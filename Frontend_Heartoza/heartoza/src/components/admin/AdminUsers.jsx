import React, { useEffect, useState } from "react";
import { AdminService } from "../../services/adminService";
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
            <h2>Quản lý User</h2>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID</th><th>Họ tên</th><th>Email</th><th>Role</th><th>Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => (
                        <tr key={u.userId}>
                            <td>{u.userId}</td>
                            <td>{u.fullName}</td>
                            <td>{u.email}</td>
                            <td>{u.role}</td>
                            <td>{u.isActive ? "✅ Active" : "⛔ Locked"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
