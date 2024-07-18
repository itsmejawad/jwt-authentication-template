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
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  confirmPassword?: string;
  changedPasswordAt?: Date;
  isActive: boolean;

  isPasswordCorrect(candidatePassword: string, userPassword: string): Promise<boolean>;
  hasChangedPassword(this: IUser, jwtTimestamp: number): boolean;
  generateResetPasswordToken(this: IUser): string;
}
