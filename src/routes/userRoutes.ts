import express from 'express';
import { updateUserProfile } from '../controllers/userController';  
import { protect } from '../middlewares/protect';
import e from 'express';

const router = express.Router();

/**
 * @route PATCH /api/users/profile
 * @des Update user`s own profile
 * @access Private
 */

router.patch('/profile', protect, updateUserProfile);

export default router;