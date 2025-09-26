// src/components/customer/VerifyEmail.jsx
import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../css/Auth.css";

export default function VerifyEmail() {
    const [params] = useSearchParams();
    const navigate = useNavigate();

    const token = (params.get("token") || "").trim();
    const auto = params.get("auto") === "1"; // muốn auto thì thêm ?auto=1 vào link

    const [status, setStatus] = useState("idle"); // idle | loading | success | error | invalid
    const [msg, setMsg] = useState("");
    const callingRef = useRef(false); // chặn double-call trong StrictMode

    const doVerify = async () => {
        if (!token) {
            setStatus("invalid");
            setMsg("Không tìm thấy token xác thực.");
            return;
        }
        if (callingRef.current) return; // ĐÃ gọi rồi thì thôi
        callingRef.current = true;

        setStatus("loading");
        setMsg("Đang xác thực…");

        try {
            const { data } = await api.get("/auth/verify-email", { params: { token } });
            setStatus("success");
            setMsg(data?.message || "Xác thực thành công!");
            setTimeout(() => navigate("/login", { replace: true }), 2000);
        } catch (err) {
            const text = err?.response?.data || "Xác thực thất bại hoặc token đã hết hạn.";
            setStatus("error");
            setMsg(text);
        }
    };

    // Chỉ auto-verify khi có ?auto=1
    useEffect(() => {
        if (auto) doVerify();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auto, token]);

    return (
        <div className="auth-container">
            <h2>Xác thực Email</h2>

            {/* Trạng thái ban đầu / thủ công */}
            {status === "idle" && (
                <div style={{ textAlign: "center" }}>
                    <p>Mã xác thực đã được đính kèm trong liên kết.</p>
                    <p style={{ fontSize: 14, color: "#666" }}>
                        Token: {token ? token.slice(0, 10) + "..." : "Không có"}
                    </p>
                    <button className="btn primary" onClick={doVerify} disabled={!token}>
                        Xác thực ngay
                    </button>
                </div>
            )}

            {status === "loading" && (
                <p style={{ textAlign: "center" }}>🔍 Đang xác thực token…</p>
            )}

            {status === "success" && (
                <div style={{ textAlign: "center", color: "green" }}>
                    <p>✅ {msg}</p>
                    <p>Đang chuyển hướng đến trang đăng nhập…</p>
                    <Link to="/login" style={{ display: "block", marginTop: 10 }}>
                        Đăng nhập ngay
                    </Link>
                </div>
            )}

            {(status === "error" || status === "invalid") && (
                <div style={{ textAlign: "center", color: "red" }}>
                    <p>❌ {msg}</p>
                    <div style={{ marginTop: 20 }}>
                        <Link to="/register" style={{ marginRight: 15 }}>
                            ← Đăng ký lại
                        </Link>
                        <Link to="/forgot">Gửi lại email xác thực</Link>
                    </div>
                </div>
            )}
        </div>
    );
}
