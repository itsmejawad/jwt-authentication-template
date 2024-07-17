import { NextFunction, Request, Response } from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler';
import User from '../models/userModel';
import { IUser } from '../interfaces/IUser';

const getAllUsers = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
  const users: IUser[] = await User.find();

  res.status(200).json({
    status: 'success',
    users,
  });
});

const getUser = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const user = await User.findOne({ _id: id });

  res.status(200).json({
    status: 'success',
    user,
  });
});

const deleteUser = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  await User.findByIdAndDelete(id);

  res.status(200).json({
    status: 'success',
    user: null,
  });
});

export default { getAllUsers, getUser, deleteUser };
