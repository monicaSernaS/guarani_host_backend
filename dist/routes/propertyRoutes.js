"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const propertyController_1 = require("../controllers/propertyController");
const protect_1 = require("../middlewares/protect");
const checkRole_1 = require("../middlewares/checkRole");
const multerConfig_1 = require("../config/multerConfig");
const router = express_1.default.Router();
/* ========================= PROPERTY ROUTES ========================= */
/**
 * @route   POST /api/admin/properties
 * @desc    Create a new property
 * @access  Private (admin and host)
 */
router.post("/properties", protect_1.protect, (0, checkRole_1.checkRole)("admin", "host"), multerConfig_1.upload.fields([{ name: "images", maxCount: 10 }]), // Accept multiple images
propertyController_1.createProperty);
/**
 * @route   GET /api/admin/properties
 * @desc    Get all properties (admin) or host's own properties
 * @access  Private (admin and host)
 */
router.get("/properties", protect_1.protect, (0, checkRole_1.checkRole)("admin", "host"), propertyController_1.getProperties);
/**
 * @route   PATCH /api/admin/properties/:id
 * @desc    Update a property
 * @access  Private (admin only)
 */
router.patch("/properties/:id", protect_1.protect, (0, checkRole_1.checkRole)("admin"), propertyController_1.updateProperty);
/**
 * @route   DELETE /api/admin/properties/:id
 * @desc    Delete a property and its images
 * @access  Private (admin only)
 */
router.delete("/properties/:id", protect_1.protect, (0, checkRole_1.checkRole)("admin"), propertyController_1.deleteProperty);
exports.default = router;
