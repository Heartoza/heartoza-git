import React from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../../services/authService";
import { AuthContext } from "../../context/AuthContext";
import "../css/Auth.css";

export default function Register() {
    const nav = useNavigate();
    const { login } = React.useContext(AuthContext);

    const [form, setForm] = React.useState({
        fullName: "",
        email: "",
        password: "",
        phone: "",
    });
    const [err, setErr] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const onChange =
        (key) =>
            (e) => {
                const v = e.target.value;
                setForm((s) => ({ ...s, [key]: v }));
            };

    const submit = async (e) => {
        e.preventDefault();
        setErr("");
        setLoading(true);
        try {
            const res = await AuthService.register(form);
            const { token, userId, email, fullName, role } = res;
            login(token, { userId, email, fullName, role });
            nav("/profile");
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
                    placeholder="Mật khẩu (≥ 6 ký tự)"
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

                <button type="submit" disabled={loading}>
                    {loading ? "Đang đăng ký..." : "Register"}
                </button>
            </form>
        </div>
    );
}
