import Booking, { type BookingDocument } from "../models/Booking";
import User from "../models/User";
import { HttpError } from "../lib/httpError";

export interface BookingInput {
  bookerUid?: string;
  listingId?: string | null;
  vehicleId?: string | null;
  vehicleName?: string;
  vehicleImage?: string | null;
  city?: string | null;
  startDate?: string;
  endDate?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  pricePerDay?: string | number;
}

export interface BookingPayload {
  id: string;
  bookerUid: string;
  listingId: string | null;
  vehicleId: string | null;
  vehicleName: string;
  vehicleImage: string | null;
  city: string | null;
  startDate: string;
  endDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  pricePerDay: number;
  days: number;
  serviceFee: number;
  total: number;
  status: "confirmed" | "cancelled";
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

const parseDate = (value?: string, fieldName?: string) => {
  if (!value?.trim()) {
    throw new HttpError(400, `${fieldName} is required.`);
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new HttpError(400, `${fieldName} must be a valid date.`);
  }

  return parsedDate;
};

export const serializeBooking = (booking: BookingDocument): BookingPayload => ({
  id: booking._id.toString(),
  bookerUid: booking.bookerUid,
  listingId: booking.listingId || null,
  vehicleId: booking.vehicleId || null,
  vehicleName: booking.vehicleName,
  vehicleImage: booking.vehicleImage || null,
  city: booking.city || null,
  startDate: booking.startDate.toISOString(),
  endDate: booking.endDate.toISOString(),
  pickupLocation: booking.pickupLocation,
  dropoffLocation: booking.dropoffLocation,
  pricePerDay: booking.pricePerDay,
  days: booking.days,
  serviceFee: booking.serviceFee,
  total: booking.total,
  status: booking.status,
  createdAt: booking.createdAt.toISOString(),
  updatedAt: booking.updatedAt.toISOString(),
});

export const createBooking = async (input: BookingInput) => {
  const bookerUid = normalizeString(input.bookerUid);
  const vehicleName = normalizeString(input.vehicleName);
  const pickupLocation = normalizeString(input.pickupLocation);
  const dropoffLocation = normalizeString(input.dropoffLocation);

  if (!bookerUid) {
    throw new HttpError(400, "bookerUid is required.");
  }

  if (!vehicleName) {
    throw new HttpError(400, "vehicleName is required.");
  }

  if (!pickupLocation) {
    throw new HttpError(400, "pickupLocation is required.");
  }

  if (!dropoffLocation) {
    throw new HttpError(400, "dropoffLocation is required.");
  }

  const booker = await User.findOne({ firebaseUid: bookerUid });

  if (!booker) {
    throw new HttpError(404, "Booking user was not found.");
  }

  const startDate = parseDate(input.startDate, "startDate");
  const endDate = parseDate(input.endDate, "endDate");

  if (endDate < startDate) {
    throw new HttpError(400, "endDate must be after startDate.");
  }

  const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000));
  const pricePerDay = parsePricePerDay(input.pricePerDay);
  const subtotal = pricePerDay * days;
  const serviceFee = Math.round(subtotal * 0.1);
  const total = subtotal + serviceFee;

  const booking = await Booking.create({
    bookerUid,
    listingId: normalizeString(input.listingId ?? undefined) || null,
    vehicleId: normalizeString(input.vehicleId ?? undefined) || null,
    vehicleName,
    vehicleImage: normalizeString(input.vehicleImage ?? undefined) || null,
    city: normalizeString(input.city ?? undefined) || null,
    startDate,
    endDate,
    pickupLocation,
    dropoffLocation,
    pricePerDay,
    days,
    serviceFee,
    total,
  });

  await User.findOneAndUpdate(
    { firebaseUid: bookerUid },
    {
      $push: {
        bookings: booking._id.toString(),
      },
    },
  );

  return serializeBooking(booking);
};

export const getBookingsByUser = async (bookerUid: string) => {
  const normalizedBookerUid = normalizeString(bookerUid);

  if (!normalizedBookerUid) {
    throw new HttpError(400, "bookerUid is required.");
  }

  const bookings = await Booking.find({ bookerUid: normalizedBookerUid }).sort({ createdAt: -1 });

  return bookings.map(serializeBooking);
};

export const getBookingById = async (bookingId: string) => {
  const normalizedBookingId = normalizeString(bookingId);

  if (!normalizedBookingId) {
    throw new HttpError(400, "bookingId is required.");
  }

  const booking = await Booking.findById(normalizedBookingId);

  if (!booking) {
    throw new HttpError(404, "Booking was not found.");
  }

  return serializeBooking(booking);
};
