import React, { useEffect, useState } from "react";
import {
    adminListBanners, adminDeleteBanner, adminCreateBanner, adminUpdateBanner, adminGetBanner
} from "../../../services/marketingApi";
import BannerImagePicker from "../../../components/admin/media/BannerImagePicker";

const POSITIONS = ["home-top", "home-mid", "sidebar", "footer", "checkout-top", "cart-sidebar"];

export default function AdminBanners() {
    const [items, setItems] = useState([]);
    const [position, setPosition] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [pageSize] = useState(20);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
        title: "", mediaId: "", externalImageUrl: "",
        position: "home-top",
        sortOrder: 0, linkUrl: "", openInNewTab: true,
        isActive: true, startAt: "", endAt: ""
    });

    const load = async () => {
        setLoading(true);
        try {
            const data = await adminListBanners({ page, pageSize, position: position || undefined });
            setItems(data.items || []);
            setTotal(data.total || 0);
        } finally { setLoading(false); }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, position]);

    const resetForm = () => {
        setEditingId(null);
        setForm({
            title: "", mediaId: "", externalImageUrl: "",
            position: "home-top", sortOrder: 0, linkUrl: "",
            openInNewTab: true, isActive: true, startAt: "", endAt: ""
        });
    };

    const onEdit = async (id) => {
        const b = await adminGetBanner(id);
        setEditingId(id);
        setForm({
            title: b.title || "",
            mediaId: b.mediaId || "",
            externalImageUrl: b.externalImageUrl || "",
            position: b.position || "home-top",
            sortOrder: b.sortOrder || 0,
            linkUrl: b.linkUrl || "",
            openInNewTab: !!b.openInNewTab,
            isActive: !!b.isActive,
            startAt: b.startAt ? b.startAt.substring(0, 16) : "",
            endAt: b.endAt ? b.endAt.substring(0, 16) : ""
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const onDelete = async (id) => {
        if (!window.confirm("Xóa banner này?")) return;
        await adminDeleteBanner(id);
        load();
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            mediaId: form.mediaId ? Number(form.mediaId) : null,
            sortOrder: Number(form.sortOrder) || 0,
            startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
            endAt: form.endAt ? new Date(form.endAt).toISOString() : null
        };
        if (editingId) await adminUpdateBanner(editingId, payload);
        else await adminCreateBanner(payload);
        resetForm(); load();
    };

    return (
        <div className="admin-page">
            <div className="admin-head">
                <h2>Marketing → Banners</h2>
                <div className="searchbar">
                    <select value={position} onChange={e => { setPosition(e.target.value); setPage(1); }}>
                        <option value="">Tất cả vị trí</option>
                        {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <span className="status-badge info">Tổng: {total}</span>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="form" style={{ background: "#fff", padding: 16, borderRadius: 12, marginBottom: 20 }}>
                <BannerImagePicker
                    value={{
                        mediaId: form.mediaId || null,
                        url: form.externalImageUrl || null
                    }}
                    onChange={(v) => {
                        if (v && v.mediaId) {
                            // dùng ảnh blob trong hệ thống
                            setForm(f => ({ ...f, mediaId: String(v.mediaId), externalImageUrl: "" }));
                        } else if (v && v.url) {
                            // fallback dùng ảnh URL ngoài
                            setForm(f => ({ ...f, mediaId: "", externalImageUrl: v.url }));
                        } else {
                            // clear
                            setForm(f => ({ ...f, mediaId: "", externalImageUrl: "" }));
                        }
                    }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                        <label>Tiêu đề</label>
                        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div>
                        <label>Vị trí</label>
                        <select value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}>
                            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    {!form.mediaId && (
                        <div>
                            <label>ExternalImageUrl</label>
                            <input value={form.externalImageUrl} onChange={e => setForm(f => ({ ...f, externalImageUrl: e.target.value }))} />
                        </div>
                    )}
                    {!form.externalImageUrl && (
                        <div>
                            <label>MediaId (ảnh blob)</label>
                            <input value={form.mediaId} onChange={e => setForm(f => ({ ...f, mediaId: e.target.value }))} />
                        </div>
                    )}
                    <div>
                        <label>Link khi click</label>
                        <input value={form.linkUrl} onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))} />
                    </div>
                    <div>
                        <label>Sort</label>
                        <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} />
                    </div>
                    <div className="switch">
                        <input type="checkbox" checked={form.openInNewTab} onChange={e => setForm(f => ({ ...f, openInNewTab: e.target.checked }))} />
                        <span>Bật tab mới</span>
                    </div>
                    <div className="switch">
                        <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                        <span>Active</span>
                    </div>
                    <div>
                        <label>Start UTC</label>
                        <input type="datetime-local" value={form.startAt} onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))} />
                    </div>
                    <div>
                        <label>End UTC</label>
                        <input type="datetime-local" value={form.endAt} onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))} />
                    </div>
                </div>

                <div className="actions">
                    {editingId && <button type="button" className="btn ghost" onClick={resetForm}>Hủy</button>}
                    <button className="btn primary" type="submit">{editingId ? "Cập nhật" : "Tạo banner"}</button>
                </div>
            </form>

            {/* List */}
            {loading ? (
                <div className="loading-text">Đang tải…</div>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th><th>Tiêu đề</th><th>Vị trí</th><th>Sort</th><th>Active</th><th>Khoảng thời gian</th><th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(it => (
                            <tr key={it.bannerId}>
                                <td>{it.bannerId}</td>
                                <td>{it.title}</td>
                                <td>{it.position}</td>
                                <td>{it.sortOrder}</td>
                                <td>{it.isActive ? "✅" : "⛔"}</td>
                                <td>
                                    {(it.startAt ? new Date(it.startAt).toLocaleString() : "—")} → {(it.endAt ? new Date(it.endAt).toLocaleString() : "—")}
                                </td>
                                <td>
                                    <div className="row-actions">
                                        <button className="btn" onClick={() => onEdit(it.bannerId)}>Sửa</button>
                                        <button className="btn danger" onClick={() => onDelete(it.bannerId)}>Xóa</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!items.length && <tr><td colSpan="7" className="text-center">Không có dữ liệu.</td></tr>}
                    </tbody>
                </table>
            )}

            <div className="pagination">
                <button className="btn ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Trước</button>
                <span>Trang {page}</span>
                <button className="btn ghost" disabled={page * pageSize >= total} onClick={() => setPage(p => p + 1)}>Sau →</button>
            </div>
        </div>
    );
}
