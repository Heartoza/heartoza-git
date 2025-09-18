import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthService } from "../../services/authService";
import { AuthContext } from "../../context/AuthContext";
import "../css/Auth.css";

export default function Login() {
    const nav = useNavigate();
    const { login } = React.useContext(AuthContext);

    const [form, setForm] = React.useState({ email: "", password: "" });
    const [err, setErr] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const onChange = (key) => (e) => {
        const v = e.target.value;
        setForm((s) => ({ ...s, [key]: v }));
    };

    const submit = async (e) => {
        e.preventDefault();
        setErr("");
        setLoading(true);
        try {
            const res = await AuthService.login(form);
            const { token, userId, email, fullName, role } = res;
            login(token, { userId, email, fullName, role });

            // 🔑 Phân nhánh sau login
            if (role === "Admin") {
                nav("/admin");
            } else {
                nav("/profile");
            }
        } catch (e) {
            setErr(
                e?.response?.data ?? "Đăng nhập thất bại. Vui lòng kiểm tra thông tin."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>Đăng nhập</h2>
            <form onSubmit={submit}>
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
                    placeholder="Mật khẩu"
                    value={form.password}
                    onChange={onChange("password")}
                    autoComplete="current-password"
                    required
                />

                {err && <p className="auth-message error">{String(err)}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Đang đăng nhập..." : "Login"}
                </button>
            </form>

            <div className="link-group">
                <Link to="/forgot">Quên mật khẩu?</Link> ·{" "}
                <Link to="/register">Tạo tài khoản</Link>
            </div>
        </div>
    );
}
