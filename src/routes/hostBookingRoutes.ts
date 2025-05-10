import express from "express";
import { protect } from "../middlewares/protect";
import { checkRole } from "../middlewares/checkRole";
import {
  getHostBookings,
  filterHostBookings,
  updateHostBookingPaymentStatus,
  exportHostBookingsToPDF,
  getHostBookingSummary
} from "../controllers/hostBookingController";

const router = express.Router();

/* ========================= HOST BOOKINGS ROUTES ========================= */

/**
 * @route   GET /api/host/bookings
 * @desc    Get bookings related to host's properties or tours
 * @access  Private (host only)
 */
router.get("/bookings", protect, checkRole("host"), getHostBookings);

/**
 * @route   GET /api/host/bookings/filter
 * @desc    Filter host's bookings by payment status or date range
 * @access  Private (host only)
 */
router.get("/bookings/filter", protect, checkRole("host"), filterHostBookings);

/**
 * @route   PATCH /api/host/bookings/:id/payment-status
 * @desc    Host updates booking payment status
 * @access  Private (host only)
 */
router.patch("/bookings/:id/payment-status", protect, checkRole("host"), updateHostBookingPaymentStatus);

/**
 * @route   GET /api/host/bookings/export/pdf
 * @desc    Host exports bookings in PDF format
 * @access  Private (host only)
 */
router.get("/bookings/export/pdf", protect, checkRole("host"), exportHostBookingsToPDF);

/**
 * @route   GET /api/host/bookings/summary
 * @desc    Host retrieves summary stats about their bookings
 * @access  Private (host only)
 */
router.get("/bookings/summary", protect, checkRole("host"), getHostBookingSummary);

export default router;

