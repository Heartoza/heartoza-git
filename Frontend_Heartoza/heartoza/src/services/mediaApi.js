import http from "./api";
import { AdminService } from "./adminService"; // nếu có

/**
 * Upload 1 file ảnh banner, trả về { mediaId, url }
 * Ưu tiên dùng AdminService.uploadMedia nếu có (ví dụ dùng chung với avatar/product)
 */
export async function uploadImage(file, bannerId = null) {
    // ✅ Nếu dự án đã có AdminService.uploadMedia thì ưu tiên dùng
    if (AdminService && typeof AdminService.uploadMedia === "function") {
        const r = await AdminService.uploadMedia(file);
        return {
            mediaId: r.mediaId ?? r.id ?? r.mediaID ?? r?.data?.mediaId,
            url: r.url ?? r?.data?.url,
        };
    }

    // ✅ Fallback: gọi API banner upload mới
    const form = new FormData();
    form.append("file", file);
    if (bannerId) form.append("bannerId", bannerId); // optional

    const { data } = await http.post("/banners/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
    });

    return {
        mediaId: data.mediaId ?? data.id ?? data.mediaID,
        url: data.url ?? data.downloadUrl ?? data.previewUrl,
    };
}
