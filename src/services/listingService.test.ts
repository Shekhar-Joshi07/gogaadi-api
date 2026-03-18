import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  listingCreateMock,
  listingFindMock,
  listingFindByIdMock,
  userFindOneMock,
  userFindOneAndUpdateMock,
} = vi.hoisted(() => ({
  listingCreateMock: vi.fn(),
  listingFindMock: vi.fn(),
  listingFindByIdMock: vi.fn(),
  userFindOneMock: vi.fn(),
  userFindOneAndUpdateMock: vi.fn(),
}));

vi.mock("../models/Listing", () => ({
  default: {
    create: listingCreateMock,
    find: listingFindMock,
    findById: listingFindByIdMock,
  },
}));

vi.mock("../models/User", () => ({
  default: {
    findOne: userFindOneMock,
    findOneAndUpdate: userFindOneAndUpdateMock,
  },
}));

import {
  createListing,
  getAllListings,
  getListingById,
  getListingsByOwner,
  serializeListing,
} from "./listingService";
import { HttpError } from "../lib/httpError";

const sampleListing = {
  _id: {
    toString: () => "listing-1",
  },
  ownerUid: "firebase-1",
  vehicleName: "Mahindra Thar",
  brand: "Mahindra",
  city: "Jaipur",
  description: "Ready for rally convoys.",
  pricePerDay: 4500,
  rallySuitability: [],
  imageUrls: ["/public/uploads/listings/thar.jpg"],
  status: "pending" as const,
  createdAt: new Date("2026-03-18T00:00:00.000Z"),
  updatedAt: new Date("2026-03-18T00:00:00.000Z"),
};

describe("listingService", () => {
  beforeEach(() => {
    listingCreateMock.mockReset();
    listingFindMock.mockReset();
    listingFindByIdMock.mockReset();
    userFindOneMock.mockReset();
    userFindOneAndUpdateMock.mockReset();
  });

  it("creates a listing and appends its id to the owner's listing summary", async () => {
    userFindOneMock.mockResolvedValue({ firebaseUid: "firebase-1" });
    listingCreateMock.mockResolvedValue(sampleListing);

    const result = await createListing(
      {
        ownerUid: "firebase-1",
        vehicleName: "Mahindra Thar",
        brand: "Mahindra",
        city: "Jaipur",
        description: "Ready for rally convoys.",
        pricePerDay: "4500",
      },
      [{ filename: "thar.jpg" }],
    );

    expect(listingCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerUid: "firebase-1",
        vehicleName: "Mahindra Thar",
        imageUrls: ["/public/uploads/listings/thar.jpg"],
      }),
    );
    expect(userFindOneAndUpdateMock).toHaveBeenCalledWith(
      { firebaseUid: "firebase-1" },
      {
        $push: {
          listings: "listing-1",
        },
      },
    );
    expect(result.id).toBe("listing-1");
  });

  it("rejects listing creation without images", async () => {
    await expect(
      createListing(
        {
          ownerUid: "firebase-1",
          vehicleName: "Mahindra Thar",
          brand: "Mahindra",
          city: "Jaipur",
          description: "Ready for rally convoys.",
          pricePerDay: "4500",
        },
        [],
      ),
    ).rejects.toBeInstanceOf(HttpError);
  });

  it("rejects listing creation with more than 4 images", async () => {
    await expect(
      createListing(
        {
          ownerUid: "firebase-1",
          vehicleName: "Mahindra Thar",
          brand: "Mahindra",
          city: "Jaipur",
          description: "Ready for rally convoys.",
          pricePerDay: "4500",
        },
        [
          { filename: "1.jpg" },
          { filename: "2.jpg" },
          { filename: "3.jpg" },
          { filename: "4.jpg" },
          { filename: "5.jpg" },
        ],
      ),
    ).rejects.toBeInstanceOf(HttpError);
  });

  it("returns a listing by id", async () => {
    listingFindByIdMock.mockResolvedValue(sampleListing);

    const result = await getListingById("listing-1");

    expect(listingFindByIdMock).toHaveBeenCalledWith("listing-1");
    expect(result.vehicleName).toBe("Mahindra Thar");
  });

  it("returns all listings for an owner", async () => {
    const sortMock = vi.fn().mockResolvedValue([sampleListing]);
    listingFindMock.mockReturnValue({ sort: sortMock });

    const result = await getListingsByOwner("firebase-1");

    expect(listingFindMock).toHaveBeenCalledWith({ ownerUid: "firebase-1" });
    expect(result).toHaveLength(1);
  });

  it("serializes a listing document", () => {
    expect(serializeListing(sampleListing as never)).toEqual({
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
    });
  });

  it("returns all listings", async () => {
    const sortMock = vi.fn().mockResolvedValue([sampleListing]);
    listingFindMock.mockReturnValue({ sort: sortMock });

    const result = await getAllListings();

    expect(listingFindMock).toHaveBeenCalledWith();
    expect(result).toHaveLength(1);
  });
});
