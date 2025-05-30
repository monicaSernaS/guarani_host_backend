import { Request, Response } from "express";
import { Types } from "mongoose";
import { Booking } from "../models/BookingModel";
import { Property, IProperty } from "../models/PropertyModel";
import { TourPackage, ITourPackage } from "../models/TourPackageModel";
import { IUser } from "../models/User";
import { validateCheckInOut, validatePaymentStatus } from "../helpers/validateBooking";
import PDFDocument from "pdfkit";
import { PaymentStatus, BookingStatus } from "../@types/express/enums";

/**
 * @desc    Host gets all their related bookings
 * @route   GET /api/host/bookings
 * @access  Private (host only)
 */
export const getHostBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;
    if (!hostId) {
      res.status(401).json({ message: "🚫 Unauthorized host" });
      return;
    }

    // Optimización: Buscar directamente las propiedades y tour packages del host
    const [hostProperties, hostTourPackages] = await Promise.all([
      Property.find({ host: hostId }).select('_id'),
      TourPackage.find({ host: hostId }).select('_id')
    ]);

    const propertyIds = hostProperties.map(p => p._id);
    const tourPackageIds = hostTourPackages.map(t => t._id);

    // Buscar bookings que pertenezcan a las propiedades o tour packages del host
    const bookings = await Booking.find({
      $or: [
        { property: { $in: propertyIds } },
        { tourPackage: { $in: tourPackageIds } }
      ]
    })
      .populate("property", "title location images host")
      .populate("tourPackage", "title duration price host")
      .populate("user", "firstName lastName email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      message: "✅ Host bookings fetched successfully", 
      bookings,
      total: bookings.length 
    });
  } catch (error: any) {
    console.error("❌ Host bookings error:", error);
    res.status(500).json({ message: error.message || "❌ Internal server error" });
  }
};

/**
 * @desc    Host filters bookings by criteria
 * @route   GET /api/host/bookings/filter
 * @access  Private (host only)
 */
export const filterHostBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;
    if (!hostId) {
      res.status(401).json({ message: "🚫 Unauthorized host" });
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

    // Validaciones
    if (paymentStatus && !Object.values(PaymentStatus).includes(paymentStatus as PaymentStatus)) {
      res.status(400).json({ message: "❌ Invalid payment status" });
      return;
    }

    if (bookingStatus && !Object.values(BookingStatus).includes(bookingStatus as BookingStatus)) {
      res.status(400).json({ message: "❌ Invalid booking status" });
      return;
    }

    if (from && to) {
      try {
        validateCheckInOut(from as string, to as string);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
        return;
      }
    }

    // Obtener las propiedades y tour packages del host
    const [hostProperties, hostTourPackages] = await Promise.all([
      Property.find({ host: hostId }).select('_id'),
      TourPackage.find({ host: hostId }).select('_id')
    ]);

    const propertyIds = hostProperties.map(p => p._id);
    const tourPackageIds = hostTourPackages.map(t => t._id);

    // Construir query de filtros
    const filterQuery: any = {
      $or: [
        { property: { $in: propertyIds } },
        { tourPackage: { $in: tourPackageIds } }
      ]
    };

    // Aplicar filtros adicionales
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

    if (propertyType === 'property') {
      filterQuery.property = { $exists: true };
      filterQuery.tourPackage = { $exists: false };
    } else if (propertyType === 'tour') {
      filterQuery.tourPackage = { $exists: true };
      filterQuery.property = { $exists: false };
    }

    // Paginación
    const skip = (Number(page) - 1) * Number(limit);
    
    const [bookings, totalCount] = await Promise.all([
      Booking.find(filterQuery)
        .populate("property", "title location images host")
        .populate("tourPackage", "title duration price host")
        .populate("user", "firstName lastName email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(filterQuery)
    ]);

    res.status(200).json({ 
      message: "✅ Filtered bookings retrieved successfully", 
      bookings,
      pagination: {
        current: Number(page),
        total: Math.ceil(totalCount / Number(limit)),
        count: bookings.length,
        totalCount
      }
    });
  } catch (error: any) {
    console.error("❌ Error filtering host bookings:", error);
    res.status(500).json({ message: error.message || "❌ Internal server error" });
  }
};

