import { Request, Response } from "express";
import { Types } from "mongoose";
import { Booking } from "../models/BookingModel";
import { Property, IProperty } from "../models/PropertyModel";
import { TourPackage, ITourPackage } from "../models/TourPackageModel";
import { IUser } from "../models/User";
import { validateCheckInOut, validatePaymentStatus, validateBookingStatus } from "../helpers/validateBooking";
import { sendEmail } from "../utils/emailService";
import PDFDocument from "pdfkit";
import { PaymentStatus, BookingStatus } from "../@types/express/enums";

/**
 * @desc    Host gets all bookings for their properties and tours
 * @route   GET /api/host/bookings
 * @access  Private (host only)
 */
export const getHostBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;
    if (!hostId) {
      res.status(401).json({ 
        success: false,
        message: "🚫 Unauthorized host" 
      });
      return;
    }

    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get host's properties and tour packages in parallel for better performance
    const [hostProperties, hostTourPackages] = await Promise.all([
      Property.find({ host: hostId }).select('_id'),
      TourPackage.find({ host: hostId }).select('_id')
    ]);

    const propertyIds = hostProperties.map(p => (p._id as any));
    const tourPackageIds = hostTourPackages.map(t => (t._id as any));

    // Build query to find bookings for host's properties or tours
    const query = {
      $or: [
        { property: { $in: propertyIds } },
        { tourPackage: { $in: tourPackageIds } }
      ]
    };

    // Get bookings with pagination and total count
    const [bookings, totalCount] = await Promise.all([
      Booking.find(query)
        .populate("property", "title location imageUrls host pricePerNight")
        .populate("tourPackage", "title duration price host")
        .populate("user", "firstName lastName email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query)
    ]);

    res.status(200).json({ 
      success: true,
      message: "✅ Host bookings fetched successfully", 
      data: {
        bookings,
        pagination: {
          current: page,
          total: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        }
      }
    });
  } catch (error: any) {
    console.error("❌ Host bookings error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "❌ Internal server error" 
    });
  }
};

/**
 * @desc    Host filters bookings by various criteria
 * @route   GET /api/host/bookings/filter
 * @access  Private (host only)
 */
export const filterHostBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;
    if (!hostId) {
      res.status(401).json({ 
        success: false,
        message: "🚫 Unauthorized host" 
      });
      return;
    }

    const { 
      paymentStatus, 
      bookingStatus,
      from, 
      to, 
      propertyType,
      page = 1,
      limit = 10
    } = req.query;

    // Validate payment status if provided
    if (paymentStatus && !Object.values(PaymentStatus).includes(paymentStatus as PaymentStatus)) {
      res.status(400).json({ 
        success: false,
        message: "❌ Invalid payment status" 
      });
      return;
    }

    // Validate booking status if provided
    if (bookingStatus && !Object.values(BookingStatus).includes(bookingStatus as BookingStatus)) {
      res.status(400).json({ 
        success: false,
        message: "❌ Invalid booking status" 
      });
      return;
    }

    // Validate date range if provided
    if (from && to) {
      try {
        validateCheckInOut(from as string, to as string);
      } catch (error: any) {
        res.status(400).json({ 
          success: false,
          message: error.message 
        });
        return;
      }
    }

    // Get host's properties and tour packages
    const [hostProperties, hostTourPackages] = await Promise.all([
      Property.find({ host: hostId }).select('_id'),
      TourPackage.find({ host: hostId }).select('_id')
    ]);

    const propertyIds = hostProperties.map(p => (p._id as any));
    const tourPackageIds = hostTourPackages.map(t => (t._id as any));

    // Build base query for host's bookings
    const filterQuery: any = {
      $or: [
        { property: { $in: propertyIds } },
        { tourPackage: { $in: tourPackageIds } }
      ]
    };

    // Apply additional filters
    if (paymentStatus) {
      filterQuery.paymentStatus = paymentStatus;
    }

    if (bookingStatus) {
      filterQuery.status = bookingStatus;
    }

    if (from && to) {
      filterQuery.checkIn = { $gte: new Date(from as string) };
      filterQuery.checkOut = { $lte: new Date(to as string) };
    }

    // Filter by property type (property vs tour)
    if (propertyType === 'property') {
      filterQuery.property = { $exists: true };
      filterQuery.tourPackage = { $exists: false };
    } else if (propertyType === 'tour') {
      filterQuery.tourPackage = { $exists: true };
      filterQuery.property = { $exists: false };
    }

    // Pagination setup
    const skip = (Number(page) - 1) * Number(limit);
    
    // Execute queries in parallel
    const [bookings, totalCount] = await Promise.all([
      Booking.find(filterQuery)
        .populate("property", "title location imageUrls host pricePerNight")
        .populate("tourPackage", "title duration price host")
        .populate("user", "firstName lastName email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(filterQuery)
    ]);

    res.status(200).json({ 
      success: true,
      message: "✅ Filtered bookings retrieved successfully", 
      data: {
        bookings,
        pagination: {
          current: Number(page),
          total: Math.ceil(totalCount / Number(limit)),
          totalCount,
          hasNext: Number(page) * Number(limit) < totalCount,
          hasPrev: Number(page) > 1
        },
        filters: { paymentStatus, bookingStatus, from, to, propertyType }
      }
    });
  } catch (error: any) {
    console.error("❌ Error filtering host bookings:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "❌ Internal server error" 
    });
  }
};

