import { Request, Response, NextFunction, RequestHandler } from 'express';

// type MiddlewareAsyncFunction = (req: Request, res: Response, next: NextFunction) => RequestHandler;

const asyncErrorHandler = (fn: RequestHandler): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };
};

export default asyncErrorHandler;
