import path from "path";

import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createListingMock,
  getAllListingsMock,
  getListingByIdMock,
  getListingsByOwnerMock,
} = vi.hoisted(() => ({
  createListingMock: vi.fn(),
  getAllListingsMock: vi.fn(),
  getListingByIdMock: vi.fn(),
  getListingsByOwnerMock: vi.fn(),
}));

vi.mock("../services/listingService", () => ({
  createListing: createListingMock,
  getAllListings: getAllListingsMock,
  getListingById: getListingByIdMock,
  getListingsByOwner: getListingsByOwnerMock,
}));

import app from "../app";

const sampleListing = {
  id: "listing-1",
  ownerUid: "firebase-1",
  vehicleName: "Mahindra Thar",
  brand: "Mahindra",
  city: "Jaipur",
  description: "Ready for rally convoys.",
  pricePerDay: 4500,
  rallySuitability: [],
  imageUrls: ["/public/uploads/listings/thar.jpg"],
  status: "pending",
  createdAt: "2026-03-18T00:00:00.000Z",
  updatedAt: "2026-03-18T00:00:00.000Z",
};

describe("listing routes", () => {
  beforeEach(() => {
    createListingMock.mockReset();
    getAllListingsMock.mockReset();
    getListingByIdMock.mockReset();
    getListingsByOwnerMock.mockReset();
  });

  it("creates a listing with multipart images", async () => {
    createListingMock.mockResolvedValue(sampleListing);

    const response = await request(app)
      .post("/api/listings")
      .field("ownerUid", "firebase-1")
      .field("vehicleName", "Mahindra Thar")
      .field("brand", "Mahindra")
      .field("city", "Jaipur")
      .field("description", "Ready for rally convoys.")
      .field("pricePerDay", "4500")
      .attach("images", path.resolve(__dirname, "./fixtures/test-image.png"));

    expect(response.status).toBe(201);
    expect(createListingMock).toHaveBeenCalled();
    expect(response.body).toEqual({ listing: sampleListing });
  });

  it("returns all listings", async () => {
    getAllListingsMock.mockResolvedValue([sampleListing]);

    const response = await request(app).get("/api/listings");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ listings: [sampleListing] });
  });

  it("returns listings for one owner", async () => {
    getListingsByOwnerMock.mockResolvedValue([sampleListing]);

    const response = await request(app).get("/api/listings/owner/firebase-1");

    expect(response.status).toBe(200);
    expect(getListingsByOwnerMock).toHaveBeenCalledWith("firebase-1");
  });
});
