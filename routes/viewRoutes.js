import express from 'express';
import * as viewController from './../controllers/viewController.js';
import * as authController from './../controllers/authController.js';
import * as bookingController from './../controllers/bookingController.js';

const router = express.Router();

// router.use(authController.isLoggedIn);
// router.get('/', bookingController.createBookingCheckout, authController.isLoggedIn, viewController.getOverview);

router.get('/', authController.isLoggedIn, viewController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);
router.get('/login', authController.isLoggedIn, viewController.getLoginForm);
router.get('/signup', authController.isLoggedIn, viewController.getSignupForm);
router.get('/me', authController.protect, viewController.getAccount);
router.get('/my-tours', authController.protect, viewController.getMyTours);

// not using it anymore
router.post('/submit-user-data', authController.protect, viewController.updateUserData);

export default router;
