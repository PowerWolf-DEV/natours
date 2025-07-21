import { showAlert } from './alerts.js';

export const login = async (email, password) => {
  const url = 'http://127.0.0.1:3000/api/v1/users/login';
  // console.log(email, password);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log(data);

    if (data.status === 'fail') {
      // throw new Error(`Error message: ${data.message}, Request failed with status: ${data.error.statusCode}`);
      throw new Error(`${data.message}`);
    } else if (data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    console.error(err.message);
    showAlert('error', err.message);
  }
};

export const logout = async () => {
  try {
    const url = 'http://127.0.0.1:3000/api/v1/users/logout';
    const response = await fetch(url);

    const data = await response.json();
    // console.log(data);

    if (data.status === 'fail') {
      throw new Error(`Error message: ${data.message}`);
    } else if (data.status === 'success') {
      showAlert('success', 'Logged out successfully!');
      window.setTimeout(() => {
        // location.reload();
        location.assign('/');
      }, 1000);
    }
  } catch (err) {
    console.err(err);
    showAlert('error', err.message);
  }
};
