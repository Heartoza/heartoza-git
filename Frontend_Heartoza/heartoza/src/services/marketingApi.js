import http from "./api"; // ✅ client chung của anh

// ===== BANNERS =====
export const getActiveBanners = (position) =>
    http.get(`/banners/active`, { params: { position } }).then(r => r.data);

export const adminListBanners = (params) =>
    http.get(`/banners`, { params }).then(r => r.data);

export const adminGetBanner = (id) =>
    http.get(`/banners/${id}`).then(r => r.data);

export const adminCreateBanner = (payload) =>
    http.post(`/banners`, payload).then(r => r.data);

export const adminUpdateBanner = (id, payload) =>
    http.put(`/banners/${id}`, payload).then(r => r.data);

export const adminDeleteBanner = (id) =>
    http.delete(`/banners/${id}`).then(r => r.data);

// ===== VOUCHERS =====
export const adminListVouchers = (params) =>
    http.get(`/vouchers`, { params }).then(r => r.data);

export const adminGetVoucher = (id) =>
    http.get(`/vouchers/${id}`).then(r => r.data);

export const adminCreateVoucher = (payload) =>
    http.post(`/vouchers`, payload).then(r => r.data);

export const adminUpdateVoucher = (id, payload) =>
    http.put(`/vouchers/${id}`, payload).then(r => r.data);

export const adminDeleteVoucher = (id) =>
    http.delete(`/vouchers/${id}`).then(r => r.data);

export const validateVoucher = (code, orderSubtotal, userId) =>
    http.post(`/vouchers/validate`, { code, orderSubtotal, userId }).then(r => r.data);

export const applyVoucher = (code, orderSubtotal, userId, orderId) =>
    http.post(`/vouchers/apply`, { code, orderSubtotal, userId, orderId }).then(r => r.data);

// ===== SEO =====
export const getSeoMeta = (slug) =>
    http.get(`/seo/meta`, { params: { slug } }).then(r => r.data);

export const adminListSeo = (params) =>
    http.get(`/seo`, { params }).then(r => r.data);

export const adminGetSeo = (id) =>
    http.get(`/seo/${id}`).then(r => r.data);

export const adminCreateSeo = (payload) =>
    http.post(`/seo`, payload).then(r => r.data);

export const adminUpdateSeo = (id, payload) =>
    http.put(`/seo/${id}`, payload).then(r => r.data);

export const adminDeleteSeo = (id) =>
    http.delete(`/seo/${id}`).then(r => r.data);
