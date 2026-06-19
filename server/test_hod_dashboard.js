const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'mahinderkumar@gmail.com',
      password: 'password'
    });
    
    const token = loginRes.data.token;
    console.log("Logged in");

    const statsRes = await axios.get('http://localhost:5000/api/attendance/dashboard/hod', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log("SUCCESS:");
    console.log(statsRes.data);
  } catch (err) {
    console.log("ERROR:");
    if (err.response) {
      console.log(err.response.data);
    } else {
      console.log(err.message);
    }
  }
}

test();
