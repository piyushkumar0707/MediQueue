import fetch from 'node-fetch';

const testLogin = async () => {
  try {
    console.log('🔍 Testing login API endpoint...\n');
    
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneOrEmail: 'admin@test.com',
        password: 'Test@123'
      })
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Login API is working!');
      console.log('Token received:', data.data?.accessToken ? 'Yes' : 'No');
    } else {
      console.log('\n❌ Login failed!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testLogin();
