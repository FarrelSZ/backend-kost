import mongoose, { Document, Schema } from "mongoose";
import { encrypt } from "../utils/encryption";
import * as Yup from "yup";
import { ROLES } from "../utils/constants";

export const USER_MODEL_NAME = "User";

// ─── Yup Validation ──────────────────────────────────────────────────────────

const validatePassword = Yup.string()
  .required()
  .min(6, "Password must be at least 6 characters")
  .test("at-least-one-uppercase-letter", "Contains at least one uppercase letter", (value) => {
    if (!value) return false;
    return /^(?=.*[A-Z])/.test(value);
  })
  .test("at-least-one-number", "Contains at least one number", (value) => {
    if (!value) return false;
    return /^(?=.*\d)/.test(value);
  });

export const userLoginDTO = Yup.object({
  identifier: Yup.string().required(),
  password: validatePassword,
});

export const userUpdatePasswordDTO = Yup.object({
  oldPassword: validatePassword,
  newPassword: validatePassword,
});

export const userDTO = Yup.object({
  name: Yup.string().required(),
  email: Yup.string().email().required(),
  phone: Yup.string().required(),
  password: validatePassword,
});

export type TypeUser = Yup.InferType<typeof userDTO>;

// ─── Mongoose Interface ───────────────────────────────────────────────────────

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: ROLES;
}

// ─── Mongoose Schema ──────────────────────────────────────────────────────────

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: Object.values(ROLES), required: true, default: ROLES.OWNER },
  },
  { timestamps: true },
);

UserSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await encrypt(this.password);
  }
});

UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

const UserModel = mongoose.model<IUser>(USER_MODEL_NAME, UserSchema);

export default UserModel;
