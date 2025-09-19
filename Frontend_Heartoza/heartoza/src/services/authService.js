// src/services/authService.ts
import http from "./api";

export const AuthService = {
    // ===== Auth =====
    async login(payload: { email: string; password: string }) {
        const { data } = await http.post("/auth/login", payload);
        return data; // { token, userId, email, fullName, role }
    },
    async register(payload: { fullName: string; email: string; password: string; phone?: string }) {
        const { data } = await http.post("/auth/register", payload);
        return data;
    },
    async forgotPassword(email: string) {
        const { data } = await http.post("/auth/forgot", { email });
        return data;
    },
    async resetPassword({ token, newPassword }: { token: string; newPassword: string }) {
        const { data } = await http.post("/auth/reset", { token, newPassword });
        return data;
    },

    // ===== Profile =====
    async getProfile() {
        const { data } = await http.get("/profile/me"); // nếu baseURL chưa có /api thì đổi thành /api/profile/me
        return data; // ProfileResponse (kèm addresses, defaultAddressId, avatarUrl)
    },
    async updateProfile(payload: { fullName?: string; phone?: string; avatarUrl?: string }) {
        const { data } = await http.put("/profile/me", payload);
        return data;
    },
    async changePassword(payload: { currentPassword: string; newPassword: string }) {
        const { data } = await http.post("/profile/change-password", payload);
        return data;
    },

    // ===== Addresses =====
    async addAddress(payload: {
        fullName?: string;
        line1?: string;
        district?: string;
        city?: string;
        country?: string;
        postalCode?: string;
        phone?: string;
        isDefault?: boolean;
    }) {
        const { data } = await http.post("/profile/addresses", payload);
        return data; // { message, addressId }
    },

    async updateAddress(
        id: number,
        payload: {
            fullName?: string;
            line1?: string;
            district?: string;
            city?: string;
            country?: string;
            postalCode?: string;
            phone?: string;
            isDefault?: boolean;
        }
    ) {
        const { data } = await http.put(`/profile/addresses/${id}`, payload);
        return data;
    },

    async deleteAddress(id: number) {
        const { data } = await http.delete(`/profile/addresses/${id}`);
        return data;
    },

    async setDefaultAddress(id: number) {
        const { data } = await http.post(`/profile/addresses/${id}/set-default`, {});
        return data;
    },
};
