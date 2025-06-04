"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHostBookingSummary = exports.exportHostBookingsToPDF = exports.updateHostBookingPaymentStatus = exports.filterHostBookings = exports.getHostBookings = void 0;
const BookingModel_1 = require("../models/BookingModel");
const validateBooking_1 = require("../helpers/validateBooking");
const pdfkit_1 = __importDefault(require("pdfkit"));
const enums_1 = require("../@types/express/enums");
/**
 * @desc    Host gets all their related bookings
 * @route   GET /api/host/bookings
 * @access  Private (host only)
 */
const getHostBookings = async (req, res) => {
    try {
        const hostId = req.user?._id;
        if (!hostId) {
            res.status(401).json({ message: "🚫 Unauthorized host" });
            return;
        }
        const bookings = await BookingModel_1.Booking.find({
            $or: [
                { property: { $exists: true } },
                { tourPackage: { $exists: true } }
            ]
        })
            .populate("property")
            .populate("tourPackage")
            .populate("user");
        const filtered = bookings.filter((b) => {
            const property = b.property;
            const tour = b.tourPackage;
            return (property && property.host?.toString() === hostId.toString()) ||
                (tour && tour.host?.toString() === hostId.toString());
        });
        res.status(200).json({ message: "✅ Host bookings fetched", bookings: filtered });
    }
    catch (error) {
        console.error("❌ Host bookings error:", error);
        res.status(500).json({ message: error.message || "❌ Server error" });
    }
};
exports.getHostBookings = getHostBookings;
/**
 * @desc    Host filters bookings by criteria
 * @route   GET /api/host/bookings/filter
 * @access  Private (host only)
 */
const filterHostBookings = async (req, res) => {
    try {
        const hostId = req.user?._id;
        if (!hostId) {
            res.status(401).json({ message: "🚫 Unauthorized host" });
            return;
        }
        const { paymentStatus, from, to } = req.query;
        if (paymentStatus)
            (0, validateBooking_1.validatePaymentStatus)(paymentStatus);
        if (from && to)
            (0, validateBooking_1.validateCheckInOut)(from, to);
        const bookings = await BookingModel_1.Booking.find()
            .populate("property")
            .populate("tourPackage")
            .populate("user");
        const filtered = bookings.filter((b) => {
            const property = b.property;
            const tour = b.tourPackage;
            const isMine = (property && property.host?.toString() === hostId.toString()) ||
                (tour && tour.host?.toString() === hostId.toString());
            const matchesStatus = paymentStatus
                ? b.paymentStatus === paymentStatus
                : true;
            const matchesDate = from && to
                ? new Date(b.checkIn) >= new Date(from) && new Date(b.checkOut) <= new Date(to)
                : true;
            return isMine && matchesStatus && matchesDate;
        });
        res.status(200).json({ message: "✅ Filtered bookings", bookings: filtered });
    }
    catch (error) {
        console.error("❌ Error filtering host bookings:", error);
        res.status(500).json({ message: error.message || "❌ Server error" });
    }
};
exports.filterHostBookings = filterHostBookings;
/**
 * @desc    Host updates payment status of a booking
 * @route   PATCH /api/host/bookings/:id/payment-status
 * @access  Private (host only)
 */
const updateHostBookingPaymentStatus = async (req, res) => {
    try {
        const hostId = req.user?._id;
        if (!hostId) {
            res.status(401).json({ message: "🚫 Unauthorized host" });
            return;
        }
        const { paymentStatus } = req.body;
        (0, validateBooking_1.validatePaymentStatus)(paymentStatus);
        const booking = await BookingModel_1.Booking.findById(req.params.id)
            .populate("property")
            .populate("tourPackage")
            .populate("user");
        if (!booking) {
            res.status(404).json({ message: "❌ Booking not found" });
            return;
        }
        const property = booking.property;
        const tour = booking.tourPackage;
        const isHostOwner = (property && property.host?.toString() === hostId.toString()) ||
            (tour && tour.host?.toString() === hostId.toString());
        if (!isHostOwner) {
            res.status(403).json({ message: "🚫 You are not allowed to update this booking" });
            return;
        }
        booking.paymentStatus = paymentStatus;
        await booking.save();
        res.status(200).json({ message: "✅ Payment status updated", booking });
    }
    catch (error) {
        console.error("❌ Error updating payment status:", error);
        res.status(500).json({ message: error.message || "❌ Server error" });
    }
};
exports.updateHostBookingPaymentStatus = updateHostBookingPaymentStatus;
/**
 * @desc    Host exports bookings as PDF
 * @route   GET /api/host/bookings/export/pdf
 * @access  Private (host only)
 */
