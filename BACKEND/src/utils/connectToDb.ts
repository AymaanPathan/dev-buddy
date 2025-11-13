import mongoose from "mongoose";

const mongoUri = process.env.MONGO_URI || "";

export const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1); // exit if DB fails to connect
  }
};