/**
 * @desc    Host updates payment status of a booking for their property/tour
 * @route   PATCH /api/host/bookings/:id/payment-status
 * @access  Private (host only)
 */
export const updateHostBookingPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;
    const bookingId = req.params.id;
    
    if (!hostId) {
      res.status(401).json({ 
        success: false,
        message: "🚫 Unauthorized host" 
      });
      return;
    }

    if (!Types.ObjectId.isValid(bookingId)) {
      res.status(400).json({ 
        success: false,
        message: "❌ Invalid booking ID" 
      });
      return;
    }

    const { paymentStatus } = req.body;
    
    if (!paymentStatus || !Object.values(PaymentStatus).includes(paymentStatus)) {
      res.status(400).json({ 
        success: false,
        message: "❌ Invalid payment status" 
      });
      return;
    }

    // Find booking and populate related data
    const booking = await Booking.findById(bookingId)
      .populate("property", "host title")
      .populate("tourPackage", "host title")
      .populate("user", "firstName lastName email");

    if (!booking) {
      res.status(404).json({ 
        success: false,
        message: "❌ Booking not found" 
      });
      return;
    }

    // Verify host ownership
    const property = booking.property as unknown as IProperty;
    const tour = booking.tourPackage as unknown as ITourPackage;

    const isHostOwner = (property && property.host?.toString() === hostId.toString()) ||
                        (tour && tour.host?.toString() === hostId.toString());

    if (!isHostOwner) {
      res.status(403).json({ 
        success: false,
        message: "🚫 You are not authorized to update this booking" 
      });
      return;
    }

    // Business validation
    if (booking.status === BookingStatus.CANCELLED && paymentStatus === PaymentStatus.PAID) {
      res.status(400).json({ 
        success: false,
        message: "❌ Cannot mark cancelled booking as paid" 
      });
      return;
    }

    const previousStatus = booking.paymentStatus;
    booking.paymentStatus = paymentStatus;
    
    // Auto-update booking status if payment is confirmed
    if (paymentStatus === PaymentStatus.PAID && booking.status === BookingStatus.PENDING) {
      booking.status = BookingStatus.CONFIRMED;
    }

    await booking.save();

    // Send email notification to guest
    const user = booking.user as unknown as IUser;
    if (user?.email) {
      const bookingType = property ? 'property' : 'tour';
      const bookingTitle = property?.title || tour?.title || 'N/A';

      await sendEmail(
        user.email,
        "Payment Status Updated - GuaraniHost",
        `
        <h2>💳 Payment Status Updated</h2>
        <p>Hello ${user.firstName},</p>
        <p>Your payment status for the ${bookingType} booking <strong>${bookingTitle}</strong> has been updated by the host.</p>
        <p><strong>Previous Status:</strong> ${previousStatus}</p>
        <p><strong>New Status:</strong> ${paymentStatus}</p>
        <p>Check-in: ${booking.checkIn.toLocaleDateString()}</p>
        <p>Check-out: ${booking.checkOut.toLocaleDateString()}</p>
        <p>Total Amount: $${booking.totalPrice}</p>
        <br>
        <p>Best regards,<br>GuaraniHost Team</p>
        `
      );
    }

    res.status(200).json({ 
      success: true,
      message: "✅ Payment status updated successfully", 
      data: {
        booking,
        previousStatus,
        newStatus: paymentStatus
      }
    });
  } catch (error: any) {
    console.error("❌ Error updating payment status:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "❌ Internal server error" 
    });
  }
};

