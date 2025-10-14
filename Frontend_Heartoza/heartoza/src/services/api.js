// src/services/api.js
// Mặc định dùng proxy "/api" (SWA sẽ rewrite).
// Nếu có REACT_APP_API_BASE thì dùng nó (ví dụ khi chạy local).
import axios from "axios";

const rawBase = process.env.REACT_APP_API_BASE;
const apiBase = (rawBase && rawBase.trim())
    ? `${rawBase.trim().replace(/\/+$/, "")}/api`
    : "/api"; // mặc định dùng proxy /api

const http = axios.create({
    baseURL: apiBase,
    timeout: 20000,
});

// ====== Helpers ======
function extractMessage(resp) {
    const data = resp?.data;

    // { message: "..." }
    if (data && typeof data === "object" && data.message) return data.message;

    // ProblemDetails (.NET): { title, detail, errors }
    if (data && typeof data === "object" && (data.title || data.detail || data.errors)) {
        if (data.detail) return data.detail;
        if (data.title) return data.title;
        if (data.errors) {
            const k = Object.keys(data.errors)[0];
            const first = data.errors[k]?.[0];
            if (first) return first;
        }
    }

    // Chuỗi thuần (tránh đổ HTML 500 lên UI)
    if (typeof data === "string") {
        if (data.startsWith("<")) return "Máy chủ trả về lỗi.";
        return data;
    }

    // Fallback theo status
    const s = resp?.status;
    if (s === 400) return "Yêu cầu không hợp lệ.";
    if (s === 401) return "Hết phiên đăng nhập, vui lòng đăng nhập lại.";
    if (s === 403) return "Bạn không có quyền thực hiện hành động này.";
    if (s === 404) return "Không tìm thấy tài nguyên.";
    if (s === 409) return "Xung đột dữ liệu, vui lòng thử lại.";
    if (s >= 500) return "Hệ thống đang bận, thử lại sau ít phút.";
    return "Đã xảy ra lỗi không xác định.";
}

// ====== Request: gắn Bearer token nếu có ======
http.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ====== Refresh token 401 (giữ logic cũ, thêm chuẩn hoá lỗi) ======
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

        // -------- 401: thử refresh theo hàng đợi --------
        if (error?.response?.status === 401 && !original?._retry) {
            original._retry = true;

            if (isRefreshing) {
                // xếp hàng đợi đến khi refresh xong
                return new Promise((resolve, reject) => {
                    queue.push({
                        resolve: (newToken) => {
                            if (newToken) {
                                original.headers.Authorization = `Bearer ${newToken}`;
                            }
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
                // không có refreshToken -> trả lỗi chuẩn hoá
                error.userMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
                return Promise.reject(error);
            }

            try {
                // dùng axios gốc để tránh vòng lặp interceptor
                const { data } = await axios.post(`${apiBase}/auth/refresh`, { refreshToken: rt });
                const newToken = data?.token;
                if (!newToken) {
                    throw new Error("Refresh không trả token");
                }
                localStorage.setItem("token", newToken);
                processQueue(null, newToken);

                // phát lại request cũ
                original.headers.Authorization = `Bearer ${newToken}`;
                return http(original);
            } catch (err) {
                processQueue(err, null);
                // dọn phiên
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("user");

                // gán message gọn
                if (err && !err.userMessage) {
                    if (err.response) err.userMessage = extractMessage(err.response);
                    else err.userMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
                }
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        // -------- Các lỗi khác: chuẩn hoá userMessage --------
        if (error?.response) {
            error.userMessage = extractMessage(error.response);
            return Promise.reject(error);
        }

        if (error?.request && !error.response) {
            // lỗi mạng / CORS / timeout
            error.userMessage = "Không thể kết nối máy chủ. Kiểm tra mạng hoặc thử lại sau.";
            return Promise.reject(error);
        }

        error.userMessage = "Có lỗi xảy ra. Vui lòng thử lại.";
        return Promise.reject(error);
    }
);

export default http;
