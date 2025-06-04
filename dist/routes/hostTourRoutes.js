"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const protect_1 = require("../middlewares/protect");
const checkRole_1 = require("../middlewares/checkRole");
const multerConfig_1 = require("../config/multerConfig");
const hostTourController_1 = require("../controllers/hostTourController");
const router = express_1.default.Router();
router.get('/tours', protect_1.protect, (0, checkRole_1.checkRole)('host'), hostTourController_1.getHostTours);
router.post('/tours', protect_1.protect, (0, checkRole_1.checkRole)('host'), multerConfig_1.upload.fields([{ name: 'images', maxCount: 10 }]), hostTourController_1.createHostTour);
router.patch('/tours/:id', protect_1.protect, (0, checkRole_1.checkRole)('host'), multerConfig_1.upload.fields([{ name: 'images', maxCount: 10 }]), hostTourController_1.updateHostTour);
router.delete('/tours/:id', protect_1.protect, (0, checkRole_1.checkRole)('host'), hostTourController_1.deleteHostTour);
exports.default = router;
