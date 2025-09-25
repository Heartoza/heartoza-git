import React, { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../../utils/api";

export default function ResetPassword() {
    const [params] = useSearchParams();
    const token = params.get("token");
    const [pw, setPw] = useState("");
    const [msg, setMsg] = useState("");

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post("/auth/reset", { token, newPassword: pw });
            setMsg("Đổi mật khẩu thành công! Hãy đăng nhập lại.");
        } catch (err) {
            setMsg(err.response?.data || "Có lỗi xảy ra.");
        }
    };

    if (!token) return <p>Token không hợp lệ.</p>;

    return (
        <form onSubmit={onSubmit}>
            <h2>Đặt lại mật khẩu</h2>
            <input
                type="password"
                placeholder="Mật khẩu mới"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                required
            />
            <button type="submit">Đổi mật khẩu</button>
            <p>{msg}</p>
            <Link to="/login">Về trang đăng nhập</Link>
        </form>
    );
}
