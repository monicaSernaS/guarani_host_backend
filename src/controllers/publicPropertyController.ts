import { Request, Response } from 'express';
import { Property } from '../models/PropertyModel';
import { PropertyStatus } from '../@types/express/enums'; // ✅ Enum usage for consistency

/**
 * @desc    Get all properties with status AVAILABLE (public route)
 * @route   GET /api/properties/public
 * @access  Public
 */
export const getAvailableProperties = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Query all properties marked as 'available'
    const properties = await Property.find({ status: 'available' })
      .populate('host', 'firstName lastName email') // Include host basic info
      .sort({ createdAt: -1 }); // Newest properties first

    res.status(200).json({
      message: '✅ Public properties retrieved successfully',
      properties,
    });
  } catch (error) {
    console.error('❌ Error fetching public properties:', error);
    res.status(500).json({ message: '❌ Server error while fetching public properties' });
  }
};

