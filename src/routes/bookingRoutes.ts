import express from "express";
import { createBooking, getBookings, updateBooking, cancelBooking } from "../controllers/bookingController";
import { protect } from "../middlewares/protect";
import { checkRole } from "../middlewares/checkRole";
import { upload } from "../config/multerConfig";

const router = express.Router();

/* ========================= BOOKING ROUTES ========================= */

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Private (user)
 */
router.post("/bookings", protect, upload.single("paymentImage"), createBooking);  // Single file upload for payment image

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings for the user
 * @access  Private (user)
 */
router.get("/bookings", protect, getBookings);

/**
 * @route   PATCH /api/bookings/:id
 * @desc    Update a booking
 * @access  Private (admin, user who created the booking)
 */
router.patch("/bookings/:id", protect, updateBooking);

/**
 * @route   DELETE /api/bookings/:id
 * @desc    Cancel a booking
 * @access  Private (admin, user who created the booking)
 */
router.delete("/bookings/:id", protect, cancelBooking);

export default router;
