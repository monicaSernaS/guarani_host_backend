import { Request, Response } from "express";
import { uploadImagesToCloudinary } from "../helpers/uploadImagesToCloudinary";
import { deleteImageFromCloudinary } from "../helpers/deleteImageFromCloudinary";
import { TourPackage } from "../models/TourPackageModel";
import { PaymentStatus } from "../@types/express/enums";

/* ====================== HOST FUNCTIONS ====================== */

/**
 * @desc    Host creates a new tour package
 * @route   POST /api/host/tours
 * @access  Private (host only)
 */
export const createHostTour = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, price, status, paymentDetails } = req.body;
    const hostId = req.user?._id;

    let imageUrls: string[] = [];
    if (req.files && "images" in req.files) {
      const imageFiles = req.files["images"] as Express.Multer.File[];
      imageUrls = await uploadImagesToCloudinary(imageFiles);
    }

    const newTour = new TourPackage({
      title,
      description,
      price,
      status,
      imageUrls,
      host: hostId,
      paymentStatus: PaymentStatus.PENDING,
      paymentDetails: paymentDetails?.trim() || "",
    });

    await newTour.save();
    res.status(201).json({ message: "✅ Tour package created", tour: newTour });
  } catch (error) {
    console.error("❌ Error creating host tour:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};

/**
 * @desc    Host fetches all their tour packages
 * @route   GET /api/host/tours
 * @access  Private (host only)
 */
export const getHostTours = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;
    const tours = await TourPackage.find({ host: hostId });
    res.status(200).json({ message: "✅ Tours retrieved", tours });
  } catch (error) {
    console.error("❌ Error fetching host tours:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};

/**
 * @desc    Host updates one of their tour packages
 * @route   PATCH /api/host/tours/:id
 * @access  Private (host only)
 */
export const updateHostTour = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, price, status, paymentDetails } = req.body;
    const tour = await TourPackage.findOne({ _id: req.params.id, host: req.user?._id });

    if (!tour) {
      res.status(404).json({ message: "🚫 Tour not found or unauthorized" });
      return;
    }

    tour.title = title || tour.title;
    tour.description = description || tour.description;
    tour.price = price || tour.price;
    tour.status = status || tour.status;
    tour.paymentDetails = paymentDetails?.trim() || tour.paymentDetails;

    if (req.files && "images" in req.files) {
      for (const oldUrl of tour.imageUrls) {
        await deleteImageFromCloudinary(oldUrl);
      }
      const newImages = req.files["images"] as Express.Multer.File[];
      tour.imageUrls = await uploadImagesToCloudinary(newImages);
    }

    await tour.save();
    res.status(200).json({ message: "✅ Tour updated", tour });
  } catch (error) {
    console.error("❌ Error updating host tour:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};

/**
 * @desc    Host deletes one of their tour packages
 * @route   DELETE /api/host/tours/:id
 * @access  Private (host only)
 */
export const deleteHostTour = async (req: Request, res: Response): Promise<void> => {
  try {
    const tour = await TourPackage.findOneAndDelete({ _id: req.params.id, host: req.user?._id });

    if (!tour) {
      res.status(404).json({ message: "🚫 Tour not found or unauthorized" });
      return;
    }

    for (const url of tour.imageUrls) {
      await deleteImageFromCloudinary(url);
    }

    res.status(200).json({ message: "✅ Tour deleted", tourId: tour._id });
  } catch (error) {
    console.error("❌ Error deleting host tour:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};
