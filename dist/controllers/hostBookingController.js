"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHostBookingById = exports.exportHostBookingsToPDF = exports.updateHostBookingStatus = exports.updateHostBookingPaymentStatus = exports.filterHostBookings = exports.getHostBookings = void 0;
const mongoose_1 = require("mongoose");
const BookingModel_1 = require("../models/BookingModel");
const PropertyModel_1 = require("../models/PropertyModel");
const TourPackageModel_1 = require("../models/TourPackageModel");
const validateBooking_1 = require("../helpers/validateBooking");
const emailService_1 = require("../utils/emailService");
const pdfkit_1 = __importDefault(require("pdfkit"));
const enums_1 = require("../@types/express/enums");
/**
 * @desc    Host gets all bookings for their properties and tours
 * @route   GET /api/host/bookings
 * @access  Private (host only)
 */
const getHostBookings = async (req, res) => {
    try {
        const hostId = req.user?._id;
        if (!hostId) {
            res.status(401).json({
                success: false,
                message: "🚫 Unauthorized host"
            });
            return;
        }
        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Get host's properties and tour packages in parallel for better performance
        const [hostProperties, hostTourPackages] = await Promise.all([
            PropertyModel_1.Property.find({ host: hostId }).select('_id'),
            TourPackageModel_1.TourPackage.find({ host: hostId }).select('_id')
        ]);
        const propertyIds = hostProperties.map(p => p._id);
        const tourPackageIds = hostTourPackages.map(t => t._id);
        // Build query to find bookings for host's properties or tours
        const query = {
            $or: [
                { property: { $in: propertyIds } },
                { tourPackage: { $in: tourPackageIds } }
            ]
        };
        // Get bookings with pagination and total count
        const [bookings, totalCount] = await Promise.all([
            BookingModel_1.Booking.find(query)
                .populate("property", "title location imageUrls host pricePerNight")
                .populate("tourPackage", "title duration price host")
                .populate("user", "firstName lastName email phone")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            BookingModel_1.Booking.countDocuments(query)
        ]);
        res.status(200).json({
            success: true,
            message: "✅ Host bookings fetched successfully",
            data: {
                bookings,
                pagination: {
                    current: page,
                    total: Math.ceil(totalCount / limit),
                    totalCount,
                    hasNext: page * limit < totalCount,
                    hasPrev: page > 1
                }
            }
        });
    }
    catch (error) {
        console.error("❌ Host bookings error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "❌ Internal server error"
        });
    }
};
exports.getHostBookings = getHostBookings;
/**
 * @desc    Host filters bookings by various criteria
 * @route   GET /api/host/bookings/filter
 * @access  Private (host only)
 */
