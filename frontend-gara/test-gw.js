import axios from 'axios';
async function run() {
    try {
        const loginRes = await axios.post('http://localhost:8080/api/auth/login', {username: 'admin', password: 'password'});
        const token = loginRes.data.token || loginRes.data;
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get('http://localhost:8080/api/repair/orders?page=0&size=10', { headers });
        console.log(res.status, res.data);
    } catch(e) {
        console.error("GW ERROR:", e.response ? e.response.status : e.message);
    }
}
run();
