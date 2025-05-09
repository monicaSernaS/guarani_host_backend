import express from "express";
import { protect } from "../middlewares/protect";
import { checkRole } from "../middlewares/checkRole";
import {
  exportBookingsAsCSV,
  exportBookingsAsPDF,
} from "../controllers/adminPaymentController";

const router = express.Router();

/* =================== ADMIN PAYMENT EXPORT ROUTES =================== */

/**
 * @route   GET /api/admin/bookings/export/csv
 * @desc    Export all bookings to CSV file
 * @access  Private (admin only)
 */
router.get("/bookings/export/csv", protect, checkRole("admin"), exportBookingsAsCSV);

/**
 * @route   GET /api/admin/bookings/export/pdf
 * @desc    Export all bookings to PDF file
 * @access  Private (admin only)
 */
router.get("/bookings/export/pdf", protect, checkRole("admin"), exportBookingsAsPDF);

export default router;
