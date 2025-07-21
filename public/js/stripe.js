import { showAlert } from './alerts.js';
const stripe = Stripe('pk_test_51Rl7bI977cSzAYB913hZoSkcBfsQwBTXYxVYxrGAYDRzByrbh7ZILsH5I410qjAnABAJD0huL3kTp2fZGHXRo7Gh00kTulFL67');

export const bookTour = async tourId => {
  try {
    // 1. Get checkout session from the server
    // const url = `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`;
    const url = `/api/v1/bookings/checkout-session/${tourId}`;
    const response = await fetch(url);

    const data = await response.json();

    // 2. Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
