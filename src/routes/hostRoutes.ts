import express from "express";
import { protect } from "../middlewares/protect";
import { checkRole } from "../middlewares/checkRole";
import { getHostBookingSummary } from "../controllers/bookingController";

const router = express.Router();

/* ========================= HOST BOOKING SUMMARY ========================= */

/**
 * @route   GET /api/host/bookings/summary
 * @desc    Host retrieves a summary of their bookings (homes or tours)
 * @access  Private (host only)
 */

router.get(  "/bookings/summary", protect, checkRole("host"), getHostBookingSummary);

export default router;

