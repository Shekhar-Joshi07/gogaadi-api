import type { Request, Response } from "express";

import {
  createListing,
  getAllListings,
  getListingById,
  getListingsByOwner,
  type ListingInput,
  type UploadedListingImage,
} from "../services/listingService";

const getUploadedImages = (req: Request) =>
  (Array.isArray(req.files) ? req.files : []) as Express.Multer.File[];

const readRouteParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] || "" : value || "";

export const createListingHandler = async (req: Request, res: Response) => {
  const listing = await createListing(
    req.body as ListingInput,
    getUploadedImages(req).map(
      (file) =>
        ({
          filename: file.filename,
        }) satisfies UploadedListingImage,
    ),
  );

  res.status(201).json({ listing });
};

export const getListingByIdHandler = async (req: Request, res: Response) => {
  const listing = await getListingById(readRouteParam(req.params.id));
  res.status(200).json({ listing });
};

export const getListingsByOwnerHandler = async (req: Request, res: Response) => {
  const listings = await getListingsByOwner(readRouteParam(req.params.uid));
  res.status(200).json({ listings });
};

export const getAllListingsHandler = async (_req: Request, res: Response) => {
  const listings = await getAllListings();
  res.status(200).json({ listings });
};
