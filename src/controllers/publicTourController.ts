import { Request, Response } from 'express';
import { TourPackage } from '../models/TourPackageModel';
import { TourPackageStatus } from '../@types/express/enums';

/**
 * @desc Get all available tour packages
 * @route GET /api/tours/public
 * @access Public
 */
export const getAvailableTourPackages = async (_req: Request, res: Response): Promise<void> => {
  try {
    const tours = await TourPackage.find({ status: 'available' })
      .populate('host', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: '✅ Public tour packages retrieved successfully',
      tours,
    });
  } catch (error) {
    console.error('❌ Error fetching public tour packages:', error);
    res.status(500).json({ message: '❌ Server error while fetching public tour packages' });
  }
};
