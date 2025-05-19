"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const PORT = process.env.PORT || 4000;
/**
 * Starts the Express server after successfully connecting to the database.
 */
const startServer = async () => {
    try {
        await (0, db_1.connectDB)();
        app_1.default.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error("❌ Failed to start the server:", error);
        process.exit(1);
    }
};
startServer();
