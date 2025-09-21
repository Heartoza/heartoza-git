// src/components/customer/VerifyEmail.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function VerifyEmail() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const token = params.get("token");

    const [status, setStatus] = useState("loading"); // loading | success | error | invalid
    const [msg, setMsg] = useState("Đang xác thực...");

    useEffect(() => {
        const verify = async () => {
            if (!token) {
                setStatus("invalid");
                setMsg("Token không hợp lệ.");
                return;
            }
            try {
                // Gọi BE: GET /api/auth/verify-email?token=...
                const { data } = await api.get("/auth/verify-email", { params: { token } });
                setStatus("success");
                setMsg(data?.message || "Xác thực thành công!");
                // tự chuyển về /login sau 2s
                setTimeout(() => navigate("/login", { replace: true }), 2000);
            } catch (err) {
                setStatus("error");
                setMsg(err?.response?.data || "Xác thực thất bại hoặc token đã hết hạn.");
            }
        };
        verify();
    }, [token, navigate]);

    return (
        <div className="auth-container">
            <h2>Xác thực Email</h2>
            <p style={{ marginTop: 8 }}>{msg}</p>

            {status === "loading" && <p>Vui lòng chờ trong giây lát…</p>}

            {status === "success" && (
                <p style={{ marginTop: 12 }}>
                    Sắp đưa bạn về trang đăng nhập… {" "}
                    <Link to="/login">Đăng nhập ngay</Link>
                </p>
            )}

            {status === "error" && (
                <p style={{ marginTop: 12 }}>
                    <Link to="/register">← Quay lại đăng ký</Link>
                </p>
            )}

            {status === "invalid" && (
                <p style={{ marginTop: 12 }}>
                    <Link to="/register">← Quay lại đăng ký</Link>
                </p>
            )}
        </div>
    );
}
