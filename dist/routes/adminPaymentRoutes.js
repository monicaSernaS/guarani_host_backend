"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const protect_1 = require("../middlewares/protect");
const checkRole_1 = require("../middlewares/checkRole");
const adminPaymentController_1 = require("../controllers/adminPaymentController");
const router = express_1.default.Router();
/* =================== ADMIN PAYMENT EXPORT ROUTES =================== */
/**
 * @route   GET /api/admin/bookings/export/csv
 * @desc    Export all bookings to CSV file
 * @access  Private (admin only)
 */
router.get("/bookings/export/csv", protect_1.protect, (0, checkRole_1.checkRole)("admin"), adminPaymentController_1.exportBookingsAsCSV);
/**
 * @route   GET /api/admin/bookings/export/pdf
 * @desc    Export all bookings to PDF file
 * @access  Private (admin only)
 */
router.get("/bookings/export/pdf", protect_1.protect, (0, checkRole_1.checkRole)("admin"), adminPaymentController_1.exportBookingsAsPDF);
exports.default = router;
