import { Request, Response } from "express";
import { TourPackage } from "../models/TourPackageModel";
import { uploadImagesToCloudinary } from "../helpers/uploadImagesToCloudinary";
import { deleteImageFromCloudinary } from "../helpers/deleteImageFromCloudinary";
import { TourPackageStatus } from "../@types/express/enums";

/**
 * @desc    Create a new tour package (admin/host)
 * @route   POST /api/admin/tour-packages
 * @access  Private (admin and host)
 */
export const createTourPackage = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(201).json({ message: "Tour package created - TODO" });
  } catch (error) {
    console.error("❌ Error creating tour package:", error);
    res.status(500).json({ message: "❌ Server error while creating tour package" });
  }
};

/**
 * @desc    Get all tour packages
 * @route   GET /api/admin/tour-packages
 * @access  Private (admin and host)
 */
export const getTourPackages = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({ message: "Get tour packages - TODO" });
  } catch (error) {
    console.error("❌ Error fetching tour packages:", error);
    res.status(500).json({ message: "❌ Server error while fetching tour packages" });
  }
};

/**
 * @desc    Update tour package
 * @route   PATCH /api/admin/tour-packages/:id
 * @access  Private (admin only)
 */
export const updateTourPackage = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({ message: "Update tour package - TODO" });
  } catch (error) {
    console.error("❌ Error updating tour package:", error);
    res.status(500).json({ message: "❌ Server error while updating tour package" });
  }
};

/**
 * @desc    Delete tour package
 * @route   DELETE /api/admin/tour-packages/:id
 * @access  Private (admin only)
 */
export const deleteTourPackage = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({ message: "Delete tour package - TODO" });
  } catch (error) {
    console.error("❌ Error deleting tour package:", error);
    res.status(500).json({ message: "❌ Server error while deleting tour package" });
  }
};