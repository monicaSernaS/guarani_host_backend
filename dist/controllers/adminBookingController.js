"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookingById = exports.exportBookingsToPDF = exports.filterBookingsByHost = exports.filterBookingsByType = exports.filterBookingsByStatus = exports.filterBookingsByDateRange = exports.deleteBookingByAdmin = exports.updateBookingPaymentStatus = exports.updateBookingByAdmin = exports.getAllBookingsForAdmin = void 0;
const BookingModel_1 = require("../models/BookingModel");
const PropertyModel_1 = require("../models/PropertyModel");
const TourPackageModel_1 = require("../models/TourPackageModel");
const User_1 = require("../models/User");
const validateBooking_1 = require("../helpers/validateBooking");
const emailService_1 = require("../utils/emailService");
const pdfkit_1 = __importDefault(require("pdfkit"));
/**
 * @desc    Admin retrieves all bookings with full population
 * @route   GET /api/admin/bookings
 * @access  Private (admin only)
 */
const getAllBookingsForAdmin = async (req, res) => {
    try {
        // Get query parameters for pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Get total count for pagination
        const totalBookings = await BookingModel_1.Booking.countDocuments();
        // Fetch bookings with pagination and full population
        const bookings = await BookingModel_1.Booking.find()
            .populate("user", "-password")
            .populate("property", "title city location pricePerNight host imageUrls")
            .populate("tourPackage", "title duration price host")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        res.status(200).json({
            success: true,
            message: "✅ All bookings retrieved successfully",
            data: {
                bookings,
                pagination: {
                    current: page,
                    total: Math.ceil(totalBookings / limit),
                    totalBookings,
                    hasNext: page * limit < totalBookings,
                    hasPrev: page > 1
                }
            }
        });
    }
    catch (error) {
        console.error("❌ Error fetching all bookings:", error);
        res.status(500).json({
            success: false,
            message: "❌ Server error"
        });
    }
};
exports.getAllBookingsForAdmin = getAllBookingsForAdmin;
/**
 * @desc    Admin updates full booking (status, paymentStatus, dates)
 * @route   PATCH /api/admin/bookings/:id
 * @access  Private (admin only)
 */
const updateBookingByAdmin = async (req, res) => {
    try {
        const { status, paymentStatus, checkIn, checkOut, totalPrice, guests } = req.body;
        const booking = await BookingModel_1.Booking.findById(req.params.id)
            .populate("user", "firstName lastName email")
            .populate("property", "title")
            .populate("tourPackage", "title");
        if (!booking) {
            res.status(404).json({
                success: false,
                message: "🚫 Booking not found"
            });
            return;
        }
        // Validate dates if provided
        if (checkIn && checkOut) {
            (0, validateBooking_1.validateCheckInOut)(checkIn, checkOut);
        }
        // Validate status if provided
        if (status) {
            (0, validateBooking_1.validateBookingStatus)(status);
        }
        // Validate payment status if provided
        if (paymentStatus) {
            (0, validateBooking_1.validatePaymentStatus)(paymentStatus);
        }
        // Store previous values for email notification
        const previousStatus = booking.status;
        const previousPaymentStatus = booking.paymentStatus;
        // Update fields
        if (status)
            booking.status = status;
        if (paymentStatus)
            booking.paymentStatus = paymentStatus;
        if (checkIn)
            booking.checkIn = new Date(checkIn);
        if (checkOut)
            booking.checkOut = new Date(checkOut);
        if (totalPrice)
            booking.totalPrice = totalPrice;
        if (guests)
            booking.guests = guests;
        await booking.save();
        // Send email notification if status changed
        const user = booking.user;
        if (user?.email && (status !== previousStatus || paymentStatus !== previousPaymentStatus)) {
            const bookingType = booking.property ? 'property' : 'tour';
            const bookingTitle = booking.property ?
                booking.property.title :
                booking.tourPackage.title;
            await (0, emailService_1.sendEmail)(user.email, "Booking Update - GuaraniHost", `
        <h2>📝 Booking Updated</h2>
        <p>Hello ${user.firstName},</p>
        <p>Your ${bookingType} booking for <strong>${bookingTitle}</strong> has been updated by admin.</p>
        <p><strong>Previous Status:</strong> ${previousStatus}</p>
        <p><strong>New Status:</strong> ${booking.status}</p>
        <p><strong>Previous Payment Status:</strong> ${previousPaymentStatus}</p>
        <p><strong>New Payment Status:</strong> ${booking.paymentStatus}</p>
        <p>Check-in: ${booking.checkIn.toLocaleDateString()}</p>
        <p>Check-out: ${booking.checkOut.toLocaleDateString()}</p>
        <p>Total Price: $${booking.totalPrice}</p>
        <br>
        <p>Best regards,<br>GuaraniHost Team</p>
        `);
        }
        res.status(200).json({
            success: true,
            message: "✅ Booking updated by admin",
            data: { booking }
        });
    }
    catch (error) {
        console.error("❌ Error updating booking by admin:", error);
        res.status(400).json({
            success: false,
            message: error.message || "❌ Server error"
        });
    }
};
exports.updateBookingByAdmin = updateBookingByAdmin;
/**
 * @desc    Admin updates only the payment status of a booking
 * @route   PATCH /api/admin/bookings/:id/payment-status
 * @access  Private (admin only)
 */
