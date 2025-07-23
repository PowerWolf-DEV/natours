import path from 'node:path';
import express from 'express';
import morgan from 'morgan';

import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';

import tourRouter from './routes/tourRoutes.js';
import userRouter from './routes/userRoutes.js';
import reviewRouter from './routes/reviewRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import viewRouter from './routes/viewRoutes.js';

import AppError from './utils/appError.js';
import globalErrorHandler from './controllers/errorController.js';

// start express app
const app = express();

const dirname = import.meta.dirname;

// set view engine
app.set('view engine', 'pug');
app.set('views', path.join(dirname, 'views'));

// Serving static files
// app.use(express.static(`${dirname}/public`));
app.use(express.static(path.join(dirname, 'public')));

// set the extended query parser
app.set('query parser', 'extended');

// 1. Global Middlewares
// Implementing CORS (cross-origin resource sharing)
app.use(cors());

app.options('*', cors());

// allow complex requests(delete, patch etc.) on just a specific route(example)
// app.options('/api/v1/tours/:id', cors());

// Set security HTTP headers
// Sets all of the defaults, but overrides 'script-src' & 'img-src'
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'script-src': ["'self'", 'https://js.stripe.com'],
        'frame-src': ["'self'", 'https://js.stripe.com'],
        // 'img-src': ["'self'", 'data:', 'https://*.tile.openstreetmap.org'],
        'img-src': ["'self'", 'https://*.openstreetmap.org'],
      },
    },
  })
);

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same IP
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 100,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

console.log(`MODE: ${process.env.NODE_ENV}`);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
// Middleware for parsing the data coming from a form
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// cookieParser
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS attacks
app.use(xss());

// prevent parameter pollution
app.use(
  hpp({
    whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price'],
  })
);

// compression middleware
app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 2. Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// app.all('/{*any}', (req, res, next) => {
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handling middleware
app.use(globalErrorHandler);

export default app;
