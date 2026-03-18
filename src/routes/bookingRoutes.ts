import { Router } from "express";

import {
  createBookingHandler,
  getBookingByIdHandler,
  getBookingsByUserHandler,
} from "../controllers/bookingController";

const bookingRoutes = Router();

bookingRoutes.post("/", createBookingHandler);
bookingRoutes.get("/user/:uid", getBookingsByUserHandler);
bookingRoutes.get("/:id", getBookingByIdHandler);

export default bookingRoutes;
