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
    console.log('🚀 ADMIN CREATE PROPERTY - START');
    console.log('📋 req.body:', req.body);
    console.log('📸 req.files:', req.files);
    console.log('👤 req.user:', req.user);
    console.log('🔑 Authorization header:', req.headers.authorization);
    
    const {
      title,
      description,
      address,
      city,
      pricePerNight,
      amenities,
      host,
      status,
      guests
    } = req.body;

    console.log('📦 Creating property with data:', req.body);
    console.log('🖼️ Files received:', req.files);

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

   if (guests === undefined || guests === null || +guests < 1) {
    res.status(400).json({ message: "❗ Guests must be at least 1" });
    return;
    }

    // Validate status if provided
    if (status && !Object.values(PropertyStatus).includes(status)) {
      res.status(400).json({ message: "❗ Invalid property status" });
      return;
    }

    // Upload images to Cloudinary
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

    // Handle amenities
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
      guests: +guests,
      imageUrls,
      status: status || PropertyStatus.AVAILABLE,
    });

    await newProperty.save();
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
export const getProperties = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      city,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter: any = {};
    if (status) filter.status = status;
    if (city) filter.city = new RegExp(city as string, 'i');

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Get properties with pagination
    const properties = await Property.find(filter)
      .populate('host', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await Property.countDocuments(filter);

    res.status(200).json({
      message: "✅ Properties retrieved successfully",
      properties,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error("❌ Error getting properties:", error);
    res.status(500).json({ message: "❌ Server error while getting properties" });
  }
};

/**
 * @desc    Update a property (admin only)
 * @route   PATCH /api/admin/properties/:id
 * @access  Private (admin only)
 */
export const updateProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      address,
      city,
      pricePerNight,
      amenities,
      status,
      guests
    } = req.body;

    console.log('📝 Updating property with ID:', id);
    console.log('📦 Update data:', req.body);

    // Check if property exists
    const existingProperty = await Property.findById(id);
    if (!existingProperty) {
      res.status(404).json({ message: "❗ Property not found" });
      return;
    }

    // Validate numeric fields if provided
    if (pricePerNight && +pricePerNight <= 0) {
      res.status(400).json({ message: "❗ Price per night must be greater than zero" });
      return;
    }

    if (guests !== undefined && +guests < 1) {
    res.status(400).json({ message: "❗ Guests must be at least 1" });
    return;
    }

    // Validate status if provided
    if (status && !Object.values(PropertyStatus).includes(status)) {
      res.status(400).json({ message: "❗ Invalid property status" });
      return;
    }

    // Handle new images if provided
    let newImageUrls: string[] = [];
    if (req.files && "images" in req.files) {
      const imageFiles = req.files["images"] as Express.Multer.File[];
      if (imageFiles.length > 0) {
        newImageUrls = await uploadImagesToCloudinary(imageFiles);
      }
    }

    // Handle amenities
    let parsedAmenities: string[] | undefined;
    if (amenities) {
      try {
        parsedAmenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
      } catch (error) {
        parsedAmenities = Array.isArray(amenities) ? amenities : [amenities];
      }
    }

    // Build update object
    const updateData: any = {};
    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (address) updateData.address = address.trim();
    if (city) updateData.city = city.trim();
    if (pricePerNight) updateData.pricePerNight = +pricePerNight;
    if (parsedAmenities) updateData.amenities = parsedAmenities;
    if (status) updateData.status = status;
    if (guests) updateData.guests = +guests;

    // Add new images to existing ones
    if (newImageUrls.length > 0) {
      updateData.imageUrls = [...existingProperty.imageUrls, ...newImageUrls];
    }

    // Update property
    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('host', 'firstName lastName email');

    if (!updatedProperty) {
      res.status(404).json({ message: "❗ Property not found" });
      return;
    }

    res.status(200).json({
      message: "✅ Property updated successfully",
      property: updatedProperty,
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
    const { id } = req.params;

    console.log('🗑️ Deleting property with ID:', id);

    // Check if property exists
    const property = await Property.findById(id);
    if (!property) {
      res.status(404).json({ message: "❗ Property not found" });
      return;
    }

    // Delete images from Cloudinary
    if (property.imageUrls && property.imageUrls.length > 0) {
      console.log('🖼️ Deleting images from Cloudinary...');
      
      const deletePromises = property.imageUrls.map(async (imageUrl) => {
        try {
          // Extract public_id from Cloudinary URL
          const publicId = imageUrl.split('/').pop()?.split('.')[0];
          if (publicId) {
            await deleteImageFromCloudinary(publicId);
          }
        } catch (error) {
          console.error(`❌ Error deleting image ${imageUrl}:`, error);
          // Continue with deletion even if some images fail
        }
      });

      await Promise.allSettled(deletePromises);
    }

    // Delete property from database
    await Property.findByIdAndDelete(id);

    res.status(200).json({
      message: "✅ Property and its images deleted successfully"
    });
  } catch (error) {
    console.error("❌ Error deleting property:", error);
    res.status(500).json({ message: "❌ Server error while deleting property" });
  }
};