import { Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  photo?: string;
  password: string;
  confirmPassword: string;
}
