import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

const bookingSchema = new Schema(
  {
    bookerUid: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    listingId: {
      type: String,
      default: null,
      trim: true,
    },
    vehicleId: {
      type: String,
      default: null,
      trim: true,
    },
    vehicleName: {
      type: String,
      required: true,
      trim: true,
    },
    vehicleImage: {
      type: String,
      default: null,
      trim: true,
    },
    city: {
      type: String,
      default: null,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    pickupLocation: {
      type: String,
      required: true,
      trim: true,
    },
    dropoffLocation: {
      type: String,
      required: true,
      trim: true,
    },
    pricePerDay: {
      type: Number,
      required: true,
      min: 1,
    },
    days: {
      type: Number,
      required: true,
      min: 1,
    },
    serviceFee: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      default: "confirmed",
      enum: ["confirmed", "cancelled"],
    },
  },
  {
    timestamps: true,
  },
);

export type Booking = InferSchemaType<typeof bookingSchema>;
export type BookingDocument = HydratedDocument<Booking>;

const BookingModel = models.Booking || model<Booking>("Booking", bookingSchema);

export default BookingModel;
