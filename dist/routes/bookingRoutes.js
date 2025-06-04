"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bookingController_1 = require("../controllers/bookingController");
const protect_1 = require("../middlewares/protect");
const checkRole_1 = require("../middlewares/checkRole");
const multerConfig_1 = require("../config/multerConfig");
const router = express_1.default.Router();
/* ========================= BOOKING ROUTES ========================= */
/**
 * @route   POST /api/bookings
 * @desc    Create a new booking (property or tour)
 * @access  Private (user)
 */
router.post("/", protect_1.protect, multerConfig_1.upload.fields([{ name: "paymentImage", maxCount: 5 }]), bookingController_1.createBooking);
/**
 * @route   GET /api/bookings
 * @desc    Get all bookings (own for user, all for admin)
 * @access  Private (user or admin)
 */
router.get("/", protect_1.protect, bookingController_1.getBookings);
/**
 * @route   GET /api/bookings/:id/summary
 * @desc    Get booking summary with populated details
 * @access  Private (user who made the booking, host or admin)
 */
router.get("/:id/summary", protect_1.protect, bookingController_1.getBookingSummary);
/**
 * @route   PATCH /api/bookings/:id
 * @desc    Update booking info or payment images
 * @access  Private (user who created it or admin)
 */
router.patch("/:id", protect_1.protect, multerConfig_1.upload.fields([{ name: "paymentImage", maxCount: 5 }]), bookingController_1.updateBooking);
/**
 * @route   DELETE /api/bookings/:id
 * @desc    Cancel and delete a booking
 * @access  Private (user or admin)
 */
router.delete("/:id", protect_1.protect, bookingController_1.cancelBooking);
/**
 * @route   GET /api/bookings/filter
 * @desc    Filter bookings by checkIn and checkOut range
 * @access  Private (admin or host only)
 */
router.get("/filter", protect_1.protect, (0, checkRole_1.checkRole)("admin", "host"), bookingController_1.filterBookingsByDateRange);
exports.default = router;
