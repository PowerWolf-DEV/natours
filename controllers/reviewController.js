import Review from './../models/reviewModel.js';
import * as factory from './../controllers/handlerFactory.js';

export const setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

export const getAllReviews = factory.getAll(Review);
export const getReview = factory.getOne(Review);
export const createReview = factory.createOne(Review);
export const updateReview = factory.updateOne(Review);
export const deleteReview = factory.deleteOne(Review);

// export const getAllReviews = async (req, res, next) => {
//   try {
//     let filter = {};
//     if (req.params.tourId) filter = { tour: req.params.tourId };
//     const reviews = await Review.find(filter);

//     res.status(200).json({
//       status: 'success',
//       results: reviews.length,
//       data: {
//         reviews,
//       },
//     });
//   } catch (err) {
//     next(err);
//   }
// };