const updateBookingPaymentStatus = async (req, res) => {
    try {
        const { paymentStatus } = req.body;
        if (!paymentStatus) {
            res.status(400).json({
                success: false,
                message: "❗ Payment status is required"
            });
            return;
        }
        (0, validateBooking_1.validatePaymentStatus)(paymentStatus);
        const booking = await BookingModel_1.Booking.findById(req.params.id)
            .populate("user", "firstName lastName email")
            .populate("property", "title")
            .populate("tourPackage", "title");
        if (!booking) {
            res.status(404).json({
                success: false,
                message: "🚫 Booking not found"
            });
            return;
        }
        const previousPaymentStatus = booking.paymentStatus;
        booking.paymentStatus = paymentStatus;
        await booking.save();
        // Send email notification
        const user = booking.user;
        if (user?.email) {
            const bookingType = booking.property ? 'property' : 'tour';
            const bookingTitle = booking.property ?
                booking.property.title :
                booking.tourPackage.title;
            await (0, emailService_1.sendEmail)(user.email, "Payment Status Updated - GuaraniHost", `
        <h2>💳 Payment Status Updated</h2>
        <p>Hello ${user.firstName},</p>
        <p>The payment status for your ${bookingType} booking <strong>${bookingTitle}</strong> has been updated.</p>
        <p><strong>New Payment Status:</strong> ${paymentStatus}</p>
        <p>Booking Period: ${booking.checkIn.toLocaleDateString()} - ${booking.checkOut.toLocaleDateString()}</p>
        <p>Total Amount: $${booking.totalPrice}</p>
        <br>
        <p>Best regards,<br>GuaraniHost Team</p>
        `);
        }
        res.status(200).json({
            success: true,
            message: "✅ Payment status updated successfully",
            data: {
                booking,
                previousPaymentStatus,
                newPaymentStatus: paymentStatus
            }
        });
    }
    catch (error) {
        console.error("❌ Error updating payment status:", error);
        res.status(400).json({
            success: false,
            message: error.message || "❌ Server error"
        });
    }
};
exports.updateBookingPaymentStatus = updateBookingPaymentStatus;
/**
 * @desc    Admin deletes a booking
 * @route   DELETE /api/admin/bookings/:id
 * @access  Private (admin only)
 */
