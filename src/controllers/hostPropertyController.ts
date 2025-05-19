import { Request, Response } from 'express';
import { Property } from '../models/PropertyModel';

/**
 * @desc    Host gets all their properties created by authenticated host
 * @route   GET /api/host/properties
 * @access  Private (host only)
 */

export const getHostProperties = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.user?._id;
    const properties = await Property.find({ host: hostId })
    res.status(200).json(properties);
    } catch (error) {
    console.error("❌ Host properties error:", error);
    res.status(500).json({ message: "❌ Server error" });
    }
    }
