import { model, Schema } from "mongoose";
import { IUser } from "../interfaces/IUser";

const userSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is a required field"],
    },
    email: {
      type: String,
      required: [true, "Email is a required field"],
      unique: true,
      lowercase: true,
      // TODO: Validate email formate
    },
    photo: String,
    password: {
      type: String,
      required: [true, "Password is a required field"],
      minLength: [8, "Password length must be 8 characters or more"],
      maxLength: [64, "Password length must be 64 characters or less"],
    },
    confirmPassword: {
      type: String,
      required: [true, "Confirm Password is a required field"],
      minLength: [8, "Password length must be 8 characters or more"],
      maxLength: [64, "Password length must be 64 characters or less"],
    },
  },
  {}
);

const User = model<IUser>("User", userSchema);

export default User;
