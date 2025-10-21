import React, { useRef, useState } from "react";
import { uploadImage } from "../../../services/mediaApi";
import "../../css/Admin.css";

export default function BannerImagePicker({ value, onChange }) {
    const inputRef = useRef(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const previewUrl = value?.url || value?.imageUrl;

    const onPick = () => inputRef.current?.click();

    const onFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError("");
        if (!file.type.startsWith("image/")) {
            setError("Vui lòng chọn file ảnh (jpg, png, webp…).");
            return;
        }
        if (file.size > 6 * 1024 * 1024) {
            setError("Ảnh > 6MB, vui lòng nén nhỏ hơn.");
            return;
        }
        try {
            setBusy(true);
            const res = await uploadImage(file);
            if (!res?.mediaId) throw new Error("Upload không trả về mediaId");
            onChange?.({ mediaId: res.mediaId, url: res.url });
        } catch (err) {
            setError("Tải ảnh thất bại. Thử lại nhé.");
            console.error(err);
        } finally {
            setBusy(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    const clearImg = () => onChange?.(null);

    return (
        <div className="form-card" style={{
            background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb"
        }}>
            <div className="admin-head" style={{ marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>🖼️ Ảnh banner</h3>
                <div />
            </div>

            {previewUrl ? (
                <div className="image-preview-grid" style={{ gridTemplateColumns: "1fr" }}>
                    <div className="preview-card primary">
                        <img src={previewUrl} alt="banner" />
                        <span className="primary-badge">Preview</span>
                    </div>
                </div>
            ) : (
                <div style={{
                    padding: "32px 16px", textAlign: "center",
                    background: "#fafafa", borderRadius: 8, border: "2px dashed #d1d5db", marginBottom: 12
                }}>
                    <div style={{ fontSize: 42, opacity: .5, marginBottom: 8 }}>📷</div>
                    <div style={{ color: "#9ca3af" }}>Chưa có ảnh banner</div>
                </div>
            )}

            {!!error && (
                <div style={{
                    margin: "8px 0 0", padding: "8px 10px",
                    background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b", fontSize: 13
                }}>
                    {error}
                </div>
            )}

            <div className="actions" style={{ marginTop: 12 }}>
                <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFile} />
                <button type="button" className="btn" onClick={onPick} disabled={busy}>
                    {busy ? "⏳ Đang tải…" : (previewUrl ? "Đổi ảnh…" : "Tải ảnh lên")}
                </button>
                {previewUrl && (
                    <button type="button" className="btn danger" onClick={clearImg} disabled={busy}>
                        Xóa ảnh
                    </button>
                )}
            </div>

            <p className="form-hint" style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
                Gợi ý: 1920×600 (home-top), 1200×300 (home-mid), ≤ 6MB.
            </p>
        </div>
    );
}
