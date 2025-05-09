import { Request, Response } from "express";
import { uploadImagesToCloudinary } from "../helpers/uploadImagesToCloudinary";
import { deleteImageFromCloudinary } from "../helpers/deleteImageFromCloudinary";
import { TourPackage } from "../models/TourPackageModel";
import { PaymentStatus } from "../@types/express/enums";

/**
 * @desc    Create a new tour package
 * @route   POST /api/admin/tour-packages
 * @access  Private (admin and host)
 */
export const createTourPackage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, price, status, paymentDetails } = req.body;
    const hostId = req.user?._id;

    // Upload images to Cloudinary if provided
    let imageUrls: string[] = [];
    if (req.files && "images" in req.files) {
      const imageFiles = req.files["images"] as Express.Multer.File[];
      imageUrls = await uploadImagesToCloudinary(imageFiles);
    }

    // Create new tour package
    const newTourPackage = new TourPackage({
      title,
      description,
      price,
      status,
      imageUrls,
      host: hostId,
      paymentStatus: PaymentStatus.PENDING,
      paymentDetails: paymentDetails?.trim() || "",
    });

    await newTourPackage.save();

    res.status(201).json({
      message: "✅ Tour package created successfully",
      tourPackage: newTourPackage,
    });
  } catch (error) {
    console.error("❌ Error creating tour package:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};

/**
 * @desc    Get all tour packages for a specific host or all for admin
 * @route   GET /api/admin/tour-packages
 * @access  Private (admin and host)
 */
export const getTourPackages = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.query.hostId as string;

    const tourPackages =
      req.user?.role === "admin"
        ? await TourPackage.find().populate("host")
        : await TourPackage.find({ host: hostId });

    res.status(200).json({
      message: "✅ Tour packages retrieved successfully",
      tourPackages,
    });
  } catch (error) {
    console.error("❌ Error fetching tour packages:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};

/**
 * @desc    Update a tour package
 * @route   PATCH /api/admin/tour-packages/:id
 * @access  Private (admin only)
 */
export const updateTourPackage = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      price,
      status,
      paymentDetails,
      paymentStatus,
    } = req.body;

    const tourPackage = await TourPackage.findById(req.params.id);
    if (!tourPackage) {
      res.status(404).json({ message: "🚫 Tour package not found" });
      return;
    }

    // Update main fields
    tourPackage.title = title || tourPackage.title;
    tourPackage.description = description || tourPackage.description;
    tourPackage.price = price || tourPackage.price;
    tourPackage.status = status || tourPackage.status;
    tourPackage.paymentDetails = paymentDetails?.trim() || tourPackage.paymentDetails;
    tourPackage.paymentStatus = paymentStatus || tourPackage.paymentStatus;

    // Replace images if new ones are provided
    if (req.files && "images" in req.files) {
      // Optional: delete old images if needed
      for (const oldUrl of tourPackage.imageUrls) {
        await deleteImageFromCloudinary(oldUrl);
      }

      const newImageFiles = req.files["images"] as Express.Multer.File[];
      const newImageUrls = await uploadImagesToCloudinary(newImageFiles);
      tourPackage.imageUrls = newImageUrls;
    }

    await tourPackage.save();

    res.status(200).json({
      message: "✅ Tour package updated successfully",
      tourPackage,
    });
  } catch (error) {
    console.error("❌ Error updating tour package:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};

/**
 * @desc    Delete a tour package and remove its images
 * @route   DELETE /api/admin/tour-packages/:id
 * @access  Private (admin only)
 */
export const deleteTourPackage = async (req: Request, res: Response): Promise<void> => {
  try {
    const tourPackage = await TourPackage.findByIdAndDelete(req.params.id);
    if (!tourPackage) {
      res.status(404).json({ message: "🚫 Tour package not found" });
      return;
    }

    if (tourPackage.imageUrls && tourPackage.imageUrls.length > 0) {
      for (const imageUrl of tourPackage.imageUrls) {
        await deleteImageFromCloudinary(imageUrl);
      }
    }

    res.status(200).json({
      message: "✅ Tour package deleted successfully",
      tourPackageId: tourPackage._id,
    });
  } catch (error) {
    console.error("❌ Error deleting tour package:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};
