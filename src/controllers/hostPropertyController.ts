import { Request, Response } from "express";
import { Property } from "../models/PropertyModel";
import { uploadImagesToCloudinary } from "../helpers/uploadImagesToCloudinary";
import { deleteImageFromCloudinary } from "../helpers/deleteImageFromCloudinary";
import { PropertyStatus } from "../@types/express/enums";

/**
 * @desc    Get all properties created by the current host
 * @route   GET /api/host/properties
 * @access  Private (host only)
 */
export const getHostProperties = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;

    if (!hostId) {
      res.status(401).json({ message: "🚫 Unauthorized" });
      return;
    }

    const properties = await Property.find({ host: hostId }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "✅ Host properties retrieved successfully",
      total: properties.length,
      properties
    });
  } catch (error) {
    console.error("❌ Error fetching host properties:", error);
    res.status(500).json({ message: "❌ Server error while fetching properties" });
  }
};

/**
 * @desc    Get a specific property by ID (owned by host)
 * @route   GET /api/host/properties/:id
 * @access  Private (host only)
 */
export const getHostPropertyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;

    if (!hostId) {
      res.status(401).json({ message: "🚫 Unauthorized" });
      return;
    }

    const property = await Property.findOne({
      _id: req.params.id,
      host: hostId
    });

    if (!property) {
      res.status(404).json({ message: "🚫 Property not found or not owned by you" });
      return;
    }

    res.status(200).json({
      message: "✅ Property retrieved successfully",
      property
    });
  } catch (error) {
    console.error("❌ Error fetching property:", error);
    res.status(500).json({ message: "❌ Server error while fetching property" });
  }
};

/**
 * @desc    Create a new property for the authenticated host
 * @route   POST /api/host/properties
 * @access  Private (host only)
 */
export const createHostProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({ message: "🚫 Unauthorized" });
      return;
    }

    const {
      title,
      description,
      address,
      city,
      pricePerNight,
      amenities,
      guests,
      status
    } = req.body;

    console.log('Host creating property with data:', req.body);
    console.log('Files received:', req.files);

    if (!title || !description || !address || !city || !pricePerNight) {
      res.status(400).json({ message: "❗ Missing required fields: title, description, address, city, pricePerNight" });
      return;
    }

    if (+pricePerNight <= 0) {
      res.status(400).json({ message: "❗ Price per night must be greater than 0" });
      return;
    }

    if (guests === undefined || +guests < 1) {
      res.status(400).json({ message: "❗ Guests must be at least 1" });
      return;
    }

    if (status && !Object.values(PropertyStatus).includes(status)) {
      res.status(400).json({ message: "❗ Invalid property status" });
      return;
    }

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

    let parsedAmenities: string[] = [];
    if (amenities) {
      try {
        parsedAmenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
      } catch {
        parsedAmenities = Array.isArray(amenities) ? amenities : [amenities];
      }
    }

    const newProperty = new Property({
      title: title.trim(),
      description: description.trim(),
      address: address.trim(),
      city: city.trim(),
      pricePerNight: +pricePerNight,
      amenities: parsedAmenities,
      guests: +guests,
      host: req.user._id,
      imageUrls,
      status: status || PropertyStatus.AVAILABLE,
    });

    await newProperty.save();

    res.status(201).json({
      message: "✅ Property created successfully",
      property: newProperty
    });
  } catch (error) {
    console.error("❌ Error creating property:", error);
    res.status(500).json({ message: "❌ Server error while creating property" });
  }
};

/**
 * @desc    Update a property owned by the host
 * @route   PATCH /api/host/properties/:id
 * @access  Private (host only)
 */
