import { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';

import { IUser } from '../interfaces/IUser';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/authSchemas';
import { User } from '../models/userModel';
import asyncErrorHandler from '../utils/asyncErrorHandler';
import sendEmail from '../utils/nodeMailer';
import AppError from '../utils/appError';
import cryptoHash from '../utils/cryptoHash';

const signToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '',
  });
};

const createSendToken = (user: IUser, statusCode: number, res: Response): void => {
  const token = signToken(user._id as string);

  const cookieOptions = {
    expires: new Date(Date.now() + Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000),
    secure: process.env.NODE_ENV === 'development' ? false : true,
    httpOnly: true,
  };
  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'Success',
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
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

const register: RequestHandler = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const validatedData = registerSchema.safeParse({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
    });

    if (!validatedData.success) {
      return next(new AppError(validatedData?.error?.errors[0]?.message, 400));
    }

    const { name, email, password, confirmPassword } = validatedData.data;

    const newUser: IUser = new User({ name, email, password, confirmPassword });
    await newUser.save();

    createSendToken(newUser, 201, res);
  }
);

const login: RequestHandler = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 1) Check data and validate it.
    const validatedData = loginSchema.safeParse({
      email: req.body.email,
      password: req.body.password,
    });

    if (!validatedData.success) {
      return next(new AppError(validatedData.error.errors[0].message, 400));
    }

    const { email, password } = validatedData.data;

    // 2) Get user with correct credentials.
    const user: IUser | null = await User.findOne({ email }).select('+password');

    // 3) Check if user exists and password is correct.
    if (!user || !(await user?.isPasswordCorrect(password, user.password))) {
      return next(new AppError('Incorrect email or password.', 401));
    }

    // 4) Send token to user.
    createSendToken(user, 200, res);
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
    const freshUser: IUser | null = await User.findById(decoded.id).select('+changedPasswordAt');

    if (!freshUser) {
      return next(new AppError('User not found.', 401));
    }

    // 4) Check if user changed password after the JWT was issued.
    if (freshUser.hasChangedPassword(decoded.iat)) {
      return next(new AppError('User has recently changed their password.', 401));
    }

    // User is authenticated, then grant access to protected route.
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
    // 1) Check data and validate it.
    const validatedData = forgotPasswordSchema.safeParse({ email: req.body.email });

    if (!validatedData.success) {
      return next(new AppError(validatedData?.error?.errors[0]?.message, 400));
    }

    const { email } = validatedData.data;

    // Get user based on posted email.
    const user: IUser | null = await User.findOne({ email });

    if (!user) {
      return next(new AppError(`User not found.`, 404));
    }

    // Generate password reset token.
    const resetPasswordToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Send token to the email.
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/reset-password/${resetPasswordToken}`;

    const message = `Reset your password using the following link ${resetURL}`;

    // TODO: Write a professional email.
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
    // Hash token using same algorithm in the userModel middleware.
    const hashedToken = cryptoHash(req.params.token);

    if (!hashedToken) {
      next(new AppError(`Token has not been provided.`, 401));
    }

    // Get token based on user and based on whether reset token > now.
    const user: IUser | null = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    // Check if token has not expired or valid, if not reset the password.
    if (!user) {
      return next(new AppError(`Token is invalid or expired.`, 404));
    }

    // Check data and validate it.
    const validatedData = resetPasswordSchema.safeParse({
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
    });

    if (!validatedData.success) {
      return next(new AppError(validatedData?.error?.errors[0]?.message, 400));
    }

    const { password, confirmPassword } = validatedData.data;

    // Update password and confirm password.
    user.password = password;
    user.confirmPassword = confirmPassword;

    // Delete token and token expiry date.
    user.passwordResetExpires = undefined;
    user.passwordResetToken = undefined;
    await user.save();

    // Update the changedPasswordAt to now (Done using the built in Middleware in userModel).

    // Send token to the user.
    createSendToken(user, 200, res);
  }
);

const updatePassword: RequestHandler = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Get the logged in user.
    const user: IUser | null = await User.findById(req?.user?.id).select('+password');

    // Check if the entered password matches the actual password.
    if (!user || !(await user?.isPasswordCorrect(req.body.currentPassword, user.password))) {
      return next(new AppError('Your current password is wrong.', 401));
    }

    // Check data and validate it.
    const validatedData = resetPasswordSchema.safeParse({
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
    });

    if (!validatedData.success) {
      return next(new AppError(validatedData?.error?.errors[0]?.message, 400));
    }

    const { password, confirmPassword } = validatedData.data;

    // Update password.
    user.password = password;
    user.confirmPassword = confirmPassword;
    await user.save();

    // Send token to the user.
    createSendToken(user, 200, res);
  }
);

export default {
  register,
  login,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword,
  updatePassword,
};
