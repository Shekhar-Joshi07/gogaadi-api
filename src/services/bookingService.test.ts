import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  bookingCreateMock,
  bookingFindMock,
  bookingFindByIdMock,
  userFindOneMock,
  userFindOneAndUpdateMock,
} = vi.hoisted(() => ({
  bookingCreateMock: vi.fn(),
  bookingFindMock: vi.fn(),
  bookingFindByIdMock: vi.fn(),
  userFindOneMock: vi.fn(),
  userFindOneAndUpdateMock: vi.fn(),
}));

vi.mock("../models/Booking", () => ({
  default: {
    create: bookingCreateMock,
    find: bookingFindMock,
    findById: bookingFindByIdMock,
  },
}));

vi.mock("../models/User", () => ({
  default: {
    findOne: userFindOneMock,
    findOneAndUpdate: userFindOneAndUpdateMock,
  },
}));

import {
  createBooking,
  getBookingById,
  getBookingsByUser,
  serializeBooking,
} from "./bookingService";
import { HttpError } from "../lib/httpError";

const sampleBooking = {
  _id: {
    toString: () => "booking-1",
  },
  bookerUid: "firebase-1",
  listingId: null,
  vehicleId: "vehicle-1",
  vehicleName: "Mahindra Thar",
  vehicleImage: "/images/thar.jpg",
  city: "Jaipur",
  startDate: new Date("2026-03-20T00:00:00.000Z"),
  endDate: new Date("2026-03-22T00:00:00.000Z"),
  pickupLocation: "Civil Lines",
  dropoffLocation: "Ramlila Ground",
  pricePerDay: 4500,
  days: 2,
  serviceFee: 900,
  total: 9900,
  status: "confirmed" as const,
  createdAt: new Date("2026-03-18T00:00:00.000Z"),
  updatedAt: new Date("2026-03-18T00:00:00.000Z"),
};

describe("bookingService", () => {
  beforeEach(() => {
    bookingCreateMock.mockReset();
    bookingFindMock.mockReset();
    bookingFindByIdMock.mockReset();
    userFindOneMock.mockReset();
    userFindOneAndUpdateMock.mockReset();
  });

  it("creates a booking and appends its id to the user's booking summary", async () => {
    userFindOneMock.mockResolvedValue({ firebaseUid: "firebase-1" });
    bookingCreateMock.mockResolvedValue(sampleBooking);

    const result = await createBooking({
      bookerUid: "firebase-1",
      vehicleId: "vehicle-1",
      vehicleName: "Mahindra Thar",
      vehicleImage: "/images/thar.jpg",
      city: "Jaipur",
      startDate: "2026-03-20",
      endDate: "2026-03-22",
      pickupLocation: "Civil Lines",
      dropoffLocation: "Ramlila Ground",
      pricePerDay: 4500,
    });

    expect(bookingCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        vehicleName: "Mahindra Thar",
        days: 2,
        total: 9900,
      }),
    );
    expect(userFindOneAndUpdateMock).toHaveBeenCalledWith(
      { firebaseUid: "firebase-1" },
      {
        $push: {
          bookings: "booking-1",
        },
      },
    );
    expect(result.id).toBe("booking-1");
  });

  it("rejects invalid booking dates", async () => {
    userFindOneMock.mockResolvedValue({ firebaseUid: "firebase-1" });

    await expect(
      createBooking({
        bookerUid: "firebase-1",
        vehicleName: "Mahindra Thar",
        startDate: "2026-03-22",
        endDate: "2026-03-20",
        pickupLocation: "Civil Lines",
        dropoffLocation: "Ramlila Ground",
        pricePerDay: 4500,
      }),
    ).rejects.toBeInstanceOf(HttpError);
  });

  it("returns a booking by id", async () => {
    bookingFindByIdMock.mockResolvedValue(sampleBooking);

    const result = await getBookingById("booking-1");

    expect(bookingFindByIdMock).toHaveBeenCalledWith("booking-1");
    expect(result.vehicleName).toBe("Mahindra Thar");
  });

  it("returns bookings for a user", async () => {
    const sortMock = vi.fn().mockResolvedValue([sampleBooking]);
    bookingFindMock.mockReturnValue({ sort: sortMock });

    const result = await getBookingsByUser("firebase-1");

    expect(bookingFindMock).toHaveBeenCalledWith({ bookerUid: "firebase-1" });
    expect(result).toHaveLength(1);
  });

  it("serializes a booking document", () => {
    expect(serializeBooking(sampleBooking as never)).toEqual({
      id: "booking-1",
      bookerUid: "firebase-1",
      listingId: null,
      vehicleId: "vehicle-1",
      vehicleName: "Mahindra Thar",
      vehicleImage: "/images/thar.jpg",
      city: "Jaipur",
      startDate: "2026-03-20T00:00:00.000Z",
      endDate: "2026-03-22T00:00:00.000Z",
      pickupLocation: "Civil Lines",
      dropoffLocation: "Ramlila Ground",
      pricePerDay: 4500,
      days: 2,
      serviceFee: 900,
      total: 9900,
      status: "confirmed",
      createdAt: "2026-03-18T00:00:00.000Z",
      updatedAt: "2026-03-18T00:00:00.000Z",
    });
  });
});