const filterHostBookings = async (req, res) => {
    try {
        const hostId = req.user?._id;
        if (!hostId) {
            res.status(401).json({
                success: false,
                message: "🚫 Unauthorized host"
            });
            return;
        }
        const { paymentStatus, bookingStatus, from, to, propertyType, page = 1, limit = 10 } = req.query;
        // Validate payment status if provided
        if (paymentStatus && !Object.values(enums_1.PaymentStatus).includes(paymentStatus)) {
            res.status(400).json({
                success: false,
                message: "❌ Invalid payment status"
            });
            return;
        }
        // Validate booking status if provided
        if (bookingStatus && !Object.values(enums_1.BookingStatus).includes(bookingStatus)) {
            res.status(400).json({
                success: false,
                message: "❌ Invalid booking status"
            });
            return;
        }
        // Validate date range if provided
        if (from && to) {
            try {
                (0, validateBooking_1.validateCheckInOut)(from, to);
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
                return;
            }
        }
        // Get host's properties and tour packages
        const [hostProperties, hostTourPackages] = await Promise.all([
            PropertyModel_1.Property.find({ host: hostId }).select('_id'),
            TourPackageModel_1.TourPackage.find({ host: hostId }).select('_id')
        ]);
        const propertyIds = hostProperties.map(p => p._id);
        const tourPackageIds = hostTourPackages.map(t => t._id);
        // Build base query for host's bookings
        const filterQuery = {
            $or: [
                { property: { $in: propertyIds } },
                { tourPackage: { $in: tourPackageIds } }
            ]
        };
        // Apply additional filters
        if (paymentStatus) {
            filterQuery.paymentStatus = paymentStatus;
        }
        if (bookingStatus) {
            filterQuery.status = bookingStatus;
        }
        if (from && to) {
            filterQuery.checkIn = { $gte: new Date(from) };
            filterQuery.checkOut = { $lte: new Date(to) };
        }
        // Filter by property type (property vs tour)
        if (propertyType === 'property') {
            filterQuery.property = { $exists: true };
            filterQuery.tourPackage = { $exists: false };
        }
        else if (propertyType === 'tour') {
            filterQuery.tourPackage = { $exists: true };
            filterQuery.property = { $exists: false };
        }
        // Pagination setup
        const skip = (Number(page) - 1) * Number(limit);
        // Execute queries in parallel
        const [bookings, totalCount] = await Promise.all([
            BookingModel_1.Booking.find(filterQuery)
                .populate("property", "title location imageUrls host pricePerNight")
                .populate("tourPackage", "title duration price host")
                .populate("user", "firstName lastName email phone")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            BookingModel_1.Booking.countDocuments(filterQuery)
        ]);
        res.status(200).json({
            success: true,
            message: "✅ Filtered bookings retrieved successfully",
            data: {
                bookings,
                pagination: {
                    current: Number(page),
                    total: Math.ceil(totalCount / Number(limit)),
                    totalCount,
                    hasNext: Number(page) * Number(limit) < totalCount,
                    hasPrev: Number(page) > 1
                },
                filters: { paymentStatus, bookingStatus, from, to, propertyType }
            }
        });
    }
    catch (error) {
        console.error("❌ Error filtering host bookings:", error);
        res.status(500).json({
            success: false,
            message: error.message || "❌ Internal server error"
        });
    }
};
exports.filterHostBookings = filterHostBookings;
/**
 * @desc    Host updates payment status of a booking for their property/tour
 * @route   PATCH /api/host/bookings/:id/payment-status
 * @access  Private (host only)
 */
