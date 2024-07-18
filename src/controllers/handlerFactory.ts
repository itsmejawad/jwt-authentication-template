import { Request, Response, NextFunction } from 'express';

import AppError from '../utils/appError';
import asyncErrorHandler from '../utils/asyncErrorHandler';
import { Model } from 'mongoose';

const deleteOne = (Model: Model<unknown>) =>
  asyncErrorHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const doc = await Model.findByIdAndDelete(id);

    if (!doc) {
      return next(new AppError(`No document found with that ID.`, 404));
    }

    res.status(204).json({
      status: 'Success',
      user: null,
    });
  });

// NOTE: User middlewares won't run when using findByIdAndUpdate()
const updateOne = (Model: Model<unknown>) =>
  asyncErrorHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    const doc = await Model.findByIdAndUpdate(id, req.body, {
      runValidators: true,
      new: true,
    });

    if (!doc) {
      return next(new AppError(`No document found with that ID.`, 404));
    }

    res.status(200).json({
      status: 'Success',
      data: {
        doc,
      },
    });
  });

const createOne = (Model: Model<unknown>) =>
  asyncErrorHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const doc = await Model.create(req.body);

    if (!doc) {
      return next(new AppError(`No document found with that ID.`, 404));
    }

    res.status(201).json({
      status: 'Success',
      data: {
        doc,
      },
    });
  });

const getOne = (Model: Model<unknown>) =>
  asyncErrorHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    const doc = await Model.findById(id);

    if (!doc) {
      return next(new AppError(`No document found with that ID.`, 404));
    }

    res.status(200).json({
      status: 'Success',
      data: {
        doc,
      },
    });
  });

const getAll = (Model: Model<unknown>) =>
  asyncErrorHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const docs = await Model.find();

    if (!docs) {
      return next(new AppError(`No documents were found.`, 404));
    }

    res.status(200).json({
      status: 'Success',
      data: {
        docs,
      },
    });
  });

export default { deleteOne, updateOne, createOne, getOne, getAll };
