import { Request, Response } from "express";
import { Booking } from "../models/BookingModel";

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
    const bookings = await Booking.find()
      .populate("user", "-password")
      .populate("property")
      .populate("tourPackage");

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

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404).json({ message: "🚫 Booking not found" });
      return;
    }

    if (status) booking.status = status;
    if (paymentStatus) booking.paymentStatus = paymentStatus;
    if (checkIn) booking.checkIn = checkIn;
    if (checkOut) booking.checkOut = checkOut;

    await booking.save();

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

    if (!paymentStatus) {
      res.status(400).json({ message: "❗ Payment status is required" });
      return;
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404).json({ message: "🚫 Booking not found" });
      return;
    }

    booking.paymentStatus = paymentStatus;
    await booking.save();

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
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      res.status(404).json({ message: "🚫 Booking not found" });
      return;
    }

    res.status(200).json({
      message: "✅ Booking deleted successfully",
      bookingId: booking._id,
    });
  } catch (error) {
    console.error("❌ Error deleting booking:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};
