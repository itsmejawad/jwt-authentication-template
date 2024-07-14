import { Document } from 'mongoose';

export interface IUser extends Document {
  _id?: string;
  name: string;
  email: string;
  photo?: string;
  password: string;
  confirmPassword?: string;
  changedPasswordAt?: Date;
  isPasswordCorrect(candidatePassword: string, userPassword: string): Promise<boolean>;
  hasChangedPassword(jwtTimestamp: number): boolean;
}
