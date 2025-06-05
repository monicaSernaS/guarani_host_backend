import { Request, Response } from 'express';
import { TourPackage } from '../models/TourPackageModel';
import { TourPackageStatus } from '../@types/express/enums';

/**
 * @desc Get all available tour packages
 * @route GET /tours/public
 * @access Public
 */
export const getAvailableTourPackages = async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔥 TOUR CONTROLLER CALLED!');
    
    // Ver TODOS los tours
    const allTours = await TourPackage.find({});
    console.log('🔍 Total tours in DB:', allTours.length);
    
    if (allTours.length > 0) {
      console.log('📋 First tour sample:', {
        id: allTours[0]._id,
        title: allTours[0].title,
        status: allTours[0].status,
        statusType: typeof allTours[0].status
      });
    }
    
    // Filtro actual
    const availableTours = await TourPackage.find({ status: 'available' });
    console.log('✅ Tours with status "available":', availableTours.length);
    
    res.status(200).json({
      message: '✅ Public tour packages retrieved successfully',
      tours: allTours, // ⭐ TEMPORAL: devolver TODOS para probar
      debug: {
        total: allTours.length,
        available: availableTours.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching public tour packages:', error);
    res.status(500).json({ message: '❌ Server error while fetching public tour packages' });
  }
};
