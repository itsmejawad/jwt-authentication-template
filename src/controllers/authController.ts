import User from '../models/userModel';
import AppError from '../utils/appError';

import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import { registerSchema } from '../schemas/registerSchema';
import { loginSchema } from '../schemas/loginSchema';
import asyncErrorHandler from '../utils/asyncErrorHandler';
import { IUser } from '../interfaces/IUser';

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

const register = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
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
});

const login = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
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
});

const protect = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
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
  // req.user = freshUser;
  next();
});

export default { register, login, protect };
