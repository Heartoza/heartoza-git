import React, { useEffect, useState } from "react";
import { AdminService } from "../../services/adminService";
import { NavLink } from "react-router-dom";
import "../css/Admin.css";

export default function AdminUsers() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        (async () => {
            const data = await AdminService.getUsers();
            setUsers(data.items || []);
        })();
    }, []);

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h2>Quản lý User</h2>
            </div>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>STT</th>
                        <th>Họ tên</th>
                        <th>Số điện thoại</th>
                        <th>Role</th>
                        <th>Lần cuối đăng nhập</th>
                        <th>Trạng thái</th>
                        <th>Chi tiết</th>
                    </tr>
                </thead>
                <tbody>
                    {users.length > 0 ? (
                        users.map((u, idx) => (
                            <tr key={u.userId}>
                                <td>{idx + 1}</td>
                                <td>{u.fullName}</td>
                                <td>{u.phone}</td>
                                <td>{u.role}</td>
                                <td>{new Date(u.lastLoginAt).toLocaleString()}</td>
                                <td>{u.isActive ? "✅ Active" : "⛔ Locked"}</td>
                                <td>
                                    <NavLink 
                                        to={`/admin/users/${u.userId}`} 
                                        className="btn-view"
                                    >
                                        Xem
                                    </NavLink>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" className="text-center">
                                Không có user nào.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
