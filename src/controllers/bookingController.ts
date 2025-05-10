// bookingController.ts
import { Request, Response } from "express";
import { Booking } from "../models/BookingModel";
import { IUser } from "../models/User";
import { uploadImagesToCloudinary } from "../helpers/uploadImagesToCloudinary";
import { deleteImageFromCloudinary } from "../helpers/deleteImageFromCloudinary";
import { sendEmail } from "../utils/emailService";
import { PaymentStatus, BookingStatus } from "../@types/express/enums";
import { validateCheckInOut } from "../helpers/validateBooking";

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

    ensureValidDates(checkIn, checkOut);

    if (guests <= 0 || totalPrice <= 0) {
      res.status(400).json({ message: "❗ Guests and total price must be greater than zero" });
      return;
    }

    const bookingData: any = {
      user: userId,
      property,
      tourPackage,
      checkIn,
      checkOut,
      guests,
      totalPrice,
      paymentStatus: PaymentStatus.PENDING,
      paymentDetails: paymentDetails?.trim() || "",
      status: BookingStatus.PENDING,
    };

    if (req.files && "paymentImage" in req.files) {
      const paymentImageFiles = req.files["paymentImage"] as Express.Multer.File[];
      const imageUrls = await uploadImagesToCloudinary(paymentImageFiles);
      bookingData.paymentImages = imageUrls;
    }

    const newBooking = new Booking(bookingData);
    await newBooking.save();

    if (req.user?.email) {
      await sendEmail(
        req.user.email,
        "Booking Confirmation - GuaraniHost",
        `<h2>✅ Booking confirmed!</h2>
         <p>Hello ${req.user.firstName},</p>
         <p>Your booking from <strong>${new Date(checkIn).toLocaleDateString()}</strong> to <strong>${new Date(checkOut).toLocaleDateString()}</strong> is confirmed.</p>`
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
 * @desc    Get all bookings (user or admin)
 * @route   GET /api/bookings
 * @access  Private (user or admin)
 */
export const getBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const isAdmin = req.user?.role === "admin";

    const bookings = await Booking.find(isAdmin ? {} : { user: userId })
      .populate("property")
      .populate("tourPackage");

    if (!bookings.length) {
      res.status(404).json({ message: "❗ No bookings found" });
      return;
    }

    res.status(200).json({
      message: "✅ Bookings retrieved successfully",
      bookings,
    });
  } catch (error) {
    console.error("❌ Error fetching bookings:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};

/**
 * @desc    Get booking summary
 * @route   GET /api/bookings/:id/summary
 * @access  Private
 */
export const getBookingSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "firstName lastName email phone")
      .populate("property", "title city address pricePerNight")
      .populate("tourPackage", "title description price");

    if (!booking) {
      res.status(404).json({ message: "🚫 Booking not found" });
      return;
    }

    res.status(200).json({
      message: "✅ Booking summary loaded",
      booking,
    });
  } catch (error) {
    console.error("❌ Error loading summary:", error);
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
      property,
      tourPackage,
    } = req.body;

    const booking = await Booking.findById(req.params.id).populate("user");

    if (!booking) {
      res.status(404).json({ message: "🚫 Booking not found" });
      return;
    }

    if (guests && guests <= 0) {
      res.status(400).json({ message: "❗ Guests must be greater than zero" });
      return;
    }

    booking.checkIn = checkIn || booking.checkIn;
    booking.checkOut = checkOut || booking.checkOut;
    booking.guests = guests || booking.guests;
    booking.paymentDetails = paymentDetails?.trim() || booking.paymentDetails;
    booking.property = property || booking.property;
    booking.tourPackage = tourPackage || booking.tourPackage;

    if (Array.isArray(removedPaymentImages)) {
      for (const imageUrl of removedPaymentImages) {
        await deleteImageFromCloudinary(imageUrl);
        booking.paymentImages = booking.paymentImages?.filter((url) => url !== imageUrl) || [];
      }
    }

    if (req.files && "paymentImage" in req.files) {
      const newPaymentImageFiles = req.files["paymentImage"] as Express.Multer.File[];
      const newImageUrls = await uploadImagesToCloudinary(newPaymentImageFiles);
      booking.paymentImages = [...(booking.paymentImages || []), ...newImageUrls];
    }

    await booking.save();

    const user = booking.user as unknown as IUser;
    await sendEmail(
      user.email,
      "Booking Updated - GuaraniHost",
      `<h2>🔄 Booking Updated</h2>
       <p>Hello ${user.firstName},</p>
       <p>Your booking from <strong>${new Date(booking.checkIn).toLocaleDateString()}</strong> to <strong>${new Date(booking.checkOut).toLocaleDateString()}</strong> has been updated.</p>`
    );

    res.status(200).json({
      message: "✅ Booking updated successfully",
      booking,
    });
  } catch (error) {
    console.error("❌ Error updating booking:", error);
    res.status(500).json({ message: "❌ Server error" });
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

    if (booking.paymentImages && booking.paymentImages.length > 0) {
      for (const imageUrl of booking.paymentImages) {
        await deleteImageFromCloudinary(imageUrl);
      }
    }

    await booking.deleteOne();

    const user = booking.user as unknown as IUser;
    await sendEmail(
      user.email,
      "Booking Canceled - GuaraniHost",
      `<h2>❌ Booking Canceled</h2>
       <p>Hello ${user.firstName},</p>
       <p>Your booking from <strong>${new Date(booking.checkIn).toLocaleDateString()}</strong> to <strong>${new Date(booking.checkOut).toLocaleDateString()}</strong> has been canceled.</p>`
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
 * @desc    Admin or host filters bookings by check-in and check-out dates
 * @route   GET /api/bookings/filter?from=YYYY-MM-DD&to=YYYY-MM-DD
 * @access  Private (admin or host)
 */
export const filterBookingsByDateRange = async (req: Request, res: Response): Promise<void> => {
  try {
    const role = req.user?.role;
    if (!role || !["admin", "host"].includes(role)) {
      res.status(403).json({ message: "🚫 Access denied" });
      return;
    }

    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    if (!from || !to) {
      res.status(400).json({ message: "❗ 'from' and 'to' dates are required" });
      return;
    }

    ensureValidDates(from, to);

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const bookings = await Booking.find({
      checkIn: { $gte: fromDate },
      checkOut: { $lte: toDate },
    })
      .populate("user", "firstName lastName email")
      .populate("property")
      .populate("tourPackage");

    res.status(200).json({
      message: "✅ Bookings filtered by date range",
      from: fromDate.toISOString().split("T")[0],
      to: toDate.toISOString().split("T")[0],
      total: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("❌ Error filtering bookings by date:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};
