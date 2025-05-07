import express from 'express';
import { createHost, getAllHosts } from '../controllers/adminController';
import { protect } from '../middlewares/protect';
import { checkRole } from '../middlewares/checkRole';


const router = express.Router();

router.post('/create-host', protect, checkRole('admin'), createHost);
router.get('/hosts', protect, checkRole('admin'), getAllHosts);

export default router;
