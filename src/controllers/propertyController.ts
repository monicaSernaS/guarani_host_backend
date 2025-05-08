import { Request, Response } from "express";
import cloudinary from "../config/cloudinaryConfig"
import { Property } from "../models/PropertyModel";
import { User } from "../models/User";
import { upload } from "../config/multerConfig";

/**
 * @desc    Create a new property
 * @route   POST /api/admin/properties
 * @access  Private (admin and host)
 */
export const createProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, address, city, pricePerNight, checkIn, checkOut, guests, amenities } = req.body;
    const hostId = req.user?._id;  

    // Check if the user is an admin or a host
    if (req.user?.role === "host") {
      const hostUser = await User.findById(hostId);
      if (!hostUser || hostUser.role !== "host") {
        res.status(403).json({ message: "🚫 Host not found or not authorized" });
        return;
      }
    }

    // Upload images to Cloudinary
    const imageUrls: string[] = [];
    if (req.files && req.files.images) {
      for (const file of req.files.images as Express.Multer.File[]) {
        const uploadResult = await cloudinary.uploader.upload(file.path);
        imageUrls.push(uploadResult.secure_url); 
      }
    }

    // Create property
    const newProperty = new Property({
      title,
      description,
      address,
      city,
      pricePerNight,
      checkIn,
      checkOut,
      guests,
      amenities,
      host: hostId, 
      imageUrls,
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
 * @desc    Get all properties for a specific host or all for admin
 * @route   GET /api/admin/properties
 * @access  Private (admin and host)
 */
export const getProperties = async (req: Request, res: Response): Promise<void> => {
    try {
      const hostId = req.query.hostId as string;
  
      let properties;
      if (req.user?.role === "admin") {
        // Admin can get all properties
        properties = await Property.find().populate("host");
      } else if (req.user?.role === "host" && hostId) {
        // Host can only get their own properties
        properties = await Property.find({ host: hostId });
      } else {
        res.status(403).json({ message: "❌ Unauthorized" });
        return;
      }
  
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
   * @desc    Update property details
   * @route   PATCH /api/admin/properties/:id
   * @access  Private (admin only)
   */
  export const updateProperty = async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, description, address, city, pricePerNight, checkIn, checkOut, guests, amenities, paymentStatus } = req.body;
  
      const property = await Property.findById(req.params.id);
      if (!property) {
        res.status(404).json({ message: "🚫 Property not found" });
        return;
      }
  
      // Update property details
      property.title = title || property.title;
      property.description = description || property.description;
      property.address = address || property.address;
      property.city = city || property.city;
      property.pricePerNight = pricePerNight || property.pricePerNight;
      property.checkIn = checkIn || property.checkIn;
      property.checkOut = checkOut || property.checkOut;
      property.guests = guests || property.guests;
      property.amenities = amenities || property.amenities;
      property.paymentStatus = paymentStatus || property.paymentStatus;
  
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
   * @desc    Delete a property
   * @route   DELETE /api/admin/properties/:id
   * @access  Private (admin only)
   */
  export const deleteProperty = async (req: Request, res: Response): Promise<void> => {
    try {
      const property = await Property.findByIdAndDelete(req.params.id);
      if (!property) {
        res.status(404).json({ message: "🚫 Property not found" });
        return;
      }
  
      res.status(200).json({
        message: "✅ Property deleted successfully",
        propertyId: property._id,
      });
    } catch (error) {
      console.error("❌ Error deleting property:", error);
      res.status(500).json({ message: "❌ Server error" });
    }
  };