import app from "../src/app";
import { connectDB } from "./config/db";

// Define the port from environment variables or fallback to 4000
const PORT = process.env.PORT || 4000;

/**
 * Bootstraps the application.
 * Connects to MongoDB and starts the Express server.
 */
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB database
    await connectDB();

    // Start Express server after successful DB connection
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    // Log and exit in case of any startup error
    console.error("❌ Failed to start the server:", error);
    process.exit(1);
  }
};

// Run the server
startServer();

