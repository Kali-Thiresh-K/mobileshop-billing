import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000',
});

API.interceptors.request.use((req) => {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            req.headers.Authorization = `Bearer ${JSON.parse(token)}`;
        } catch (e) {
            console.error("Invalid token format in localStorage", e);
            localStorage.removeItem('token');
        }
    }
    return req;
});

export default API;