const deleteBookingByAdmin = async (req, res) => {
    try {
        const booking = await BookingModel_1.Booking.findById(req.params.id)
            .populate("user", "firstName lastName email")
            .populate("property", "title")
            .populate("tourPackage", "title");
        if (!booking) {
            res.status(404).json({
                success: false,
                message: "🚫 Booking not found"
            });
            return;
        }
        const user = booking.user;
        const bookingType = booking.property ? 'property' : 'tour';
        const bookingTitle = booking.property ?
            booking.property.title :
            booking.tourPackage.title;
        // Delete the booking
        await BookingModel_1.Booking.findByIdAndDelete(req.params.id);
        // Send cancellation email
        if (user?.email) {
            await (0, emailService_1.sendEmail)(user.email, "Booking Cancelled - GuaraniHost", `
        <h2>❌ Booking Cancelled</h2>
        <p>Hello ${user.firstName},</p>
        <p>Your ${bookingType} booking for <strong>${bookingTitle}</strong> has been cancelled by admin.</p>
        <p>Booking Period: ${booking.checkIn.toLocaleDateString()} - ${booking.checkOut.toLocaleDateString()}</p>
        <p>If you have any questions, please contact our support team.</p>
        <br>
        <p>Best regards,<br>GuaraniHost Team</p>
        `);
        }
        res.status(200).json({
            success: true,
            message: "✅ Booking deleted successfully",
            data: { bookingId: booking._id }
        });
    }
    catch (error) {
        console.error("❌ Error deleting booking:", error);
        res.status(500).json({
            success: false,
            message: "❌ Server error"
        });
    }
};
exports.deleteBookingByAdmin = deleteBookingByAdmin;
/**
 * @desc    Admin filters bookings by check-in and check-out range
 * @route   GET /api/admin/bookings/filter/date
 * @query   from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&limit=10
 * @access  Private (admin only)
 */
const filterBookingsByDateRange = async (req, res) => {
    try {
        const { from, to, page = 1, limit = 10 } = req.query;
        if (!from || !to) {
            res.status(400).json({
                success: false,
                message: "❗ Both 'from' and 'to' dates are required"
            });
            return;
        }
        (0, validateBooking_1.validateCheckInOut)(from, to);
        const skip = (Number(page) - 1) * Number(limit);
        const query = {
            checkIn: { $gte: new Date(from) },
            checkOut: { $lte: new Date(to) },
        };
        const [bookings, totalCount] = await Promise.all([
            BookingModel_1.Booking.find(query)
                .populate("user", "-password")
                .populate("property", "title city location pricePerNight host")
                .populate("tourPackage", "title duration price host")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            BookingModel_1.Booking.countDocuments(query)
        ]);
        res.status(200).json({
            success: true,
            message: "✅ Bookings filtered by date",
            data: {
                bookings,
                pagination: {
                    current: Number(page),
                    total: Math.ceil(totalCount / Number(limit)),
                    totalCount,
                    hasNext: Number(page) * Number(limit) < totalCount,
                    hasPrev: Number(page) > 1
                },
                filters: { from, to }
            }
        });
    }
    catch (error) {
        console.error("❌ Error filtering by date:", error);
        res.status(400).json({
            success: false,
            message: error.message || "❌ Server error"
        });
    }
};
exports.filterBookingsByDateRange = filterBookingsByDateRange;
/**
 * @desc    Admin filters bookings by status or payment status
 * @route   GET /api/admin/bookings/filter/status
 * @query   status=pending|confirmed|cancelled&paymentStatus=paid|pending|refunded&page=1&limit=10
 * @access  Private (admin only)
 */
