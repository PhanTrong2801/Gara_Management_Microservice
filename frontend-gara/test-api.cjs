const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:8080/api/auth/login', {
      username: 'admin',
      password: '123'
    });
    const token = loginRes.data.token;
    
    const res = await axios.get('http://localhost:8080/api/repair/orders?page=0&size=1', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(JSON.stringify(Object.keys(res.data), null, 2));
    console.log("totalPages:", res.data.totalPages);
    console.log("totalElements:", res.data.totalElements);
    console.log("page:", res.data.page);
  } catch (err) {
    console.log("Lỗi:", err.message);
  }
}
test();
