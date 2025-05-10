import { Request, Response } from "express";
import { Booking } from "../models/BookingModel";
import { Property, IProperty } from "../models/PropertyModel";
import { TourPackage, ITourPackage } from "../models/TourPackageModel";
import { IUser } from "../models/User";
import { uploadImagesToCloudinary } from "../helpers/uploadImagesToCloudinary";
import { deleteImageFromCloudinary } from "../helpers/deleteImageFromCloudinary";
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

    const bookings = await Booking.find({
      $or: [
        { property: { $exists: true } },
        { tourPackage: { $exists: true } }
      ]
    })
      .populate("property")
      .populate("tourPackage")
      .populate("user");

    const filtered = bookings.filter((b) => {
      const property = b.property as unknown as IProperty;
      const tour = b.tourPackage as unknown as ITourPackage;
      return (property && property.host?.toString() === hostId.toString()) ||
             (tour && tour.host?.toString() === hostId.toString());
    });

    res.status(200).json({ message: "✅ Host bookings fetched", bookings: filtered });
  } catch (error: any) {
    console.error("❌ Host bookings error:", error);
    res.status(500).json({ message: error.message || "❌ Server error" });
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

    const { paymentStatus, from, to } = req.query;
    if (paymentStatus) validatePaymentStatus(paymentStatus);
    if (from && to) validateCheckInOut(from as string, to as string);

    const bookings = await Booking.find()
      .populate("property")
      .populate("tourPackage")
      .populate("user");

    const filtered = bookings.filter((b) => {
      const property = b.property as unknown as IProperty;
      const tour = b.tourPackage as unknown as ITourPackage;

      const isMine = (property && property.host?.toString() === hostId.toString()) ||
                     (tour && tour.host?.toString() === hostId.toString());

      const matchesStatus = paymentStatus
        ? b.paymentStatus === paymentStatus
        : true;

      const matchesDate = from && to
        ? new Date(b.checkIn) >= new Date(from as string) && new Date(b.checkOut) <= new Date(to as string)
        : true;

      return isMine && matchesStatus && matchesDate;
    });

    res.status(200).json({ message: "✅ Filtered bookings", bookings: filtered });
  } catch (error: any) {
    console.error("❌ Error filtering host bookings:", error);
    res.status(500).json({ message: error.message || "❌ Server error" });
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
    if (!hostId) {
      res.status(401).json({ message: "🚫 Unauthorized host" });
      return;
    }

    const { paymentStatus } = req.body;
    validatePaymentStatus(paymentStatus);

    const booking = await Booking.findById(req.params.id)
      .populate("property")
      .populate("tourPackage")
      .populate("user");

    if (!booking) {
      res.status(404).json({ message: "❌ Booking not found" });
      return;
    }

    const property = booking.property as unknown as IProperty;
    const tour = booking.tourPackage as unknown as ITourPackage;

    const isHostOwner = (property && property.host?.toString() === hostId.toString()) ||
                        (tour && tour.host?.toString() === hostId.toString());

    if (!isHostOwner) {
      res.status(403).json({ message: "🚫 You are not allowed to update this booking" });
      return;
    }

    booking.paymentStatus = paymentStatus;
    await booking.save();

    res.status(200).json({ message: "✅ Payment status updated", booking });
  } catch (error: any) {
    console.error("❌ Error updating payment status:", error);
    res.status(500).json({ message: error.message || "❌ Server error" });
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

    const { from, to, paymentStatus } = req.query;
    if (paymentStatus) validatePaymentStatus(paymentStatus);
    if (from && to) validateCheckInOut(from as string, to as string);

    const bookings = await Booking.find()
      .populate("property")
      .populate("tourPackage")
      .populate("user");

    const filtered = bookings.filter((b) => {
      const property = b.property as unknown as IProperty;
      const tour = b.tourPackage as unknown as ITourPackage;

      const isMine = (property && property.host?.toString() === hostId.toString()) ||
                     (tour && tour.host?.toString() === hostId.toString());

      const matchesStatus = paymentStatus
        ? b.paymentStatus === paymentStatus
        : true;

      const matchesDate = from && to
        ? new Date(b.checkIn) >= new Date(from as string) && new Date(b.checkOut) <= new Date(to as string)
        : true;

      return isMine && matchesStatus && matchesDate;
    });

    const doc = new PDFDocument({ margin: 30, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=host-bookings.pdf");
    doc.pipe(res);

    doc.fontSize(18).text("Host Bookings Report", { align: "center" });
    doc.moveDown();

    filtered.forEach((b, i) => {
      const user = b.user as unknown as IUser;
      const property = b.property as unknown as IProperty;
      const tour = b.tourPackage as unknown as ITourPackage;

      doc.fontSize(10).text(`${i + 1}. ${user?.firstName || "-"} ${user?.lastName || "-"}`);
      doc.text(`Stay: ${property?.title || tour?.title || "-"}`);
      doc.text(`Dates: ${new Date(b.checkIn).toLocaleDateString()} - ${new Date(b.checkOut).toLocaleDateString()}`);
      doc.text(`Guests: ${b.guests} | Payment: ${b.paymentStatus}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error: any) {
    console.error("❌ Error exporting bookings PDF:", error);
    res.status(500).json({ message: error.message || "❌ Server error" });
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

    const bookings = await Booking.find()
      .populate("property")
      .populate("tourPackage");

    const filtered = bookings.filter((b) => {
      const property = b.property as unknown as IProperty;
      const tour = b.tourPackage as unknown as ITourPackage;
      return (property && property.host?.toString() === hostId.toString()) ||
             (tour && tour.host?.toString() === hostId.toString());
    });

    const summary = {
      totalBookings: filtered.length,
      pending: filtered.filter((b) => b.status === BookingStatus.PENDING).length,
      confirmed: filtered.filter((b) => b.status === BookingStatus.CONFIRMED).length,
      cancelled: filtered.filter((b) => b.status === BookingStatus.CANCELLED).length,
      payments: {
        pending: filtered.filter((b) => b.paymentStatus === PaymentStatus.PENDING).length,
        paid: filtered.filter((b) => b.paymentStatus === PaymentStatus.PAID).length,
        refunded: filtered.filter((b) => b.paymentStatus === PaymentStatus.REFUNDED).length
      }
    };

    res.status(200).json({ message: "✅ Host booking summary", summary });
  } catch (error: any) {
    console.error("❌ Error fetching summary:", error);
    res.status(500).json({ message: error.message || "❌ Server error" });
  }
};