const filterBookingsByStatus = async (req, res) => {
    try {
        const { status, paymentStatus, page = 1, limit = 10 } = req.query;
        if (status)
            (0, validateBooking_1.validateBookingStatus)(status);
        if (paymentStatus)
            (0, validateBooking_1.validatePaymentStatus)(paymentStatus);
        const skip = (Number(page) - 1) * Number(limit);
        const query = {};
        if (status)
            query.status = status;
        if (paymentStatus)
            query.paymentStatus = paymentStatus;
        const [bookings, totalCount] = await Promise.all([
            BookingModel_1.Booking.find(query)
                .populate("user", "-password")
                .populate("property", "title city location pricePerNight host")
                .populate("tourPackage", "title duration price host")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            BookingModel_1.Booking.countDocuments(query)
        ]);
        res.status(200).json({
            success: true,
            message: "✅ Bookings filtered by status",
            data: {
                bookings,
                pagination: {
                    current: Number(page),
                    total: Math.ceil(totalCount / Number(limit)),
                    totalCount,
                    hasNext: Number(page) * Number(limit) < totalCount,
                    hasPrev: Number(page) > 1
                },
                filters: { status, paymentStatus }
            }
        });
    }
    catch (error) {
        console.error("❌ Error filtering by status:", error);
        res.status(400).json({
            success: false,
            message: error.message || "❌ Server error"
        });
    }
};
exports.filterBookingsByStatus = filterBookingsByStatus;
/**
 * @desc    Admin filters bookings by type: property or tour
 * @route   GET /api/admin/bookings/filter/type
 * @query   type=property|tour&page=1&limit=10
 * @access  Private (admin only)
 */
const filterBookingsByType = async (req, res) => {
    try {
        const { type, page = 1, limit = 10 } = req.query;
        if (!type || !["property", "tour"].includes(type)) {
            res.status(400).json({
                success: false,
                message: "❗ Type must be 'property' or 'tour'"
            });
            return;
        }
        const skip = (Number(page) - 1) * Number(limit);
        const filter = type === "property"
            ? { property: { $exists: true, $ne: null } }
            : { tourPackage: { $exists: true, $ne: null } };
        const [bookings, totalCount] = await Promise.all([
            BookingModel_1.Booking.find(filter)
                .populate("user", "-password")
                .populate("property", "title city location pricePerNight host")
                .populate("tourPackage", "title duration price host")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            BookingModel_1.Booking.countDocuments(filter)
        ]);
        res.status(200).json({
            success: true,
            message: `✅ Bookings filtered by type: ${type}`,
            data: {
                bookings,
                pagination: {
                    current: Number(page),
                    total: Math.ceil(totalCount / Number(limit)),
                    totalCount,
                    hasNext: Number(page) * Number(limit) < totalCount,
                    hasPrev: Number(page) > 1
                },
                filters: { type }
            }
        });
    }
    catch (error) {
        console.error("❌ Error filtering by type:", error);
        res.status(400).json({
            success: false,
            message: error.message || "❌ Server error"
        });
    }
};
exports.filterBookingsByType = filterBookingsByType;
/**
 * @desc    Admin filters bookings by host
 * @route   GET /api/admin/bookings/filter/host/:hostId
 * @access  Private (admin only)
 */
const filterBookingsByHost = async (req, res) => {
    try {
        const { hostId } = req.params;
        const { status, paymentStatus, type, page = 1, limit = 10 } = req.query;
        if (!hostId) {
            res.status(400).json({
                success: false,
                message: "❗ Host ID is required"
            });
            return;
        }
        // Validate host exists
        const host = await User_1.User.findById(hostId);
        if (!host || host.role !== 'host') {
            res.status(404).json({
                success: false,
                message: "❗ Host not found"
            });
            return;
        }
        const skip = (Number(page) - 1) * Number(limit);
        // Get host's properties and tours
        const [hostPropertyIds, hostTourIds] = await Promise.all([
            getHostPropertyIds(hostId),
            getHostTourIds(hostId)
        ]);
        // Build query for bookings of this host's properties/tours
        const query = {
            $or: [
                { property: { $in: hostPropertyIds } },
                { tourPackage: { $in: hostTourIds } }
            ]
        };
        // Add additional filters
        if (status) {
            (0, validateBooking_1.validateBookingStatus)(status);
            query.status = status;
        }
        if (paymentStatus) {
            (0, validateBooking_1.validatePaymentStatus)(paymentStatus);
            query.paymentStatus = paymentStatus;
        }
        if (type) {
            if (type === 'property') {
                query.property = { $exists: true, $ne: null };
                delete query.$or; // Remove $or and use property filter
                query.property = { $in: hostPropertyIds };
            }
            else if (type === 'tour') {
                query.tourPackage = { $exists: true, $ne: null };
                delete query.$or; // Remove $or and use tourPackage filter
                query.tourPackage = { $in: hostTourIds };
            }
        }
        const [bookings, totalCount] = await Promise.all([
            BookingModel_1.Booking.find(query)
                .populate("user", "firstName lastName email phone")
                .populate("property", "title city location pricePerNight host")
                .populate("tourPackage", "title duration price host")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            BookingModel_1.Booking.countDocuments(query)
        ]);
        res.status(200).json({
            success: true,
            message: `✅ Bookings filtered by host`,
            data: {
                bookings,
                pagination: {
                    current: Number(page),
                    total: Math.ceil(totalCount / Number(limit)),
                    totalCount,
                    hasNext: Number(page) * Number(limit) < totalCount,
                    hasPrev: Number(page) > 1
                },
                filters: { hostId, status, paymentStatus, type },
                hostInfo: {
                    id: host._id,
                    name: `${host.firstName} ${host.lastName}`,
                    email: host.email
                }
            }
        });
    }
    catch (error) {
        console.error("❌ Error filtering by host:", error);
        res.status(500).json({
            success: false,
            message: error.message || "❌ Server error"
        });
    }
};
exports.filterBookingsByHost = filterBookingsByHost;
/**
 * @desc    Admin exports all bookings as PDF
 * @route   GET /api/admin/bookings/export/pdf
 * @query   from=YYYY-MM-DD&to=YYYY-MM-DD&status=pending&paymentStatus=paid
 * @access  Private (admin only)
 */
