import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthService } from "../../services/authService";
import { AuthContext } from "../../context/AuthContext";
import "../css/Profile.css"; // đúng đường dẫn: src/components/css/Profile.css

export default function Profile() {
    const { logout } = useContext(AuthContext);

    const [me, setMe] = useState(null);
    const [form, setForm] = useState({ fullName: "", phone: "" });
    const [msg, setMsg] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const data = await AuthService.getProfile();
                setMe(data);
                setForm({ fullName: data.fullName || "", phone: data.phone || "" });
            } catch (e) {
                setErr(e?.response?.data ?? "Không tải được hồ sơ.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const update = async (e) => {
        e.preventDefault();
        setMsg("");
        setErr("");
        setSaving(true);
        try {
            await AuthService.updateProfile(form);
            setMsg("Cập nhật hồ sơ thành công.");
        } catch (e) {
            setErr(e?.response?.data ?? "Cập nhật thất bại. Thử lại sau.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: 24 }}>Đang tải...</div>;

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h2>Hồ sơ</h2>
                <p>
                    <b>{me?.fullName}</b> — {me?.email}
                </p>
            </div>

            <div className="profile-role">Role: {me?.role}</div>

            <form className="profile-form" onSubmit={update}>
                <input
                    placeholder="Họ tên"
                    value={form.fullName}
                    onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
                    autoComplete="name"
                    required
                />
                <input
                    placeholder="Số điện thoại"
                    value={form.phone}
                    onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                    autoComplete="tel"
                />

                <button type="submit" disabled={saving}>
                    {saving ? "Đang lưu..." : "Lưu"}
                </button>

                {msg && <p className="profile-message success">{msg}</p>}
                {err && <p className="profile-message">{String(err)}</p>}
            </form>

            <div className="profile-actions">
                <Link to="/change-password">Đổi mật khẩu</Link>
                <button onClick={logout}>Đăng xuất</button>
            </div>
        </div>
    );
}