const exportHostBookingsToPDF = async (req, res) => {
    try {
        const hostId = req.user?._id;
        if (!hostId) {
            res.status(401).json({ message: "🚫 Unauthorized host" });
            return;
        }
        const { from, to, paymentStatus } = req.query;
        if (paymentStatus)
            (0, validateBooking_1.validatePaymentStatus)(paymentStatus);
        if (from && to)
            (0, validateBooking_1.validateCheckInOut)(from, to);
        const bookings = await BookingModel_1.Booking.find()
            .populate("property")
            .populate("tourPackage")
            .populate("user");
        const filtered = bookings.filter((b) => {
            const property = b.property;
            const tour = b.tourPackage;
            const isMine = (property && property.host?.toString() === hostId.toString()) ||
                (tour && tour.host?.toString() === hostId.toString());
            const matchesStatus = paymentStatus
                ? b.paymentStatus === paymentStatus
                : true;
            const matchesDate = from && to
                ? new Date(b.checkIn) >= new Date(from) && new Date(b.checkOut) <= new Date(to)
                : true;
            return isMine && matchesStatus && matchesDate;
        });
        const doc = new pdfkit_1.default({ margin: 30, size: "A4" });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=host-bookings.pdf");
        doc.pipe(res);
        doc.fontSize(18).text("Host Bookings Report", { align: "center" });
        doc.moveDown();
        filtered.forEach((b, i) => {
            const user = b.user;
            const property = b.property;
            const tour = b.tourPackage;
            doc.fontSize(10).text(`${i + 1}. ${user?.firstName || "-"} ${user?.lastName || "-"}`);
            doc.text(`Stay: ${property?.title || tour?.title || "-"}`);
            doc.text(`Dates: ${new Date(b.checkIn).toLocaleDateString()} - ${new Date(b.checkOut).toLocaleDateString()}`);
            doc.text(`Guests: ${b.guests} | Payment: ${b.paymentStatus}`);
            doc.moveDown();
        });
        doc.end();
    }
    catch (error) {
        console.error("❌ Error exporting bookings PDF:", error);
        res.status(500).json({ message: error.message || "❌ Server error" });
    }
};
exports.exportHostBookingsToPDF = exportHostBookingsToPDF;
/**
 * @desc    Host gets summary of bookings and payment status
 * @route   GET /api/host/bookings/summary
 * @access  Private (host only)
 */
const getHostBookingSummary = async (req, res) => {
    try {
        const hostId = req.user?._id;
        if (!hostId) {
            res.status(401).json({ message: "🚫 Unauthorized host" });
            return;
        }
        const bookings = await BookingModel_1.Booking.find()
            .populate("property")
            .populate("tourPackage");
        const filtered = bookings.filter((b) => {
            const property = b.property;
            const tour = b.tourPackage;
            return (property && property.host?.toString() === hostId.toString()) ||
                (tour && tour.host?.toString() === hostId.toString());
        });
        const summary = {
            totalBookings: filtered.length,
            pending: filtered.filter((b) => b.status === enums_1.BookingStatus.PENDING).length,
            confirmed: filtered.filter((b) => b.status === enums_1.BookingStatus.CONFIRMED).length,
            cancelled: filtered.filter((b) => b.status === enums_1.BookingStatus.CANCELLED).length,
            payments: {
                pending: filtered.filter((b) => b.paymentStatus === enums_1.PaymentStatus.PENDING).length,
                paid: filtered.filter((b) => b.paymentStatus === enums_1.PaymentStatus.PAID).length,
                refunded: filtered.filter((b) => b.paymentStatus === enums_1.PaymentStatus.REFUNDED).length
            }
        };
        res.status(200).json({ message: "✅ Host booking summary", summary });
    }
    catch (error) {
        console.error("❌ Error fetching summary:", error);
        res.status(500).json({ message: error.message || "❌ Server error" });
    }
};
exports.getHostBookingSummary = getHostBookingSummary;
