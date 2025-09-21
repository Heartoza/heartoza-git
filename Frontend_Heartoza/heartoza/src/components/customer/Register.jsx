// src/components/customer/Register.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../../services/authService";
import "../css/Auth.css";

export default function Register() {
    const nav = useNavigate();

    const [form, setForm] = React.useState({
        fullName: "",
        email: "",
        password: "",
        phone: "",
    });
    const [err, setErr] = React.useState("");
    const [ok, setOk] = React.useState(""); // message thành công
    const [loading, setLoading] = React.useState(false);

    const onChange = (key) => (e) =>
        setForm((s) => ({ ...s, [key]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setErr("");
        setOk("");

        // (optional) policy đơn giản phía FE
        if ((form.password || "").length < 8) {
            setErr("Mật khẩu tối thiểu 8 ký tự.");
            return;
        }

        setLoading(true);
        try {
            // BE trả { message: "Đăng ký thành công. Vui lòng kiểm tra email..." }
            const res = await AuthService.register({
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                password: form.password,
                phone: form.phone?.trim(),
            });

            setOk(res?.message || "Đăng ký thành công! Hãy kiểm tra email để xác thực.");
            // KHÔNG gọi login() ở đây. KHÔNG lưu token/user.
            // (optional) tự điều hướng sang login sau 2–3s
            setTimeout(() => nav("/login", { replace: true }), 2500);
        } catch (e) {
            setErr(e?.response?.data ?? "Đăng ký thất bại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>Đăng ký</h2>
            <form onSubmit={submit}>
                <input
                    placeholder="Họ tên"
                    value={form.fullName}
                    onChange={onChange("fullName")}
                    autoComplete="name"
                    required
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={onChange("email")}
                    autoComplete="email"
                    required
                />
                <input
                    type="password"
                    placeholder="Mật khẩu (≥ 8 ký tự)"
                    value={form.password}
                    onChange={onChange("password")}
                    autoComplete="new-password"
                    required
                />
                <input
                    placeholder="SĐT (tuỳ chọn)"
                    value={form.phone}
                    onChange={onChange("phone")}
                    autoComplete="tel"
                />

                {err && <p className="auth-message error">{String(err)}</p>}
                {ok && <p className="auth-message success">{String(ok)}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Đang đăng ký..." : "Register"}
                </button>
            </form>
        </div>
    );
}
