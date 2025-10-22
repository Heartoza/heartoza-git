import React, { useEffect, useState } from "react";
import {
    adminListVouchers, adminCreateVoucher, adminUpdateVoucher, adminDeleteVoucher, adminGetVoucher
} from "../../../services/marketingApi";

export default function AdminVouchers() {
    const [items, setItems] = useState([]);
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [pageSize] = useState(20);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
        code: "", name: "",
        discountType: "percent", discountValue: 0,
        maxDiscount: "", minOrder: "",
        startAt: "", endAt: "", isActive: true,
        usageLimit: "", perUserLimit: ""
    });

    const load = async () => {
        setLoading(true);
        try {
            const data = await adminListVouchers({ page, pageSize, q: q || undefined });
            setItems(data.items || []);
            setTotal(data.total || 0);
        } finally { setLoading(false); }
    };
    useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, q]);

    const resetForm = () => {
        setEditingId(null);
        setForm({
            code: "", name: "",
            discountType: "percent", discountValue: 0,
            maxDiscount: "", minOrder: "",
            startAt: "", endAt: "", isActive: true,
            usageLimit: "", perUserLimit: ""
        });
    };

    const onEdit = async (id) => {
        const v = await adminGetVoucher(id);
        setEditingId(id);
        setForm({
            code: v.code || "",
            name: v.name || "",
            discountType: v.discountType || "percent",
            discountValue: v.discountValue || 0,
            maxDiscount: v.maxDiscount ?? "",
            minOrder: v.minOrder ?? "",
            startAt: v.startAt ? v.startAt.substring(0, 16) : "",
            endAt: v.endAt ? v.endAt.substring(0, 16) : "",
            isActive: !!v.isActive,
            usageLimit: v.usageLimit ?? "",
            perUserLimit: v.perUserLimit ?? ""
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const onDelete = async (id) => {
        if (!window.confirm("Xóa voucher này?")) return;
        await adminDeleteVoucher(id);
        load();
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            discountValue: Number(form.discountValue) || 0,
            maxDiscount: form.maxDiscount === "" ? null : Number(form.maxDiscount),
            minOrder: form.minOrder === "" ? null : Number(form.minOrder),
            usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
            perUserLimit: form.perUserLimit === "" ? null : Number(form.perUserLimit),
            startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
            endAt: form.endAt ? new Date(form.endAt).toISOString() : null
        };
        if (editingId) await adminUpdateVoucher(editingId, payload);
        else await adminCreateVoucher(payload);
        resetForm(); load();
    };

    return (
        <div className="admin-page">
            <div className="admin-head">
                <h2>Marketing → Vouchers</h2>
                <div className="searchbar">
                    <input placeholder="Tìm code/name…" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
                    <span className="status-badge info">Tổng: {total}</span>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="form" style={{ background: "#fff", padding: 16, borderRadius: 12, marginBottom: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                        <label>Code*</label>
                        <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required />
                    </div>
                    <div>
                        <label>Name</label>
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                        <label>Discount Type</label>
                        <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}>
                            <option value="percent">percent</option>
                            <option value="amount">amount</option>
                        </select>
                    </div>
                    <div>
                        <label>Discount Value</label>
                        <input type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} />
                    </div>
                    <div>
                        <label>Max Discount</label>
                        <input type="number" value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))} />
                    </div>
                    <div>
                        <label>Min Order</label>
                        <input type="number" value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))} />
                    </div>
                    <div>
                        <label>Start UTC</label>
                        <input type="datetime-local" value={form.startAt} onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))} />
                    </div>
                    <div>
                        <label>End UTC</label>
                        <input type="datetime-local" value={form.endAt} onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))} />
                    </div>
                    <div>
                        <label>Usage Limit</label>
                        <input type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} />
                    </div>
                    <div>
                        <label>Per User Limit</label>
                        <input type="number" value={form.perUserLimit} onChange={e => setForm(f => ({ ...f, perUserLimit: e.target.value }))} />
                    </div>
                    <div className="switch">
                        <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                        <span>Active</span>
                    </div>
                </div>

                <div className="actions">
                    {editingId && <button type="button" className="btn ghost" onClick={resetForm}>Hủy</button>}
                    <button className="btn primary" type="submit">{editingId ? "Cập nhật" : "Tạo voucher"}</button>
                </div>
            </form>

            {/* List */}
            {loading ? (
                <div className="loading-text">Đang tải…</div>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th><th>Code</th><th>Type</th><th>Value</th><th>Active</th><th>Used/Limit</th><th>Thời gian</th><th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(it => (
                            <tr key={it.voucherId}>
                                <td>{it.voucherId}</td>
                                <td>{it.code}</td>
                                <td>{it.discountType}</td>
                                <td>{it.discountValue}</td>
                                <td>{it.isActive ? "✅" : "⛔"}</td>
                                <td>{(it.usageCount || 0)} / {(it.usageLimit ?? "∞")}</td>
                                <td>
                                    {(it.startAt ? new Date(it.startAt).toLocaleString() : "—")} → {(it.endAt ? new Date(it.endAt).toLocaleString() : "—")}
                                </td>
                                <td>
                                    <div className="row-actions">
                                        <button className="btn" onClick={() => onEdit(it.voucherId)}>Sửa</button>
                                        <button className="btn danger" onClick={() => onDelete(it.voucherId)}>Xóa</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!items.length && <tr><td colSpan="8" className="text-center">Không có dữ liệu.</td></tr>}
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