/**
 * @desc    Host updates payment status of a booking
 * @route   PATCH /api/host/bookings/:id/payment-status
 * @access  Private (host only)
 */
export const updateHostBookingPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;
    const bookingId = req.params.id;
    
    if (!hostId) {
      res.status(401).json({ message: "🚫 Unauthorized host" });
      return;
    }

    if (!Types.ObjectId.isValid(bookingId)) {
      res.status(400).json({ message: "❌ Invalid booking ID" });
      return;
    }

    const { paymentStatus } = req.body;
    
    if (!paymentStatus || !Object.values(PaymentStatus).includes(paymentStatus)) {
      res.status(400).json({ message: "❌ Invalid payment status" });
      return;
    }

    const booking = await Booking.findById(bookingId)
      .populate("property", "host title")
      .populate("tourPackage", "host title")
      .populate("user", "firstName lastName email");

    if (!booking) {
      res.status(404).json({ message: "❌ Booking not found" });
      return;
    }

    // Verificar ownership
    const property = booking.property as unknown as IProperty;
    const tour = booking.tourPackage as unknown as ITourPackage;

    const isHostOwner = (property && property.host?.toString() === hostId.toString()) ||
                        (tour && tour.host?.toString() === hostId.toString());

    if (!isHostOwner) {
      res.status(403).json({ message: "🚫 You are not authorized to update this booking" });
      return;
    }

    // Validaciones de negocio
    if (booking.status === BookingStatus.CANCELLED && paymentStatus === PaymentStatus.PAID) {
      res.status(400).json({ message: "❌ Cannot mark cancelled booking as paid" });
      return;
    }

    const previousStatus = booking.paymentStatus;
    booking.paymentStatus = paymentStatus;
    
    // Auto-actualizar booking status si es necesario
    if (paymentStatus === PaymentStatus.PAID && booking.status === BookingStatus.PENDING) {
      booking.status = BookingStatus.CONFIRMED;
    }

    await booking.save();

    res.status(200).json({ 
      message: "✅ Payment status updated successfully", 
      booking,
      previousStatus,
      newStatus: paymentStatus
    });
  } catch (error: any) {
    console.error("❌ Error updating payment status:", error);
    res.status(500).json({ message: error.message || "❌ Internal server error" });
  }
};

/**
 * @desc    Host updates booking status
 * @route   PATCH /api/host/bookings/:id/status
 * @access  Private (host only)
 */
export const updateHostBookingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;
    const bookingId = req.params.id;
    
    if (!hostId) {
      res.status(401).json({ message: "🚫 Unauthorized host" });
      return;
    }

    if (!Types.ObjectId.isValid(bookingId)) {
      res.status(400).json({ message: "❌ Invalid booking ID" });
      return;
    }

    const { status, reason } = req.body;
    
    if (!status || !Object.values(BookingStatus).includes(status)) {
      res.status(400).json({ message: "❌ Invalid booking status" });
      return;
    }

    const booking = await Booking.findById(bookingId)
      .populate("property", "host title")
      .populate("tourPackage", "host title")
      .populate("user", "firstName lastName email");

    if (!booking) {
      res.status(404).json({ message: "❌ Booking not found" });
      return;
    }

    // Verificar ownership
    const property = booking.property as unknown as IProperty;
    const tour = booking.tourPackage as unknown as ITourPackage;

    const isHostOwner = (property && property.host?.toString() === hostId.toString()) ||
                        (tour && tour.host?.toString() === hostId.toString());

    if (!isHostOwner) {
      res.status(403).json({ message: "🚫 You are not authorized to update this booking" });
      return;
    }

    // Validaciones de negocio
    if (booking.status === BookingStatus.CANCELLED && status !== BookingStatus.CANCELLED) {
      res.status(400).json({ message: "❌ Cannot change status of cancelled booking" });
      return;
    }

    const previousStatus = booking.status;
    booking.status = status;

    if (status === BookingStatus.CANCELLED) {
      booking.cancellationReason = reason || "Cancelled by host";
      booking.cancelledAt = new Date();
      
      // Auto-actualizar payment status si es necesario
      if (booking.paymentStatus === PaymentStatus.PAID) {
        booking.paymentStatus = PaymentStatus.REFUNDED;
      }
    }

    await booking.save();

    res.status(200).json({ 
      message: "✅ Booking status updated successfully", 
      booking,
      previousStatus,
      newStatus: status
    });
  } catch (error: any) {
    console.error("❌ Error updating booking status:", error);
    res.status(500).json({ message: error.message || "❌ Internal server error" });
  }
};

