const axios = require('axios');

async function test() {
    try {
        // 1. Login
        const loginRes = await axios.post('http://localhost:8080/api/auth/login', {
            username: 'admin',
            password: 'password123'
        });
        const token = loginRes.data.token || loginRes.data;
        console.log("Token:", token.substring(0, 20) + "...");

        // 2. Fetch Repair Orders
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get('http://localhost:8080/api/repair/orders?page=0&size=10&search=', { headers });
        console.log("Orders count:", res.data.content?.length);
        console.log("First order:", res.data.content[0]?.orderNumber);
    } catch (error) {
        console.error("Error:", error.response ? error.response.status : error.message);
        if (error.response) console.error(error.response.data);
    }
}
test();
