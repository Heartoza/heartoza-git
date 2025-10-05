// src/services/api.js
// Mặc định dùng proxy "/api" (SWA sẽ rewrite).
// Nếu có REACT_APP_API_BASE thì dùng nó (ví dụ khi chạy local).
// src/services/api.js
import axios from "axios";

const rawBase = process.env.REACT_APP_API_BASE;
const apiBase = (rawBase && rawBase.trim())
    ? `${rawBase.trim().replace(/\/+$/, "")}/api`
    : "http://localhost:5109/api"; // mặc định dùng proxy /api

const http = axios.create({ baseURL: apiBase });

// Gắn Bearer token nếu có
http.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Refresh token 401 (giữ nguyên logic cũ nếu anh đã có)
let isRefreshing = false;
let queue = [];
const processQueue = (error, token = null) => {
    queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
    queue = [];
};

http.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        if (error?.response?.status === 401 && !original._retry) {
            original._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    queue.push({
                        resolve: (token) => {
                            original.headers.Authorization = `Bearer ${token}`;
                            resolve(http(original));
                        },
                        reject,
                    });
                });
            }

            isRefreshing = true;
            const rt = localStorage.getItem("refreshToken");
            if (!rt) {
                isRefreshing = false;
                return Promise.reject(error);
            }

            try {
                const { data } = await axios.post(`${apiBase}/auth/refresh`, { refreshToken: rt });
                const newToken = data.token;
                localStorage.setItem("token", newToken);
                processQueue(null, newToken);
                original.headers.Authorization = `Bearer ${newToken}`;
                return http(original);
            } catch (err) {
                processQueue(err, null);
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("user");
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default http;
