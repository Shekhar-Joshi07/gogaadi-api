import type { DecodedIdToken } from "firebase-admin/auth";

import { getFirebaseAdminAuth } from "../config/firebaseAdmin";
import User, { type UserDocument } from "../models/User";
import { HttpError } from "../lib/httpError";

export interface AuthUser {
  uid: string;
  name: string;
  email: string;
  phone: string | null;
  photoURL: string | null;
  authMethod: "google";
  profileComplete: boolean;
}

const PHONE_PATTERN = /^[+]?[\d\s()-]{10,18}$/;

const getDisplayName = (token: DecodedIdToken) => {
  if (token.name?.trim()) {
    return token.name.trim();
  }

  if (token.email) {
    return token.email.split("@")[0];
  }

  return "Google User";
};

export const serializeUser = (user: UserDocument): AuthUser => ({
  uid: user.firebaseUid,
  name: user.name,
  email: user.email,
  phone: user.phone,
  photoURL: user.photoURL,
  authMethod: "google",
  profileComplete: Boolean(user.phone),
});

export const verifyFirebaseIdToken = async (idToken: string) => {
  if (!idToken?.trim()) {
    throw new HttpError(401, "Firebase ID token is required.");
  }

  try {
    return await getFirebaseAdminAuth().verifyIdToken(idToken);
  } catch {
    throw new HttpError(401, "Invalid or expired Firebase token.");
  }
};

export const syncGoogleUser = async (decodedToken: DecodedIdToken) => {
  if (!decodedToken.uid) {
    throw new HttpError(400, "Token payload is missing a Firebase uid.");
  }

  if (!decodedToken.email) {
    throw new HttpError(400, "Google account email is required.");
  }

  const user = await User.findOneAndUpdate(
    { firebaseUid: decodedToken.uid },
    {
      $set: {
        name: getDisplayName(decodedToken),
        email: decodedToken.email.toLowerCase(),
        photoURL: decodedToken.picture ?? null,
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

export const updateUserPhone = async (firebaseUid: string, phone: string) => {
  const normalizedPhone = phone.trim();

  if (!PHONE_PATTERN.test(normalizedPhone)) {
    throw new HttpError(400, "Please enter a valid phone number.");
  }

  const user = await User.findOneAndUpdate(
    { firebaseUid },
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
    throw new HttpError(404, "Authenticated user was not found.");
  }

  return serializeUser(user);
};
