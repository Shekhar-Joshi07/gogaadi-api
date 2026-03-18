import type { Request, Response } from "express";

import {
  createBooking,
  getBookingById,
  getBookingsByUser,
  type BookingInput,
} from "../services/bookingService";

const readRouteParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] || "" : value || "";

export const createBookingHandler = async (req: Request, res: Response) => {
  const booking = await createBooking(req.body as BookingInput);
  res.status(201).json({ booking });
};

export const getBookingByIdHandler = async (req: Request, res: Response) => {
  const booking = await getBookingById(readRouteParam(req.params.id));
  res.status(200).json({ booking });
};

export const getBookingsByUserHandler = async (req: Request, res: Response) => {
  const bookings = await getBookingsByUser(readRouteParam(req.params.uid));
  res.status(200).json({ bookings });
};
