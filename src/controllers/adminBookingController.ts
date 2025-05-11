import { Request, Response } from "express";
import { Booking } from "../models/BookingModel";
import { validateCheckInOut, validatePaymentStatus } from "../helpers/validateBooking";

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

/**
 * @desc    Admin filters bookings by check-in and check-out range
 * @route   GET /api/admin/bookings/filter/date
 * @query   from=YYYY-MM-DD&to=YYYY-MM-DD
 * @access  Private (admin only)
 */
export const filterBookingsByDateRange = async (req: Request, res: Response): Promise<void> => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      res.status(400).json({ message: "❗ Both 'from' and 'to' dates are required" });
      return;
    }

    validateCheckInOut(from as string, to as string);

    const bookings = await Booking.find({
      checkIn: { $gte: new Date(from as string) },
      checkOut: { $lte: new Date(to as string) },
    })
      .populate("user", "-password")
      .populate("property")
      .populate("tourPackage");

    res.status(200).json({
      message: "✅ Bookings filtered by date",
      total: bookings.length,
      bookings,
    });
  } catch (error: any) {
    console.error("❌ Error filtering by date:", error);
    res.status(500).json({ message: error.message || "❌ Server error" });
  }
};

/**
 * @desc    Admin filters bookings by status or payment status
 * @route   GET /api/admin/bookings/filter/status
 * @query   status=pending|confirmed|cancelled
 * @query   paymentStatus=paid|pending|refunded
 * @access  Private (admin only)
 */
export const filterBookingsByStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, paymentStatus } = req.query;

    if (status) validatePaymentStatus(status);
    if (paymentStatus) validatePaymentStatus(paymentStatus);

    const query: any = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const bookings = await Booking.find(query)
      .populate("user", "-password")
      .populate("property")
      .populate("tourPackage");

    res.status(200).json({
      message: "✅ Bookings filtered by status",
      total: bookings.length,
      bookings,
    });
  } catch (error: any) {
    console.error("❌ Error filtering by status:", error);
    res.status(500).json({ message: error.message || "❌ Server error" });
  }
};

/**
 * @desc    Admin filters bookings by type: property or tour
 * @route   GET /api/admin/bookings/filter/type
 * @query   type=property|tour
 * @access  Private (admin only)
 */
export const filterBookingsByType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.query;

    if (!type || !["property", "tour"].includes(type as string)) {
      res.status(400).json({ message: "❗ Type must be 'property' or 'tour'" });
      return;
    }

    const filter = type === "property" ? { property: { $exists: true } } : { tourPackage: { $exists: true } };

    const bookings = await Booking.find(filter)
      .populate("user", "-password")
      .populate("property")
      .populate("tourPackage");

    res.status(200).json({
      message: `✅ Bookings filtered by type: ${type}`,
      total: bookings.length,
      bookings,
    });
  } catch (error: any) {
    console.error("❌ Error filtering by type:", error);
    res.status(500).json({ message: error.message || "❌ Server error" });
  }
};
