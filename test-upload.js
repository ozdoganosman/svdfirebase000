const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function uploadFile() {
  const form = new FormData();
  form.append('file', fs.createReadStream('./test-image.jpg'));

  try {
    const response = await axios.post('http://localhost:5001/svdfirebase000/us-central1/api/media', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': 'Bearer 85dfee912dd7f916fadb2a7a342af89602c80fdc3a061496b5fffd12d5d5f68b'
      }
    });
    console.log('Upload successful:', response.data);
  } catch (error) {
    console.error('Upload failed:', error.response?.data || error.message);
  }
}

uploadFile();