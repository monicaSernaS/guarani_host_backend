import express from 'express';
import { getAvailableTourPackages } from '../controllers/publicTourController';

const router = express.Router();

router.get('/public', getAvailableTourPackages);

export default router;
