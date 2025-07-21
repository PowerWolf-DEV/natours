import mongoose from 'mongoose';

process.on('uncaughtException', err => {
  console.log('Uncaught Exception! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

import app from './app.js';
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DB_PASSWORD);

mongoose.connect(DB).then(connection => console.log('DB connection successful!'));

const port = process.env.PORT || 8000;

const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

process.on('unhandledRejection', err => {
  console.log('Unhandled Rejection! 💥 Shutting down...');
  // console.log(err);
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
