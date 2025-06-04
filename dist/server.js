"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
// Define the port from environment variables or fallback to 4000
const PORT = process.env.PORT || 4000;
/**
 * Bootstraps the application.
 * Connects to MongoDB and starts the Express server.
 */
const startServer = async () => {
    try {
        // Connect to MongoDB database
        await (0, db_1.connectDB)();
        // Start Express server after successful DB connection
        app_1.default.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        // Log and exit in case of any startup error
        console.error("❌ Failed to start the server:", error);
        process.exit(1);
    }
};
// Run the server
startServer();
