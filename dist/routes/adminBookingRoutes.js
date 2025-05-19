"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const protect_1 = require("../middlewares/protect");
const checkRole_1 = require("../middlewares/checkRole");
const adminBookingController_1 = require("../controllers/adminBookingController");
const router = express_1.default.Router();
/* ==================== ADMIN BOOKINGS ROUTES ==================== */
/**
 * @route   GET /api/admin/bookings
 * @desc    Admin retrieves all bookings
 * @access  Private (admin only)
 */
router.get("/bookings", protect_1.protect, (0, checkRole_1.checkRole)("admin"), adminBookingController_1.getAllBookingsForAdmin);
/**
 * @route   PATCH /api/admin/bookings/:id
 * @desc    Admin updates any booking (status, dates, paymentStatus)
 * @access  Private (admin only)
 */
router.patch("/bookings/:id", protect_1.protect, (0, checkRole_1.checkRole)("admin"), adminBookingController_1.updateBookingByAdmin);
/**
 * @route   PATCH /api/admin/bookings/:id/payment-status
 * @desc    Admin updates only the payment status of a booking
 * @access  Private (admin only)
 */
router.patch("/bookings/:id/payment-status", protect_1.protect, (0, checkRole_1.checkRole)("admin"), adminBookingController_1.updateBookingPaymentStatus);
/**
 * @route   DELETE /api/admin/bookings/:id
 * @desc    Admin deletes a booking by ID
 * @access  Private (admin only)
 */
router.delete("/bookings/:id", protect_1.protect, (0, checkRole_1.checkRole)("admin"), adminBookingController_1.deleteBookingByAdmin);
/**
 * @route   GET /api/admin/bookings/filter/date
 * @desc    Filter bookings by check-in and check-out range
 * @query   from=YYYY-MM-DD&to=YYYY-MM-DD
 * @access  Private (admin only)
 */
router.get("/bookings/filter/date", protect_1.protect, (0, checkRole_1.checkRole)("admin"), adminBookingController_1.filterBookingsByDateRange);
/**
 * @route   GET /api/admin/bookings/filter/status
 * @desc    Filter bookings by status or payment status
 * @query   status=pending|confirmed|cancelled
 * @query   paymentStatus=paid|pending|refunded
 * @access  Private (admin only)
 */
router.get("/bookings/filter/status", protect_1.protect, (0, checkRole_1.checkRole)("admin"), adminBookingController_1.filterBookingsByStatus);
/**
 * @route   GET /api/admin/bookings/filter/type
 * @desc    Filter bookings by type: property or tour
 * @query   type=property|tour
 * @access  Private (admin only)
 */
router.get("/bookings/filter/type", protect_1.protect, (0, checkRole_1.checkRole)("admin"), adminBookingController_1.filterBookingsByType);
exports.default = router;