const exportBookingsToPDF = async (req, res) => {
    try {
        const { from, to, status, paymentStatus, type, hostId } = req.query;
        // Build filter query
        const filterQuery = {};
        if (from && to) {
            (0, validateBooking_1.validateCheckInOut)(from, to);
            filterQuery.checkIn = { $gte: new Date(from) };
            filterQuery.checkOut = { $lte: new Date(to) };
        }
        if (status) {
            (0, validateBooking_1.validateBookingStatus)(status);
            filterQuery.status = status;
        }
        if (paymentStatus) {
            (0, validateBooking_1.validatePaymentStatus)(paymentStatus);
            filterQuery.paymentStatus = paymentStatus;
        }
        if (type && ["property", "tour"].includes(type)) {
            if (type === "property") {
                filterQuery.property = { $exists: true, $ne: null };
            }
            else {
                filterQuery.tourPackage = { $exists: true, $ne: null };
            }
        }
        if (hostId) {
            const [hostPropertyIds, hostTourIds] = await Promise.all([
                getHostPropertyIds(hostId),
                getHostTourIds(hostId)
            ]);
            filterQuery.$or = [
                { property: { $in: hostPropertyIds } },
                { tourPackage: { $in: hostTourIds } }
            ];
        }
        const bookings = await BookingModel_1.Booking.find(filterQuery)
            .populate("user", "firstName lastName email phone")
            .populate("property", "title city location pricePerNight")
            .populate("tourPackage", "title duration price")
            .sort({ createdAt: -1 });
        if (bookings.length === 0) {
            res.status(404).json({
                success: false,
                message: "❌ No bookings found for the specified criteria"
            });
            return;
        }
        // Create PDF document
        const doc = new pdfkit_1.default({
            margin: 50,
            size: "A4",
            bufferPages: true
        });
        // Set response headers
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=admin-bookings-export-${Date.now()}.pdf`);
        doc.pipe(res);
        // PDF Header
        doc.fontSize(24).font('Helvetica-Bold').text("GuaraniHost - Admin Bookings Report", { align: "center" });
        doc.moveDown();
        // Report metadata
        doc.fontSize(12).font('Helvetica');
        doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`, { align: "right" });
        doc.text(`Total Bookings: ${bookings.length}`, { align: "right" });
        // Filters applied
        if (from && to) {
            doc.text(`Date Range: ${new Date(from).toLocaleDateString()} - ${new Date(to).toLocaleDateString()}`, { align: "right" });
        }
        if (status)
            doc.text(`Status Filter: ${status}`, { align: "right" });
        if (paymentStatus)
            doc.text(`Payment Filter: ${paymentStatus}`, { align: "right" });
        if (type)
            doc.text(`Type Filter: ${type}`, { align: "right" });
        doc.moveDown(2);
        // Bookings details
        doc.fontSize(14).font('Helvetica-Bold').text("Booking Details:", { underline: true });
        doc.moveDown();
        bookings.forEach((booking, index) => {
            const user = booking.user;
            const property = booking.property;
            const tour = booking.tourPackage;
            // Check if we need a new page
            if (doc.y > 650) {
                doc.addPage();
            }
            // Booking header
            doc.fontSize(11).font('Helvetica-Bold')
                .text(`${index + 1}. Booking #${booking._id.toString().slice(-8)}`, { continued: true })
                .font('Helvetica')
                .text(` - ${booking.status.toUpperCase()}`, { align: 'left' });
            doc.font('Helvetica');
            // Guest information
            doc.text(`Guest: ${user?.firstName || "N/A"} ${user?.lastName || ""}`);
            doc.text(`Email: ${user?.email || "N/A"}`);
            if (user?.phone)
                doc.text(`Phone: ${user.phone}`);
            // Booking details
            doc.text(`${property ? 'Property' : 'Tour'}: ${property?.title || tour?.title || "N/A"}`);
            if (property?.city)
                doc.text(`Location: ${property.city}`);
            doc.text(`Check-in: ${new Date(booking.checkIn).toLocaleDateString()}`);
            doc.text(`Check-out: ${new Date(booking.checkOut).toLocaleDateString()}`);
            doc.text(`Guests: ${booking.guests}`);
            doc.text(`Payment Status: ${booking.paymentStatus.toUpperCase()}`);
            doc.text(`Total Price: $${(booking.totalPrice || 0).toFixed(2)}`);
            doc.text(`Booked on: ${new Date(booking.createdAt).toLocaleDateString()}`);
            // Add separator line
            doc.moveDown(0.5);
            doc.strokeColor('#e0e0e0').lineWidth(0.5)
                .moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.5);
        });
        // Footer
        doc.fontSize(10).text(`Report generated by GuaraniHost Admin Panel - ${new Date().toISOString()}`, 50, doc.page.height - 50, { align: 'center' });
        doc.end();
    }
    catch (error) {
        console.error("❌ Error exporting bookings PDF:", error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: error.message || "❌ Server error"
            });
        }
    }
};
exports.exportBookingsToPDF = exportBookingsToPDF;
/**
 * @desc    Get single booking details for admin
 * @route   GET /api/admin/bookings/:id
 * @access  Private (admin only)
 */
