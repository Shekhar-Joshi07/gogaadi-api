import type { DecodedIdToken } from "firebase-admin/auth";

import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifyIdTokenMock, findOneAndUpdateMock } = vi.hoisted(() => ({
  verifyIdTokenMock: vi.fn(),
  findOneAndUpdateMock: vi.fn(),
}));

vi.mock("../config/firebaseAdmin", () => ({
  getFirebaseAdminAuth: () => ({
    verifyIdToken: verifyIdTokenMock,
  }),
}));

vi.mock("../models/User", () => ({
  default: {
    findOneAndUpdate: findOneAndUpdateMock,
  },
}));

import {
  serializeUser,
  syncGoogleUser,
  updateUserPhone,
  verifyFirebaseIdToken,
} from "./authService";
import { HttpError } from "../lib/httpError";

describe("authService", () => {
  beforeEach(() => {
    verifyIdTokenMock.mockReset();
    findOneAndUpdateMock.mockReset();
  });

  it("verifies a Firebase id token", async () => {
    const decodedToken = { uid: "firebase-1", email: "user@example.com" } as unknown as DecodedIdToken;
    verifyIdTokenMock.mockResolvedValue(decodedToken);

    await expect(verifyFirebaseIdToken("token-123")).resolves.toEqual(decodedToken);
  });

  it("rejects invalid Firebase tokens", async () => {
    verifyIdTokenMock.mockRejectedValue(new Error("invalid token"));

    await expect(verifyFirebaseIdToken("token-123")).rejects.toBeInstanceOf(HttpError);
  });

  it("upserts a Google user without duplicating the record", async () => {
    findOneAndUpdateMock.mockResolvedValue({
      firebaseUid: "firebase-1",
      name: "Go Gaadi",
      email: "user@example.com",
      phone: null,
      photoURL: "https://image.example/avatar.png",
    });

    const result = await syncGoogleUser({
      uid: "firebase-1",
      name: "Go Gaadi",
      email: "user@example.com",
      picture: "https://image.example/avatar.png",
    } as unknown as DecodedIdToken);

    expect(findOneAndUpdateMock).toHaveBeenCalledWith(
      { firebaseUid: "firebase-1" },
      expect.objectContaining({
        $set: expect.objectContaining({
          name: "Go Gaadi",
          email: "user@example.com",
        }),
        $setOnInsert: { phone: null },
      }),
      expect.objectContaining({
        upsert: true,
        new: true,
      }),
    );
    expect(result).toEqual({
      uid: "firebase-1",
      name: "Go Gaadi",
      email: "user@example.com",
      phone: null,
      photoURL: "https://image.example/avatar.png",
      authMethod: "google",
      profileComplete: false,
    });
  });

  it("updates the phone number only for the matched user", async () => {
    findOneAndUpdateMock.mockResolvedValue({
      firebaseUid: "firebase-1",
      name: "Go Gaadi",
      email: "user@example.com",
      phone: "+919999999999",
      photoURL: null,
    });

    const result = await updateUserPhone("firebase-1", "+919999999999");

    expect(findOneAndUpdateMock).toHaveBeenCalledWith(
      { firebaseUid: "firebase-1" },
      { $set: { phone: "+919999999999" } },
      { new: true },
    );
    expect(result.profileComplete).toBe(true);
  });

  it("serializes a Mongo user to the frontend auth shape", () => {
    expect(
      serializeUser({
        firebaseUid: "firebase-1",
        name: "Go Gaadi",
        email: "user@example.com",
        phone: null,
        photoURL: null,
      } as never),
    ).toEqual({
      uid: "firebase-1",
      name: "Go Gaadi",
      email: "user@example.com",
      phone: null,
      photoURL: null,
      authMethod: "google",
      profileComplete: false,
    });
  });
});
