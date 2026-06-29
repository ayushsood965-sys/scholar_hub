async function testRegister() {
  const userData = {
    username: "teststudent" + Date.now() + "@example.com",
    password: "password123",
    role: "STUDENT",
    department: "Department of Forensic Science",
    phoneNumber: "9876543210",
    academicSession: "2024-25",
    degreeTypeId: "some-id",
    degreeTypeName: "PhD",
    degreeNameId: "some-id",
    degreeNameLabel: "PhD Forensic Science",
    gender: "Male",
    category: "General"
  };

  try {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testRegister();
