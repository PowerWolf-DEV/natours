import { showAlert } from './alerts.js';

// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  // const url = `http://127.0.0.1:3000/api/v1/users/${type === 'password' ? 'updateMyPassword' : 'updateMe'}`;
  const url = `/api/v1/users/${type === 'password' ? 'updateMyPassword' : 'updateMe'}`;

  // options object
  let options = { method: 'PATCH' };

  if (type === 'data') {
    const form = new FormData();
    form.append('name', data.name);
    form.append('email', data.email);
    form.append('photo', data.photo);
    options.body = form;
  } else {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);

    const dataResponse = await response.json();
    console.log(dataResponse);

    if (dataResponse.status === 'error' || dataResponse.status === 'fail') {
      throw new Error(`${dataResponse.message}`);
    } else if (dataResponse.status === 'success') {
      showAlert('success', `${type} updated successfully!`);
      window.setTimeout(() => {
        location.reload();
      }, 1000);
    }
  } catch (err) {
    console.error(err.message);
    showAlert('error', err.message);
  }
};
