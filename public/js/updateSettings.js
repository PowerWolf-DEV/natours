import { showAlert } from './alerts.js';

// type is either 'password' or 'data'
// export const updateSettings = async (data, type) => {
//   // const url = 'http://127.0.0.1:3000/api/v1/users/updateMe';
//   const url = `http://127.0.0.1:3000/api/v1/users/${type === 'password' ? 'updateMyPassword' : 'updateMe'}`;
//   // console.log(data);
//   // console.log({ ...data });

//   try {
//     const response = await fetch(url, {
//       method: 'PATCH',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ ...data }),
//     });

//     const dataResponse = await response.json();
//     console.log(dataResponse);

//     if (dataResponse.status === 'error' || dataResponse.status === 'fail') {
//       // throw new Error(`Error message: ${data.message}, Request failed with status: ${data.error.statusCode}`);
//       throw new Error(`${dataResponse.message}`);
//     } else if (dataResponse.status === 'success') {
//       showAlert('success', `${type} updated successfully!`);
//       window.setTimeout(() => {
//         location.reload();
//       }, 1000);
//     }
//   } catch (err) {
//     console.error(err.message);
//     // const errFormatted = err.message.split(': ')[2];
//     showAlert('error', err.message);
//   }
// };

// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  const url = `http://127.0.0.1:3000/api/v1/users/${type === 'password' ? 'updateMyPassword' : 'updateMe'}`;

  // options object
  let options = { method: 'PATCH' };
  // logic if updating the data (tested!)
  if (type === 'data') {
    const form = new FormData();
    form.append('name', data.name);
    form.append('email', data.email);
    form.append('photo', data.photo);
    options.body = form;
  } else {
    // logic if updating the password (tested!)
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);

    const dataResponse = await response.json();
    console.log(dataResponse);

    if (dataResponse.status === 'error' || dataResponse.status === 'fail') {
      // throw new Error(`Error message: ${data.message}, Request failed with status: ${data.error.statusCode}`);
      throw new Error(`${dataResponse.message}`);
    } else if (dataResponse.status === 'success') {
      showAlert('success', `${type} updated successfully!`);
      window.setTimeout(() => {
        location.reload();
      }, 1000);
    }
  } catch (err) {
    console.error(err.message);
    // const errFormatted = err.message.split(': ')[2];
    showAlert('error', err.message);
  }
};
