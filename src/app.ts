import express, { Express, Request, Response } from "express";
import morgan from "morgan";

// Import routers
import userRouter from "./routes/userRoutes";

// Create Node.js app.
const app: Express = express();

// Enable JSON response using express.json() middleware.
app.use(express.json());

// Enable Morgan to log requests using morgan("dev") middleware.
app.use(morgan("dev"));

// Routes
app.use("/api/users", userRouter);

export default app;
