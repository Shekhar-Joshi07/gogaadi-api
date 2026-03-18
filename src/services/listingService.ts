import Listing, { type ListingDocument } from "../models/Listing";
import User from "../models/User";
import { HttpError } from "../lib/httpError";

export interface UploadedListingImage {
  filename: string;
}

export interface ListingInput {
  ownerUid?: string;
  vehicleName?: string;
  brand?: string;
  city?: string;
  description?: string;
  pricePerDay?: string | number;
  rallySuitability?: string[] | string;
}

export interface ListingPayload {
  id: string;
  ownerUid: string;
  vehicleName: string;
  brand: string;
  city: string;
  description: string;
  pricePerDay: number;
  rallySuitability: string[];
  imageUrls: string[];
  status: "pending" | "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

const normalizeString = (value?: string | null) => value?.trim() || "";

const parsePricePerDay = (value?: string | number) => {
  const parsedValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new HttpError(400, "pricePerDay must be a valid positive number.");
  }

  return parsedValue;
};

const normalizeRallySuitability = (value?: string[] | string) => {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

export const serializeListing = (listing: ListingDocument): ListingPayload => ({
  id: listing._id.toString(),
  ownerUid: listing.ownerUid,
  vehicleName: listing.vehicleName,
  brand: listing.brand,
  city: listing.city,
  description: listing.description,
  pricePerDay: listing.pricePerDay,
  rallySuitability: listing.rallySuitability || [],
  imageUrls: listing.imageUrls || [],
  status: listing.status,
  createdAt: listing.createdAt.toISOString(),
  updatedAt: listing.updatedAt.toISOString(),
});

export const createListing = async (input: ListingInput, images: UploadedListingImage[]) => {
  const ownerUid = normalizeString(input.ownerUid);
  const vehicleName = normalizeString(input.vehicleName);
  const brand = normalizeString(input.brand);
  const city = normalizeString(input.city);
  const description = normalizeString(input.description);
  const rallySuitability = normalizeRallySuitability(input.rallySuitability);

  if (!ownerUid) {
    throw new HttpError(400, "ownerUid is required.");
  }

  if (!vehicleName) {
    throw new HttpError(400, "vehicleName is required.");
  }

  if (!brand) {
    throw new HttpError(400, "brand is required.");
  }

  if (!city) {
    throw new HttpError(400, "city is required.");
  }

  if (!description) {
    throw new HttpError(400, "description is required.");
  }

  if (!images.length) {
    throw new HttpError(400, "At least one vehicle image is required.");
  }

  if (images.length > 4) {
    throw new HttpError(400, "You can upload a maximum of 4 vehicle images.");
  }

  const owner = await User.findOne({ firebaseUid: ownerUid });

  if (!owner) {
    throw new HttpError(404, "Listing owner was not found.");
  }

  const listing = await Listing.create({
    ownerUid,
    vehicleName,
    brand,
    city,
    description,
    pricePerDay: parsePricePerDay(input.pricePerDay),
    rallySuitability,
    imageUrls: images.map((image) => `/public/uploads/listings/${image.filename}`),
  });

  await User.findOneAndUpdate(
    { firebaseUid: ownerUid },
    {
      $push: {
        listings: listing._id.toString(),
      },
    },
  );

  return serializeListing(listing);
};

export const getListingById = async (listingId: string) => {
  const normalizedListingId = normalizeString(listingId);

  if (!normalizedListingId) {
    throw new HttpError(400, "listingId is required.");
  }

  const listing = await Listing.findById(normalizedListingId);

  if (!listing) {
    throw new HttpError(404, "Listing was not found.");
  }

  return serializeListing(listing);
};

export const getListingsByOwner = async (ownerUid: string) => {
  const normalizedOwnerUid = normalizeString(ownerUid);

  if (!normalizedOwnerUid) {
    throw new HttpError(400, "ownerUid is required.");
  }

  const listings = await Listing.find({ ownerUid: normalizedOwnerUid }).sort({ createdAt: -1 });

  return listings.map(serializeListing);
};

export const getAllListings = async () => {
  const listings = await Listing.find().sort({ createdAt: -1 });
  return listings.map(serializeListing);
};
