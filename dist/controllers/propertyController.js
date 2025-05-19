"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProperty = exports.updateProperty = exports.getProperties = exports.createProperty = void 0;
const PropertyModel_1 = require("../models/PropertyModel");
const User_1 = require("../models/User");
const uploadImagesToCloudinary_1 = require("../helpers/uploadImagesToCloudinary");
const deleteImageFromCloudinary_1 = require("../helpers/deleteImageFromCloudinary");
const enums_1 = require("../@types/express/enums");
/**
 * @desc    Create a new property
 * @route   POST /api/admin/properties
 * @access  Private (admin and host)
 */
const createProperty = async (req, res) => {
    try {
        const { title, description, address, city, pricePerNight, checkIn, checkOut, guests, amenities, paymentStatus, paymentDetails, } = req.body;
        const hostId = req.user?._id;
        // Validate host user
        if (req.user?.role === "host") {
            const hostUser = await User_1.User.findById(hostId);
            if (!hostUser || hostUser.role !== "host") {
                res.status(403).json({ message: "🚫 Host not authorized" });
                return;
            }
        }
        // Validate required fields
        if (!title || !description || !address || !city || !pricePerNight || !checkIn || !checkOut || !guests) {
            res.status(400).json({ message: "❗ Missing required fields" });
            return;
        }
        // Validate pricePerNight and guests
        if (pricePerNight <= 0) {
            res.status(400).json({ message: "❗ Price per night must be greater than zero" });
            return;
        }
        if (guests <= 0) {
            res.status(400).json({ message: "❗ Number of guests must be greater than zero" });
            return;
        }
        // Validate checkIn/checkOut dates
        if (new Date(checkIn).getTime() < Date.now()) {
            res.status(400).json({ message: "❗ Check-in date cannot be in the past" });
            return;
        }
        if (new Date(checkOut).getTime() < Date.now()) {
            res.status(400).json({ message: "❗ Check-out date cannot be in the past" });
            return;
        }
        // Upload property images to Cloudinary
        let imageUrls = [];
        if (req.files && "images" in req.files) {
            const imageFiles = req.files["images"];
            imageUrls = await (0, uploadImagesToCloudinary_1.uploadImagesToCloudinary)(imageFiles);
        }
        // Create and save new property
        const newProperty = new PropertyModel_1.Property({
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
            paymentStatus: paymentStatus || enums_1.PaymentStatus.PENDING,
            paymentDetails: paymentDetails?.trim() || "",
            status: enums_1.PropertyStatus.AVAILABLE,
        });
        await newProperty.save();
        res.status(201).json({
            message: "✅ Property created successfully",
            property: newProperty,
        });
    }
    catch (error) {
        console.error("❌ Error creating property:", error);
        res.status(500).json({ message: "❌ Server error" });
    }
};
exports.createProperty = createProperty;
/**
 * @desc    Get all properties (admin) or host's own properties
 * @route   GET /api/admin/properties
 * @access  Private (admin and host)
 */
const getProperties = async (req, res) => {
    try {
        const hostId = req.query.hostId;
        const isAdmin = req.user?.role === "admin";
        // Validate hostId for admin
        if (!isAdmin && !hostId) {
            res.status(400).json({ message: "❗ Missing hostId for non-admin users" });
            return;
        }
        const properties = isAdmin
            ? await PropertyModel_1.Property.find().populate("host")
            : await PropertyModel_1.Property.find({ host: hostId });
        res.status(200).json({
            message: "✅ Properties retrieved successfully",
            properties,
        });
    }
    catch (error) {
        console.error("❌ Error fetching properties:", error);
        res.status(500).json({ message: "❌ Server error" });
    }
};
exports.getProperties = getProperties;
/**
 * @desc    Update property details, including images
 * @route   PATCH /api/admin/properties/:id
 * @access  Private (admin only)
 */
const updateProperty = async (req, res) => {
    try {
        const { title, description, address, city, pricePerNight, checkIn, checkOut, guests, amenities, paymentStatus, paymentDetails, removedImages, } = req.body;
        const property = await PropertyModel_1.Property.findById(req.params.id);
        if (!property) {
            res.status(404).json({ message: "🚫 Property not found" });
            return;
        }
        // Validate pricePerNight and guests
        if (pricePerNight <= 0) {
            res.status(400).json({ message: "❗ Price per night must be greater than zero" });
            return;
        }
        if (guests <= 0) {
            res.status(400).json({ message: "❗ Number of guests must be greater than zero" });
            return;
        }
        // Update fields if new data is provided
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
        property.paymentDetails = paymentDetails?.trim() || property.paymentDetails;
        // Remove old images from Cloudinary
        if (Array.isArray(removedImages)) {
            for (const imageUrl of removedImages) {
                await (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(imageUrl);
                property.imageUrls = property.imageUrls?.filter((url) => url !== imageUrl) || [];
            }
        }
        // Upload new images to Cloudinary if provided
        if (req.files && "images" in req.files) {
            const imageFiles = req.files["images"];
            const newImageUrls = await (0, uploadImagesToCloudinary_1.uploadImagesToCloudinary)(imageFiles);
            property.imageUrls = [...(property.imageUrls || []), ...newImageUrls];
        }
        await property.save();
        res.status(200).json({
            message: "✅ Property updated successfully",
            property,
        });
    }
    catch (error) {
        console.error("❌ Error updating property:", error);
        res.status(500).json({ message: "❌ Server error" });
    }
};
exports.updateProperty = updateProperty;
/**
 * @desc    Delete a property and remove its images from Cloudinary
 * @route   DELETE /api/admin/properties/:id
 * @access  Private (admin only)
 */
const deleteProperty = async (req, res) => {
    try {
        const property = await PropertyModel_1.Property.findByIdAndDelete(req.params.id);
        if (!property) {
            res.status(404).json({ message: "🚫 Property not found" });
            return;
        }
        // Delete all associated images from Cloudinary
        if (property.imageUrls && property.imageUrls.length > 0) {
            for (const imageUrl of property.imageUrls) {
                await (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(imageUrl);
            }
        }
        res.status(200).json({
            message: "✅ Property deleted successfully",
            propertyId: property._id,
        });
    }
    catch (error) {
        console.error("❌ Error deleting property:", error);
        res.status(500).json({ message: "❌ Server error" });
    }
};
exports.deleteProperty = deleteProperty;
