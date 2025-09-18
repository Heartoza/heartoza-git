import React, { useState } from "react";
import { AuthService } from "../../services/authService";
import "../css/Auth.css";

export default function ChangePassword() {
    const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
    const [msg, setMsg] = useState("");
    const [err, setErr] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setMsg("");
        setErr("");
        try {
            await AuthService.changePassword(form);
            setMsg("Đổi mật khẩu thành công.");
            setForm({ currentPassword: "", newPassword: "" });
        } catch (error) {
            setErr(
                error?.response?.data ?? "Không thể đổi mật khẩu. Vui lòng thử lại."
            );
        }
    };

    return (
        <div className="auth-container">
            <h2>Đổi mật khẩu</h2>
            <form onSubmit={submit} className="auth-form">
                <input
                    type="password"
                    placeholder="Mật khẩu hiện tại"
                    value={form.currentPassword}
                    onChange={(e) =>
                        setForm((s) => ({ ...s, currentPassword: e.target.value }))
                    }
                    required
                />
                <input
                    type="password"
                    placeholder="Mật khẩu mới"
                    value={form.newPassword}
                    onChange={(e) =>
                        setForm((s) => ({ ...s, newPassword: e.target.value }))
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
