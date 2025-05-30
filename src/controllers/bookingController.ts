import { Request, Response } from "express";
import { Booking } from "../models/BookingModel";
import { IUser } from "../models/User";
import { uploadImagesToCloudinary } from "../helpers/uploadImagesToCloudinary";
import { deleteImageFromCloudinary } from "../helpers/deleteImageFromCloudinary";
import { sendEmail } from "../utils/emailService";
import { BookingStatus, PaymentStatus } from "../@types/express/enums";
import { validateBookingDates } from "../helpers/availabilityHelper";

/**
 * @desc    Helper to validate check-in and check-out dates
 */
const ensureValidDates = (checkIn: string, checkOut: string) => {
  const now = Date.now();
  const inDate = new Date(checkIn).getTime();
  const outDate = new Date(checkOut).getTime();

  if (inDate < now) throw new Error("❗ Check-in date cannot be in the past");
  if (outDate < now) throw new Error("❗ Check-out date cannot be in the past");
  if (inDate > outDate) throw new Error("❗ Check-out cannot be before check-in");
};

/**
 * @desc    Create a new booking
 * @route   POST /api/bookings
 * @access  Private (user)
 */
export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { property, tourPackage, checkIn, checkOut, guests, totalPrice, paymentDetails } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ message: "🚫 Unauthorized" });
      return;
    }

    if (!property && !tourPackage) {
      res.status(400).json({ message: "❗ A property or tour package must be selected" });
      return;
    }

    if (property && tourPackage) {
      res.status(400).json({ message: "❗ Cannot book both property and tour package" });
      return;
    }

    ensureValidDates(checkIn, checkOut);

    if (guests <= 0 || totalPrice <= 0) {
      res.status(400).json({ message: "❗ Guests and total price must be greater than zero" });
      return;
    }

    // Validate booking dates for property
    if (property) {
      const validation = await validateBookingDates(property, new Date(checkIn), new Date(checkOut));
      if (!validation.valid) {
        res.status(400).json({ message: validation.message });
        return;
      }
    }

    const bookingData: any = {
      user: userId,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests,
      totalPrice,
      paymentStatus: PaymentStatus.PENDING,
      paymentDetails: paymentDetails?.trim() || "",
      status: BookingStatus.PENDING,
    };

    // Add property or tourPackage
    if (property) bookingData.property = property;
    if (tourPackage) bookingData.tourPackage = tourPackage;

    // Handle payment images
    if (req.files && "paymentImage" in req.files) {
      const paymentImageFiles = req.files["paymentImage"] as Express.Multer.File[];
      const imageUrls = await uploadImagesToCloudinary(paymentImageFiles);
      bookingData.paymentImages = imageUrls;
    }

    const newBooking = new Booking(bookingData);
    await newBooking.save();

    // Send confirmation email
    if (req.user?.email) {
      await sendEmail(
        req.user.email,
        "Booking Confirmation - GuaraniHost",
        `<h2>✅ Booking confirmed!</h2>
         <p>Hello ${req.user.firstName},</p>
         <p>Your booking from <strong>${new Date(checkIn).toLocaleDateString()}</strong> to <strong>${new Date(checkOut).toLocaleDateString()}</strong> is confirmed.</p>
         <p>Guests: ${guests}</p>
         <p>Total Price: $${totalPrice}</p>`
      );
    }

    res.status(201).json({
      message: "✅ Booking created successfully",
      booking: newBooking,
    });
  } catch (error: any) {
    console.error("❌ Error creating booking:", error);
    res.status(400).json({ message: error.message || "❌ Server error" });
  }
};

/**
 * @desc    Get all bookings (user gets their own, admin gets all)
 * @route   GET /api/bookings
 * @access  Private (user or admin)
 */
