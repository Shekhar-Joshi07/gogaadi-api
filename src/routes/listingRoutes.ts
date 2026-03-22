import { Router } from "express";

import {
  createListingHandler,
  getAllListingsHandler,
  getListingByIdHandler,
  getListingsByOwnerHandler,
  getNearbyListingsHandler,
} from "../controllers/listingController";
import { listingImagesUpload } from "../middleware/upload";

const listingRoutes = Router();

listingRoutes.get("/", getAllListingsHandler);
listingRoutes.get("/nearby", getNearbyListingsHandler);
listingRoutes.get("/owner/:uid", getListingsByOwnerHandler);
listingRoutes.get("/:id", getListingByIdHandler);
listingRoutes.post("/", listingImagesUpload.array("images", 4), createListingHandler);

export default listingRoutes;
