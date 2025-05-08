import app from "./app";
import { connectDB } from "./config/db";

const PORT = process.env.PORT || 4000;

/**
 * Starts the Express server after successfully connecting to the database.
 */
const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start the server:", error);
    process.exit(1);
  }
};

startServer();
