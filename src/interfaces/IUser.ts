import { Document } from 'mongoose';

export enum UserRole {
  Admin = 'admin',
  User = 'user',
}

export interface IUser extends Document {
  _id?: string;
  name: string;
  email: string;
  photo?: string;
  role: UserRole;
  password: string;
  confirmPassword?: string;
  changedPasswordAt?: Date;
  isPasswordCorrect(candidatePassword: string, userPassword: string): Promise<boolean>;
  hasChangedPassword(jwtTimestamp: number): boolean;
}
