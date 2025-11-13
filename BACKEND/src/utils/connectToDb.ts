import mongoose from "mongoose";

const mongoUri = process.env.MONGO_URI || "";
console.log("MongoDB URI:", mongoUri);

export const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};
