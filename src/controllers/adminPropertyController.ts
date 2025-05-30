import { Request, Response } from "express";
import { Property } from "../models/PropertyModel";
import { uploadImagesToCloudinary } from "../helpers/uploadImagesToCloudinary";
import { deleteImageFromCloudinary } from "../helpers/deleteImageFromCloudinary";
import { PropertyStatus } from "../@types/express/enums";

/**
 * @desc    Create a new property (admin only)
 * @route   POST /api/admin/properties
 * @access  Private (admin only)
 */
export const createProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      address,
      city,
      pricePerNight,
      amenities,
      host, // Admin must specify which host owns the property
      status
    } = req.body;

    console.log('Creating property with data:', req.body);
    console.log('Files received:', req.files);

    // Validate required fields
    if (!title || !description || !address || !city || !pricePerNight || !host) {
      res.status(400).json({ message: "❗ Missing required fields: title, description, address, city, pricePerNight, host" });
      return;
    }

    // Validate numeric fields
    if (+pricePerNight <= 0) {
      res.status(400).json({ message: "❗ Price per night must be greater than zero" });
      return;
    }

    // Validate status if provided
    if (status && !Object.values(PropertyStatus).includes(status)) {
      res.status(400).json({ message: "❗ Invalid property status" });
      return;
    }

    // Upload property images to Cloudinary
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

    // Create and save new property
    const newProperty = new Property({
      title: title.trim(),
      description: description.trim(),
      address: address.trim(),
      city: city.trim(),
      pricePerNight: +pricePerNight,
      amenities: parsedAmenities,
      host,
      imageUrls,
      status: status || PropertyStatus.AVAILABLE,
    });

    await newProperty.save();

    // Populate host information for response
    await newProperty.populate('host', 'firstName lastName email');

    res.status(201).json({
      message: "✅ Property created successfully",
      property: newProperty,
    });
  } catch (error) {
    console.error("❌ Error creating property:", error);
    res.status(500).json({ message: "❌ Server error while creating property" });
  }
};

/**
 * @desc    Get all properties (admin only)
 * @route   GET /api/admin/properties
 * @access  Private (admin only)
 */
export const getProperties = async (_req: Request, res: Response): Promise<void> => {
  try {
    const properties = await Property.find()
      .populate('host', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "✅ Properties retrieved successfully",
      properties,
    });
  } catch (error) {
    console.error("❌ Error fetching properties:", error);
    res.status(500).json({ message: "❌ Server error while fetching properties" });
  }
};

/**
 * @desc    Get property by ID (admin only)
 * @route   GET /api/admin/properties/:id
 * @access  Private (admin only)
 */
export const getPropertyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('host', 'firstName lastName email');

    if (!property) {
      res.status(404).json({ message: "🚫 Property not found" });
      return;
    }

    res.status(200).json({
      message: "✅ Property retrieved successfully",
      property,
    });
  } catch (error) {
    console.error("❌ Error fetching property:", error);
    res.status(500).json({ message: "❌ Server error while fetching property" });
  }
};

/**
 * @desc    Update property details (admin only)
 * @route   PATCH /api/admin/properties/:id
 * @access  Private (admin only)
 */
export const updateProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      address,
      city,
      pricePerNight,
      amenities,
      status,
      removedImages,
    } = req.body;

    console.log('Updating property with data:', req.body);
    console.log('Files received:', req.files);

    const property = await Property.findById(req.params.id);
    if (!property) {
      res.status(404).json({ message: "🚫 Property not found" });
      return;
    }

    // Validate updated numeric fields
    if (pricePerNight && +pricePerNight <= 0) {
      res.status(400).json({ message: "❗ Price per night must be greater than zero" });
      return;
    }

    // Validate status if provided
    if (status && !Object.values(PropertyStatus).includes(status)) {
      res.status(400).json({ message: "❗ Invalid property status" });
      return;
    }

    // Update fields
    if (title) property.title = title.trim();
    if (description) property.description = description.trim();
    if (address) property.address = address.trim();
    if (city) property.city = city.trim();
    if (pricePerNight) property.pricePerNight = +pricePerNight;
    if (status) property.status = status;

    // Handle amenities
    if (amenities) {
      try {
        property.amenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
      } catch (error) {
        property.amenities = Array.isArray(amenities) ? amenities : [amenities];
      }
    }

    // Remove images from Cloudinary and property
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

    // Upload new images
    if (req.files && "images" in req.files) {
      const imageFiles = req.files["images"] as Express.Multer.File[];
      const newImageUrls = await uploadImagesToCloudinary(imageFiles);
      property.imageUrls.push(...newImageUrls);
    }

    // Ensure at least one image remains
    if (property.imageUrls.length === 0) {
      res.status(400).json({ message: "❗ Property must have at least one image" });
      return;
    }

    await property.save();

    // Populate host information for response
    await property.populate('host', 'firstName lastName email');

    res.status(200).json({
      message: "✅ Property updated successfully",
      property,
    });
  } catch (error) {
    console.error("❌ Error updating property:", error);
    res.status(500).json({ message: "❌ Server error while updating property" });
  }
};

/**
 * @desc    Delete a property and its images (admin only)
 * @route   DELETE /api/admin/properties/:id
 * @access  Private (admin only)
 */
export const deleteProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      res.status(404).json({ message: "🚫 Property not found" });
      return;
    }

    // Delete all images from Cloudinary
    const deletePromises = property.imageUrls.map(async (url) => {
      try {
        await deleteImageFromCloudinary(url);
      } catch (error) {
        console.error(`Failed to delete image ${url}:`, error);
      }
    });

    await Promise.allSettled(deletePromises);

    // Delete the property
    await property.deleteOne();

    res.status(200).json({
      message: "✅ Property deleted successfully",
      propertyId: property._id,
    });
  } catch (error) {
    console.error("❌ Error deleting property:", error);
    res.status(500).json({ message: "❌ Server error while deleting property" });
  }
};

/**
 * @desc    Update property status (admin only)
 * @route   PATCH /api/admin/properties/:id/status
 * @access  Private (admin only)
 */
export const updatePropertyStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;

    if (!status || !Object.values(PropertyStatus).includes(status)) {
      res.status(400).json({ message: "❗ Valid status is required" });
      return;
    }

    const property = await Property.findById(req.params.id);
    if (!property) {
      res.status(404).json({ message: "🚫 Property not found" });
      return;
    }

    property.status = status;
    await property.save();

    res.status(200).json({
      message: "✅ Property status updated successfully",
      property,
    });
  } catch (error) {
    console.error("❌ Error updating property status:", error);
    res.status(500).json({ message: "❌ Server error while updating status" });
  }
};