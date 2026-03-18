import { Schema, model, models } from "mongoose";

export interface UserDocument {
  firebaseUid: string;
  name: string;
  email: string;
  phone: string | null;
  photoURL: string | null;
  provider: "google";
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: null,
      trim: true,
    },
    photoURL: {
      type: String,
      default: null,
      trim: true,
    },
    provider: {
      type: String,
      default: "google",
      enum: ["google"],
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const User = models.User || model<UserDocument>("User", userSchema);

export default User;
