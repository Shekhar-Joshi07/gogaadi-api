import { beforeEach, describe, expect, it, vi } from "vitest";

const { findOneAndUpdateMock, findOneMock } = vi.hoisted(() => ({
  findOneAndUpdateMock: vi.fn(),
  findOneMock: vi.fn(),
}));

vi.mock("../models/User", () => ({
  default: {
    findOneAndUpdate: findOneAndUpdateMock,
    findOne: findOneMock,
  },
}));

import {
  getUserProfileByUid,
  serializeUser,
  syncGoogleUser,
  updateUserPhone,
} from "./authService";
import { HttpError } from "../lib/httpError";

const sampleUser = {
  firebaseUid: "firebase-1",
  name: "Go Gaadi",
  email: "user@example.com",
  phone: null,
  photoURL: "https://image.example/avatar.png",
  listings: ["listing-1"],
  bookings: ["booking-1"],
  lastLoginAt: new Date("2026-03-18T00:00:00.000Z"),
  createdAt: new Date("2026-03-18T00:00:00.000Z"),
  updatedAt: new Date("2026-03-18T00:00:00.000Z"),
};

describe("authService", () => {
  beforeEach(() => {
    findOneAndUpdateMock.mockReset();
    findOneMock.mockReset();
  });

  it("upserts a Google user without duplicating the record", async () => {
    findOneAndUpdateMock.mockResolvedValue({
      ...sampleUser,
      phone: null,
      listings: [],
      bookings: [],
    });

    const result = await syncGoogleUser({
      uid: "firebase-1",
      name: "Go Gaadi",
      email: "user@example.com",
      photoURL: "https://image.example/avatar.png",
    });

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
      listings: [],
      bookings: [],
      lastLoginAt: "2026-03-18T00:00:00.000Z",
      createdAt: "2026-03-18T00:00:00.000Z",
      updatedAt: "2026-03-18T00:00:00.000Z",
      authMethod: "google",
      profileComplete: false,
    });
  });

  it("rejects missing Google profile fields", async () => {
    await expect(syncGoogleUser({ uid: "", email: "user@example.com" })).rejects.toBeInstanceOf(HttpError);
    await expect(syncGoogleUser({ uid: "firebase-1", email: "" })).rejects.toBeInstanceOf(HttpError);
  });

  it("returns the saved user profile by uid", async () => {
    findOneMock.mockResolvedValue(sampleUser);

    const result = await getUserProfileByUid("firebase-1");

    expect(findOneMock).toHaveBeenCalledWith({ firebaseUid: "firebase-1" });
    expect(result).toEqual({
      uid: "firebase-1",
      name: "Go Gaadi",
      email: "user@example.com",
      phone: null,
      photoURL: "https://image.example/avatar.png",
      listings: ["listing-1"],
      bookings: ["booking-1"],
      lastLoginAt: "2026-03-18T00:00:00.000Z",
      createdAt: "2026-03-18T00:00:00.000Z",
      updatedAt: "2026-03-18T00:00:00.000Z",
      authMethod: "google",
      profileComplete: false,
    });
  });

  it("updates the phone number only for the matched user", async () => {
    findOneAndUpdateMock.mockResolvedValue({
      ...sampleUser,
      phone: "+919999999999",
    });

    const result = await updateUserPhone("firebase-1", "+919999999999");

    expect(findOneAndUpdateMock).toHaveBeenCalledWith(
      { firebaseUid: "firebase-1" },
      { $set: { phone: "+919999999999" } },
      { new: true },
    );
    expect(result.profileComplete).toBe(true);
  });

  it("rejects a missing uid when updating the phone number", async () => {
    await expect(updateUserPhone("", "+919999999999")).rejects.toBeInstanceOf(HttpError);
  });

  it("rejects invalid Indian mobile numbers", async () => {
    await expect(updateUserPhone("firebase-1", "12345")).rejects.toBeInstanceOf(HttpError);
  });

  it("serializes a Mongo user to the frontend auth shape", () => {
    expect(serializeUser(sampleUser as never)).toEqual({
      uid: "firebase-1",
      name: "Go Gaadi",
      email: "user@example.com",
      phone: null,
      photoURL: "https://image.example/avatar.png",
      listings: ["listing-1"],
      bookings: ["booking-1"],
      lastLoginAt: "2026-03-18T00:00:00.000Z",
      createdAt: "2026-03-18T00:00:00.000Z",
      updatedAt: "2026-03-18T00:00:00.000Z",
      authMethod: "google",
      profileComplete: false,
    });
  });
});
