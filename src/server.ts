/* eslint-disable no-console */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

process.on('uncaughtException', (err: Error) => {
  console.log(err.name, err.message);
  console.log('Uncaught Exception!');
  process.exit(1);
});

dotenv.config({ path: './.env' });

import app from './app';

const DB = process.env.DATABASE;
mongoose.connect(DB!).then(() => console.log(`Connected to MongoDB Database.`));

const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}.`);
});

process.on('unhandledRejection', (err: Error) => {
  console.log(err.name, err.message);
  console.log('Unhandled Rejection!');
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM Received.');
  server.close(() => {
    console.log('Process terminated!');
  });
});
