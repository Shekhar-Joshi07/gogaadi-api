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

export type Listing = InferSchemaType<typeof listingSchema>;
export type ListingDocument = HydratedDocument<Listing>;

const ListingModel = models.Listing || model<Listing>("Listing", listingSchema);

export default ListingModel;
