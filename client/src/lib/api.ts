const API_BASE_URL = 'http://0.0.0.0:5000/api';

// ... rest of the client-side code (assuming this is a React or similar frontend application) ...

// Example of a fetch call using the updated API_BASE_URL:
fetch(API_BASE_URL + '/users')
  .then(response => response.json())
  .then(data => {
    // Process the data
    console.log(data);
  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });