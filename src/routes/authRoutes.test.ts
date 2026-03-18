import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  syncGoogleUserMock,
  updateUserPhoneMock,
  getUserProfileByUidMock,
} = vi.hoisted(() => ({
  syncGoogleUserMock: vi.fn(),
  updateUserPhoneMock: vi.fn(),
  getUserProfileByUidMock: vi.fn(),
}));

vi.mock("../services/authService", () => ({
  syncGoogleUser: syncGoogleUserMock,
  updateUserPhone: updateUserPhoneMock,
  getUserProfileByUid: getUserProfileByUidMock,
}));

import app from "../app";

const sampleSerializedUser = {
  uid: "firebase-1",
  name: "Go Gaadi",
  email: "user@example.com",
  phone: null,
  photoURL: null,
  listings: ["listing-1"],
  bookings: ["booking-1"],
  lastLoginAt: "2026-03-18T00:00:00.000Z",
  createdAt: "2026-03-18T00:00:00.000Z",
  updatedAt: "2026-03-18T00:00:00.000Z",
  authMethod: "google",
  profileComplete: false,
};

describe("auth routes", () => {
  beforeEach(() => {
    syncGoogleUserMock.mockReset();
    updateUserPhoneMock.mockReset();
    getUserProfileByUidMock.mockReset();
  });

  it("requires a Google user payload for sync", async () => {
    const response = await request(app)
      .post("/api/auth/google")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "user is required.",
    });
  });

  it("creates or updates a Google user and reports phone completion state", async () => {
    syncGoogleUserMock.mockResolvedValue(sampleSerializedUser);

    const response = await request(app)
      .post("/api/auth/google")
      .send({
        user: {
          uid: "firebase-1",
          name: "Go Gaadi",
          email: "user@example.com",
          photoURL: null,
        },
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      user: sampleSerializedUser,
      needsPhone: true,
    });
  });

  it("returns the saved user profile by uid", async () => {
    getUserProfileByUidMock.mockResolvedValue(sampleSerializedUser);

    const response = await request(app)
      .get("/api/users/firebase-1");

    expect(response.status).toBe(200);
    expect(getUserProfileByUidMock).toHaveBeenCalledWith("firebase-1");
    expect(response.body).toEqual({
      user: sampleSerializedUser,
    });
  });

  it("requires a uid for phone updates", async () => {
    const response = await request(app)
      .patch("/api/users/phone")
      .send({ phone: "+919999999999" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "uid is required.",
    });
  });

  it("updates the Google user's phone number", async () => {
    updateUserPhoneMock.mockResolvedValue({
      ...sampleSerializedUser,
      phone: "+919999999999",
      profileComplete: true,
    });

    const response = await request(app)
      .patch("/api/users/phone")
      .send({ uid: "firebase-1", phone: "+919999999999" });

    expect(response.status).toBe(200);
    expect(updateUserPhoneMock).toHaveBeenCalledWith("firebase-1", "+919999999999");
    expect(response.body).toEqual({
      user: {
        ...sampleSerializedUser,
        phone: "+919999999999",
        profileComplete: true,
      },
      needsPhone: false,
    });
  });
});
