import React, { useEffect, useState } from "react";
import { AdminService } from "../../services/adminService";

export default function ProductImagesModal({ product, onClose }) {
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);

    const load = async () => {
        const list = await AdminService.getProductImages(product.productId);
        setImages(list || []);
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

    const onPick = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) return alert("File không phải ảnh.");
        if (file.size > 8 * 1024 * 1024) return alert("Ảnh > 8MB.");

        setUploading(true);
        try {
            await AdminService.uploadProductImage(product.productId, file, images.length === 0 /* primary if first */);
            await load();
        } catch {
            alert("Upload thất bại.");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const setPrimary = async (pmId) => {
        await AdminService.setPrimaryProductImage(product.productId, pmId);
        await load();
    };

    const remove = async (pmId) => {
        if (!window.confirm("Xoá ảnh này?")) return;
        await AdminService.deleteProductImage(product.productId, pmId);
        await load();
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal wide" onClick={(e) => e.stopPropagation()}>
                <h3>Ảnh sản phẩm — {product.name}</h3>

                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                    <label className="btn ghost">
                        <input type="file" accept="image/*" hidden onChange={onPick} />
                        {uploading ? "Đang tải..." : "📤 Tải ảnh lên"}
                    </label>
                    <span style={{ opacity: .7, fontSize: 12 }}>PNG/JPG/WEBP • ≤ 8MB</span>
                </div>

                {images?.length ? (
                    <div className="img-grid">
                        {images.map(img => (
                            <div key={img.productMediaId} className={`img-card ${img.isPrimary ? "primary" : ""}`}>
                                <img src={img.url} alt="" />
                                <div className="img-actions">
                                    {!img.isPrimary && (
                                        <button className="btn ghost" onClick={() => setPrimary(img.productMediaId)}>Đặt làm ảnh chính</button>
                                    )}
                                    <button className="btn danger" onClick={() => remove(img.productMediaId)}>Xoá</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty">Chưa có ảnh nào.</div>
                )}

                <div className="modal-actions">
                    <button className="btn" onClick={onClose}>Đóng</button>
                </div>
            </div>
        </div>
    );
}