export const getBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const isAdmin = req.user?.role === "admin";

    if (!userId) {
      res.status(401).json({ message: "🚫 Unauthorized" });
      return;
    }

    const bookings = await Booking.find(isAdmin ? {} : { user: userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "✅ Bookings retrieved successfully",
      total: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("❌ Error fetching bookings:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};

/**
 * @desc    Get booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private (user or admin)
 */
export const getBookingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404).json({ message: "🚫 Booking not found" });
      return;
    }

    // Check if user owns the booking or is admin
    const userId = req.user?._id;
    const isAdmin = req.user?.role === "admin";

    if (!isAdmin && booking.user.toString() !== userId?.toString()) {
      res.status(403).json({ message: "🚫 Access denied" });
      return;
    }

    res.status(200).json({
      message: "✅ Booking retrieved successfully",
      booking,
    });
  } catch (error) {
    console.error("❌ Error fetching booking:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};

/**
 * @desc    Update booking
 * @route   PATCH /api/bookings/:id
 * @access  Private (user or admin)
 */
export const updateBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      checkIn,
      checkOut,
      guests,
      paymentDetails,
      removedPaymentImages,
      status,
      paymentStatus
    } = req.body;

    const booking = await Booking.findById(req.params.id).populate("user");

    if (!booking) {
      res.status(404).json({ message: "🚫 Booking not found" });
      return;
    }

    // Check permissions
    const userId = req.user?._id;
    const isAdmin = req.user?.role === "admin";

    if (!isAdmin && booking.user._id.toString() !== userId?.toString()) {
      res.status(403).json({ message: "🚫 Access denied" });
      return;
    }

    // Validate dates if changing
    if (checkIn && checkOut) {
      ensureValidDates(checkIn, checkOut);
      
      // Validate booking dates for property if changing dates
      if (booking.property) {
        const validation = await validateBookingDates(
          booking.property.toString(), 
          new Date(checkIn), 
          new Date(checkOut),
          booking.id // Use .id instead of ._id
        );
        if (!validation.valid) {
          res.status(400).json({ message: validation.message });
          return;
        }
      }
    }

    if (guests && guests <= 0) {
      res.status(400).json({ message: "❗ Guests must be greater than zero" });
      return;
    }

    // Update fields
    if (checkIn) booking.checkIn = new Date(checkIn);
    if (checkOut) booking.checkOut = new Date(checkOut);
    if (guests) booking.guests = guests;
    if (paymentDetails !== undefined) booking.paymentDetails = paymentDetails?.trim();

    // Only admin can update status and payment status
    if (isAdmin) {
      if (status && Object.values(BookingStatus).includes(status)) {
        booking.status = status;
      }
      if (paymentStatus && Object.values(PaymentStatus).includes(paymentStatus)) {
        booking.paymentStatus = paymentStatus;
      }
    }

    // Handle payment images
    if (Array.isArray(removedPaymentImages)) {
      for (const imageUrl of removedPaymentImages) {
        try {
          await deleteImageFromCloudinary(imageUrl);
          booking.paymentImages = booking.paymentImages?.filter((url) => url !== imageUrl) || [];
        } catch (error) {
          console.error(`Failed to delete image ${imageUrl}:`, error);
        }
      }
    }

    if (req.files && "paymentImage" in req.files) {
      const newPaymentImageFiles = req.files["paymentImage"] as Express.Multer.File[];
      const newImageUrls = await uploadImagesToCloudinary(newPaymentImageFiles);
      booking.paymentImages = [...(booking.paymentImages || []), ...newImageUrls];
    }

    await booking.save();

    // Send update notification email
    const user = booking.user as unknown as IUser;
    await sendEmail(
      user.email,
      "Booking Updated - GuaraniHost",
      `<h2>🔄 Booking Updated</h2>
       <p>Hello ${user.firstName},</p>
       <p>Your booking has been updated:</p>
       <p>Dates: <strong>${booking.checkIn.toLocaleDateString()}</strong> to <strong>${booking.checkOut.toLocaleDateString()}</strong></p>
       <p>Status: <strong>${booking.status}</strong></p>`
    );

    res.status(200).json({
      message: "✅ Booking updated successfully",
      booking,
    });
  } catch (error: any) {
    console.error("❌ Error updating booking:", error);
    res.status(500).json({ message: error.message || "❌ Server error" });
  }
};

/**
 * @desc    Cancel a booking
 * @route   DELETE /api/bookings/:id
 * @access  Private (user or admin)
 */
export const cancelBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id).populate("user");

    if (!booking) {
      res.status(404).json({ message: "🚫 Booking not found" });
      return;
    }

    // Check permissions
    const userId = req.user?._id;
    const isAdmin = req.user?.role === "admin";

    if (!isAdmin && booking.user._id.toString() !== userId?.toString()) {
      res.status(403).json({ message: "🚫 Access denied" });
      return;
    }

    // Delete payment images from Cloudinary
    if (booking.paymentImages && booking.paymentImages.length > 0) {
      const deletePromises = booking.paymentImages.map(async (imageUrl) => {
        try {
          await deleteImageFromCloudinary(imageUrl);
        } catch (error) {
          console.error(`Failed to delete image ${imageUrl}:`, error);
        }
      });
      await Promise.allSettled(deletePromises);
    }

    await booking.deleteOne();

    // Send cancellation email
    const user = booking.user as unknown as IUser;
    await sendEmail(
      user.email,
      "Booking Canceled - GuaraniHost",
      `<h2>❌ Booking Canceled</h2>
       <p>Hello ${user.firstName},</p>
       <p>Your booking from <strong>${booking.checkIn.toLocaleDateString()}</strong> to <strong>${booking.checkOut.toLocaleDateString()}</strong> has been canceled.</p>
       <p>If you have any questions, please contact us.</p>`
    );

    res.status(200).json({
      message: "✅ Booking canceled successfully",
      bookingId: booking._id,
    });
  } catch (error) {
    console.error("❌ Error canceling booking:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};

/**
 * @desc    Admin or host filters bookings by date range
 * @route   GET /api/bookings/filter?from=YYYY-MM-DD&to=YYYY-MM-DD&status=pending
 * @access  Private (admin or host)
 */
export const filterBookingsByDateRange = async (req: Request, res: Response): Promise<void> => {
  try {
    const role = req.user?.role;
    if (!role || !["admin", "host"].includes(role)) {
      res.status(403).json({ message: "🚫 Access denied" });
      return;
    }

    const { from, to, status } = req.query;

    if (!from || !to) {
      res.status(400).json({ message: "❗ 'from' and 'to' dates are required" });
      return;
    }

    const fromDate = new Date(from as string);
    const toDate = new Date(to as string);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      res.status(400).json({ message: "❗ Invalid date format" });
      return;
    }

    const query: any = {
      checkIn: { $gte: fromDate },
      checkOut: { $lte: toDate },
    };

    // Add status filter if provided
    if (status && Object.values(BookingStatus).includes(status as BookingStatus)) {
      query.status = status;
    }

    const bookings = await Booking.find(query).sort({ checkIn: 1 });

    res.status(200).json({
      message: "✅ Bookings filtered successfully",
      filters: {
        from: fromDate.toISOString().split("T")[0],
        to: toDate.toISOString().split("T")[0],
        status: status || 'all'
      },
      total: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("❌ Error filtering bookings:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};