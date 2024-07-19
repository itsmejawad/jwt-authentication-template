import { Request, Response, NextFunction } from 'express';

// Define a type that includes functions returning a Promise
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

const asyncErrorHandler =
  (fn: AsyncRequestHandler) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };
export default asyncErrorHandler;
