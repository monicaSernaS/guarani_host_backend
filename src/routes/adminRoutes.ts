import express from 'express';
import { createHost } from '../controllers/adminController';
import { protect } from '../middlewares/protect';
import { checkRole } from '../middlewares/checkRole';

const router = express.Router();

router.post('/create-host', protect, checkRole('admin'), createHost);

export default router;
