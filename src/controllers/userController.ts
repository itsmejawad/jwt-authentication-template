import { NextFunction, Request, RequestHandler, Response } from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler';
import User from '../models/userModel';
import { IUser } from '../interfaces/IUser';
import AppError from '../utils/appError';

const getAllUsers: RequestHandler = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const users: Array<IUser> = await User.find();

    res.status(200).json({
      status: 'success',
      users,
    });
  }
);

const getUser: RequestHandler = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    const user = await User.findOne({ _id: id });

    res.status(200).json({
      status: 'success',
      user,
    });
  }
);

const deleteUser: RequestHandler = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    await User.findByIdAndDelete(id);

    res.status(204).json({
      status: 'success',
      user: null,
    });
  }
);

const updateMe: RequestHandler = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.body.password || req.body.confirmPassword) {
      return next(new AppError(`You cannot update your password using this route`, 400));
    }

    const updatedUser: IUser | null = await User.findByIdAndUpdate(
      req.user?.id,
      {
        email: req.body.email,
        name: req.body.name,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: 'success',
      user: updatedUser,
    });
  }
);

const deleteMe: RequestHandler = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await User.findByIdAndUpdate(req.user?.id, {
      isActive: false,
    });

    res.status(204).json({
      status: 'success',
      user: null,
    });
  }
);
export default { getAllUsers, getUser, deleteUser, updateMe, deleteMe };
