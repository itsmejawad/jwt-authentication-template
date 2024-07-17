import { Request, Response, NextFunction } from 'express';

// Define a type that includes functions returning a Promise
// NOTE: Check TypeScript here again.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any> | void;

const asyncErrorHandler = (fn: AsyncRequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };
};

export default asyncErrorHandler;
