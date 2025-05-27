const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login API...');
    
    const loginData = {
      emailOrUsername: 'admin@smoking.com',
      password: 'admin123'
    };
    
    console.log('Sending:', JSON.stringify(loginData, null, 2));
    
    const response = await axios.post('http://localhost:5000/api/auth/login', loginData);
    
    console.log('✅ Login successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Login failed!');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message);
    console.log('Full error:', error.message);
  }
}

testLogin(); 