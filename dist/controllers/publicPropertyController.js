"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableProperties = void 0;
const PropertyModel_1 = require("../models/PropertyModel");
const enums_1 = require("../@types/express/enums"); // ✅ Enum usage for consistency
/**
 * @desc    Get all properties with status AVAILABLE (public route)
 * @route   GET /api/properties/public
 * @access  Public
 */
const getAvailableProperties = async (_req, res) => {
    try {
        // Query all properties marked as 'available'
        const properties = await PropertyModel_1.Property.find({ status: enums_1.PropertyStatus.AVAILABLE })
            .populate('host', 'firstName lastName email') // Include host basic info
            .sort({ createdAt: -1 }); // Newest properties first
        res.status(200).json({
            message: '✅ Public properties retrieved successfully',
            properties,
        });
    }
    catch (error) {
        console.error('❌ Error fetching public properties:', error);
        res.status(500).json({ message: '❌ Server error while fetching public properties' });
    }
};
exports.getAvailableProperties = getAvailableProperties;
