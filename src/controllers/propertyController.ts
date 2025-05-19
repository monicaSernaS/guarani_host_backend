import { Request, Response } from "express";
import { Property } from "../models/PropertyModel";
import { uploadImagesToCloudinary } from "../helpers/uploadImagesToCloudinary";
import { deleteImageFromCloudinary } from "../helpers/deleteImageFromCloudinary";
import { PaymentStatus, PropertyStatus } from "../@types/express/enums";

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
      checkIn,
      checkOut,
      guests,
      amenities,
      paymentStatus,
      paymentDetails,
      host, // Admin must specify which host owns the property
    } = req.body;

    // Validate required fields
    if (
      !title || !description || !address || !city || !pricePerNight || !checkIn ||
      !checkOut || !guests || !host
    ) {
      res.status(400).json({ message: "❗ Missing required fields" });
      return;
    }

    // Validate numeric fields
    if (+pricePerNight <= 0 || +guests <= 0) {
      res.status(400).json({ message: "❗ Price and guests must be greater than zero" });
      return;
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const now = new Date();

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      res.status(400).json({ message: "❗ Invalid check-in or check-out date" });
      return;
    }

    if (checkInDate < now || checkOutDate < now || checkOutDate <= checkInDate) {
      res.status(400).json({ message: "❗ Invalid check-in/check-out range" });
      return;
    }

    // Upload property images to Cloudinary
    let imageUrls: string[] = [];
    if (req.files && "images" in req.files) {
      const imageFiles = req.files["images"] as Express.Multer.File[];
      imageUrls = await uploadImagesToCloudinary(imageFiles);
    }

    // Create and save new property
    const newProperty = new Property({
      title,
      description,
      address,
      city,
      pricePerNight,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      amenities,
      host,
      imageUrls,
      paymentStatus: paymentStatus || PaymentStatus.PENDING,
      paymentDetails: paymentDetails?.trim() || "",
      status: PropertyStatus.AVAILABLE,
    });

    await newProperty.save();

    res.status(201).json({
      message: "✅ Property created successfully",
      property: newProperty,
    });
  } catch (error) {
    console.error("❌ Error creating property:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};

/**
 * @desc    Get all properties (admin only)
 * @route   GET /api/admin/properties
 * @access  Private (admin only)
 */
export const getProperties = async (_req: Request, res: Response): Promise<void> => {
  try {
    const properties = await Property.find().populate("host");
    res.status(200).json({
      message: "✅ Properties retrieved successfully",
      properties,
    });
  } catch (error) {
    console.error("❌ Error fetching properties:", error);
    res.status(500).json({ message: "❌ Server error" });
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
      checkIn,
      checkOut,
      guests,
      amenities,
      paymentStatus,
      paymentDetails,
      removedImages,
    } = req.body;

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
    if (guests && +guests <= 0) {
      res.status(400).json({ message: "❗ Number of guests must be greater than zero" });
      return;
    }

    // Validate and apply new dates
    const checkInDate = checkIn ? new Date(checkIn) : null;
    const checkOutDate = checkOut ? new Date(checkOut) : null;

    if (checkInDate && isNaN(checkInDate.getTime())) {
      res.status(400).json({ message: "❗ Invalid check-in date" });
      return;
    }

    if (checkOutDate && isNaN(checkOutDate.getTime())) {
      res.status(400).json({ message: "❗ Invalid check-out date" });
      return;
    }

    if (checkInDate && checkOutDate && checkOutDate <= checkInDate) {
      res.status(400).json({ message: "❗ Check-out must be after check-in" });
      return;
    }

    // Update fields
    if (title) property.title = title;
    if (description) property.description = description;
    if (address) property.address = address;
    if (city) property.city = city;
    if (pricePerNight) property.pricePerNight = pricePerNight;
    if (checkInDate) property.checkIn = checkInDate;
    if (checkOutDate) property.checkOut = checkOutDate;
    if (guests) property.guests = guests;
    if (amenities) property.amenities = amenities;
    if (paymentStatus) property.paymentStatus = paymentStatus;
    if (paymentDetails) property.paymentDetails = paymentDetails?.trim();

    // Remove images
    if (Array.isArray(removedImages)) {
      for (const url of removedImages) {
        await deleteImageFromCloudinary(url);
        property.imageUrls = property.imageUrls.filter((img) => img !== url);
      }
    }

    // Upload new images
    if (req.files && "images" in req.files) {
      const imageFiles = req.files["images"] as Express.Multer.File[];
      const newImageUrls = await uploadImagesToCloudinary(imageFiles);
      property.imageUrls.push(...newImageUrls);
    }

    await property.save();

    res.status(200).json({
      message: "✅ Property updated successfully",
      property,
    });
  } catch (error) {
    console.error("❌ Error updating property:", error);
    res.status(500).json({ message: "❌ Server error" });
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

    // Delete all images
    await Promise.all(property.imageUrls.map(url => deleteImageFromCloudinary(url)));

    await property.deleteOne();

    res.status(200).json({
      message: "✅ Property deleted successfully",
      propertyId: property._id,
    });
  } catch (error) {
    console.error("❌ Error deleting property:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};

