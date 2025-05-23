import express from "express";
import { protect } from "../middlewares/protect";
import { checkRole } from "../middlewares/checkRole";
import {
  getAllBookingsForAdmin,
  updateBookingByAdmin,
  updateBookingPaymentStatus,
  deleteBookingByAdmin,
  filterBookingsByDateRange,
  filterBookingsByStatus,
  filterBookingsByType,
} from "../controllers/adminBookingController";

const router = express.Router();

/* ==================== ADMIN BOOKINGS ROUTES ==================== */

/**
 * @route   GET /api/admin/bookings
 * @desc    Admin retrieves all bookings
 * @access  Private (admin only)
 */
router.get("/bookings", protect, checkRole("admin"), getAllBookingsForAdmin);

/**
 * @route   PATCH /api/admin/bookings/:id
 * @desc    Admin updates any booking (status, dates, paymentStatus)
 * @access  Private (admin only)
 */
router.patch("/bookings/:id", protect, checkRole("admin"), updateBookingByAdmin);

/**
 * @route   PATCH /api/admin/bookings/:id/payment-status
 * @desc    Admin updates only the payment status of a booking
 * @access  Private (admin only)
 */
router.patch("/bookings/:id/payment-status", protect, checkRole("admin"), updateBookingPaymentStatus);

/**
 * @route   DELETE /api/admin/bookings/:id
 * @desc    Admin deletes a booking by ID
 * @access  Private (admin only)
 */
router.delete("/bookings/:id", protect, checkRole("admin"), deleteBookingByAdmin);

/**
 * @route   GET /api/admin/bookings/filter/date
 * @desc    Filter bookings by check-in and check-out range
 * @query   from=YYYY-MM-DD&to=YYYY-MM-DD
 * @access  Private (admin only)
 */
router.get("/bookings/filter/date", protect, checkRole("admin"), filterBookingsByDateRange);

/**
 * @route   GET /api/admin/bookings/filter/status
 * @desc    Filter bookings by status or payment status
 * @query   status=pending|confirmed|cancelled
 * @query   paymentStatus=paid|pending|refunded
 * @access  Private (admin only)
 */
router.get("/bookings/filter/status", protect, checkRole("admin"), filterBookingsByStatus);

/**
 * @route   GET /api/admin/bookings/filter/type
 * @desc    Filter bookings by type: property or tour
 * @query   type=property|tour
 * @access  Private (admin only)
 */
router.get("/bookings/filter/type", protect, checkRole("admin"), filterBookingsByType);

export default router;
