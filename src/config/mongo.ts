import mongoose from "mongoose";

export const connectToMongo = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Missing required environment variable: MONGODB_URI");
  }

  await mongoose.connect(uri);
};
