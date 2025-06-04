"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const hostPropertyController_1 = require("../controllers/hostPropertyController");
const protect_1 = require("../middlewares/protect");
const checkRole_1 = require("../middlewares/checkRole");
const multerConfig_1 = require("../config/multerConfig");
const router = express_1.default.Router();
/* ===================== HOST PROPERTY ROUTES ===================== */
/**
 * @route   GET /api/host/properties
 * @desc    Get all properties owned by the host
 * @access  Private (host only)
 */
router.get("/properties", protect_1.protect, (0, checkRole_1.checkRole)("host"), hostPropertyController_1.getHostProperties);
/**
 * @route   POST /api/host/properties
 * @desc    Create a new property
 * @access  Private (host only)
 */
router.post("/properties", protect_1.protect, (0, checkRole_1.checkRole)("host"), multerConfig_1.upload.fields([{ name: "images", maxCount: 10 }]), hostPropertyController_1.createHostProperty);
/**
 * @route   PATCH /api/host/properties/:id
 * @desc    Update a property owned by the host
 * @access  Private (host only)
 */
router.patch("/properties/:id", protect_1.protect, (0, checkRole_1.checkRole)("host"), multerConfig_1.upload.fields([{ name: "images", maxCount: 10 }]), hostPropertyController_1.updateHostProperty);
/**
 * @route   DELETE /api/host/properties/:id
 * @desc    Delete a property owned by the host
 * @access  Private (host only)
 */
router.delete("/properties/:id", protect_1.protect, (0, checkRole_1.checkRole)("host"), hostPropertyController_1.deleteHostProperty);
exports.default = router;
