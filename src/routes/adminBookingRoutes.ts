import express from "express";
import { protect } from "../middlewares/protect";
import { checkRole } from "../middlewares/checkRole";
import {
  getAllBookingsForAdmin,
  updateBookingByAdmin,
  updateBookingPaymentStatus,
  deleteBookingByAdmin,
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

export default router;


