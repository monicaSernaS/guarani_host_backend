"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTourPackage = exports.updateTourPackage = exports.getTourPackages = exports.createTourPackage = void 0;
const uploadImagesToCloudinary_1 = require("../helpers/uploadImagesToCloudinary");
const deleteImageFromCloudinary_1 = require("../helpers/deleteImageFromCloudinary");
const TourPackageModel_1 = require("../models/TourPackageModel");
const enums_1 = require("../@types/express/enums");
/**
 * @desc    Create a new tour package
 * @route   POST /api/admin/tour-packages
 * @access  Private (admin and host)
 */
const createTourPackage = async (req, res) => {
    try {
        const { title, description, price, status, paymentDetails } = req.body;
        const hostId = req.user?._id;
        // Upload images to Cloudinary if provided
        let imageUrls = [];
        if (req.files && "images" in req.files) {
            const imageFiles = req.files["images"];
            imageUrls = await (0, uploadImagesToCloudinary_1.uploadImagesToCloudinary)(imageFiles);
        }
        // Create new tour package
        const newTourPackage = new TourPackageModel_1.TourPackage({
            title,
            description,
            price,
            status,
            imageUrls,
            host: hostId,
            paymentStatus: enums_1.PaymentStatus.PENDING,
            paymentDetails: paymentDetails?.trim() || "",
        });
        await newTourPackage.save();
        res.status(201).json({
            message: "✅ Tour package created successfully",
            tourPackage: newTourPackage,
        });
    }
    catch (error) {
        console.error("❌ Error creating tour package:", error);
        res.status(500).json({ message: "❌ Server error" });
    }
};
exports.createTourPackage = createTourPackage;
/**
 * @desc    Get all tour packages for a specific host or all for admin
 * @route   GET /api/admin/tour-packages
 * @access  Private (admin and host)
 */
const getTourPackages = async (req, res) => {
    try {
        const hostId = req.query.hostId;
        const tourPackages = req.user?.role === "admin"
            ? await TourPackageModel_1.TourPackage.find().populate("host")
            : await TourPackageModel_1.TourPackage.find({ host: hostId });
        res.status(200).json({
            message: "✅ Tour packages retrieved successfully",
            tourPackages,
        });
    }
    catch (error) {
        console.error("❌ Error fetching tour packages:", error);
        res.status(500).json({ message: "❌ Server error" });
    }
};
exports.getTourPackages = getTourPackages;
/**
 * @desc    Update a tour package
 * @route   PATCH /api/admin/tour-packages/:id
 * @access  Private (admin only)
 */
const updateTourPackage = async (req, res) => {
    try {
        const { title, description, price, status, paymentDetails, paymentStatus, } = req.body;
        const tourPackage = await TourPackageModel_1.TourPackage.findById(req.params.id);
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
                await (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(oldUrl);
            }
            const newImageFiles = req.files["images"];
            const newImageUrls = await (0, uploadImagesToCloudinary_1.uploadImagesToCloudinary)(newImageFiles);
            tourPackage.imageUrls = newImageUrls;
        }
        await tourPackage.save();
        res.status(200).json({
            message: "✅ Tour package updated successfully",
            tourPackage,
        });
    }
    catch (error) {
        console.error("❌ Error updating tour package:", error);
        res.status(500).json({ message: "❌ Server error" });
    }
};
exports.updateTourPackage = updateTourPackage;
/**
 * @desc    Delete a tour package and remove its images
 * @route   DELETE /api/admin/tour-packages/:id
 * @access  Private (admin only)
 */
const deleteTourPackage = async (req, res) => {
    try {
        const tourPackage = await TourPackageModel_1.TourPackage.findByIdAndDelete(req.params.id);
        if (!tourPackage) {
            res.status(404).json({ message: "🚫 Tour package not found" });
            return;
        }
        if (tourPackage.imageUrls && tourPackage.imageUrls.length > 0) {
            for (const imageUrl of tourPackage.imageUrls) {
                await (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(imageUrl);
            }
        }
        res.status(200).json({
            message: "✅ Tour package deleted successfully",
            tourPackageId: tourPackage._id,
        });
    }
    catch (error) {
        console.error("❌ Error deleting tour package:", error);
        res.status(500).json({ message: "❌ Server error" });
    }
};
exports.deleteTourPackage = deleteTourPackage;
