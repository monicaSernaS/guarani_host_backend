import { Request, Response } from "express";
import { uploadImagesToCloudinary } from "../helpers/uploadImagesToCloudinary";
import { deleteImageFromCloudinary } from "../helpers/deleteImageFromCloudinary";
import { TourPackage } from "../models/TourPackageModel";
import { TourPackageStatus } from "../@types/express/enums";

/* ====================== HOST TOUR FUNCTIONS ====================== */

/**
 * @desc    Host creates a new tour package
 * @route   POST /api/host/tours
 * @access  Private (host only)
 */
export const createHostTour = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      title, 
      description, 
      price, 
      duration,
      maxCapacity,
      location,
      amenities,
      status 
    } = req.body;
    
    const hostId = req.user?._id;

    console.log('📥 Request body:', { title, description, price, status });
    console.log('👤 Host ID from token:', hostId);
    console.log('📁 Files received:', req.files);

    if (!hostId) {
      res.status(401).json({ message: "🚫 Unauthorized" });
      return;
    }

    // Validate required fields
    if (!title || !description || !price) {
      res.status(400).json({ message: "❗ Missing required fields: title, description, price" });
      return;
    }

    // Validate numeric fields
    if (+price <= 0) {
      res.status(400).json({ message: "❗ Price must be greater than 0" });
      return;
    }

    if (maxCapacity && +maxCapacity <= 0) {
      res.status(400).json({ message: "❗ Max capacity must be greater than 0" });
      return;
    }

    // Validate status if provided
    if (status && !Object.values(TourPackageStatus).includes(status)) {
      res.status(400).json({ message: "❗ Invalid tour package status" });
      return;
    }

    // Upload tour images to Cloudinary
    let imageUrls: string[] = [];
    if (req.files && "images" in req.files) {
      const imageFiles = req.files["images"] as Express.Multer.File[];
      if (imageFiles.length === 0) {
        res.status(400).json({ message: "❗ At least one image is required" });
        return;
      }
      imageUrls = await uploadImagesToCloudinary(imageFiles);
    } else {
      res.status(400).json({ message: "❗ At least one image is required" });
      return;
    }

    // Parse amenities if it's a string (from FormData)
    let parsedAmenities: string[] = [];
    if (amenities) {
      try {
        parsedAmenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
      } catch (error) {
        parsedAmenities = Array.isArray(amenities) ? amenities : [amenities];
      }
    }

    const newTour = new TourPackage({
      title: title.trim(),
      description: description.trim(),
      price: +price,
      duration: duration ? +duration : undefined,
      maxCapacity: maxCapacity ? +maxCapacity : undefined,
      location: location?.trim(),
      amenities: parsedAmenities,
      status: status || TourPackageStatus.AVAILABLE,
      imageUrls,
      host: hostId,
    });

    await newTour.save();

    res.status(201).json({ 
      message: "✅ Tour package created successfully", 
      tour: newTour 
    });
  } catch (error) {
    console.error("❌ Detailed error:", error);
    res.status(500).json({ 
      message: "❌ Server error while creating tour", 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
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

    console.log('🔍 Getting tours for host ID:', hostId);
    console.log('🔍 Host ID type:', typeof hostId);

    if (!hostId) {
      res.status(401).json({ message: "🚫 Unauthorized" });
      return;
    }

    const tours = await TourPackage.find({ host: hostId }).sort({ createdAt: -1 });

    console.log('📋 Found tours count:', tours.length);
    tours.forEach((tour, index) => {
      console.log(`- Tour ${index + 1}: "${tour.title}" (ID: ${tour._id}) - Host: ${tour.host} (Type: ${typeof tour.host})`);
    });

    res.status(200).json({ 
      message: "✅ Tours retrieved successfully",
      total: tours.length,
      tours 
    });
  } catch (error) {
    console.error("❌ Error fetching host tours:", error);
    res.status(500).json({ message: "❌ Server error while fetching tours" });
  }
};

/**
 * @desc    Get a specific tour by ID (owned by host)
 * @route   GET /api/host/tours/:id
 * @access  Private (host only)
 */
export const getHostTourById = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;

    if (!hostId) {
      res.status(401).json({ message: "🚫 Unauthorized" });
      return;
    }

    const tour = await TourPackage.findOne({ 
      _id: req.params.id, 
      host: hostId 
    });

    if (!tour) {
      res.status(404).json({ message: "🚫 Tour not found or not owned by you" });
      return;
    }

    res.status(200).json({
      message: "✅ Tour retrieved successfully",
      tour
    });
  } catch (error) {
    console.error("❌ Error fetching tour:", error);
    res.status(500).json({ message: "❌ Server error while fetching tour" });
  }
};

/**
 * @desc    Host updates one of their tour packages
 * @route   PATCH /api/host/tours/:id
 * @access  Private (host only)
 */
