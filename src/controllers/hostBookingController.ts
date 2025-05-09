import { Request, Response } from "express";
import { Booking } from "../models/BookingModel";
import { Property } from "../models/PropertyModel";
import { TourPackage } from "../models/TourPackageModel";

/**
 * @desc    Host retrieves all bookings related to their properties or tour packages
 * @route   GET /api/host/bookings/summary
 * @access  Private (host only)
 */
export const getHostBookingSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;

    if (!hostId || req.user?.role !== "host") {
      res.status(403).json({ message: "🚫 Unauthorized" });
      return;
    }

    const bookings = await Booking.find({
      $or: [
        { property: { $exists: true } },
        { tourPackage: { $exists: true } }
      ]
    })
      .populate({ path: "property", match: { host: hostId } })
      .populate({ path: "tourPackage", match: { host: hostId } })
      .populate("user", "firstName lastName email");

    const filtered = bookings.filter(b => b.property || b.tourPackage);

    res.status(200).json({
      message: "✅ Host booking summary retrieved successfully",
      total: filtered.length,
      bookings: filtered,
    });
  } catch (error) {
    console.error("❌ Error retrieving host booking summary:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};

/**
 * @desc    Host updates booking status or paymentStatus for their own property/tour booking
 * @route   PATCH /api/host/bookings/:id
 * @access  Private (host only)
 */
export const updateBookingStatusByHost = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const hostId = req.user?._id;
    if (!hostId) {
      res.status(401).json({ message: "❌ Unauthorized" });
      return;
    }

    const { status, paymentStatus, checkIn, checkOut } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404).json({ message: "🚫 Booking not found" });
      return;
    }

    const [property, tour] = await Promise.all([
      booking.property ? Property.findOne({ _id: booking.property, host: hostId }) : null,
      booking.tourPackage ? TourPackage.findOne({ _id: booking.tourPackage, host: hostId }) : null,
    ]);

    if (!property && !tour) {
      res.status(403).json({ message: "🚫 Not authorized to update this booking" });
      return;
    }

    if (status) booking.status = status;
    if (paymentStatus) booking.paymentStatus = paymentStatus;
    if (checkIn) booking.checkIn = checkIn;
    if (checkOut) booking.checkOut = checkOut;

    await booking.save();

    res.status(200).json({
      message: "✅ Booking updated by host",
      booking,
    });
  } catch (error) {
    console.error("❌ Error updating booking by host:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};

/**
 * @desc    Host retrieves all bookings related to their properties
 * @route   GET /api/host/bookings/properties
 * @access  Private (host only)
 */
export const getBookingsForHostProperties = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;
    if (!hostId) {
      res.status(401).json({ message: "❌ Unauthorized" });
      return;
    }

    const bookings = await Booking.find()
      .populate("property")
      .populate("user");

    const filtered = bookings.filter(
      (b) => b.property && (b.property as any).host?.toString() === hostId.toString()
    );

    res.status(200).json({
      message: "✅ Property bookings retrieved",
      bookings: filtered,
    });
  } catch (error) {
    console.error("❌ Error fetching property bookings:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};

/**
 * @desc    Host retrieves all bookings related to their tour packages
 * @route   GET /api/host/bookings/tours
 * @access  Private (host only)
 */
export const getBookingsForHostTours = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;
    if (!hostId) {
      res.status(401).json({ message: "❌ Unauthorized" });
      return;
    }

    const bookings = await Booking.find()
      .populate("tourPackage")
      .populate("user");

    const filtered = bookings.filter(
      (b) => b.tourPackage && (b.tourPackage as any).host?.toString() === hostId.toString()
    );

    res.status(200).json({
      message: "✅ Tour bookings retrieved",
      bookings: filtered,
    });
  } catch (error) {
    console.error("❌ Error fetching tour bookings:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};

/**
 * @desc    Host filter bookings by checkIn/checkOut date range
 * @route   GET /api/host/bookings/filter?start=YYYY-MM-DD&end=YYYY-MM-DD
 * @access  Private (host only)
 */
export const hostFilterBookingsByDateRange = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;
    const { startDate, endDate } = req.query;

    if (req.user?.role !== "host") {
      res.status(403).json({ message: "🚫 Access denied" });
      return;
    }

    if (!startDate || !endDate) {
      res.status(400).json({ message: "❗ Both startDate and endDate are required" });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const bookings = await Booking.find({
      $or: [
        { checkIn: { $gte: start, $lte: end } },
        { checkOut: { $gte: start, $lte: end } },
      ],
    })
      .populate("property")
      .populate("tourPackage")
      .populate("user");

    const filtered = bookings.filter(
      (b) =>
        (b.property && (b.property as any).host?.toString() === hostId?.toString()) ||
        (b.tourPackage && (b.tourPackage as any).host?.toString() === hostId?.toString())
    );

    res.status(200).json({
      message: "✅ Filtered bookings for host",
      bookings: filtered,
    });
  } catch (error) {
    console.error("❌ Error filtering bookings by date:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};