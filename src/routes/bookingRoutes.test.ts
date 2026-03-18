import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createBookingMock,
  getBookingByIdMock,
  getBookingsByUserMock,
} = vi.hoisted(() => ({
  createBookingMock: vi.fn(),
  getBookingByIdMock: vi.fn(),
  getBookingsByUserMock: vi.fn(),
}));

vi.mock("../services/bookingService", () => ({
  createBooking: createBookingMock,
  getBookingById: getBookingByIdMock,
  getBookingsByUser: getBookingsByUserMock,
}));

import app from "../app";

const sampleBooking = {
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
};

describe("booking routes", () => {
  beforeEach(() => {
    createBookingMock.mockReset();
    getBookingByIdMock.mockReset();
    getBookingsByUserMock.mockReset();
  });

  it("creates a booking", async () => {
    createBookingMock.mockResolvedValue(sampleBooking);

    const response = await request(app)
      .post("/api/bookings")
      .send({
        bookerUid: "firebase-1",
        vehicleName: "Mahindra Thar",
        startDate: "2026-03-20",
        endDate: "2026-03-22",
        pickupLocation: "Civil Lines",
        dropoffLocation: "Ramlila Ground",
        pricePerDay: 4500,
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ booking: sampleBooking });
  });

  it("returns bookings for a user", async () => {
    getBookingsByUserMock.mockResolvedValue([sampleBooking]);

    const response = await request(app).get("/api/bookings/user/firebase-1");

    expect(response.status).toBe(200);
    expect(getBookingsByUserMock).toHaveBeenCalledWith("firebase-1");
  });

  it("returns one booking by id", async () => {
    getBookingByIdMock.mockResolvedValue(sampleBooking);

    const response = await request(app).get("/api/bookings/booking-1");

    expect(response.status).toBe(200);
    expect(getBookingByIdMock).toHaveBeenCalledWith("booking-1");
  });
});