/**
 * @desc    Host exports bookings as PDF
 * @route   GET /api/host/bookings/export/pdf
 * @access  Private (host only)
 */
export const exportHostBookingsToPDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;
    if (!hostId) {
      res.status(401).json({ message: "🚫 Unauthorized host" });
      return;
    }

    const { from, to, paymentStatus, bookingStatus } = req.query;
    
    // Validaciones
    if (paymentStatus && !Object.values(PaymentStatus).includes(paymentStatus as PaymentStatus)) {
      res.status(400).json({ message: "❌ Invalid payment status" });
      return;
    }

    if (from && to) {
      try {
        validateCheckInOut(from as string, to as string);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
        return;
      }
    }

    // Obtener las propiedades y tour packages del host
    const [hostProperties, hostTourPackages] = await Promise.all([
      Property.find({ host: hostId }).select('_id'),
      TourPackage.find({ host: hostId }).select('_id')
    ]);

    const propertyIds = hostProperties.map(p => p._id);
    const tourPackageIds = hostTourPackages.map(t => t._id);

    // Construir query de filtros
    const filterQuery: any = {
      $or: [
        { property: { $in: propertyIds } },
        { tourPackage: { $in: tourPackageIds } }
      ]
    };

    if (paymentStatus) filterQuery.paymentStatus = paymentStatus;
    if (bookingStatus) filterQuery.status = bookingStatus;
    
    if (from && to) {
      filterQuery.checkIn = { $gte: new Date(from as string) };
      filterQuery.checkOut = { $lte: new Date(to as string) };
    }

    const bookings = await Booking.find(filterQuery)
      .populate("property", "title location")
      .populate("tourPackage", "title duration")
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 });

    if (bookings.length === 0) {
      res.status(404).json({ message: "❌ No bookings found for the specified criteria" });
      return;
    }

    // Crear PDF
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    
    // Headers para la respuesta
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=host-bookings-${Date.now()}.pdf`);
    doc.pipe(res);

    // Header del documento
    doc.fontSize(20).text("Host Bookings Report", { align: "center" });
    doc.moveDown();
    
    // Información del reporte
    doc.fontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, { align: "right" });
    doc.text(`Total Bookings: ${bookings.length}`, { align: "right" });
    
    if (from && to) {
      doc.text(`Date Range: ${new Date(from as string).toLocaleDateString()} - ${new Date(to as string).toLocaleDateString()}`, { align: "right" });
    }
    
    doc.moveDown(2);

    // Tabla de bookings
    bookings.forEach((booking, index) => {
      const user = booking.user as unknown as IUser;
      const property = booking.property as unknown as IProperty;
      const tour = booking.tourPackage as unknown as ITourPackage;

      // Verificar si necesitamos una nueva página
      if (doc.y > 700) {
        doc.addPage();
      }

      doc.fontSize(12).font('Helvetica-Bold').text(`${index + 1}. Booking #${booking._id}`);
      doc.font('Helvetica');
      
      doc.text(`Guest: ${user?.firstName || "N/A"} ${user?.lastName || ""}`);
      doc.text(`Email: ${user?.email || "N/A"}`);
      doc.text(`Property: ${property?.title || tour?.title || "N/A"}`);
      doc.text(`Check-in: ${new Date(booking.checkIn).toLocaleDateString()}`);
      doc.text(`Check-out: ${new Date(booking.checkOut).toLocaleDateString()}`);
      doc.text(`Guests: ${booking.guests}`);
      doc.text(`Status: ${booking.status}`);
      doc.text(`Payment: ${booking.paymentStatus}`);
      doc.text(`Total: $${booking.totalPrice || 0}`); // CORREGIDO: totalAmount -> totalPrice
      
      doc.moveDown();
      doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
    });

    doc.end();
  } catch (error: any) {
    console.error("❌ Error exporting bookings PDF:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: error.message || "❌ Internal server error" });
    }
  }
};

