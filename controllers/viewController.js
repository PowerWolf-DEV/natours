import Tour from './../models/tourModel.js';
import User from './../models/userModel.js';
import Booking from './../models/bookingModel.js';
import AppError from './../utils/appError.js';

export const getOverview = async (req, res, next) => {
  try {
    // 1. get tour data from collection
    const tours = await Tour.find();
    // 2. Build template
    // 3. Render that template using tour data
    res.status(200).render('overview', {
      title: 'All Tours',
      tours,
    });
  } catch (err) {
    next(err);
  }
};

export const getTour = async (req, res, next) => {
  try {
    // console.log(req.params.slug);
    // 1. Get the data for the requested tour (including reviews and guides)
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
      path: 'reviews',
      fields: 'review rating user',
    });

    if (!tour) {
      return next(new AppError('There is no tour with that name', 404));
    }

    res.status(200).render('tour', {
      title: `${tour.name} Tour`,
      tour,
    });
  } catch (err) {
    next(err);
  }
};

export const getLoginForm = (req, res, next) => {
  try {
    res.status(200).render('login', {
      title: 'Log into your account',
    });
  } catch (err) {
    next(err);
  }
};

export const getSignupForm = (req, res, next) => {
  try {
    res.status(200).render('signup', {
      title: 'Sign up',
    });
  } catch (err) {
    next(err);
  }
};

export const getAccount = (req, res, next) => {
  try {
    res.status(200).render('account', {
      title: 'Your account',
    });
  } catch (err) {
    next(err);
  }
};

export const updateUserData = async (req, res, next) => {
  try {
    // console.log(req.body);
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        name: req.body.name,
        email: req.body.email,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).render('account', {
      title: 'Your account',
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

export const getMyTours = async (req, res, next) => {
  try {
    // 1. Find all bookings for current user
    const bookings = await Booking.find({ user: req.user.id });

    // 2. Find tours with the returned IDs
    const tourIds = bookings.map(el => el.tour);
    // console.log(tourIds);
    const tours = await Tour.find({ _id: { $in: tourIds } });
    // console.log(tours);

    res.status(200).render('overview', {
      title: 'My Tours',
      tours,
    });
  } catch (err) {
    next(err);
  }
};
