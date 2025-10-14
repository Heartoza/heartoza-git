// src/admin/categories/AdminCategories.jsx
import React, { useEffect, useMemo, useState } from "react";
import { AdminService } from "../../services/adminService";
import "../css/Admin.css";

export default function AdminCategories() {
    const [cats, setCats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            // BE: GET /api/admin/categories (đã có)
            // (nếu muốn có ProductCount: có thể thay bằng endpoint ?includeCounts=true
            // và update AdminService.getCategories() -> thêm qs; để đơn giản giữ nguyên)
            const data = await AdminService.getCategories();
            setCats(Array.isArray(data) ? data : []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const filtered = useMemo(() => {
        if (!q) return cats;
        const k = q.toLowerCase().trim();
        return cats.filter(
            (c) =>
                (c.name || "").toLowerCase().includes(k) ||
                String(c.categoryId).includes(k)
        );
    }, [cats, q]);

    const parentMap = useMemo(() => {
        const m = new Map();
        cats.forEach((c) => m.set(c.categoryId, c.name));
        return m;
    }, [cats]);

    const onCreate = async (payload) => {
        await AdminService.createCategory(payload); // { name, parentId? }
        setCreating(false);
        await load();
    };

    const onUpdate = async (id, payload) => {
        // Update API yêu cầu phân biệt ParentIdHasValue khi muốn set null/root
        // payload dự kiến: { name?, parentIdHasValue: true, parentId: number|null }
        await AdminService.updateCategory(id, payload);
        setEditing(null);
        await load();
    };


    const onDelete = async (id) => {
        // 🛡️ Pre-check trên FE: có category con?
        const hasChildren = cats.some(c => c.parentId === id);
        if (hasChildren) {
            alert("Không thể xóa category cha vì vẫn còn category con. Hãy di chuyển hoặc xóa các category con trước.");
            return;
        }

        if (!window.confirm("Xóa category này?")) return;
        try {
            await AdminService.deleteCategory(id);
            await load();
        } catch (err) {
            // 🧯 Không ném exception ra UI – chỉ hiển thị message gọn gàng
            const resp = err?.response;
            const msg =
                resp?.data?.message ||
                (typeof resp?.data === "string" ? resp.data : null) ||
                (resp?.status === 400
                    ? "Không thể xóa category."
                    : "Đã xảy ra lỗi khi xóa category.");
            alert(msg);
        }
    };


    return (
        <div className="admin-page">
            <div className="admin-header">
                <h2>Quản lý Category</h2>
                <button className="btn primary" onClick={() => setCreating(true)}>
                    + Thêm Category
                </button>
            </div>

            <div className="filters-row">
                <input
                    placeholder="Tìm theo tên hoặc ID…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />
            </div>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th style={{ width: 80 }}>ID</th>
                        <th>Tên</th>
                        <th>Thuộc (Parent)</th>
                        <th style={{ width: 200 }}>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="4" className="text-center">
                                Đang tải…
                            </td>
                        </tr>
                    ) : filtered.length > 0 ? (
                        filtered.map((c) => (
                            <tr key={c.categoryId}>
                                <td>{c.categoryId}</td>
                                <td>{c.name}</td>
                                <td>{c.parentId ? parentMap.get(c.parentId) || `#${c.parentId}` : "—"}</td>
                                <td className="row-actions">
                                    <button className="btn" onClick={() => setEditing(c)}>
                                        Sửa
                                    </button>
                                    <button className="btn danger" onClick={() => onDelete(c.categoryId)}>
                                        Xóa
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" className="text-center">
                                Chưa có category nào.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {creating && (
                <CategoryForm
                    title="Thêm Category"
                    categories={cats}
                    onClose={() => setCreating(false)}
                    onSubmit={onCreate}
                />
            )}

            {editing && (
                <CategoryForm
                    title="Sửa Category"
                    categories={cats}
                    initial={editing}
                    onClose={() => setEditing(null)}
                    onSubmit={(payload) =>
                        onUpdate(editing.categoryId, payload)
                    }
                    isEdit
                />
            )}
        </div>
    );
}

function CategoryForm({ title, categories, initial, onClose, onSubmit, isEdit }) {
    const [name, setName] = useState(initial?.name || "");
    const [parentId, setParentId] = useState(
        initial?.parentId === undefined ? "" : initial?.parentId ?? ""
    );
    const [saving, setSaving] = useState(false);

    const submit = async () => {
        if (!name.trim()) {
            alert("Tên category không được để trống.");
            return;
        }
        setSaving(true);
        try {
            if (isEdit) {
                // luôn gửi ParentIdHasValue để đảm bảo có thể đẩy về root (null)
                await onSubmit({
                    name: name.trim(),
                    parentIdHasValue: true,
                    parentId: parentId === "" ? null : Number(parentId),
                });
            } else {
                await onSubmit({
                    name: name.trim(),
                    // với Create, BE chấp nhận không có parentId => root
                    ...(parentId === "" ? {} : { parentId: Number(parentId) }),
                });
            }
        } finally {
            setSaving(false);
        }
    };

    // chặn chọn chính nó làm parent
    const options = categories.filter((c) => c.categoryId !== initial?.categoryId);

    return (
        <div className="modal-backdrop">
            <div className="modal">
                <h3>{title}</h3>
                <div className="form">
                    <label>Tên</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={200}
                        placeholder="Ví dụ: Hộp quà, Phụ kiện, ..."
                    />

                    <label>Parent</label>
                    <select
                        value={parentId}
                        onChange={(e) => setParentId(e.target.value)}
                    >
                        <option value="">(Không có — Root)</option>
                        {options.map((c) => (
                            <option key={c.categoryId} value={c.categoryId}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="actions">
                    <button className="btn ghost" onClick={onClose}>
                        Huỷ
                    </button>
                    <button className="btn primary" onClick={submit} disabled={saving}>
                        {saving ? "Đang lưu..." : "Lưu"}
                    </button>
                </div>
            </div>
        </div>
    );
}
