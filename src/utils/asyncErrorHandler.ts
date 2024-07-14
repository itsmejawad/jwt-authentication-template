import { Request, Response, NextFunction } from "express";

type MiddlewareAsyncFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

const asyncErrorHandler = (fn: MiddlewareAsyncFunction) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };
};

export default asyncErrorHandler;
