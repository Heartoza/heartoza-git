import React, { useState } from "react";
import { AuthService } from "../../services/authService";
import "../css/Auth.css";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [devToken, setDevToken] = useState("");
    const [reset, setReset] = useState({ token: "", newPassword: "" });
    const [msg, setMsg] = useState("");
    const [err, setErr] = useState("");

    const request = async (e) => {
        e.preventDefault();
        setMsg("");
        setErr("");
        try {
            const res = await AuthService.forgotPassword(email);
            if (res?.token) setDevToken(res.token); // BE dev-mode
            setMsg(res?.message || "Đã gửi hướng dẫn đặt lại mật khẩu.");
        } catch (error) {
            setErr(error?.response?.data ?? "Không thể gửi yêu cầu. Thử lại sau.");
        }
    };

    const doReset = async (e) => {
        e.preventDefault();
        setMsg("");
        setErr("");
        try {
            await AuthService.resetPassword(reset);
            setMsg("Đặt lại mật khẩu thành công. Hãy quay lại trang đăng nhập.");
            setReset({ token: "", newPassword: "" });
        } catch (error) {
            setErr(error?.response?.data ?? "Đặt lại mật khẩu thất bại.");
        }
    };

    return (
        <div className="auth-container">
            <h2>Quên mật khẩu</h2>

            {/* B1: Yêu cầu token */}
            <form onSubmit={request} className="auth-form">
                <input
                    type="email"
                    placeholder="Email của bạn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <button type="submit">Gửi</button>
            </form>

            {devToken && (
                <p className="dev-token">
                    Token (dev): <code>{devToken}</code>
                </p>
            )}

            {/* B2: Reset mật khẩu */}
            <h3 style={{ marginTop: 24 }}>Đặt lại mật khẩu</h3>
            <form onSubmit={doReset} className="auth-form">
                <input
                    placeholder="Token"
                    value={reset.token}
                    onChange={(e) => setReset((s) => ({ ...s, token: e.target.value }))}
                    required
                />
                <input
                    type="password"
                    placeholder="Mật khẩu mới"
                    value={reset.newPassword}
                    onChange={(e) =>
                        setReset((s) => ({ ...s, newPassword: e.target.value }))
                    }
                    required
                />
                <button type="submit">Đổi mật khẩu</button>
            </form>

            {msg && <p className="success-msg">{msg}</p>}
            {err && <p className="error-msg">{String(err)}</p>}
        </div>
    );
}
