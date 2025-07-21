import { showAlert } from './alerts.js';

export const signup = async (name, email, password, passwordConfirm) => {
  const url = 'http://127.0.0.1:3000/api/v1/users/signup';
  // console.log(email, password);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, passwordConfirm }),
    });

    const data = await response.json();
    console.log(data);

    // if (data.status === 'fail' || 'error') {
    if (data.status === 'error') {
      throw new Error(`${data.message}`);
      // throw new Error(`Error message: ${data.message}, Request failed with status: ${data.error.statusCode}`);
    }
    if (data.status === 'success') {
      showAlert('success', 'Signup successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    console.error(err.message);
    showAlert('error', err.message);
  }
};
