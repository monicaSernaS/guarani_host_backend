import mongoose from "mongoose";

/**
 * Establishes a connection to the MongoDB database using the URI from environment variables.
 * Terminates the process if the connection fails or the URI is missing.
 */
export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  // Ensure URI is defined before attempting to connect
  if (!uri) {
    console.error("❌ MONGODB_URI is not defined in environment variables.");
    process.exit(1);
  }

  try {
    // Attempt to connect to MongoDB
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    // Handle any connection errors
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};
