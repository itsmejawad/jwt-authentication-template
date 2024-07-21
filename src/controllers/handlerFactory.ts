import { Request, Response, NextFunction } from 'express';
import { Model } from 'mongoose';

import AppError from '../utils/appError';
import asyncErrorHandler from '../utils/asyncErrorHandler';
import APIFeatures from '../utils/apiFeatures';

const deleteOne = <T>(Model: Model<T>) =>
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

const updateOne = <T>(Model: Model<T>) =>
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

const createOne = <T>(Model: Model<T>) =>
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

const getOne = <T>(Model: Model<T>) =>
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

const getAll = <T>(Model: Model<T>) =>
  asyncErrorHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const features = new APIFeatures<T>(Model.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const docs = await features.query;

    if (!docs) {
      return next(new AppError(`No documents were found.`, 404));
    }

    res.status(200).json({
      status: 'Success',
      results: docs.length,
      data: {
        docs,
      },
    });
  });

export default { deleteOne, updateOne, createOne, getOne, getAll };
