import { Request, Response } from "express";
import cloudinary from "../config/cloudinaryConfig"; 
import { Booking } from "../models/BookingModel"; 
import { User } from "../models/User"; 
import { upload } from "../config/multerConfig"; 

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
       res.status(401).json({ message: "Unauthorized" });
       return;
    }

    // Create booking data
    let bookingData: any = {
      user: userId,
      checkIn,
      checkOut,
      guests,
      totalPrice,
      status: "pending", // Pending until payment is confirmed
      paymentDetails: paymentDetails || "", // Payment transfer details (e.g., reference number)
    };

    // Check if it's for a property or a tour package
    if (property) bookingData.property = property;
    if (tourPackage) bookingData.tourPackage = tourPackage;

    // Upload payment image (if exists)
    if (req.files && req.files.paymentImage) {
      const uploadResult = await cloudinary.uploader.upload((req.files as any).paymentImage[0].path);
      bookingData.paymentImage = uploadResult.secure_url; // Save Cloudinary image URL
    }

    // Create the booking
    const newBooking = new Booking(bookingData);
    await newBooking.save();

    res.status(201).json({
      message: "✅ Booking created successfully",
      booking: newBooking,
    });
  } catch (error) {
    console.error("❌ Error creating booking:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};

/**
 * @desc    Get all bookings for a user or all for admin
 * @route   GET /api/bookings
 * @access  Private (admin and user)
 */
export const getBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
        return;
    }

    const bookings = await Booking.find({ user: userId }).populate("property").populate("tourPackage");

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
 * @desc    Update booking details
 * @route   PATCH /api/bookings/:id
 * @access  Private (admin and user who created the booking)
 */
export const updateBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { checkIn, checkOut, guests, paymentDetails } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
       res.status(404).json({ message: "🚫 Booking not found" });
       return;
    }

    // Update booking details
    booking.checkIn = checkIn || booking.checkIn;
    booking.checkOut = checkOut || booking.checkOut;
    booking.guests = guests || booking.guests;
    booking.paymentDetails = paymentDetails || booking.paymentDetails;

    await booking.save();

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
 * @access  Private (admin and user who created the booking)
 */
export const cancelBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      res.status(404).json({ message: "🚫 Booking not found" });
        return;
    }

    res.status(200).json({
      message: "✅ Booking canceled successfully",
      bookingId: booking._id,
    });
  } catch (error) {
    console.error("❌ Error canceling booking:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};
