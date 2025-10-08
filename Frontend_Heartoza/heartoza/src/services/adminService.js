import api from "./api";

export const AdminService = {
    getUsers: (page = 1, pageSize = 20) =>
        api.get(`/admin/users?page=${page}&pageSize=${pageSize}`).then(r => r.data),

    toggleUser: (id) =>
        api.post(`/admin/users/${id}/toggle`).then(r => r.data),

    getOrders: (page = 1, pageSize = 20) =>
        api.get(`/admin/orders?page=${page}&pageSize=${pageSize}`).then(r => r.data),

    getUserById: (id) =>
        api.get(`/admin/users/${id}`).then(r => r.data),

    deleteUser: (id) =>
        api.delete(`/admin/users/${id}`).then(r => r.data),
    
    getOrderById: (id) =>
    api.get(`/admin/orders/${id}`).then(r => r.data),

  updateOrderStatus: (id, status) =>
    api.post(`/admin/orders/${id}/status`, JSON.stringify(status), {
      headers: { "Content-Type": "application/json" },
    }).then(r => r.data),

    getProducts: (page = 1, pageSize = 20, q = "") =>
        api.get(`/admin/products?page=${page}&pageSize=${pageSize}&q=${q}`).then(r => r.data),

    getProductById: (id) =>
        api.get(`/admin/products/${id}`).then(r => r.data),

    createProduct: (p) =>
        api.post(`/admin/products`, p).then(r => r.data),

    updateProduct: (id, p) =>
        api.put(`/admin/products/${id}`, p).then(r => r.data),

    deleteProduct: (id) =>
        api.delete(`/admin/products/${id}`).then(r => r.data),

    getCategories: () =>
        api.get(`/admin/categories`).then(r => r.data),

    createCategory: (c) =>
        api.post(`/admin/categories`, c).then(r => r.data),

    updateCategory: (id, c) =>
        api.put(`/admin/categories/${id}`, c).then(r => r.data),

    deleteCategory: (id) =>
        api.delete(`/admin/categories/${id}`).then(r => r.data),
    // Images of product
    getProductImages: (productId) =>
        api.get(`/admin/products/${productId}/images`).then(r => r.data),

    uploadProductImage: (productId, file, asPrimary = true) => {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("AsPrimary", String(asPrimary));
        return api.post(`/admin/products/${productId}/images`, fd, {
            headers: { "Content-Type": "multipart/form-data" }
        }).then(r => r.data);
    },

    setPrimaryProductImage: (productId, productMediaId) =>
        api.post(`/admin/products/${productId}/images/set-primary`, { productMediaId })
            .then(r => r.data),

    deleteProductImage: (productId, productMediaId) =>
        api.delete(`/admin/products/${productId}/images/${productMediaId}`)
            .then(r => r.data),

};
