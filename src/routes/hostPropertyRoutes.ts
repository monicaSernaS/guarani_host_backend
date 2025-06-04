import express from "express";
import {
  getHostProperties,
  createHostProperty,
  updateHostProperty,
  deleteHostProperty,
} from "../controllers/hostPropertyController";
import { protect } from "../middlewares/protect";
import { checkRole } from "../middlewares/checkRole";
import { upload } from "../config/multerConfig";

const router = express.Router();

/* ===================== HOST PROPERTY ROUTES ===================== */

/**
 * @route   GET /api/host/properties
 * @desc    Get all properties owned by the host
 * @access  Private (host only)
 */
router.get("/properties", protect, checkRole("host"), getHostProperties);

/**
 * @route   POST /api/host/properties
 * @desc    Create a new property
 * @access  Private (host only)
 */
router.post("/properties", protect, checkRole("host"), upload.fields([{ name: "images", maxCount: 10 }]), createHostProperty);

/**
 * @route   PATCH /api/host/properties/:id
 * @desc    Update a property owned by the host
 * @access  Private (host only)
 */
router.patch("/properties/:id", protect, checkRole("host"), upload.fields([{ name: "images", maxCount: 10 }]), updateHostProperty);

/**
 * @route   DELETE /api/host/properties/:id
 * @desc    Delete a property owned by the host
 * @access  Private (host only)
 */
router.delete("/properties/:id", protect, checkRole("host"), deleteHostProperty);

export default router;