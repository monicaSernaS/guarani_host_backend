import express from 'express';
import {
  // Hosts
  createHost,
  getAllHosts,
  updateHost,
  deleteHost,
  // Users
  getAllUsers,
  updateUser,
  deleteUser,
} from '../controllers/adminController';
import { protect } from '../middlewares/protect';
import { checkRole } from '../middlewares/checkRole';

const router = express.Router();

// ===================== HOSTS =====================
router.post('/create-host', protect, checkRole('admin'), createHost);
router.get('/hosts', protect, checkRole('admin'), getAllHosts);
router.patch('/hosts/:id', protect, checkRole('admin'), updateHost);
router.delete('/hosts/:id', protect, checkRole('admin'), deleteHost);

// ===================== USERS =====================
router.get('/users', protect, checkRole('admin'), getAllUsers);
router.patch('/users/:id', protect, checkRole('admin'), updateUser);
router.delete('/users/:id', protect, checkRole('admin'), deleteUser);

export default router;
