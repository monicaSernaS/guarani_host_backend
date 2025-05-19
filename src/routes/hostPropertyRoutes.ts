import express from 'express';
import { protect } from '../middlewares/protect';
import { checkRole } from '../middlewares/checkRole';
import { getHostProperties } from '../controllers/hostPropertyController';

const router = express.Router();

/**
 * @route   GET /api/host/properties
 * @desc    Host gets all their properties created by authenticated host
 * @access  Private (host only)
 */

router.get('/properties', protect, checkRole('host'), getHostProperties );

export default router;