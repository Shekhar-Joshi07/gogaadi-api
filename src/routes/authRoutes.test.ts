import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError } from "../lib/httpError";

const {
  verifyFirebaseIdTokenMock,
  syncGoogleUserMock,
  updateUserPhoneMock,
} = vi.hoisted(() => ({
  verifyFirebaseIdTokenMock: vi.fn(),
  syncGoogleUserMock: vi.fn(),
  updateUserPhoneMock: vi.fn(),
}));

vi.mock("../services/authService", () => ({
  verifyFirebaseIdToken: verifyFirebaseIdTokenMock,
  syncGoogleUser: syncGoogleUserMock,
  updateUserPhone: updateUserPhoneMock,
}));

import app from "../app";

describe("auth routes", () => {
  beforeEach(() => {
    verifyFirebaseIdTokenMock.mockReset();
    syncGoogleUserMock.mockReset();
    updateUserPhoneMock.mockReset();
  });

  it("returns 401 for an invalid Google auth token", async () => {
    verifyFirebaseIdTokenMock.mockRejectedValue(new HttpError(401, "Invalid or expired Firebase token."));

    const response = await request(app)
      .post("/api/auth/google")
      .send({ idToken: "bad-token" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Invalid or expired Firebase token.",
    });
  });

  it("creates or updates a Google user and reports phone completion state", async () => {
    verifyFirebaseIdTokenMock.mockResolvedValue({
      uid: "firebase-1",
      email: "user@example.com",
    });
    syncGoogleUserMock.mockResolvedValue({
      uid: "firebase-1",
      name: "Go Gaadi",
      email: "user@example.com",
      phone: null,
      photoURL: null,
      authMethod: "google",
      profileComplete: false,
    });

    const response = await request(app)
      .post("/api/auth/google")
      .send({ idToken: "valid-token" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      user: {
        uid: "firebase-1",
        name: "Go Gaadi",
        email: "user@example.com",
        phone: null,
        photoURL: null,
        authMethod: "google",
        profileComplete: false,
      },
      needsPhone: true,
    });
  });

  it("requires a bearer token for phone updates", async () => {
    const response = await request(app)
      .patch("/api/users/me/phone")
      .send({ phone: "+919999999999" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Missing Firebase bearer token.",
    });
  });

  it("updates the authenticated user's phone number", async () => {
    verifyFirebaseIdTokenMock.mockResolvedValue({
      uid: "firebase-1",
      email: "user@example.com",
    });
    updateUserPhoneMock.mockResolvedValue({
      uid: "firebase-1",
      name: "Go Gaadi",
      email: "user@example.com",
      phone: "+919999999999",
      photoURL: null,
      authMethod: "google",
      profileComplete: true,
    });

    const response = await request(app)
      .patch("/api/users/me/phone")
      .set("Authorization", "Bearer valid-token")
      .send({ phone: "+919999999999" });

    expect(response.status).toBe(200);
    expect(updateUserPhoneMock).toHaveBeenCalledWith("firebase-1", "+919999999999");
    expect(response.body).toEqual({
      user: {
        uid: "firebase-1",
        name: "Go Gaadi",
        email: "user@example.com",
        phone: "+919999999999",
        photoURL: null,
        authMethod: "google",
        profileComplete: true,
      },
      needsPhone: false,
    });
  });
});