export const updateHostTour = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;

    if (!hostId) {
      res.status(401).json({ message: "🚫 Unauthorized" });
      return;
    }

    const { 
      title, 
      description, 
      price, 
      duration,
      maxCapacity,
      location,
      amenities,
      status,
      removedImages 
    } = req.body;

    console.log('Host updating tour with data:', req.body);
    console.log('Files received:', req.files);

    const tour = await TourPackage.findOne({ 
      _id: req.params.id, 
      host: hostId 
    });

    if (!tour) {
      res.status(404).json({ message: "🚫 Tour not found or not owned by you" });
      return;
    }

    // Validate numeric fields
    if (price && +price <= 0) {
      res.status(400).json({ message: "❗ Price must be greater than 0" });
      return;
    }

    if (maxCapacity && +maxCapacity <= 0) {
      res.status(400).json({ message: "❗ Max capacity must be greater than 0" });
      return;
    }

    // Validate status if provided
    if (status && !Object.values(TourPackageStatus).includes(status)) {
      res.status(400).json({ message: "❗ Invalid tour package status" });
      return;
    }

    // Update fields
    if (title) tour.title = title.trim();
    if (description) tour.description = description.trim();
    if (price) tour.price = +price;
    if (duration) tour.duration = +duration;
    if (maxCapacity) tour.maxCapacity = +maxCapacity;
    if (location) tour.location = location.trim();
    if (status) tour.status = status;

    // Handle amenities
    if (amenities) {
      try {
        tour.amenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
      } catch (error) {
        tour.amenities = Array.isArray(amenities) ? amenities : [amenities];
      }
    }

    // Remove images from Cloudinary and tour
    if (Array.isArray(removedImages)) {
      for (const url of removedImages) {
        try {
          await deleteImageFromCloudinary(url);
          tour.imageUrls = tour.imageUrls.filter((img) => img !== url);
        } catch (error) {
          console.error(`Failed to delete image ${url}:`, error);
        }
      }
    }

    // Upload new images
    if (req.files && "images" in req.files) {
      const imageFiles = req.files["images"] as Express.Multer.File[];
      const newImages = await uploadImagesToCloudinary(imageFiles);
      tour.imageUrls.push(...newImages);
    }

    // Ensure at least one image remains
    if (tour.imageUrls.length === 0) {
      res.status(400).json({ message: "❗ Tour must have at least one image" });
      return;
    }

    await tour.save();

    res.status(200).json({ 
      message: "✅ Tour updated successfully", 
      tour 
    });
  } catch (error) {
    console.error("❌ Error updating host tour:", error);
    res.status(500).json({ message: "❌ Server error while updating tour" });
  }
};

/**
 * @desc    Host deletes one of their tour packages
 * @route   DELETE /api/host/tours/:id
 * @access  Private (host only)
 */
export const deleteHostTour = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;

    if (!hostId) {
      res.status(401).json({ message: "🚫 Unauthorized" });
      return;
    }

    const tour = await TourPackage.findOne({ 
      _id: req.params.id, 
      host: hostId 
    });

    if (!tour) {
      res.status(404).json({ message: "🚫 Tour not found or not owned by you" });
      return;
    }

    // Delete all images from Cloudinary
    const deletePromises = tour.imageUrls.map(async (url) => {
      try {
        await deleteImageFromCloudinary(url);
      } catch (error) {
        console.error(`Failed to delete image ${url}:`, error);
      }
    });

    await Promise.allSettled(deletePromises);

    // Delete the tour
    await tour.deleteOne();

    res.status(200).json({ 
      message: "✅ Tour deleted successfully", 
      tourId: tour._id 
    });
  } catch (error) {
    console.error("❌ Error deleting host tour:", error);
    res.status(500).json({ message: "❌ Server error while deleting tour" });
  }
};

/**
 * @desc    Update tour status (available/sold_out/cancelled/upcoming)
 * @route   PATCH /api/host/tours/:id/status
 * @access  Private (host only)
 */
export const updateHostTourStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;
    const { status } = req.body;

    if (!hostId) {
      res.status(401).json({ message: "🚫 Unauthorized" });
      return;
    }

    if (!status || !Object.values(TourPackageStatus).includes(status)) {
      res.status(400).json({ message: "❗ Valid status is required" });
      return;
    }

    const tour = await TourPackage.findOne({ 
      _id: req.params.id, 
      host: hostId 
    });

    if (!tour) {
      res.status(404).json({ message: "🚫 Tour not found or not owned by you" });
      return;
    }

    tour.status = status;
    await tour.save();

    res.status(200).json({
      message: "✅ Tour status updated successfully",
      tour: {
        _id: tour._id,
        title: tour.title,
        status: tour.status
      }
    });
  } catch (error) {
    console.error("❌ Error updating tour status:", error);
    res.status(500).json({ message: "❌ Server error while updating status" });
  }
};