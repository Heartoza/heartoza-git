import React, { useState } from "react";
import { AuthService } from "../../services/authService";
import "../css/Auth.css";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [msg, setMsg] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setMsg("");
        setErr("");
        setLoading(true);
        try {
            const res = await AuthService.forgotPassword(email.trim());
            setMsg(res?.message || "Đã gửi hướng dẫn đặt lại mật khẩu. Check mail nha!");
        } catch (error) {
            setErr(error?.response?.data ?? "Không thể gửi yêu cầu. Thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>Quên mật khẩu</h2>
            <form onSubmit={submit} className="auth-form">
                <input
                    type="email"
                    placeholder="Email của bạn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Đang gửi..." : "Gửi hướng dẫn"}
                </button>
            </form>

            {msg && <p className="success-msg">{msg}</p>}
            {err && <p className="error-msg">{String(err)}</p>}
        </div>
    );
}