/**
 * @desc    Host updates booking status for their property/tour
 * @route   PATCH /api/host/bookings/:id/status
 * @access  Private (host only)
 */
export const updateHostBookingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;
    const bookingId = req.params.id;
    
    if (!hostId) {
      res.status(401).json({ 
        success: false,
        message: "🚫 Unauthorized host" 
      });
      return;
    }

    if (!Types.ObjectId.isValid(bookingId)) {
      res.status(400).json({ 
        success: false,
        message: "❌ Invalid booking ID" 
      });
      return;
    }

    const { status, reason } = req.body;
    
    if (!status || !Object.values(BookingStatus).includes(status)) {
      res.status(400).json({ 
        success: false,
        message: "❌ Invalid booking status" 
      });
      return;
    }

    // Find booking and populate related data
    const booking = await Booking.findById(bookingId)
      .populate("property", "host title")
      .populate("tourPackage", "host title")
      .populate("user", "firstName lastName email");

    if (!booking) {
      res.status(404).json({ 
        success: false,
        message: "❌ Booking not found" 
      });
      return;
    }

    // Verify host ownership
    const property = booking.property as unknown as IProperty;
    const tour = booking.tourPackage as unknown as ITourPackage;

    const isHostOwner = (property && property.host?.toString() === hostId.toString()) ||
                        (tour && tour.host?.toString() === hostId.toString());

    if (!isHostOwner) {
      res.status(403).json({ 
        success: false,
        message: "🚫 You are not authorized to update this booking" 
      });
      return;
    }

    // Business validation
    if (booking.status === BookingStatus.CANCELLED && status !== BookingStatus.CANCELLED) {
      res.status(400).json({ 
        success: false,
        message: "❌ Cannot change status of cancelled booking" 
      });
      return;
    }

    const previousStatus = booking.status;
    booking.status = status;

    // Handle cancellation logic
    if (status === BookingStatus.CANCELLED) {
      booking.cancellationReason = reason || "Cancelled by host";
      booking.cancelledAt = new Date();
      
      // Auto-update payment status if booking was paid
      if (booking.paymentStatus === PaymentStatus.PAID) {
        booking.paymentStatus = PaymentStatus.REFUNDED;
      }
    }

    await booking.save();

    // Send email notification to guest
    const user = booking.user as unknown as IUser;
    if (user?.email) {
      const bookingType = property ? 'property' : 'tour';
      const bookingTitle = property?.title || tour?.title || 'N/A';

      let emailSubject = "Booking Status Updated - GuaraniHost";
      let emailBody = `
        <h2>📝 Booking Status Updated</h2>
        <p>Hello ${user.firstName},</p>
        <p>Your ${bookingType} booking for <strong>${bookingTitle}</strong> status has been updated by the host.</p>
        <p><strong>Previous Status:</strong> ${previousStatus}</p>
        <p><strong>New Status:</strong> ${status}</p>
        <p>Check-in: ${booking.checkIn.toLocaleDateString()}</p>
        <p>Check-out: ${booking.checkOut.toLocaleDateString()}</p>
      `;

      if (status === BookingStatus.CANCELLED) {
        emailSubject = "Booking Cancelled - GuaraniHost";
        emailBody += `<p><strong>Cancellation Reason:</strong> ${booking.cancellationReason}</p>`;
        if (booking.paymentStatus === PaymentStatus.REFUNDED) {
          emailBody += `<p><strong>Refund Status:</strong> Your payment will be refunded shortly.</p>`;
        }
      }

      emailBody += `
        <p>Total Amount: $${booking.totalPrice}</p>
        <br>
        <p>Best regards,<br>GuaraniHost Team</p>
      `;

      await sendEmail(user.email, emailSubject, emailBody);
    }

    res.status(200).json({ 
      success: true,
      message: "✅ Booking status updated successfully", 
      data: {
        booking,
        previousStatus,
        newStatus: status
      }
    });
  } catch (error: any) {
    console.error("❌ Error updating booking status:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "❌ Internal server error" 
    });
  }
};

