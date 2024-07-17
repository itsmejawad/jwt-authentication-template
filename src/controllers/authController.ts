import User from '../models/userModel';
import AppError from '../utils/appError';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { registerSchema } from '../schemas/registerSchema';
import { loginSchema } from '../schemas/loginSchema';
import asyncErrorHandler from '../utils/asyncErrorHandler';
import { IUser } from '../interfaces/IUser';
import sendEmail from '../utils/nodeMailer';
const signToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '',
  });
};

interface JwtPayload {
  id: string;
  iat: number;
  exp: number;
}

const jwtVerifyPromisified = (token: string, secret: string): Promise<JwtPayload> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, {}, (err, payload) => {
      if (err) {
        reject(err);
      } else {
        if (typeof payload === 'object' && payload !== null) {
          resolve(payload as JwtPayload);
        }
      }
    });
  });
};

// TODO: Make sure to hide the password in the JSON response.
const register: RequestHandler = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { name, email, password, confirmPassword } = req.body;

    const validatedData = registerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!validatedData.success) {
      return next(new AppError(validatedData?.error?.errors[0]?.message, 400));
    }

    const newUser: IUser = new User(validatedData.data);
    await newUser.save();

    const token = signToken(newUser._id as string);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser,
      },
    });
  }
);

const login: RequestHandler = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, password } = req.body;

    // 1) Check data and validate it.
    // 2) Check if email and password exists.
    const validatedData = loginSchema.safeParse({
      email,
      password,
    });

    if (!validatedData.success) {
      return next(new AppError(validatedData.error.errors[0].message, 400));
    }

    // 3) Get user with correct credentials.
    const user: IUser | null = await User.findOne({ email }).select('+password');

    // 4) Check if user exists and password is correct.
    if (!user || !(await user?.isPasswordCorrect(password, user?.password))) {
      return next(new AppError('Incorrect email or password.', 401));
    }

    // 5) Send token to user.
    const token = signToken(user._id as string);

    res.status(200).json({
      status: 'success',
      token,
    });
  }
);

declare module 'express' {
  interface Request {
    user?: IUser;
  }
}

const protect: RequestHandler = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let token = '';
    // 1) Get token and check if it exists.
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in.', 401));
    }

    // 2) Verification.
    const decoded = await jwtVerifyPromisified(token, process.env.JWT_SECRET || '');

    // 3) Check if user still exists.
    const freshUser: IUser | null = await User.findById(decoded.id);

    if (!freshUser) {
      return next(new AppError('User not found.', 401));
    }

    // 4) Check if user changed password after the JWT was issued.
    if (freshUser.hasChangedPassword(decoded.iat)) {
      return next(new AppError('User has recently changed their password.', 401));
    }

    // User is authenticated, then grant access to protected route.
    // NOTE: Check TypeScript
    req.user = freshUser;
    next();
  }
);

const restrictTo =
  (...roles: Array<string>): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (req.user !== undefined && !roles.includes(req.user.role)) {
      return next(new AppError(`You do not have the permission to preform this action`, 403));
    }
    next();
  };

const forgotPassword: RequestHandler = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email } = req.body;

    // Get user based on posted email
    const user: IUser | null = await User.findOne({ email });

    if (!user) {
      return next(new AppError(`User not found.`, 404));
    }

    // Generate password reset token
    const resetPasswordToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Send token to the email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/reset-password/${resetPasswordToken}`;

    const message = `Reset your password using the following link ${resetURL}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Reset Your Password',
        message,
      });

      res.status(200).json({
        status: 'Success',
        message: 'Reset token has been sent your your email',
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new AppError('There was an error sending the email', 500));
    }
  }
);

const resetPassword: RequestHandler = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // TODO: Make hash token function for when generating email token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    if (!hashedToken) {
      next(new AppError(`Token has not been provided.`, 401));
    }

    // Get token based on user
    const user: IUser | null = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    // Check if token has not expired or valid, if not reset the password
    if (!user) {
      return next(new AppError(`Token is invalid or expired.`, 404));
    }
    const { password, confirmPassword } = req.body;

    user.password = password;
    user.confirmPassword = confirmPassword;
    user.passwordResetExpires = undefined;
    user.passwordResetToken = undefined;
    await user.save();

    // Update the changedPasswordAt to now
    // user.changedPasswordAt;

    // Send token to the user
    const token = signToken(user._id as string);

    res.status(200).json({
      status: 'success',
      token,
    });
  }
);
export default { register, login, protect, restrictTo, forgotPassword, resetPassword };
