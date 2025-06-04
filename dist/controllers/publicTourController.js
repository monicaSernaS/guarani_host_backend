"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableTourPackages = void 0;
const TourPackageModel_1 = require("../models/TourPackageModel");
const enums_1 = require("../@types/express/enums");
/**
 * @desc Get all available tour packages
 * @route GET /api/tours/public
 * @access Public
 */
const getAvailableTourPackages = async (_req, res) => {
    try {
        const tours = await TourPackageModel_1.TourPackage.find({ status: enums_1.TourPackageStatus.AVAILABLE })
            .populate('host', 'firstName lastName email')
            .sort({ createdAt: -1 });
        res.status(200).json({
            message: '✅ Public tour packages retrieved successfully',
            tours,
        });
    }
    catch (error) {
        console.error('❌ Error fetching public tour packages:', error);
        res.status(500).json({ message: '❌ Server error while fetching public tour packages' });
    }
};
exports.getAvailableTourPackages = getAvailableTourPackages;
