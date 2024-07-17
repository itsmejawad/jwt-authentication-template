import express, { Express, Request, Response, NextFunction } from 'express';
import { globalErrorHandler } from './controllers/errorController';
import morgan from 'morgan';
import AppError from './utils/appError';
import userRouter from './routes/userRoutes';

// Create Node.js app.
const app: Express = express();

// Enable JSON response using express.json() middleware.
app.use(express.json());

// Enable Morgan to log requests using morgan("dev") middleware.
app.use(morgan('dev'));

// Routes
app.use('/api/v1/users', userRouter);

// Handle undefined routes (Operational Errors)
app.all('*', (req: Request, res: Response, next: NextFunction): void => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error Handling Middleware (Has four arguments)
app.use(globalErrorHandler);

export default app;