export const updateHostProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;

    if (!hostId) {
      res.status(401).json({ message: "🚫 Unauthorized" });
      return;
    }

    const property = await Property.findOne({
      _id: req.params.id,
      host: hostId
    });

    if (!property) {
      res.status(404).json({ message: "🚫 Property not found or not owned by you" });
      return;
    }

    const {
      title,
      description,
      address,
      city,
      pricePerNight,
      amenities,
      guests,
      status,
      removedImages,
    } = req.body;

    console.log('Host updating property with data:', req.body);
    console.log('Files received:', req.files);

    if (pricePerNight && +pricePerNight <= 0) {
      res.status(400).json({ message: "❗ Price per night must be greater than 0" });
      return;
    }

    if (guests !== undefined && +guests < 1) {
      res.status(400).json({ message: "❗ Guests must be at least 1" });
      return;
    }

    if (status && !Object.values(PropertyStatus).includes(status)) {
      res.status(400).json({ message: "❗ Invalid property status" });
      return;
    }

    if (title) property.title = title.trim();
    if (description) property.description = description.trim();
    if (address) property.address = address.trim();
    if (city) property.city = city.trim();
    if (pricePerNight) property.pricePerNight = +pricePerNight;
    if (guests !== undefined) property.guests = +guests;
    if (status) property.status = status;

    if (amenities) {
      try {
        property.amenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
      } catch {
        property.amenities = Array.isArray(amenities) ? amenities : [amenities];
      }
    }

    if (Array.isArray(removedImages)) {
      for (const url of removedImages) {
        try {
          await deleteImageFromCloudinary(url);
          property.imageUrls = property.imageUrls.filter((img) => img !== url);
        } catch (error) {
          console.error(`Failed to delete image ${url}:`, error);
        }
      }
    }

    if (req.files && "images" in req.files) {
      const imageFiles = req.files["images"] as Express.Multer.File[];
      const newImages = await uploadImagesToCloudinary(imageFiles);
      property.imageUrls.push(...newImages);
    }

    if (property.imageUrls.length === 0) {
      res.status(400).json({ message: "❗ Property must have at least one image" });
      return;
    }

    await property.save();

    res.status(200).json({
      message: "✅ Property updated successfully",
      property
    });
  } catch (error) {
    console.error("❌ Error updating property:", error);
    res.status(500).json({ message: "❌ Server error while updating property" });
  }
};

/**
 * @desc    Delete a property owned by the host and its images
 * @route   DELETE /api/host/properties/:id
 * @access  Private (host only)
 */
export const deleteHostProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;

    if (!hostId) {
      res.status(401).json({ message: "🚫 Unauthorized" });
      return;
    }

    const property = await Property.findOne({
      _id: req.params.id,
      host: hostId
    });

    if (!property) {
      res.status(404).json({ message: "🚫 Property not found or not owned by you" });
      return;
    }

    const deletePromises = property.imageUrls.map(async (url) => {
      try {
        await deleteImageFromCloudinary(url);
      } catch (error) {
        console.error(`Failed to delete image ${url}:`, error);
      }
    });

    await Promise.allSettled(deletePromises);
    await property.deleteOne();

    res.status(200).json({
      message: "✅ Property deleted successfully",
      propertyId: property._id
    });
  } catch (error) {
    console.error("❌ Error deleting property:", error);
    res.status(500).json({ message: "❌ Server error while deleting property" });
  }
};

/**
 * @desc    Update property status (available/inactive)
 * @route   PATCH /api/host/properties/:id/status
 * @access  Private (host only)
 */
export const updateHostPropertyStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;
    const { status } = req.body;

    if (!hostId) {
      res.status(401).json({ message: "🚫 Unauthorized" });
      return;
    }

    if (!status || !Object.values(PropertyStatus).includes(status)) {
      res.status(400).json({ message: "❗ Valid status is required" });
      return;
    }

    const property = await Property.findOne({
      _id: req.params.id,
      host: hostId
    });

    if (!property) {
      res.status(404).json({ message: "🚫 Property not found or not owned by you" });
      return;
    }

    property.status = status;
    await property.save();

    res.status(200).json({
      message: "✅ Property status updated successfully",
      property: {
        _id: property._id,
        title: property.title,
        status: property.status
      }
    });
  } catch (error) {
    console.error("❌ Error updating property status:", error);
    res.status(500).json({ message: "❌ Server error while updating status" });
  }
};
