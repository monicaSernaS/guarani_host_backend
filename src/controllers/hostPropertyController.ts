import { Request, Response } from "express";
import { Property } from "../models/PropertyModel";
import { uploadImagesToCloudinary } from "../helpers/uploadImagesToCloudinary";
import { deleteImageFromCloudinary } from "../helpers/deleteImageFromCloudinary";
import { PropertyStatus, PaymentStatus } from "../@types/express/enums";

/**
 * @desc    Get all properties created by the current host
 * @route   GET /api/host/properties
 * @access  Private (host only)
 */
export const getHostProperties = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;
    const properties = await Property.find({ host: hostId });
    res.status(200).json({ message: "✅ Host properties retrieved", properties });
  } catch (error) {
    console.error("❌ Error fetching host properties:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};

/**
 * @desc    Create a new property for the authenticated host
 * @route   POST /api/host/properties
 * @access  Private (host only)
 */
export const createHostProperty = async (req: Request, res: Response): Promise<void> => {
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
    } = req.body;

    const hostId = req.user?._id;

    // Required fields
    if (!title || !description || !address || !city || !pricePerNight || !checkIn || !checkOut || !guests) {
      res.status(400).json({ message: "❗ Missing required fields" });
      return;
    }

    if (+pricePerNight <= 0 || +guests <= 0) {
      res.status(400).json({ message: "❗ Price and guests must be greater than 0" });
      return;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
      res.status(400).json({ message: "❗ Invalid check-in/check-out range" });
      return;
    }

    // Upload images
    const imageUrls =
      req.files && "images" in req.files
        ? await uploadImagesToCloudinary(req.files["images"])
        : [];

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
      host: hostId,
      imageUrls,
      paymentStatus: paymentStatus || PaymentStatus.PENDING,
      paymentDetails: paymentDetails?.trim() || "",
      status: PropertyStatus.AVAILABLE,
    });

    await newProperty.save();

    res.status(201).json({ message: "✅ Property created", property: newProperty });
  } catch (error) {
    console.error("❌ Error creating property:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};

/**
 * @desc    Update a property owned by the host
 * @route   PATCH /api/host/properties/:id
 * @access  Private (host only)
 */
export const updateHostProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property || property.host.toString() !== req.user?._id.toString()) {
      res.status(403).json({ message: "🚫 Not authorized or property not found" });
      return;
    }

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

    if (pricePerNight && +pricePerNight <= 0) {
      res.status(400).json({ message: "❗ Price must be greater than 0" });
      return;
    }

    if (guests && +guests <= 0) {
      res.status(400).json({ message: "❗ Guests must be greater than 0" });
      return;
    }

    const checkInDate = checkIn ? new Date(checkIn) : null;
    const checkOutDate = checkOut ? new Date(checkOut) : null;
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

    // Delete selected images
    if (Array.isArray(removedImages)) {
      for (const url of removedImages) {
        await deleteImageFromCloudinary(url);
        property.imageUrls = property.imageUrls.filter((img) => img !== url);
      }
    }

    // Upload new images
    if (req.files && "images" in req.files) {
      const imageFiles = req.files["images"] as Express.Multer.File[];
      const newImages = await uploadImagesToCloudinary(imageFiles);
      property.imageUrls.push(...newImages);
    }

    await property.save();

    res.status(200).json({ message: "✅ Property updated", property });
  } catch (error) {
    console.error("❌ Error updating property:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};

/**
 * @desc    Delete a property owned by the host and its images
 * @route   DELETE /api/host/properties/:id
 * @access  Private (host only)
 */
export const deleteHostProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property || property.host.toString() !== req.user?._id.toString()) {
      res.status(403).json({ message: "🚫 Not authorized or property not found" });
      return;
    }

    // Delete all Cloudinary images
    await Promise.all(property.imageUrls.map(url => deleteImageFromCloudinary(url)));

    await property.deleteOne();

    res.status(200).json({ message: "✅ Property deleted", propertyId: property._id });
  } catch (error) {
    console.error("❌ Error deleting property:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
};
