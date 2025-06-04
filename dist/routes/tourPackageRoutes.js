"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tourPackageController_1 = require("../controllers/tourPackageController");
const protect_1 = require("../middlewares/protect");
const checkRole_1 = require("../middlewares/checkRole");
const multerConfig_1 = require("../config/multerConfig");
const router = express_1.default.Router();
/* ========================= TOUR PACKAGE ROUTES ========================= */
/**
 * @route   POST /api/admin/tour-packages
 * @desc    Create a new tour package
 * @access  Private (admin and host)
 */
router.post("/tour-packages", protect_1.protect, (0, checkRole_1.checkRole)("admin", "host"), multerConfig_1.upload.fields([{ name: "images", maxCount: 10 }]), // Accept multiple tour images
tourPackageController_1.createTourPackage);
/**
 * @route   GET /api/admin/tour-packages
 * @desc    Get all tour packages (admin) or only the host's own
 * @access  Private (admin and host)
 */
router.get("/tour-packages", protect_1.protect, (0, checkRole_1.checkRole)("admin", "host"), tourPackageController_1.getTourPackages);
/**
 * @route   PATCH /api/admin/tour-packages/:id
 * @desc    Update a tour package
 * @access  Private (admin only)
 */
router.patch("/tour-packages/:id", protect_1.protect, (0, checkRole_1.checkRole)("admin"), multerConfig_1.upload.fields([{ name: "images", maxCount: 10 }]), // Accept multiple images
tourPackageController_1.updateTourPackage);
/**
 * @route   DELETE /api/admin/tour-packages/:id
 * @desc    Delete a tour package and its images
 * @access  Private (admin only)
 */
router.delete("/tour-packages/:id", protect_1.protect, (0, checkRole_1.checkRole)("admin"), tourPackageController_1.deleteTourPackage);
exports.default = router;
