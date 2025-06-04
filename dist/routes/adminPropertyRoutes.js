"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminPropertyController_1 = require("../controllers/adminPropertyController");
const protect_1 = require("../middlewares/protect");
const checkRole_1 = require("../middlewares/checkRole");
const multerConfig_1 = require("../config/multerConfig");
const router = express_1.default.Router();
/* ==================== ADMIN PROPERTY ROUTES ==================== */
/**
 * @route   POST /api/admin/properties
 * @desc    Create a new property (admin only)
 * @access  Private (admin only)
 */
router.post("/properties", protect_1.protect, (0, checkRole_1.checkRole)("admin"), multerConfig_1.upload.fields([{ name: "images", maxCount: 10 }]), adminPropertyController_1.createProperty);
/**
 * @route   GET /api/admin/properties
 * @desc    Get all properties (admin only)
 * @access  Private (admin only)
 */
router.get("/properties", protect_1.protect, (0, checkRole_1.checkRole)("admin"), adminPropertyController_1.getProperties);
/**
 * @route   PATCH /api/admin/properties/:id
 * @desc    Update a property (admin only)
 * @access  Private (admin only)
 */
router.patch("/properties/:id", protect_1.protect, (0, checkRole_1.checkRole)("admin"), multerConfig_1.upload.fields([{ name: "images", maxCount: 10 }]), adminPropertyController_1.updateProperty);
/**
 * @route   DELETE /api/admin/properties/:id
 * @desc    Delete a property and its images (admin only)
 * @access  Private (admin only)
 */
router.delete("/properties/:id", protect_1.protect, (0, checkRole_1.checkRole)("admin"), adminPropertyController_1.deleteProperty);
exports.default = router;
