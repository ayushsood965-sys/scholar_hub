const axios = require('axios');

async function test() {
  const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
    username: 'pradeepkumar@gmail.com',
    password: 'password123',
    portal: 'track'
  });
  
  const token = loginRes.data.token;
  
  const params = {
    sessionId: '6a3571cd3d57cf0a9cd77473',
    degreeTypeId: '6a4155a12472b888a2bb6378',
    degreeNameId: '6a4155ab2472b888a2bb63c0',
    semesterId: '6a3571cd3d57cf0a9cd7747b'
  };
  
  try {
    const res = await axios.get('http://localhost:5000/api/student-mapping/preview?' + new URLSearchParams(params).toString(), {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Total students returned:', res.data.students.length);
    const hasMeena = res.data.students.find(s => s._id === '6a32804b03ab1cd02bae3fb1');
    console.log('Has Meena Bose by direct ID:', !!hasMeena);
    console.log('Meena Bose by name search:', res.data.students.find(s => s.name.includes('Meena')));
  } catch (err) {
    console.error('API call failed:', err.message);
  }
}

test().catch(console.error);
