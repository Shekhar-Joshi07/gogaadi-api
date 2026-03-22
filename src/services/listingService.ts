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
  latitude?: string | number;
  longitude?: string | number;
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
  latitude: number | null;
  longitude: number | null;
  rallySuitability: string[];
  imageUrls: string[];
  status: "pending" | "active" | "archived";
  distanceKm?: number;
  createdAt: string;
  updatedAt: string;
}

interface AggregatedNearbyListing {
  _id: string;
  ownerUid: string;
  vehicleName: string;
  brand: string;
  city: string;
  description: string;
  pricePerDay: number;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  rallySuitability?: string[];
  imageUrls?: string[];
  status: "pending" | "active" | "archived";
  distanceMeters: number;
  createdAt: Date;
  updatedAt: Date;
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

const getListingCoordinates = (listing: { location?: { coordinates?: number[] | null } | null }) => {
  const longitude = listing.location?.coordinates?.[0];
  const latitude = listing.location?.coordinates?.[1];

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return { latitude: null, longitude: null };
  }

  return { latitude, longitude };
};

const parseCoordinate = (
  value: string | number | undefined,
  fieldName: "latitude" | "longitude",
  min: number,
  max: number,
) => {
  const parsedValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < min || parsedValue > max) {
    throw new HttpError(400, `${fieldName} must be a valid number between ${min} and ${max}.`);
  }

  return parsedValue;
};

export const serializeListing = (listing: ListingDocument): ListingPayload => {
  const { latitude, longitude } = getListingCoordinates(listing);

  return {
    id: listing._id.toString(),
    ownerUid: listing.ownerUid,
    vehicleName: listing.vehicleName,
    brand: listing.brand,
    city: listing.city,
    description: listing.description,
    pricePerDay: listing.pricePerDay,
    latitude,
    longitude,
    rallySuitability: listing.rallySuitability || [],
    imageUrls: listing.imageUrls || [],
    status: listing.status,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
  };
};

export const createListing = async (input: ListingInput, images: UploadedListingImage[]) => {
  const ownerUid = normalizeString(input.ownerUid);
  const vehicleName = normalizeString(input.vehicleName);
  const brand = normalizeString(input.brand);
  const city = normalizeString(input.city);
  const description = normalizeString(input.description);
  const latitude = parseCoordinate(input.latitude, "latitude", -90, 90);
  const longitude = parseCoordinate(input.longitude, "longitude", -180, 180);
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
    location: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
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

export const getNearbyListings = async (
  latitudeInput: string | number,
  longitudeInput: string | number,
  radiusKmInput: string | number | undefined,
) => {
  const latitude = parseCoordinate(latitudeInput, "latitude", -90, 90);
  const longitude = parseCoordinate(longitudeInput, "longitude", -180, 180);
  const radiusKmValue =
    radiusKmInput === undefined ? 20 : typeof radiusKmInput === "number" ? radiusKmInput : Number(radiusKmInput);

  if (!Number.isFinite(radiusKmValue) || radiusKmValue <= 0) {
    throw new HttpError(400, "radiusKm must be a valid positive number.");
  }

  const listings = await Listing.aggregate<AggregatedNearbyListing>([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        distanceField: "distanceMeters",
        maxDistance: radiusKmValue * 1000,
        spherical: true,
      },
    },
    {
      $sort: {
        distanceMeters: 1,
        createdAt: -1,
      },
    },
  ]);

  return listings.map((listing) => ({
    ...getListingCoordinates(listing),
    id: String(listing._id),
    ownerUid: listing.ownerUid,
    vehicleName: listing.vehicleName,
    brand: listing.brand,
    city: listing.city,
    description: listing.description,
    pricePerDay: listing.pricePerDay,
    rallySuitability: listing.rallySuitability || [],
    imageUrls: listing.imageUrls || [],
    status: listing.status,
    distanceKm: Number((listing.distanceMeters / 1000).toFixed(1)),
    createdAt: new Date(listing.createdAt).toISOString(),
    updatedAt: new Date(listing.updatedAt).toISOString(),
  }));
};
