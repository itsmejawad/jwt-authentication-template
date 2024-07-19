/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO: Huge improvements on TypeScript must be applied to this file.

import { CastError } from 'mongoose';
import AppError from '../utils/appError';
import { NextFunction, Request, Response } from 'express';

// Send Errors
const sendErrorToDev = (err: AppError, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    statusCode: err.statusCode,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorToProduction = (err: AppError, res: Response) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error('Something went wrong!', err);
    res.status(500).json({
      status: 'Error',
      message: 'Something went wrong!',
    });
  }
};

// MongoDB Errors
const handleCastErrorMongoDb = (err: CastError) => {
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);
};

const handleDuplicateFieldsMongoDb = (err: any) => {
  const value = err.message.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorMongoDb = (err: any) => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// JWT Token Errors
const handleJwtTokenError = () => new AppError(`Invalid token.`, 401);
const handleJwtExpiredTokenError = () => new AppError(`Token has expired.`, 401);

// Global Error Middleware
const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'Error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorToDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    // MongoDB Errors:
    if (err.name === 'CastError') error = handleCastErrorMongoDb(error);
    if (error.code === 11000) error = handleDuplicateFieldsMongoDb(error);
    if (err.name === 'ValidationError') error = handleValidationErrorMongoDb(error);

    // JWT Errors:
    if (err.name === 'JsonWebTokenError') error = handleJwtTokenError();
    if (err.name === 'TokenExpiredError') error = handleJwtExpiredTokenError();

    sendErrorToProduction(error, res);
  }
};

export { globalErrorHandler };
