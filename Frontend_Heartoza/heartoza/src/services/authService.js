import http from "./api";

export const AuthService = {
    // Auth
    async login(payload) {
        // payload: { email, password }
        const { data } = await http.post("/auth/login", payload);
        return data; // { token, userId, email, fullName, role }
    },
    async register(payload) {
        // payload: { fullName, email, password, phone? }
        const { data } = await http.post("/auth/register", payload);
        return data; // { token, userId, email, fullName, role }
    },
    async forgotPassword(email) {
        const { data } = await http.post("/auth/forgot", { email });
        return data; // { message, token? (dev) }
    },
    async resetPassword({ token, newPassword }) {
        const { data } = await http.post("/auth/reset", { token, newPassword });
        return data;
    },

    // Profile
    async getProfile() {
        const { data } = await http.get("/profile/me");
        return data;
    },
    async updateProfile(payload) {
        // payload: { fullName?, phone? }
        const { data } = await http.put("/profile/me", payload);
        return data;
    },
    async changePassword(payload) {
        // payload: { currentPassword, newPassword }
        const { data } = await http.post("/profile/change-password", payload);
        return data;
    },
};
