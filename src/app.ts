import express, { Express, Request, Response, NextFunction } from 'express';
import { globalErrorHandler } from './controllers/errorController';
import morgan from 'morgan';
import AppError from './utils/appError';
import userRouter from './routes/userRoutes';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
// import xss from 'xss';

// Create Node.js app.
const app: Express = express();

// Limit requests from the same IP to 100.
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from your IP, please try again later.',
});

app.use('/api', limiter);

// Set security HTTP headers using helmet middleware.
app.use(helmet());

// Enable JSON response using express.json() middleware.
app.use(
  express.json({
    limit: '15kb',
  })
);

// Data sanitization against noSQL query injection
app.use(ExpressMongoSanitize());

// TODO: Data sanitization against XSS

// Prevent parameter pollution
app.use(
  hpp()
  // whitelist: ["field name", ]
);

// Enable Morgan to log requests using morgan("dev") middleware.
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// Routes
app.use('/api/v1/users', userRouter);

// Handle undefined routes (Operational Errors)
app.all('*', (req: Request, res: Response, next: NextFunction): void => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error Handling Middleware (Has four arguments)
app.use(globalErrorHandler);

export default app;