const updateHostBookingPaymentStatus = async (req, res) => {
    try {
        const hostId = req.user?._id;
        const bookingId = req.params.id;
        if (!hostId) {
            res.status(401).json({
                success: false,
                message: "🚫 Unauthorized host"
            });
            return;
        }
        if (!mongoose_1.Types.ObjectId.isValid(bookingId)) {
            res.status(400).json({
                success: false,
                message: "❌ Invalid booking ID"
            });
            return;
        }
        const { paymentStatus } = req.body;
        if (!paymentStatus || !Object.values(enums_1.PaymentStatus).includes(paymentStatus)) {
            res.status(400).json({
                success: false,
                message: "❌ Invalid payment status"
            });
            return;
        }
        // Find booking and populate related data
        const booking = await BookingModel_1.Booking.findById(bookingId)
            .populate("property", "host title")
            .populate("tourPackage", "host title")
            .populate("user", "firstName lastName email");
        if (!booking) {
            res.status(404).json({
                success: false,
                message: "❌ Booking not found"
            });
            return;
        }
        // Verify host ownership
        const property = booking.property;
        const tour = booking.tourPackage;
        const isHostOwner = (property && property.host?.toString() === hostId.toString()) ||
            (tour && tour.host?.toString() === hostId.toString());
        if (!isHostOwner) {
            res.status(403).json({
                success: false,
                message: "🚫 You are not authorized to update this booking"
            });
            return;
        }
        // Business validation
        if (booking.status === enums_1.BookingStatus.CANCELLED && paymentStatus === enums_1.PaymentStatus.PAID) {
            res.status(400).json({
                success: false,
                message: "❌ Cannot mark cancelled booking as paid"
            });
            return;
        }
        const previousStatus = booking.paymentStatus;
        booking.paymentStatus = paymentStatus;
        // Auto-update booking status if payment is confirmed
        if (paymentStatus === enums_1.PaymentStatus.PAID && booking.status === enums_1.BookingStatus.PENDING) {
            booking.status = enums_1.BookingStatus.CONFIRMED;
        }
        await booking.save();
        // Send email notification to guest
        const user = booking.user;
        if (user?.email) {
            const bookingType = property ? 'property' : 'tour';
            const bookingTitle = property?.title || tour?.title || 'N/A';
            await (0, emailService_1.sendEmail)(user.email, "Payment Status Updated - GuaraniHost", `
        <h2>💳 Payment Status Updated</h2>
        <p>Hello ${user.firstName},</p>
        <p>Your payment status for the ${bookingType} booking <strong>${bookingTitle}</strong> has been updated by the host.</p>
        <p><strong>Previous Status:</strong> ${previousStatus}</p>
        <p><strong>New Status:</strong> ${paymentStatus}</p>
        <p>Check-in: ${booking.checkIn.toLocaleDateString()}</p>
        <p>Check-out: ${booking.checkOut.toLocaleDateString()}</p>
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
                previousStatus,
                newStatus: paymentStatus
            }
        });
    }
    catch (error) {
        console.error("❌ Error updating payment status:", error);
        res.status(500).json({
            success: false,
            message: error.message || "❌ Internal server error"
        });
    }
};
exports.updateHostBookingPaymentStatus = updateHostBookingPaymentStatus;
/**
 * @desc    Host updates booking status for their property/tour
 * @route   PATCH /api/host/bookings/:id/status
 * @access  Private (host only)
 */
const updateHostBookingStatus = async (req, res) => {
    try {
        const hostId = req.user?._id;
        const bookingId = req.params.id;
        if (!hostId) {
            res.status(401).json({
                success: false,
                message: "🚫 Unauthorized host"
            });
            return;
        }
        if (!mongoose_1.Types.ObjectId.isValid(bookingId)) {
            res.status(400).json({
                success: false,
                message: "❌ Invalid booking ID"
            });
            return;
        }
        const { status, reason } = req.body;
        if (!status || !Object.values(enums_1.BookingStatus).includes(status)) {
            res.status(400).json({
                success: false,
                message: "❌ Invalid booking status"
            });
            return;
        }
        // Find booking and populate related data
        const booking = await BookingModel_1.Booking.findById(bookingId)
            .populate("property", "host title")
            .populate("tourPackage", "host title")
            .populate("user", "firstName lastName email");
        if (!booking) {
            res.status(404).json({
                success: false,
                message: "❌ Booking not found"
            });
            return;
        }
        // Verify host ownership
        const property = booking.property;
        const tour = booking.tourPackage;
        const isHostOwner = (property && property.host?.toString() === hostId.toString()) ||
            (tour && tour.host?.toString() === hostId.toString());
        if (!isHostOwner) {
            res.status(403).json({
                success: false,
                message: "🚫 You are not authorized to update this booking"
            });
            return;
        }
        // Business validation
        if (booking.status === enums_1.BookingStatus.CANCELLED && status !== enums_1.BookingStatus.CANCELLED) {
            res.status(400).json({
                success: false,
                message: "❌ Cannot change status of cancelled booking"
            });
            return;
        }
        const previousStatus = booking.status;
        booking.status = status;
        // Handle cancellation logic
        if (status === enums_1.BookingStatus.CANCELLED) {
            booking.cancellationReason = reason || "Cancelled by host";
            booking.cancelledAt = new Date();
            // Auto-update payment status if booking was paid
            if (booking.paymentStatus === enums_1.PaymentStatus.PAID) {
                booking.paymentStatus = enums_1.PaymentStatus.REFUNDED;
            }
        }
        await booking.save();
        // Send email notification to guest
        const user = booking.user;
        if (user?.email) {
            const bookingType = property ? 'property' : 'tour';
            const bookingTitle = property?.title || tour?.title || 'N/A';
            let emailSubject = "Booking Status Updated - GuaraniHost";
            let emailBody = `
        <h2>📝 Booking Status Updated</h2>
        <p>Hello ${user.firstName},</p>
        <p>Your ${bookingType} booking for <strong>${bookingTitle}</strong> status has been updated by the host.</p>
        <p><strong>Previous Status:</strong> ${previousStatus}</p>
        <p><strong>New Status:</strong> ${status}</p>
        <p>Check-in: ${booking.checkIn.toLocaleDateString()}</p>
        <p>Check-out: ${booking.checkOut.toLocaleDateString()}</p>
      `;
            if (status === enums_1.BookingStatus.CANCELLED) {
                emailSubject = "Booking Cancelled - GuaraniHost";
                emailBody += `<p><strong>Cancellation Reason:</strong> ${booking.cancellationReason}</p>`;
                if (booking.paymentStatus === enums_1.PaymentStatus.REFUNDED) {
                    emailBody += `<p><strong>Refund Status:</strong> Your payment will be refunded shortly.</p>`;
                }
            }
            emailBody += `
        <p>Total Amount: $${booking.totalPrice}</p>
        <br>
        <p>Best regards,<br>GuaraniHost Team</p>
      `;
            await (0, emailService_1.sendEmail)(user.email, emailSubject, emailBody);
        }
        res.status(200).json({
            success: true,
            message: "✅ Booking status updated successfully",
            data: {
                booking,
                previousStatus,
                newStatus: status
            }
        });
    }
    catch (error) {
        console.error("❌ Error updating booking status:", error);
        res.status(500).json({
            success: false,
            message: error.message || "❌ Internal server error"
        });
    }
};
exports.updateHostBookingStatus = updateHostBookingStatus;
/**
 * @desc    Host exports their bookings as PDF
 * @route   GET /api/host/bookings/export/pdf
 * @access  Private (host only)
 */
const exportHostBookingsToPDF = async (req, res) => {
    try {
        const hostId = req.user?._id;
        if (!hostId) {
            res.status(401).json({
                success: false,
                message: "🚫 Unauthorized host"
            });
            return;
        }
        const { from, to, paymentStatus, bookingStatus, propertyType } = req.query;
        // Validate payment status if provided
        if (paymentStatus && !Object.values(enums_1.PaymentStatus).includes(paymentStatus)) {
            res.status(400).json({
                success: false,
                message: "❌ Invalid payment status"
            });
            return;
        }
        // Validate booking status if provided
        if (bookingStatus && !Object.values(enums_1.BookingStatus).includes(bookingStatus)) {
            res.status(400).json({
                success: false,
                message: "❌ Invalid booking status"
            });
            return;
        }
        // Validate date range if provided
        if (from && to) {
            try {
                (0, validateBooking_1.validateCheckInOut)(from, to);
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
                return;
            }
        }
        // Get host's properties and tour packages
        const [hostProperties, hostTourPackages] = await Promise.all([
            PropertyModel_1.Property.find({ host: hostId }).select('_id'),
            TourPackageModel_1.TourPackage.find({ host: hostId }).select('_id')
        ]);
        const propertyIds = hostProperties.map(p => p._id);
        const tourPackageIds = hostTourPackages.map(t => t._id);
        // Build filter query
        const filterQuery = {
            $or: [
                { property: { $in: propertyIds } },
                { tourPackage: { $in: tourPackageIds } }
            ]
        };
        // Apply filters
        if (paymentStatus)
            filterQuery.paymentStatus = paymentStatus;
        if (bookingStatus)
            filterQuery.status = bookingStatus;
        if (from && to) {
            filterQuery.checkIn = { $gte: new Date(from) };
            filterQuery.checkOut = { $lte: new Date(to) };
        }
        if (propertyType === 'property') {
            filterQuery.property = { $exists: true };
            filterQuery.tourPackage = { $exists: false };
        }
        else if (propertyType === 'tour') {
            filterQuery.tourPackage = { $exists: true };
            filterQuery.property = { $exists: false };
        }
        // Get bookings for PDF
        const bookings = await BookingModel_1.Booking.find(filterQuery)
            .populate("property", "title location city")
            .populate("tourPackage", "title duration")
            .populate("user", "firstName lastName email")
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
        res.setHeader("Content-Disposition", `attachment; filename=host-bookings-${Date.now()}.pdf`);
        doc.pipe(res);
        // Get host info for header
        const hostInfo = req.user;
        // PDF Header
        doc.fontSize(20).font('Helvetica-Bold').text("Host Bookings Report", { align: "center" });
        doc.moveDown();
        // Host and report info
        doc.fontSize(12).font('Helvetica');
        doc.text(`Host: ${hostInfo?.firstName} ${hostInfo?.lastName}`, { align: "right" });
        doc.text(`Email: ${hostInfo?.email}`, { align: "right" });
        doc.text(`Generated: ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`, { align: "right" });
        doc.text(`Total Bookings: ${bookings.length}`, { align: "right" });
        // Applied filters
        if (from && to) {
            doc.text(`Period: ${new Date(from).toLocaleDateString()} - ${new Date(to).toLocaleDateString()}`, { align: "right" });
        }
        if (bookingStatus)
            doc.text(`Status: ${bookingStatus}`, { align: "right" });
        if (paymentStatus)
            doc.text(`Payment: ${paymentStatus}`, { align: "right" });
        if (propertyType)
            doc.text(`Type: ${propertyType}`, { align: "right" });
        doc.moveDown(2);
        // Bookings table
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
            // Booking entry
            doc.fontSize(11).font('Helvetica-Bold')
                .text(`${index + 1}. Booking #${booking._id.toString().slice(-8)}`, { continued: true })
                .font('Helvetica')
                .text(` - ${booking.status.toUpperCase()}`);
            doc.font('Helvetica');
            // Guest details
            doc.text(`Guest: ${user?.firstName || "N/A"} ${user?.lastName || ""}`);
            doc.text(`Email: ${user?.email || "N/A"}`);
            // Booking details
            doc.text(`${property ? 'Property' : 'Tour'}: ${property?.title || tour?.title || "N/A"}`);
            if (property?.city)
                doc.text(`Location: ${property.city}`);
            doc.text(`Dates: ${new Date(booking.checkIn).toLocaleDateString()} - ${new Date(booking.checkOut).toLocaleDateString()}`);
            doc.text(`Guests: ${booking.guests}`);
            doc.text(`Payment: ${booking.paymentStatus.toUpperCase()}`);
            doc.text(`Total: $${(booking.totalPrice || 0).toFixed(2)}`);
            doc.text(`Booked: ${new Date(booking.createdAt).toLocaleDateString()}`);
            if (booking.cancellationReason) {
                doc.text(`Cancellation: ${booking.cancellationReason}`);
            }
            // Separator line
            doc.moveDown(0.5);
            doc.strokeColor('#e0e0e0').lineWidth(0.5)
                .moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.5);
        });
        // Footer
        doc.fontSize(10).text(`Generated by GuaraniHost - ${new Date().toISOString()}`, 50, doc.page.height - 50, { align: 'center' });
        doc.end();
    }
    catch (error) {
        console.error("❌ Error exporting bookings PDF:", error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: error.message || "❌ Internal server error"
            });
        }
    }
};
exports.exportHostBookingsToPDF = exportHostBookingsToPDF;
/**
 * @desc    Get single booking details for host (only their properties/tours)
 * @route   GET /api/host/bookings/:id
 * @access  Private (host only)
 */
const getHostBookingById = async (req, res) => {
    try {
        const hostId = req.user?._id;
        const bookingId = req.params.id;
        if (!hostId) {
            res.status(401).json({
                success: false,
                message: "🚫 Unauthorized host"
            });
            return;
        }
        if (!mongoose_1.Types.ObjectId.isValid(bookingId)) {
            res.status(400).json({
                success: false,
                message: "❌ Invalid booking ID"
            });
            return;
        }
        // Find booking with full population
        const booking = await BookingModel_1.Booking.findById(bookingId)
            .populate("property")
            .populate("tourPackage")
            .populate("user", "-password");
        if (!booking) {
            res.status(404).json({
                success: false,
                message: "❌ Booking not found"
            });
            return;
        }
        // Verify host ownership
        const property = booking.property;
        const tour = booking.tourPackage;
        const isHostOwner = (property && property.host?.toString() === hostId.toString()) ||
            (tour && tour.host?.toString() === hostId.toString());
        if (!isHostOwner) {
            res.status(403).json({
                success: false,
                message: "🚫 You are not authorized to view this booking"
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
            message: error.message || "❌ Internal server error"
        });
    }
};
exports.getHostBookingById = getHostBookingById;