/**
 * @desc    Host exports their bookings as PDF
 * @route   GET /api/host/bookings/export/pdf
 * @access  Private (host only)
 */
export const exportHostBookingsToPDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;
    if (!hostId) {
      res.status(401).json({ 
        success: false,
        message: "🚫 Unauthorized host" 
      });
      return;
    }

    const { from, to, paymentStatus, bookingStatus, propertyType } = req.query;
    
    // Validate payment status if provided
    if (paymentStatus && !Object.values(PaymentStatus).includes(paymentStatus as PaymentStatus)) {
      res.status(400).json({ 
        success: false,
        message: "❌ Invalid payment status" 
      });
      return;
    }

    // Validate booking status if provided
    if (bookingStatus && !Object.values(BookingStatus).includes(bookingStatus as BookingStatus)) {
      res.status(400).json({ 
        success: false,
        message: "❌ Invalid booking status" 
      });
      return;
    }

    // Validate date range if provided
    if (from && to) {
      try {
        validateCheckInOut(from as string, to as string);
      } catch (error: any) {
        res.status(400).json({ 
          success: false,
          message: error.message 
        });
        return;
      }
    }

    // Get host's properties and tour packages
    const [hostProperties, hostTourPackages] = await Promise.all([
      Property.find({ host: hostId }).select('_id'),
      TourPackage.find({ host: hostId }).select('_id')
    ]);

    const propertyIds = hostProperties.map(p => (p._id as any));
    const tourPackageIds = hostTourPackages.map(t => (t._id as any));

    // Build filter query
    const filterQuery: any = {
      $or: [
        { property: { $in: propertyIds } },
        { tourPackage: { $in: tourPackageIds } }
      ]
    };

    // Apply filters
    if (paymentStatus) filterQuery.paymentStatus = paymentStatus;
    if (bookingStatus) filterQuery.status = bookingStatus;
    
    if (from && to) {
      filterQuery.checkIn = { $gte: new Date(from as string) };
      filterQuery.checkOut = { $lte: new Date(to as string) };
    }

    if (propertyType === 'property') {
      filterQuery.property = { $exists: true };
      filterQuery.tourPackage = { $exists: false };
    } else if (propertyType === 'tour') {
      filterQuery.tourPackage = { $exists: true };
      filterQuery.property = { $exists: false };
    }

    // Get bookings for PDF
    const bookings = await Booking.find(filterQuery)
      .populate("property", "title location city")
      .populate("tourPackage", "title duration")
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 });

    if (bookings.length === 0) {
      res.status(404).json({ 
        success: false,
        message: "❌ No bookings found for the specified criteria" 
      });
      return;
    }

    // Create PDF document
    const doc = new PDFDocument({ 
      margin: 50, 
      size: "A4",
      bufferPages: true
    });
    
    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=host-bookings-${Date.now()}.pdf`);
    doc.pipe(res);

    // Get host info for header
    const hostInfo = req.user;

    // PDF Header
    doc.fontSize(20).font('Helvetica-Bold').text("Host Bookings Report", { align: "center" });
    doc.moveDown();
    
    // Host and report info
    doc.fontSize(12).font('Helvetica');
    doc.text(`Host: ${hostInfo?.firstName} ${hostInfo?.lastName}`, { align: "right" });
    doc.text(`Email: ${hostInfo?.email}`, { align: "right" });
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, { align: "right" });
    doc.text(`Total Bookings: ${bookings.length}`, { align: "right" });
    
    // Applied filters
    if (from && to) {
      doc.text(`Period: ${new Date(from as string).toLocaleDateString()} - ${new Date(to as string).toLocaleDateString()}`, { align: "right" });
    }
    if (bookingStatus) doc.text(`Status: ${bookingStatus}`, { align: "right" });
    if (paymentStatus) doc.text(`Payment: ${paymentStatus}`, { align: "right" });
    if (propertyType) doc.text(`Type: ${propertyType}`, { align: "right" });
    
    doc.moveDown(2);

    // Bookings table
    doc.fontSize(14).font('Helvetica-Bold').text("Booking Details:", { underline: true });
    doc.moveDown();

    bookings.forEach((booking, index) => {
      const user = booking.user as unknown as IUser;
      const property = booking.property as any;
      const tour = booking.tourPackage as any;

      // Check if we need a new page
      if (doc.y > 650) {
        doc.addPage();
      }

      // Booking entry
      doc.fontSize(11).font('Helvetica-Bold')
        .text(`${index + 1}. Booking #${(booking._id as any).toString().slice(-8)}`, { continued: true })
        .font('Helvetica')
        .text(` - ${booking.status.toUpperCase()}`);
      
      doc.font('Helvetica');
      
      // Guest details
      doc.text(`Guest: ${user?.firstName || "N/A"} ${user?.lastName || ""}`);
      doc.text(`Email: ${user?.email || "N/A"}`);
      
      // Booking details
      doc.text(`${property ? 'Property' : 'Tour'}: ${property?.title || tour?.title || "N/A"}`);
      if (property?.city) doc.text(`Location: ${property.city}`);
      
      doc.text(`Dates: ${new Date(booking.checkIn).toLocaleDateString()} - ${new Date(booking.checkOut).toLocaleDateString()}`);
      doc.text(`Guests: ${booking.guests}`);
      doc.text(`Payment: ${booking.paymentStatus.toUpperCase()}`);
      doc.text(`Total: $${(booking.totalPrice || 0).toFixed(2)}`);
      doc.text(`Booked: ${new Date(booking.createdAt).toLocaleDateString()}`);
      
      if (booking.cancellationReason) {
        doc.text(`Cancellation: ${booking.cancellationReason}`);
      }
      
      // Separator line
      doc.moveDown(0.5);
      doc.strokeColor('#e0e0e0').lineWidth(0.5)
        .moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);
    });

    // Footer
    doc.fontSize(10).text(
      `Generated by GuaraniHost - ${new Date().toISOString()}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );

    doc.end();
  } catch (error: any) {
    console.error("❌ Error exporting bookings PDF:", error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        message: error.message || "❌ Internal server error" 
      });
    }
  }
};

/**
 * @desc    Get single booking details for host (only their properties/tours)
 * @route   GET /api/host/bookings/:id
 * @access  Private (host only)
 */
export const getHostBookingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;
    const bookingId = req.params.id;
    
    if (!hostId) {
      res.status(401).json({ 
        success: false,
        message: "🚫 Unauthorized host" 
      });
      return;
    }

    if (!Types.ObjectId.isValid(bookingId)) {
      res.status(400).json({ 
        success: false,
        message: "❌ Invalid booking ID" 
      });
      return;
    }

    // Find booking with full population
    const booking = await Booking.findById(bookingId)
      .populate("property")
      .populate("tourPackage")
      .populate("user", "-password");

    if (!booking) {
      res.status(404).json({ 
        success: false,
        message: "❌ Booking not found" 
      });
      return;
    }

    // Verify host ownership
    const property = booking.property as unknown as IProperty;
    const tour = booking.tourPackage as unknown as ITourPackage;

    const isHostOwner = (property && property.host?.toString() === hostId.toString()) ||
                        (tour && tour.host?.toString() === hostId.toString());

    if (!isHostOwner) {
      res.status(403).json({ 
        success: false,
        message: "🚫 You are not authorized to view this booking" 
      });
      return;
    }

    res.status(200).json({ 
      success: true,
      message: "✅ Booking details retrieved successfully", 
      data: { booking }
    });
  } catch (error: any) {
    console.error("❌ Error fetching booking details:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "❌ Internal server error" 
    });
  }
};