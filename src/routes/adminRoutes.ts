import express from "express";
import {
  createHost,
  getAllHosts,
  updateHost,
  deleteHost,
  getAllUsers,
  deleteUser,
  updateUser,
} from "../controllers/adminController";
import { protect } from "../middlewares/protect";
import { checkRole } from "../middlewares/checkRole";

const router = express.Router();

router.post("/create-host", protect, checkRole("admin"), createHost);
router.get("/hosts", protect, checkRole("admin"), getAllHosts);
router.patch('/hosts/:id', protect, checkRole('admin'), updateHost);
router.delete('/hosts/:id', protect, checkRole('admin'), deleteHost);

router.get('/users', protect, checkRole('admin'), getAllUsers);
router.delete('/users/:id', protect, checkRole('admin'), deleteUser);
router.patch('/users/:id', protect, checkRole('admin'), updateUser);

export default router;
