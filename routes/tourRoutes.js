import express from 'express';
import * as tourController from './../controllers/tourController.js';
import * as authController from './../controllers/authController.js';
// import * as reviewController from './../controllers/reviewController.js';
import reviewRouter from './../routes/reviewRoutes.js';

const router = express.Router();

// router.route('/:tourId/reviews').post(authController.protect, authController.restrictTo('user'), reviewController.createReview);
router.use('/:tourId/reviews', reviewRouter);

// param middleware
// router.param('id', tourController.checkID);

router.route('/top-5').get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(authController.protect, authController.restrictTo('admin', 'lead-guide', 'guide'), tourController.getMonthlyPlan);

// Geospatial Queries: Finding Tours Within Radius
router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin);
// /tours-within?distance=233&center=-40,45,unit=mi => alternative way to do it
// /tours-within/233/center/-40,45/unit/mi

// Geospatial Aggregation: Calculating Distances
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.createTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour);

export default router;
