"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const publicPropertyController_1 = require("../controllers/publicPropertyController");
const router = express_1.default.Router();
// Public endpoint to get all available properties
router.get('/public', publicPropertyController_1.getAvailableProperties);
exports.default = router;
