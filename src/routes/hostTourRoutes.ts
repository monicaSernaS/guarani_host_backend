import express from 'express'
import { protect } from '../middlewares/protect'
import { checkRole } from '../middlewares/checkRole'
import { upload } from '../config/multerConfig'
import {
  getHostTours,
  createHostTour,
  updateHostTour,
  deleteHostTour,
} from '../controllers/hostTourController'

const router = express.Router()

router.get('/tours', protect, checkRole('host'), getHostTours)
router.post('/tours', protect, checkRole('host'), upload.fields([{ name: 'images', maxCount: 10 }]), createHostTour)
router.patch('/tours/:id', protect, checkRole('host'), upload.fields([{ name: 'images', maxCount: 10 }]), updateHostTour)
router.delete('/tours/:id', protect, checkRole('host'), deleteHostTour)

export default router
