const axios = require('axios');

async function test() {
  // Login
  const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
    username: 'pradeepkumar@gmail.com',
    password: 'password123',
    portal: 'track'
  });
  
  const token = loginRes.data.token;
  console.log('Logged in successfully. Token:', token.substring(0, 10) + '...');
  
  // Call mapped endpoint
  // Filters:
  // Session: 2026-2027 -> ID: 6a3571cd3d57cf0a9cd77473
  // Degree Type: Postgraduate -> ID: 6a4155a12472b888a2bb6378
  // Degree Name: M.Sc. Forensic Science -> ID: 6a4155ab2472b888a2bb63c0
  // Semester: Semester 1 -> ID: 6a3571cd3d57cf0a9cd7747b
  
  const params = {
    sessionId: '6a3571cd3d57cf0a9cd77473',
    degreeTypeId: '6a4155a12472b888a2bb6378',
    degreeNameId: '6a4155ab2472b888a2bb63c0',
    semesterId: '6a3571cd3d57cf0a9cd7747b'
  };
  
  try {
    const res = await axios.get('http://localhost:5000/api/student-mapping/mapped', {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    console.log('API Response status:', res.status);
    console.log('API Response data:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('API call failed:', err.response ? err.response.status : err.message);
    if (err.response) {
      console.error(err.response.data);
    }
  }
}

test().catch(console.error);
