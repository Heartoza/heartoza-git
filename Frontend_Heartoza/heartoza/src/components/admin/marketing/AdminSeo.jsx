import React, { useEffect, useState } from "react";
import { adminListSeo, adminCreateSeo, adminUpdateSeo, adminDeleteSeo, adminGetSeo } from "../../../services/marketingApi";

export default function AdminSeo() {
    const [items, setItems] = useState([]);
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
        slug: "/", title: "", description: "", keywords: "",
        imageMediaId: "", ogImageUrl: "", canonicalUrl: "", noIndex: false, noFollow: false
    });

    const load = async () => {
        setLoading(true);
        try {
            const data = await adminListSeo({ page, pageSize, q: q || undefined });
            setItems(data.items || []);
            setTotal(data.total || 0);
        } finally { setLoading(false); }
    };
    useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, q]);

    const resetForm = () => {
        setEditingId(null);
        setForm({
            slug: "/", title: "", description: "", keywords: "",
            imageMediaId: "", ogImageUrl: "", canonicalUrl: "", noIndex: false, noFollow: false
        });
    };

    const onEdit = async (id) => {
        const s = await adminGetSeo(id);
        setEditingId(id);
        setForm({
            slug: s.slug || "/",
            title: s.title || "",
            description: s.description || "",
            keywords: s.keywords || "",
            imageMediaId: s.imageMediaId ?? "",
            ogImageUrl: s.ogImageUrl || "",
            canonicalUrl: s.canonicalUrl || "",
            noIndex: !!s.noIndex,
            noFollow: !!s.noFollow
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const onDelete = async (id) => {
        if (!window.confirm("Xóa SEO meta này?")) return;
        await adminDeleteSeo(id);
        load();
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            imageMediaId: form.imageMediaId ? Number(form.imageMediaId) : null
        };
        if (editingId) await adminUpdateSeo(editingId, payload);
        else await adminCreateSeo(payload);
        resetForm(); load();
    };

    return (
        <div className="admin-page">
            <div className="admin-head">
                <h2>Marketing → SEO Meta</h2>
                <div className="searchbar">
                    <input placeholder="Tìm slug/title…" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
                    <span className="status-badge info">Tổng: {total}</span>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="form" style={{ background: "#fff", padding: 16, borderRadius: 12, marginBottom: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                        <label>Slug*</label>
                        <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} required />
                        <div style={{ fontSize: 12, color: "#777" }}>Ví dụ: /, /qua-valentine, /san-pham/123</div>
                    </div>
                    <div>
                        <label>Title</label>
                        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                    </div>

                    <div style={{ gridColumn: "1 / span 2" }}>
                        <label>Description</label>
                        <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                    </div>

                    <div>
                        <label>Keywords</label>
                        <input value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} />
                    </div>

                    <div>
                        <label>ImageMediaId (ưu tiên)</label>
                        <input value={form.imageMediaId} onChange={e => setForm(f => ({ ...f, imageMediaId: e.target.value }))} />
                    </div>

                    <div>
                        <label>OgImageUrl (fallback)</label>
                        <input value={form.ogImageUrl} onChange={e => setForm(f => ({ ...f, ogImageUrl: e.target.value }))} />
                    </div>

                    <div>
                        <label>CanonicalUrl</label>
                        <input value={form.canonicalUrl} onChange={e => setForm(f => ({ ...f, canonicalUrl: e.target.value }))} />
                    </div>

                    <div className="switch">
                        <input type="checkbox" checked={form.noIndex} onChange={e => setForm(f => ({ ...f, noIndex: e.target.checked }))} />
                        <span>NoIndex</span>
                    </div>
                    <div className="switch">
                        <input type="checkbox" checked={form.noFollow} onChange={e => setForm(f => ({ ...f, noFollow: e.target.checked }))} />
                        <span>NoFollow</span>
                    </div>
                </div>

                <div className="actions">
                    {editingId && <button type="button" className="btn ghost" onClick={resetForm}>Hủy</button>}
                    <button className="btn primary" type="submit">{editingId ? "Cập nhật" : "Tạo SEO meta"}</button>
                </div>
            </form>

            {/* List */}
            {loading ? (
                <div className="loading-text">Đang tải…</div>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th><th>Slug</th><th>Title</th><th>NoIndex/NoFollow</th><th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(it => (
                            <tr key={it.seoMetaId}>
                                <td>{it.seoMetaId}</td>
                                <td>{it.slug}</td>
                                <td>{it.title}</td>
                                <td>{it.noIndex ? "noindex" : ""} {it.noFollow ? "nofollow" : ""}</td>
                                <td>
                                    <div className="row-actions">
                                        <button className="btn" onClick={() => onEdit(it.seoMetaId)}>Sửa</button>
                                        <button className="btn danger" onClick={() => onDelete(it.seoMetaId)}>Xóa</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!items.length && <tr><td colSpan="5" className="text-center">Không có dữ liệu.</td></tr>}
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
