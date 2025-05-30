import express from "express";
import {
  createBooking,
  getBookings,
  updateBooking,
  cancelBooking,
  getBookingById,
  filterBookingsByDateRange
} from "../controllers/bookingController";
import { protect } from "../middlewares/protect";
import { checkRole } from "../middlewares/checkRole";
import { upload } from "../config/multerConfig";

const router = express.Router();

/* ========================= BOOKING ROUTES ========================= */

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking (property or tour)
 * @access  Private (user)
 */
router.post(
  "/",
  protect,
  upload.fields([{ name: "paymentImage", maxCount: 5 }]),
  createBooking
);

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings (own for user, all for admin)
 * @access  Private (user or admin)
 */
router.get("/", protect, getBookings);

/**
 * @route   GET /api/bookings/:id/summary
 * @desc    Get booking summary with populated details
 * @access  Private (user who made the booking, host or admin)
 */
router.get("/:id", protect, getBookingById);

/**
 * @route   PATCH /api/bookings/:id
 * @desc    Update booking info or payment images
 * @access  Private (user who created it or admin)
 */
router.patch(
  "/:id",
  protect,
  upload.fields([{ name: "paymentImage", maxCount: 5 }]),
  updateBooking
);

/**
 * @route   DELETE /api/bookings/:id
 * @desc    Cancel and delete a booking
 * @access  Private (user or admin)
 */
router.delete("/:id", protect, cancelBooking);

/**
 * @route   GET /api/bookings/filter
 * @desc    Filter bookings by checkIn and checkOut range
 * @access  Private (admin or host only)
 */
router.get("/filter", protect, checkRole("admin", "host"), filterBookingsByDateRange);

export default router;