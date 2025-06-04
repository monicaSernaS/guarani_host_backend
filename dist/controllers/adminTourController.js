"use strict";
// Admin Tour Package Controller - Handles CRUD operations for tour packages
// Accessible by admin users with full permissions over all tour packages
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTourPackage = exports.updateTourPackage = exports.getTourPackages = exports.createTourPackage = void 0;
const TourPackageModel_1 = require("../models/TourPackageModel");
const uploadImagesToCloudinary_1 = require("../helpers/uploadImagesToCloudinary");
const deleteImageFromCloudinary_1 = require("../helpers/deleteImageFromCloudinary");
const enums_1 = require("../@types/express/enums");
// Helper function to safely extract error message
const getErrorMessage = (error) => {
    if (error instanceof Error)
        return error.message;
    if (typeof error === 'string')
        return error;
    return 'Unknown error occurred';
};
// Helper function to check if error is a Mongoose validation error
const isValidationError = (error) => {
    return !!(error &&
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        error.name === 'ValidationError');
};
/**
 * @desc    Create a new tour package (admin/host)
 * @route   POST /api/admin/tour-packages
 * @access  Private (admin and host)
 */
const createTourPackage = async (req, res) => {
    try {
        console.log("🚀 Creating new tour package...");
        console.log("📋 Request body:", req.body);
        console.log("📁 Files received:", req.files);
        // Extract and validate required fields from request body
        const { title, description, price, status, duration, maxCapacity, location, amenities } = req.body;
        if (!title || !description || !price) {
            res.status(400).json({
                message: "❌ Missing required fields: title, description, and price are required"
            });
            return;
        }
        // Handle image files (multer uses upload.fields with "images" field name)
        const files = req.files;
        const imageFiles = files?.images || [];
        if (!imageFiles || imageFiles.length === 0) {
            res.status(400).json({
                message: "❌ At least one image is required to create a tour package"
            });
            return;
        }
        if (imageFiles.length > 10) {
            res.status(400).json({
                message: "❌ Maximum 10 images allowed"
            });
            return;
        }
        // Upload images to Cloudinary using existing helper
        console.log("☁️ Uploading images to Cloudinary...");
        const imageUrls = await (0, uploadImagesToCloudinary_1.uploadImagesToCloudinary)(imageFiles);
        console.log("✅ Images uploaded successfully:", imageUrls.length);
        // Get authenticated user ID from protect middleware
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({
                message: "❌ User not authenticated"
            });
            return;
        }
        // Process amenities if sent as string (from FormData)
        let processedAmenities = [];
        if (amenities) {
            if (typeof amenities === 'string') {
                try {
                    processedAmenities = JSON.parse(amenities);
                }
                catch {
                    processedAmenities = amenities.split(',').map((a) => a.trim()).filter((a) => a.length > 0);
                }
            }
            else if (Array.isArray(amenities)) {
                processedAmenities = amenities;
            }
        }
        // Create new tour package instance
        const newTourPackage = new TourPackageModel_1.TourPackage({
            title: title.trim(),
            description: description.trim(),
            price: parseFloat(price),
            duration: duration ? parseFloat(duration) : undefined,
            maxCapacity: maxCapacity ? parseInt(maxCapacity) : undefined,
            location: location ? location.trim() : undefined,
            amenities: processedAmenities,
            status: status || enums_1.TourPackageStatus.AVAILABLE,
            host: userId,
            imageUrls: imageUrls,
        });
        // Save to database
        const savedTourPackage = await newTourPackage.save();
        console.log("✅ Tour package saved to database:", savedTourPackage._id);
        // Populate host information for response
        await savedTourPackage.populate('host', 'firstName lastName email');
        res.status(201).json({
            message: "✅ Tour package created successfully",
            tourPackage: savedTourPackage,
        });
    }
    catch (error) {
        console.error("❌ Error creating tour package:", error);
        // Handle Mongoose validation errors
        if (isValidationError(error)) {
            const validationErrors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                message: "❌ Validation errors",
                errors: validationErrors
            });
            return;
        }
        // Generic server error
        res.status(500).json({
            message: "❌ Internal server error while creating tour package",
            error: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
        });
    }
};
exports.createTourPackage = createTourPackage;
/**
 * @desc    Get all tour packages with filtering and pagination
 * @route   GET /api/admin/tour-packages
 * @access  Private (admin and host)
 */
