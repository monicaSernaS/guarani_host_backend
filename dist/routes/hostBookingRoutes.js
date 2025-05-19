"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const protect_1 = require("../middlewares/protect");
const checkRole_1 = require("../middlewares/checkRole");
const hostBookingController_1 = require("../controllers/hostBookingController");
const router = express_1.default.Router();
/* ========================= HOST BOOKINGS ROUTES ========================= */
/**
 * @route   GET /api/host/bookings
 * @desc    Get bookings related to host's properties or tours
 * @access  Private (host only)
 */
router.get("/bookings", protect_1.protect, (0, checkRole_1.checkRole)("host"), hostBookingController_1.getHostBookings);
/**
 * @route   GET /api/host/bookings/filter
 * @desc    Filter host's bookings by payment status or date range
 * @access  Private (host only)
 */
router.get("/bookings/filter", protect_1.protect, (0, checkRole_1.checkRole)("host"), hostBookingController_1.filterHostBookings);
/**
 * @route   PATCH /api/host/bookings/:id/payment-status
 * @desc    Host updates booking payment status
 * @access  Private (host only)
 */
router.patch("/bookings/:id/payment-status", protect_1.protect, (0, checkRole_1.checkRole)("host"), hostBookingController_1.updateHostBookingPaymentStatus);
/**
 * @route   GET /api/host/bookings/export/pdf
 * @desc    Host exports bookings in PDF format
 * @access  Private (host only)
 */
router.get("/bookings/export/pdf", protect_1.protect, (0, checkRole_1.checkRole)("host"), hostBookingController_1.exportHostBookingsToPDF);
/**
 * @route   GET /api/host/bookings/summary
 * @desc    Host retrieves summary stats about their bookings
 * @access  Private (host only)
 */
router.get("/bookings/summary", protect_1.protect, (0, checkRole_1.checkRole)("host"), hostBookingController_1.getHostBookingSummary);
exports.default = router;
