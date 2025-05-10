import { Request, Response } from "express";
import { Booking } from "../models/BookingModel";
import { IUser } from "../models/User"; 
import { sendEmail } from "../utils/emailService"; 


/**
 * @desc    Admin retrieves all bookings with full population
 * @route   GET /api/admin/bookings
 * @access  Private (admin only)
 */
export const getAllBookingsForAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10; // Default limit is 10
    const skip = (page - 1) * limit;
    
    const bookings = await Booking.find()
      .populate("user", "-password")
      .populate("property")
      .populate("tourPackage")
      .skip(skip)
      .limit(limit);

    const totalBookings = await Booking.countDocuments();

    res.status(200).json({
      message: "✅ All bookings retrieved successfully",
      total: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("❌ Error fetching all bookings:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};

/**
 * @desc    Admin updates full booking (status, paymentStatus, dates)
 * @route   PATCH /api/admin/bookings/:id
 * @access  Private (admin only)
 */
export const updateBookingByAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status, paymentStatus, checkIn, checkOut } = req.body;

    // Validate dates if provided
    if (checkIn && new Date(checkIn).getTime() < Date.now()) {
     res.status(400).json({ message: "❗ Check-in date cannot be in the past" });
     return;
    }

    if (checkOut && new Date(checkOut).getTime() < Date.now()) {
      res.status(400).json({ message: "❗ Check-out date cannot be in the past" });
    return;
    }

    const booking = await Booking.findById(req.params.id).populate("user", "email");
    if (!booking) {
      res.status(404).json({ message: "🚫 Booking not found" });
      return;
    }

    if (status) booking.status = status;
    if (paymentStatus) booking.paymentStatus = paymentStatus;
    if (checkIn) booking.checkIn = checkIn;
    if (checkOut) booking.checkOut = checkOut;

    await booking.save();

    // Notify user
    const user = booking.user as unknown as IUser;
    await sendEmail(
      user.email,
      "Booking Updated by Admin - GuaraniHost",
      `
        <h2>🛠️ Your booking has been updated</h2>
        <p>Hello ${user.firstName},</p>
        <p>Your booking from <strong>${new Date(booking.checkIn).toLocaleDateString()}</strong> to <strong>${new Date(booking.checkOut).toLocaleDateString()}</strong> has been updated by an admin.</p>
      `
    );

    res.status(200).json({
      message: "✅ Booking updated by admin",
      booking,
    });
  } catch (error) {
    console.error("❌ Error updating booking by admin:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};

/**
 * @desc    Admin updates only the payment status of a booking
 * @route   PATCH /api/admin/bookings/:id/payment-status
 * @access  Private (admin only)
 */
export const updateBookingPaymentStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { paymentStatus } = req.body;

    // Validate payment status
    const validStatuses = ["pending", "paid", "refunded"];
    if (!validStatuses.includes(paymentStatus)) {
     res.status(400).json({ message: "❗ Invalid payment status" });
     return;
    }

    const booking = await Booking.findById(req.params.id).populate("user", "email");
    if (!booking) {
      res.status(404).json({ message: "🚫 Booking not found" });
      return;
    }

    booking.paymentStatus = paymentStatus;
    await booking.save();

     // Notify user
    const user = booking.user as unknown as IUser;
    await sendEmail(
      user.email,
      "Payment Status Updated - GuaraniHost",
      `
        <h2>💰 Payment status updated</h2>
        <p>Hello ${user.firstName},</p>
        <p>Your payment status for the booking from <strong>${new Date(booking.checkIn).toLocaleDateString()}</strong> to <strong>${new Date(booking.checkOut).toLocaleDateString()}</strong> has been updated to <strong>${paymentStatus}</strong>.</p>
      `
    );

    res.status(200).json({
      message: "✅ Payment status updated successfully",
      booking,
    });
  } catch (error) {
    console.error("❌ Error updating payment status:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};

/**
 * @desc    Admin deletes a booking
 * @route   DELETE /api/admin/bookings/:id
 * @access  Private (admin only)
 */
export const deleteBookingByAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id).populate("user", "email");
    if (!booking) {
      res.status(404).json({ message: "🚫 Booking not found" });
      return;
    }

    // Notify user
    const user = booking.user as unknown as IUser;
    await sendEmail(
      user.email,
      "Booking Deleted - GuaraniHost",
      `
        <h2>❌ Your booking has been deleted</h2>
        <p>Hello ${user.firstName},</p>
        <p>Your booking scheduled from <strong>${new Date(booking.checkIn).toLocaleDateString()}</strong> to <strong>${new Date(booking.checkOut).toLocaleDateString()}</strong> has been deleted by an administrator.</p>
      `
    );

    res.status(200).json({
      message: "✅ Booking deleted successfully",
      bookingId: booking._id,
    });
  } catch (error) {
    console.error("❌ Error deleting booking:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};
