import express from 'express';
import * as bookingController from './../controllers/bookingController.js';
import * as authController from './../controllers/authController.js';

const router = express.Router();

// protect all routes below
router.use(authController.protect);

// ** not following rest principle here
router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

// restrict access to next roles
router.use(authController.restrictTo('admin', 'lead-guide'));

// all CRUD operations for bookings
router.route('/').get(bookingController.getAllBookings).post(bookingController.createBooking);

router.route('/:id').get(bookingController.getBooking).patch(bookingController.updateBooking).delete(bookingController.deleteBooking);

export default router;
