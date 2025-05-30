import express from 'express';
import { getAvailableProperties } from '../controllers/publicPropertyController';

const router = express.Router();

// Public endpoint to get all available properties
router.get('/public', getAvailableProperties);

export default router;
