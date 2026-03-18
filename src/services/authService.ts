import User, { type UserDocument } from "../models/User";
import { HttpError } from "../lib/httpError";

export interface AuthUser {
  uid: string;
  name: string;
  email: string;
  phone: string | null;
  photoURL: string | null;
  listings: string[];
  bookings: string[];
  lastLoginAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  authMethod: "google";
  profileComplete: boolean;
}

export interface GoogleUserProfileInput {
  uid: string;
  name?: string | null;
  email: string;
  photoURL?: string | null;
}

const PHONE_PATTERN = /^\+91\d{10}$/;

const getDisplayName = (profile: GoogleUserProfileInput) => {
  if (profile.name?.trim()) {
    return profile.name.trim();
  }

  if (profile.email) {
    return profile.email.split("@")[0];
  }

  return "Google User";
};

export const serializeUser = (user: UserDocument): AuthUser => ({
  uid: user.firebaseUid,
  name: user.name,
  email: user.email,
  phone: user.phone,
  photoURL: user.photoURL,
  listings: user.listings || [],
  bookings: user.bookings || [],
  lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
  createdAt: user.createdAt ? user.createdAt.toISOString() : null,
  updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null,
  authMethod: "google",
  profileComplete: Boolean(user.phone),
});

export const syncGoogleUser = async (profile: GoogleUserProfileInput) => {
  if (!profile.uid?.trim()) {
    throw new HttpError(400, "Google user uid is required.");
  }

  if (!profile.email?.trim()) {
    throw new HttpError(400, "Google account email is required.");
  }

  const user = await User.findOneAndUpdate(
    { firebaseUid: profile.uid.trim() },
    {
      $set: {
        name: getDisplayName(profile),
        email: profile.email.trim().toLowerCase(),
        photoURL: profile.photoURL?.trim() || null,
        provider: "google",
        lastLoginAt: new Date(),
      },
      $setOnInsert: {
        phone: null,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  if (!user) {
    throw new HttpError(500, "Failed to create or update the user.");
  }

  return serializeUser(user);
};

export const getUserProfileByUid = async (firebaseUid: string) => {
  if (!firebaseUid?.trim()) {
    throw new HttpError(400, "uid is required.");
  }

  const user = await User.findOne({ firebaseUid: firebaseUid.trim() });

  if (!user) {
    throw new HttpError(404, "Google user was not found.");
  }

  return serializeUser(user);
};

export const updateUserPhone = async (firebaseUid: string, phone: string) => {
  if (!firebaseUid?.trim()) {
    throw new HttpError(400, "Google user uid is required.");
  }

  const digitsOnly = phone.replace(/\D/g, "");
  const normalizedPhone =
    digitsOnly.length === 10
      ? `+91${digitsOnly}`
      : digitsOnly.length === 12 && digitsOnly.startsWith("91")
        ? `+${digitsOnly}`
        : phone.trim();

  if (!PHONE_PATTERN.test(normalizedPhone)) {
    throw new HttpError(400, "Please enter a valid 10-digit Indian mobile number.");
  }

  const user = await User.findOneAndUpdate(
    { firebaseUid: firebaseUid.trim() },
    {
      $set: {
        phone: normalizedPhone,
      },
    },
    {
      new: true,
    },
  );

  if (!user) {
    throw new HttpError(404, "Google user was not found.");
  }

  return serializeUser(user);
};
