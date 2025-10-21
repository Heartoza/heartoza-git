// src/admin/users/AdminUsers.jsx
import React, { useEffect, useMemo, useState } from "react";
import { AdminService } from "../../services/adminService";
import "../css/Admin.css";

const ROLES = ["Admin", "Staff", "Customer"];

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [filters, setFilters] = useState({
        q: "",
        role: "",
        active: undefined,
        page: 1,
        pageSize: 20,
        sort: "createdAt_desc",
    });

    const load = async () => {
        setLoading(true);
        try {
            const data = await AdminService.getUsers({
                q: filters.q,
                role: filters.role || undefined,
                active: filters.active,
                page: filters.page,
                pageSize: filters.pageSize,
                sort: filters.sort,
            });
            setUsers(data.items || []);
            setTotal(data.total || 0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(); // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(filters)]);

    const totalPages = useMemo(() => {
        const size = filters.pageSize || 20;
        return Math.max(1, Math.ceil((total || 0) / size));
    }, [total, filters.pageSize]);

    const toggle = async (u) => {
        const willLock = !!u.isActive;
        if (willLock && !window.confirm("Khóa tài khoản này?")) return;
        const res = await AdminService.toggleUser(u.userId);
        setUsers((prev) => prev.map((x) => (x.userId === u.userId ? { ...x, isActive: res.isActive } : x)));
    };

    const onSave = async (id, payload) => {
        const updated = await AdminService.updateUser(id, payload);
        setUsers((prev) => prev.map((u) => (u.userId === id ? { ...u, ...updated } : u)));
        setEditing(null);
        alert("Đã lưu thay đổi.");
    };

    const fmt = (s) => (s ? new Date(s).toLocaleString() : "—");

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h2>Quản lý User</h2>
            </div>

            {/* Filters */}
            <div className="filters-row">
                <input
                    placeholder="Tìm tên/email…"
                    value={filters.q || ""}
                    onChange={(e) => setFilters({ ...filters, q: e.target.value, page: 1 })}
                />
                <select
                    value={filters.role || ""}
                    onChange={(e) => setFilters({ ...filters, role: e.target.value || undefined, page: 1 })}
                >
                    <option value="">Tất cả role</option>
                    {ROLES.map((r) => (
                        <option key={r} value={r}>
                            {r}
                        </option>
                    ))}
                </select>
                <select
                    value={filters.active === undefined ? "" : String(filters.active)}
                    onChange={(e) => {
                        const v = e.target.value;
                        setFilters({ ...filters, active: v === "" ? undefined : v === "true", page: 1 });
                    }}
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Đã khóa</option>
                </select>
                <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
                    <option value="createdAt_desc">Mới nhất</option>
                    <option value="createdAt_asc">Cũ nhất</option>
                    <option value="name_asc">Tên A→Z</option>
                    <option value="name_desc">Tên Z→A</option>
                    <option value="email_asc">Email A→Z</option>
                    <option value="email_desc">Email Z→A</option>
                </select>
            </div>

            {/* Table */}
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>STT</th>
                        <th>Họ tên</th>
                        <th>Email</th>
                        <th>Số điện thoại</th>
                        <th>Role</th>
                        <th>Lần cuối đăng nhập</th>
                        <th>Trạng thái</th>
                        <th style={{ width: 180 }}>Điều chỉnh</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="8" className="text-center">
                                Đang tải…
                            </td>
                        </tr>
                    ) : users.length > 0 ? (
                        users.map((u, idx) => (
                            <tr key={u.userId}>
                                <td>{(filters.page - 1) * (filters.pageSize || 20) + idx + 1}</td>
                                <td>{u.fullName || "—"}</td>
                                <td>{u.email}</td>
                                <td>{u.phone || "—"}</td>
                                <td>
                                    <span className={`badge badge-${String(u.role || "").toLowerCase()}`}>{u.role}</span>
                                </td>
                                <td>{fmt(u.lastLoginAt)}</td>
                                <td>{u.isActive ? "✅ Active" : "⛔ Locked"}</td>
                                <td className="actions">
                                    <button className="btn" onClick={() => setEditing(u)}>
                                        Sửa
                                    </button>
                                    <button className="btn danger" onClick={() => toggle(u)}>
                                        {u.isActive ? "Khóa" : "Mở khóa"}
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="8" className="text-center">
                                Không có user nào.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination">
                <button disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>
                    «
                </button>
                <span>
                    {filters.page} / {totalPages}
                </span>
                <button
                    disabled={filters.page >= totalPages}
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                >
                    »
                </button>
            </div>

            {editing && (
                <EditUserDialog
                    user={editing}
                    onClose={() => setEditing(null)}
                    onSave={onSave}
                />
            )}
        </div>
    );
}

function EditUserDialog({ user, onClose, onSave }) {
    const [fullName, setFullName] = useState(user.fullName || "");
    const [phone, setPhone] = useState(user.phone || "");
    const [role, setRole] = useState(user.role || "Customer");
    const [isActive, setIsActive] = useState(!!user.isActive);
    const [saving, setSaving] = useState(false);

    const submit = async () => {
        setSaving(true);
        try {
            await onSave(user.userId, { fullName, phone, role, isActive });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal">
                <h3>Chỉnh sửa người dùng</h3>
                <div className="form">
                    <label>Email</label>
                    <input value={user.email} disabled />

                    <label>Họ tên</label>
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={200} />

                    <label>Số điện thoại</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />

                    <label>Role</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)}>
                        {ROLES.map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>

                    <label className="switch">
                        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                        <span>Đang hoạt động</span>
                    </label>
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
