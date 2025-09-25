import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthService } from "../../services/authService";
import { AuthContext } from "../../context/AuthContext";
import "../css/Auth.css";

export default function Login() {
    const nav = useNavigate();
    const { login, user } = React.useContext(AuthContext);

    const [form, setForm] = React.useState({ email: "", password: "" });
    const [err, setErr] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    // Nếu đã đăng nhập, tự redirect
    React.useEffect(() => {
        if (!user) return;
        if (user.role === "Admin") nav("/admin", { replace: true });
        else nav("/profile", { replace: true });
    }, [user, nav]);

    // JS thuần: bỏ kiểu TS
    const onChange = (key) => (e) => {
        setForm((s) => ({ ...s, [key]: e.target.value }));
    };

    const submit = async (e) => {
        e.preventDefault();
        setErr("");
        setLoading(true);
        try {
            const res = await AuthService.login(form);
            const { token, refreshToken, userId, email, fullName, role } = res;

            // Lưu token + refreshToken
            login(token, { userId, email, fullName, role }, refreshToken);

            // Điều hướng sau login
            if (role === "Admin") nav("/admin", { replace: true });
            else nav("/profile", { replace: true });
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