const getBookingById = async (req, res) => {
    try {
        const booking = await BookingModel_1.Booking.findById(req.params.id)
            .populate("user", "-password")
            .populate("property")
            .populate("tourPackage");
        if (!booking) {
            res.status(404).json({
                success: false,
                message: "🚫 Booking not found"
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "✅ Booking details retrieved successfully",
            data: { booking }
        });
    }
    catch (error) {
        console.error("❌ Error fetching booking details:", error);
        res.status(500).json({
            success: false,
            message: "❌ Server error"
        });
    }
};
exports.getBookingById = getBookingById;
// Helper functions
/**
 * Get all property IDs that belong to a specific host
 */
async function getHostPropertyIds(hostId) {
    try {
        const properties = await PropertyModel_1.Property.find({ host: hostId }).select('_id');
        return properties.map(p => p._id.toString());
    }
    catch (error) {
        console.error("Error fetching host properties:", error);
        return [];
    }
}
/**
 * Get all tour package IDs that belong to a specific host
 */
async function getHostTourIds(hostId) {
    try {
        const tours = await TourPackageModel_1.TourPackage.find({ host: hostId }).select('_id');
        return tours.map(t => t._id.toString());
    }
    catch (error) {
        console.error("Error fetching host tours:", error);
        return [];
    }
}
