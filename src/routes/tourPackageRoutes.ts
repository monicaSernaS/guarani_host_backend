import express from "express";
import {
  createTourPackage,
  getTourPackages,
  updateTourPackage,
  deleteTourPackage,
} from "../controllers/tourPackageController";
import { protect } from "../middlewares/protect";
import { checkRole } from "../middlewares/checkRole";
import { upload } from "../config/multerConfig";

const router = express.Router();

/* ========================= TOUR PACKAGE ROUTES ========================= */

/**
 * @route   POST /api/admin/tour-packages
 * @desc    Create a new tour package
 * @access  Private (admin and host)
 */
router.post(
  "/tour-packages",
  protect,
  checkRole("admin", "host"),
  upload.fields([{ name: "images", maxCount: 10 }]), // Accept multiple tour images
  createTourPackage
);

/**
 * @route   GET /api/admin/tour-packages
 * @desc    Get all tour packages (admin) or only the host's own
 * @access  Private (admin and host)
 */
router.get(
  "/tour-packages",
  protect,
  checkRole("admin", "host"),
  getTourPackages
);

/**
 * @route   PATCH /api/admin/tour-packages/:id
 * @desc    Update a tour package
 * @access  Private (admin only)
 */
router.patch(
  "/tour-packages/:id",
  protect,
  checkRole("admin"),
  upload.fields([{ name: "images", maxCount: 10 }]),  // Accept multiple images
  updateTourPackage
);

/**
 * @route   DELETE /api/admin/tour-packages/:id
 * @desc    Delete a tour package and its images
 * @access  Private (admin only)
 */
router.delete(
  "/tour-packages/:id",
  protect,
  checkRole("admin"),
  deleteTourPackage
);

export default router;