const getTourPackages = async (req, res) => {
    try {
        console.log("📋 Fetching tour packages...");
        console.log("👤 User role:", req.user?.role);
        console.log("🆔 User ID:", req.user?._id);
        // Extract query parameters for filtering and pagination
        const { status, host, page = 1, limit = 50, sort = '-createdAt' } = req.query;
        // Build filter object
        const filter = {};
        if (status && typeof status === 'string') {
            filter.status = status;
        }
        if (host && typeof host === 'string') {
            filter.host = host;
        }
        // Role-based filtering: hosts can only see their own tours
        const userRole = req.user?.role;
        const userId = req.user?._id;
        if (userRole === 'host' && userId) {
            filter.host = userId;
            console.log("🏠 Host filter applied - showing only own tours");
        }
        else if (userRole === 'admin') {
            console.log("👑 Admin access - showing all tours");
        }
        // Calculate pagination skip value
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Fetch tour packages with pagination and population
        const tourPackages = await TourPackageModel_1.TourPackage
            .find(filter)
            .populate('host', 'firstName lastName email role')
            .sort(sort)
            .skip(skip)
            .limit(limitNum);
        // Count total documents for pagination metadata
        const total = await TourPackageModel_1.TourPackage.countDocuments(filter);
        console.log(`✅ Found ${tourPackages.length} tour packages (total: ${total})`);
        res.status(200).json({
            message: "✅ Tour packages retrieved successfully",
            tourPackages,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    }
    catch (error) {
        console.error("❌ Error fetching tour packages:", error);
        res.status(500).json({
            message: "❌ Internal server error while fetching tour packages",
            error: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
        });
    }
};
exports.getTourPackages = getTourPackages;
/**
 * @desc    Update existing tour package
 * @route   PATCH /api/admin/tour-packages/:id
 * @access  Private (admin only)
 */
const updateTourPackage = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("🔄 Updating tour package:", id);
        console.log("📋 Update data:", req.body);
        console.log("👤 User role:", req.user?.role);
        // Validate MongoDB ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            res.status(400).json({
                message: "❌ Invalid tour package ID format"
            });
            return;
        }
        // Find existing tour package
        const existingTourPackage = await TourPackageModel_1.TourPackage.findById(id);
        if (!existingTourPackage) {
            res.status(404).json({
                message: "❌ Tour package not found"
            });
            return;
        }
        // Check permissions (admin only can update according to routes)
        const userRole = req.user?.role;
        if (userRole !== 'admin') {
            res.status(403).json({
                message: "❌ Only administrators can update tour packages"
            });
            return;
        }
        // Extract update fields from request body
        const { title, description, price, duration, maxCapacity, location, amenities, status } = req.body;
        // Prepare update data object
        const updateData = {};
        if (title !== undefined)
            updateData.title = title.trim();
        if (description !== undefined)
            updateData.description = description.trim();
        if (price !== undefined)
            updateData.price = parseFloat(price);
        if (duration !== undefined)
            updateData.duration = duration ? parseFloat(duration) : undefined;
        if (maxCapacity !== undefined)
            updateData.maxCapacity = maxCapacity ? parseInt(maxCapacity) : undefined;
        if (location !== undefined)
            updateData.location = location ? location.trim() : undefined;
        if (status !== undefined)
            updateData.status = status;
        // Process amenities if provided
        if (amenities !== undefined) {
            let processedAmenities = [];
            if (typeof amenities === 'string') {
                try {
                    processedAmenities = JSON.parse(amenities);
                }
                catch {
                    processedAmenities = amenities.split(',').map((a) => a.trim()).filter((a) => a.length > 0);
                }
            }
            else if (Array.isArray(amenities)) {
                processedAmenities = amenities;
            }
            updateData.amenities = processedAmenities;
        }
        // Handle new images if uploaded
        const files = req.files;
        const imageFiles = files?.images || [];
        if (imageFiles && imageFiles.length > 0) {
            console.log("🖼️ Processing new images...");
            if (imageFiles.length > 10) {
                res.status(400).json({
                    message: "❌ Maximum 10 images allowed"
                });
                return;
            }
            // Delete old images from Cloudinary
            if (existingTourPackage.imageUrls && existingTourPackage.imageUrls.length > 0) {
                console.log("🗑️ Deleting old images from Cloudinary...");
                for (const imageUrl of existingTourPackage.imageUrls) {
                    try {
                        await (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(imageUrl);
                    }
                    catch (deleteError) {
                        console.warn("⚠️ Could not delete old image:", imageUrl, deleteError);
                    }
                }
            }
            // Upload new images using existing helper
            const newImageUrls = await (0, uploadImagesToCloudinary_1.uploadImagesToCloudinary)(imageFiles);
            updateData.imageUrls = newImageUrls;
            console.log("✅ New images uploaded:", newImageUrls.length);
        }
        // Update document in database
        const updatedTourPackage = await TourPackageModel_1.TourPackage
            .findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        })
            .populate('host', 'firstName lastName email');
        console.log("✅ Tour package updated successfully");
        res.status(200).json({
            message: "✅ Tour package updated successfully",
            tourPackage: updatedTourPackage,
        });
    }
    catch (error) {
        console.error("❌ Error updating tour package:", error);
        // Handle Mongoose validation errors
        if (isValidationError(error)) {
            const validationErrors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                message: "❌ Validation errors",
                errors: validationErrors
            });
            return;
        }
        // Generic server error
        res.status(500).json({
            message: "❌ Internal server error while updating tour package",
            error: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
        });
    }
};
exports.updateTourPackage = updateTourPackage;
/**
 * @desc    Delete tour package and associated images
 * @route   DELETE /api/admin/tour-packages/:id
 * @access  Private (admin only)
 */