/**
 * @desc    Host gets summary of bookings and payment status
 * @route   GET /api/host/bookings/summary
 * @access  Private (host only)
 */
export const getHostBookingSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;
    if (!hostId) {
      res.status(401).json({ message: "🚫 Unauthorized host" });
      return;
    }

    const { period = 'all' } = req.query;

    // Obtener las propiedades y tour packages del host
    const [hostProperties, hostTourPackages] = await Promise.all([
      Property.find({ host: hostId }).select('_id'),
      TourPackage.find({ host: hostId }).select('_id')
    ]);

    const propertyIds = hostProperties.map(p => p._id);
    const tourPackageIds = hostTourPackages.map(t => t._id);

    // Construir query base
    const baseQuery: any = {
      $or: [
        { property: { $in: propertyIds } },
        { tourPackage: { $in: tourPackageIds } }
      ]
    };

    // Filtro por período
    if (period !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }

      baseQuery.createdAt = { $gte: startDate };
    }

    const bookings = await Booking.find(baseQuery);

    // Calcular estadísticas
    const summary = {
      totalBookings: bookings.length,
      
      // Status breakdown
      status: {
        pending: bookings.filter(b => b.status === BookingStatus.PENDING).length,
        confirmed: bookings.filter(b => b.status === BookingStatus.CONFIRMED).length,
        cancelled: bookings.filter(b => b.status === BookingStatus.CANCELLED).length,
        completed: bookings.filter(b => b.status === BookingStatus.COMPLETED).length
      },
      
      // Payment breakdown
      payments: {
        pending: bookings.filter(b => b.paymentStatus === PaymentStatus.PENDING).length,
        paid: bookings.filter(b => b.paymentStatus === PaymentStatus.PAID).length,
        refunded: bookings.filter(b => b.paymentStatus === PaymentStatus.REFUNDED).length,
        failed: bookings.filter(b => b.paymentStatus === PaymentStatus.FAILED).length
      },
      
      // Revenue - CORREGIDO: totalAmount -> totalPrice
      revenue: {
        total: bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0),
        paid: bookings
          .filter(b => b.paymentStatus === PaymentStatus.PAID)
          .reduce((sum, b) => sum + (b.totalPrice || 0), 0),
        pending: bookings
          .filter(b => b.paymentStatus === PaymentStatus.PENDING)
          .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
      },
      
      // Property vs Tour breakdown
      types: {
        properties: bookings.filter(b => b.property).length,
        tours: bookings.filter(b => b.tourPackage).length
      },
      
      // Current period info
      period,
      generatedAt: new Date()
    };

    res.status(200).json({ 
      message: "✅ Host booking summary retrieved successfully", 
      summary 
    });
  } catch (error: any) {
    console.error("❌ Error fetching booking summary:", error);
    res.status(500).json({ message: error.message || "❌ Internal server error" });
  }
};

/**
 * @desc    Get single booking details for host
 * @route   GET /api/host/bookings/:id
 * @access  Private (host only)
 */
export const getHostBookingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;
    const bookingId = req.params.id;
    
    if (!hostId) {
      res.status(401).json({ message: "🚫 Unauthorized host" });
      return;
    }

    if (!Types.ObjectId.isValid(bookingId)) {
      res.status(400).json({ message: "❌ Invalid booking ID" });
      return;
    }

    const booking = await Booking.findById(bookingId)
      .populate("property")
      .populate("tourPackage")
      .populate("user", "-password");

    if (!booking) {
      res.status(404).json({ message: "❌ Booking not found" });
      return;
    }

    // Verificar ownership
    const property = booking.property as unknown as IProperty;
    const tour = booking.tourPackage as unknown as ITourPackage;

    const isHostOwner = (property && property.host?.toString() === hostId.toString()) ||
                        (tour && tour.host?.toString() === hostId.toString());

    if (!isHostOwner) {
      res.status(403).json({ message: "🚫 You are not authorized to view this booking" });
      return;
    }

    res.status(200).json({ 
      message: "✅ Booking details retrieved successfully", 
      booking 
    });
  } catch (error: any) {
    console.error("❌ Error fetching booking details:", error);
    res.status(500).json({ message: error.message || "❌ Internal server error" });
  }
};