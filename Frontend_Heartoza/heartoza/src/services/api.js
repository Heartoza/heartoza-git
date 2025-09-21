// src/services/api.ts
import axios from "axios";

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

// Tự refresh token khi gặp 401
let isRefreshing = false;
let queue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
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
                        resolve: (token: string) => {
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
                const { data } = await axios.post(`${apiBase}/auth/refresh`, {
                    refreshToken: rt,
                });
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
