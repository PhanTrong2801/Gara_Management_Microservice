import axios from 'axios';

const api = axios.create({
    // baseURL: "http://localhost:8080/api",
    // baseURL: "http://api.gara-autoflow.online:8080/api",
    baseURL: "https://api.gara-autoflow.online/api",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;