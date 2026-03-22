import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

const listingSchema = new Schema(
  {
    ownerUid: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    vehicleName: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    pricePerDay: {
      type: Number,
      required: true,
      min: 1,
    },
    rallySuitability: {
      type: [String],
      default: [],
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (value: number[]) => Array.isArray(value) && value.length === 2,
          message: "location.coordinates must contain longitude and latitude.",
        },
      },
    },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "active", "archived"],
    },
  },
  {
    timestamps: true,
  },
);

listingSchema.index({ location: "2dsphere" });

export type Listing = InferSchemaType<typeof listingSchema>;
export type ListingDocument = HydratedDocument<Listing>;

const ListingModel = models.Listing || model<Listing>("Listing", listingSchema);

export default ListingModel;