const deleteTourPackage = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("🗑️ Deleting tour package:", id);
        console.log("👤 User role:", req.user?.role);
        // Validate MongoDB ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            res.status(400).json({
                message: "❌ Invalid tour package ID format"
            });
            return;
        }
        // Find existing tour package
        const existingTourPackage = await TourPackageModel_1.TourPackage.findById(id);
        if (!existingTourPackage) {
            res.status(404).json({
                message: "❌ Tour package not found"
            });
            return;
        }
        // Check permissions (admin only can delete according to routes)
        const userRole = req.user?.role;
        if (userRole !== 'admin') {
            res.status(403).json({
                message: "❌ Only administrators can delete tour packages"
            });
            return;
        }
        // Delete images from Cloudinary using existing helper
        if (existingTourPackage.imageUrls && existingTourPackage.imageUrls.length > 0) {
            console.log("🖼️ Deleting images from Cloudinary...");
            for (const imageUrl of existingTourPackage.imageUrls) {
                try {
                    await (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(imageUrl);
                }
                catch (deleteError) {
                    console.warn("⚠️ Could not delete image:", imageUrl, deleteError);
                }
            }
        }
        // Delete document from database
        await TourPackageModel_1.TourPackage.findByIdAndDelete(id);
        console.log("✅ Tour package deleted successfully");
        res.status(200).json({
            message: "✅ Tour package deleted successfully",
            deletedId: id,
        });
    }
    catch (error) {
        console.error("❌ Error deleting tour package:", error);
        res.status(500).json({
            message: "❌ Internal server error while deleting tour package",
            error: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
        });
    }
};
exports.deleteTourPackage = deleteTourPackage;
