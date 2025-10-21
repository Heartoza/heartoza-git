import React, { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../../services/api";
import "../css/Auth.css";

export default function ResetPassword() {
    const [params] = useSearchParams();
    const token = params.get("token");
    const [pw, setPw] = useState("");
    const [msg, setMsg] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    if (!token) {
        return (
            <div className="auth-container">
                <h2>Đặt lại mật khẩu</h2>
                <p className="error-msg">Token không hợp lệ hoặc thiếu token.</p>
                <Link to="/forgot">← Quay lại Quên mật khẩu</Link>
            </div>
        );
    }

    const onSubmit = async (e) => {
        e.preventDefault();
        setMsg("");
        setErr("");
        setLoading(true);
        try {
            await api.post("/auth/reset", { token, newPassword: pw });
            setMsg("Đổi mật khẩu thành công! Hãy đăng nhập lại.");
        } catch (error) {
            setErr(error?.response?.data || "Có lỗi xảy ra.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>Đặt lại mật khẩu</h2>
            <form onSubmit={onSubmit} className="auth-form">
                <input
                    type="password"
                    placeholder="Mật khẩu mới (≥ 8 ký tự)"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    required
                    autoComplete="new-password"
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Đang đổi..." : "Đổi mật khẩu"}
                </button>
            </form>

            {msg && <p className="success-msg">{msg}</p>}
            {err && <p className="error-msg">{String(err)}</p>}
            <div style={{ marginTop: 8 }}>
                <Link to="/login">Về trang đăng nhập</Link>
            </div>
        </div>
    );
}
