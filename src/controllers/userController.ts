import { NextFunction, Request, RequestHandler, Response } from 'express';

import { IUser } from '../interfaces/IUser';
import asyncErrorHandler from '../utils/asyncErrorHandler';
import User from '../models/userModel';
import AppError from '../utils/appError';
import factory from './handlerFactory';

const updateMe: RequestHandler = asyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.body.password || req.body.confirmPassword) {
      return next(
        new AppError(`You cannot update your password using this route, use /forgot-password`, 400)
      );
    }

    const updatedUser: IUser | null = await User.findByIdAndUpdate(
      req.user?.id,
      {
        name: req.body.name,
        email: req.body.email,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: 'Success',
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

const getAllUsers = factory.getAll<IUser>(User);
const getUser = factory.getOne<IUser>(User);
const createUser = factory.createOne<IUser>(User);
const deleteUser = factory.deleteOne<IUser>(User);
const updateUser = factory.updateOne<IUser>(User);

export default { updateMe, deleteMe, getUser, updateUser, getAllUsers, deleteUser, createUser };
