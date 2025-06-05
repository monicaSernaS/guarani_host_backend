import { Request, Response } from 'express';
import { Property } from '../models/PropertyModel';
import { PropertyStatus } from '../@types/express/enums';

/**
 * @desc    Get all properties with status AVAILABLE (public route)
 * @route   GET /properties/public
 * @access  Public
 */
export const getAvailableProperties = async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log('🏠 PROPERTY CONTROLLER CALLED!');
    
    // Ver TODAS las propiedades
    const allProperties = await Property.find({});
    console.log('🔍 Total properties in DB:', allProperties.length);
    
    if (allProperties.length > 0) {
      console.log('📋 First property sample:', {
        id: allProperties[0]._id,
        title: allProperties[0].title, // ✅ Solo title, sin name
        status: allProperties[0].status,
        statusType: typeof allProperties[0].status
      });
      console.log('📊 All property statuses:', allProperties.map(p => p.status));
    }
    
    // Filtro actual
    const availableProperties = await Property.find({ status: 'available' });
    console.log('✅ Properties with status "available":', availableProperties.length);
    
    res.status(200).json({
      message: '✅ Public properties retrieved successfully',
      properties: allProperties, // ⭐ TEMPORAL: devolver TODAS
      debug: {
        total: allProperties.length,
        available: availableProperties.length,
        allStatuses: allProperties.map(p => p.status)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching public properties:', error);
    res.status(500).json({ message: '❌ Server error while fetching public properties' });
  }
};