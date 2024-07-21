import { Document } from 'mongoose';

export enum UserRole {
  Admin = 'Admin',
  User = 'User',
  Supplier = 'Worker',
}
export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  password: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  confirmPassword?: string;
  changedPasswordAt?: Date;
  isActive: boolean;
  createdAt: Date;

  isPasswordCorrect(candidatePassword: string, userPassword: string): Promise<boolean>;
  hasChangedPassword(this: IUser, jwtTimestamp: number): boolean;
  generateResetPasswordToken(this: IUser): string;
}
