import mongoose, { Document, Schema } from "mongoose";
import * as Yup from "yup";
import { USER_MODEL_NAME } from "./user.model";

export const PROPERTY_MODEL_NAME = "Property";

// ─── Yup Validation ───────────────────────────────────────────────────────────

export const propertyDTO = Yup.object({
  name: Yup.string().required(),
  address: Yup.string().required(),
  city: Yup.string().required(),
  wifi_password: Yup.string().optional(),
  phone: Yup.string().required(),
  rules: Yup.string().optional(),
  total_rooms: Yup.number().required().min(1),
});

export type TypeProperty = Yup.InferType<typeof propertyDTO>;

// ─── Mongoose Interface ───────────────────────────────────────────────────────

export interface IProperty extends Document {
  owner_id: mongoose.Types.ObjectId;
  name: string;
  address: string;
  city: string;
  wifi_password?: string;
  phone: string;
  rules?: string;
  total_rooms: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Mongoose Schema ──────────────────────────────────────────────────────────

const PropertySchema = new Schema<IProperty>(
  {
    owner_id: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true, index: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    phone: { type: String, required: true },
    wifi_password: { type: String },
    rules: { type: String },
    total_rooms: { type: Number, required: true, min: 1 },
  },
  { timestamps: true },
);

const PropertyModel = mongoose.model<IProperty>(PROPERTY_MODEL_NAME, PropertySchema);

export default PropertyModel;
