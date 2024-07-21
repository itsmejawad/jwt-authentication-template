import { model, Query, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import { IUser, UserRole } from '../interfaces/IUser';
import cryptoHash from '../utils/cryptoHash';

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is a required field.'],
      minLength: [1, 'Name must be 1 character or more.'],
      maxLength: [124, 'Name must be 124 characters or less.'],
    },
    email: {
      type: String,
      required: [true, 'Email is a required field.'],
      unique: true,
      lowercase: true,
      validate: {
        validator: function (email: string) {
          const re = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
          return re.test(email);
        },
        message: 'Invalid email format.',
      },
    },
    role: {
      type: String,
      enum: UserRole,
      default: UserRole.User,
    },
    password: {
      type: String,
      required: [true, 'Password is a required field.'],
      minLength: [8, 'Password length must be 8 characters or more.'],
      maxLength: [64, 'Password length must be 64 characters or less.'],
      select: false,
    },
    confirmPassword: {
      type: String,
      required: [true, 'Confirm Password is a required field.'],
      minLength: [8, 'Password length must be 8 characters or more.'],
      maxLength: [64, 'Password length must be 64 characters or less.'],
      validate: {
        validator: function (this: IUser, confirmPassword: string) {
          return this.password === confirmPassword;
        },
        message: 'Passwords are not the same.',
      },
      select: false,
    },
    changedPasswordAt: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  { discriminatorKey: 'role', versionKey: false }
);

// "save" will only be executed when we use .save() or .create()
userSchema.pre<IUser>(
  'save',
  async function (this: IUser, next: (err?: Error) => void): Promise<void> {
    //  This will ensure that the code will only run if the password has been modified.
    if (!this.isModified('password')) {
      return next();
    }

    // Hash password with cost of 12.
    this.password = await bcrypt.hash(this.password, 12);

    // Delete the confirm password.
    this.confirmPassword = undefined;
    next();
  }
);

userSchema.pre<IUser>(
  'save',
  async function (this: IUser, next: (err?: Error) => void): Promise<void> {
    if (!this.isModified('password') || this.isNew) {
      return next();
    }
    this.changedPasswordAt = new Date(Date.now() - 1000);
    next();
  }
);

userSchema.pre<Query<IUser, IUser>>(
  /^find/,
  async function (this: Query<IUser, IUser>, next: (err?: Error) => void): Promise<void> {
    this.find({ isActive: { $ne: false } });
    next();
  }
);

userSchema.methods.isPasswordCorrect = async function (
  candidatePassword: string,
  userPassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.hasChangedPassword = function (this: IUser, jwtTimestamp: number): boolean {
  if (this.changedPasswordAt) {
    const changedTimeStamp = Math.floor(this.changedPasswordAt.getTime() / 1000);
    return changedTimeStamp > jwtTimestamp;
  }
  return false;
};

userSchema.methods.generateResetPasswordToken = function (this: IUser): string {
  const resetPasswordToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = cryptoHash(resetPasswordToken);
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
  return resetPasswordToken;
};

const User = model<IUser>('User', userSchema);

const Admin = User.discriminator(
  'Admin',
  new Schema(
    { phoneNumber: { type: Number, required: [true, 'Phone number is a required field'] } },
    { discriminatorKey: 'role' }
  )
);

const Supplier = User.discriminator(
  'Supplier',
  new Schema(
    { company: { type: String, required: [true, 'Company is a required field'] } },
    { discriminatorKey: 'role' }
  )
);

export { User, Admin, Supplier };
