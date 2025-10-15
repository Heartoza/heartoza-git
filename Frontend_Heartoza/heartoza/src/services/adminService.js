// src/services/adminService.js
import api from "./api";

// helper build query từ object (bỏ field null/undefined/"")
const buildQuery = (obj) =>
    Object.entries(obj)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");

export const AdminService = {
    // ================= USERS =================

    /**
     * Lấy danh sách users.
     * Dùng linh hoạt:
     *  - getUsers({ q, role, active, page, pageSize, sort })
     *  - getUsers(page, pageSize)  // backward-compatible
     */
    getUsers: (arg1 = 1, arg2 = 20) => {
        let qs = "";
        if (typeof arg1 === "object") {
            const params = { page: 1, pageSize: 20, sort: "createdAt_desc", ...arg1 };
            qs = buildQuery(params);
        } else {
            qs = buildQuery({ page: arg1, pageSize: arg2 });
        }
        return api.get(`/admin/users?${qs}`).then((r) => r.data);
    },

    /** Cập nhật user: { fullName?, phone?, role?, isActive? } */
    updateUser: (id, payload) =>
        api.put(`/admin/users/${id}`, payload).then((r) => r.data),

    /** Khoá/Mở user */
    toggleUser: (id) =>
        api.post(`/admin/users/${id}/toggle`).then((r) => r.data),

    /** Lấy 1 user theo id (nếu BE có) */
    getUserById: (id) =>
        api.get(`/admin/users/${id}`).then((r) => r.data),

    /** Xoá user (nếu BE có) */
    deleteUser: (id) =>
        api.delete(`/admin/users/${id}`).then((r) => r.data),

    // ================= ORDERS (để nguyên, chỉ sửa body status) =================

    getOrders: (page = 1, pageSize = 20) =>
        api.get(`/admin/orders?page=${page}&pageSize=${pageSize}`).then((r) => r.data),

    getOrderById: (id) =>
        api.get(`/admin/orders/${id}`).then((r) => r.data),

    /** Gửi body chuẩn { status: "..." } thay vì JSON.stringify(status) */
    updateOrderStatus: (id, status) =>
        api.post(
            `/admin/orders/${id}/status`,
            `"${status}"`, // gửi chuỗi JSON thô
            { headers: { "Content-Type": "application/json" } }
        ).then((r) => r.data),


    // ================= PRODUCTS (để nguyên, chỉ encode q) =================

    getProducts: (page = 1, pageSize = 20, q = "") =>
        api
            .get(`/admin/products?page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(q)}`)
            .then((r) => r.data),

    getProductById: (id) =>
        api.get(`/admin/products/${id}`).then((r) => r.data),

    createProduct: (p) =>
        api.post(`/admin/products`, p).then((r) => r.data),

    updateProduct: (id, p) =>
        api.put(`/admin/products/${id}`, p).then((r) => r.data),

    deleteProduct: (id) =>
        api.delete(`/admin/products/${id}`).then((r) => r.data),

    // ================= CATEGORIES (để nguyên) =================

    getCategories: () =>
        api.get(`/admin/categories`).then((r) => r.data),

    createCategory: (c) =>
        api.post(`/admin/categories`, c).then((r) => r.data),

    updateCategory: (id, c) =>
        api.put(`/admin/categories/${id}`, c).then((r) => r.data),

    deleteCategory: (id) =>
        api.delete(`/admin/categories/${id}`).then((r) => r.data),

    // ================= PRODUCT IMAGES (để nguyên) =================

    getProductImages: (productId) =>
        api.get(`/admin/products/${productId}/images`).then((r) => r.data),

    uploadProductImage: (productId, file, asPrimary = true) => {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("AsPrimary", String(asPrimary));
        return api
            .post(`/admin/products/${productId}/images`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            .then((r) => r.data);
    },

    setPrimaryProductImage: (productId, productMediaId) =>
        api
            .post(`/admin/products/${productId}/images/set-primary`, { productMediaId })
            .then((r) => r.data),

    deleteProductImage: (productId, productMediaId) =>
        api.delete(`/admin/products/${productId}/images/${productMediaId}`).then((r) => r.data),
};
