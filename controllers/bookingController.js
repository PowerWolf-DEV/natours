import Tour from './../models/tourModel.js';
import Booking from './../models/bookingModel.js';
import AppError from '../utils/appError.js';
import Stripe from 'stripe';

import * as factory from './../controllers/handlerFactory.js';

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

export const getCheckoutSession = async (req, res, next) => {
  try {
    // 1. get the currently booked tour
    const tour = await Tour.findById(req.params.tourId);
    // console.log(tour);

    // 2. create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
      cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
      customer_email: req.user.email,
      client_reference_id: req.params.tourId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: tour.price * 100,
            currency: 'usd',
            product_data: {
              name: `${tour.name} Tour`,
              description: tour.summary,
              images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
            },
          },
          quantity: 1,
        },
      ],
    });

    // 3. Create session as response
    res.status(200).json({
      status: 'success',
      session,
    });
  } catch (err) {
    next(err);
  }
};

export const createBookingCheckout = async (req, res, next) => {
  try {
    // This is only temporary, because it's not secure solution
    const { tour, user, price } = req.query;
    if (!tour && !user && !price) return next();

    await Booking.create({ tour, user, price });

    res.redirect(req.originalUrl.split('?')[0]);
  } catch (err) {
    next(err);
  }
};

export const getAllBookings = factory.getAll(Booking);
export const createBooking = factory.createOne(Booking);
export const getBooking = factory.getOne(Booking);
export const updateBooking = factory.updateOne(Booking);
export const deleteBooking = factory.deleteOne(Booking);
