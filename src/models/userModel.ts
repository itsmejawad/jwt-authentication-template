import { model, Schema } from 'mongoose';
import { IUser, UserRole } from '../interfaces/IUser';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

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
      // TODO: Validate email formate
    },
    photo: String,
    role: {
      type: String,
      enum: Object.values(UserRole),
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
      //  NOTE: This validator, will only work on the .save() mongoDB method.
      validate: {
        validator: function (this: IUser, el: string) {
          return this.password === el;
        },
        message: 'Password are not the same.',
      },
    },
    changedPasswordAt: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
  },
  { versionKey: false }
);

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
  this.passwordResetToken = crypto.createHash('sha256').update(resetPasswordToken).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
  return resetPasswordToken;
};

const User = model<IUser>('User', userSchema);

export default User;
