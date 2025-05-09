import express from "express";
import {
  getBookingsForHostProperties,
  getBookingsForHostTours,
  updateBookingStatusByHost,
} from "../controllers/hostBookingController";
import { protect } from "../middlewares/protect";
import { checkRole } from "../middlewares/checkRole";

const router = express.Router();

/* ========================= HOST BOOKINGS ROUTES ========================= */

/**
 * @route   GET /api/host/bookings/properties
 * @desc    Get bookings of properties owned by host
 * @access  Private (host only)
 */
router.get("/bookings/properties", protect, checkRole("host"), getBookingsForHostProperties);

/**
 * @route   GET /api/host/bookings/tours
 * @desc    Get bookings of tours managed by host
 * @access  Private (host only)
 */
router.get("/bookings/tours", protect, checkRole("host"), getBookingsForHostTours);

/**
 * @route   PATCH /api/host/bookings/:id
 * @desc    Update booking status or payment by host
 * @access  Private (host only)
 */
router.patch("/bookings/:id", protect, checkRole("host"), updateBookingStatusByHost);

export default router;
