import axios from "axios";

// Ưu tiên .env => REACT_APP_API_BASE, fallback localhost
const apiBase =
    process.env.REACT_APP_API_BASE?.replace(/\/+$/, "") ||
    "https://localhost:7109/api";

const http = axios.create({ baseURL: apiBase });

// Gắn Bearer token tự động nếu có
http.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default http;
