import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminService } from "../../services/adminService";
import "../css/Admin.css";

export default function UserDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const data = await AdminService.getUserById(id);
            setUser(data);
            setLoading(false);
        })();
    }, [id]);

    const handleToggle = async () => {
        await AdminService.toggleUser(id);
        setUser((prev) => ({ ...prev, isActive: !prev.isActive }));
    };

    const handleDelete = async () => {
        if (window.confirm("Bạn có chắc muốn xóa user này không?")) {
            await AdminService.deleteUser(id);
            navigate("/admin/users");
        }
    };

    if (loading) return <p>Đang tải...</p>;
    if (!user) return <p>Không tìm thấy user.</p>;

    return (
        <div className="user-detail">
            <h2>Chi tiết User</h2>

            <div className="user-info">
                <p><b>Họ tên:</b> {user.fullName}</p>
                <p><b>Số điện thoại:</b> {user.phone}</p>
                <p><b>Role:</b> {user.role}</p>
                <p>
                    <b>Trạng thái:</b>{" "}
                    {user.isActive ? "✅ Active" : "⛔ Locked"}
                </p>
            </div>

            <div className="btn-group">
                <button className="btn-primary" onClick={handleToggle}>
                    {user.isActive ? "🔒 Khóa" : "🔓 Mở khóa"}
                </button>
                <button className="btn-danger" onClick={handleDelete}>
                    🗑 Xóa
                </button>
                <button className="btn-secondary" onClick={() => navigate("/admin/users")}>
                    ← Quay lại
                </button>
            </div>
        </div>
    );
}
