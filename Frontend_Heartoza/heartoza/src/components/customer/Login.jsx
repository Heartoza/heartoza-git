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

    // resend verify state
    const [canResend, setCanResend] = React.useState(false);
    const [resendMsg, setResendMsg] = React.useState("");
    const [resendLoading, setResendLoading] = React.useState(false);

    React.useEffect(() => {
        if (!user) return;
        if (user.role === "Admin") nav("/admin", { replace: true });
        else nav("/profile", { replace: true });
    }, [user, nav]);

    const onChange = (key) => (e) => {
        setForm((s) => ({ ...s, [key]: e.target.value }));
    };

    const submit = async (e) => {
        e.preventDefault();
        setErr("");
        setResendMsg("");
        setCanResend(false);
        setLoading(true);
        try {
            const res = await AuthService.login(form);
            const { token, refreshToken, userId, email, fullName, role } = res;
            login(token, { userId, email, fullName, role }, refreshToken);
            nav(role === "Admin" ? "/admin" : "/profile", { replace: true });
        } catch (e) {
            const msg =
                e?.response?.data ??
                "Đăng nhập thất bại. Vui lòng kiểm tra thông tin.";
            setErr(msg);

            // nếu chưa xác thực email → show nút resend
            if (typeof msg === "string" && msg.includes("chưa xác thực")) {
                setCanResend(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const resend = async () => {
        setResendMsg("");
        setResendLoading(true);
        try {
            if (!form.email.trim()) {
                setResendMsg("Vui lòng nhập email trước khi gửi lại.");
            } else {
                const r = await AuthService.resendVerify(form.email.trim());
                setResendMsg(r?.message || "Đã gửi lại email xác thực. Check mail nha!");
            }
        } catch (e) {
            setResendMsg(e?.response?.data || "Không thể gửi lại email xác thực.");
        } finally {
            setResendLoading(false);
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

                {canResend && (
                    <div className="resend-verify-wrap">
                        <button
                            type="button"
                            className="linklike"
                            onClick={resend}
                            disabled={resendLoading}
                        >
                            {resendLoading ? "Đang gửi..." : "Gửi lại email xác thực"}
                        </button>
                        {resendMsg && <p className="auth-message success">{resendMsg}</p>}
                    </div>
                )}

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
