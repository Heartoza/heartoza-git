// src/components/customer/Sessions.jsx
import React from "react";
import { AuthService } from "../../services/authService";

export default function Sessions() {
    const [list, setList] = React.useState([]);
    const [msg, setMsg] = React.useState("");
    const [err, setErr] = React.useState("");

    const load = async () => {
        setErr(""); setMsg("");
        try {
            const data = await AuthService.listSessions();
            setList(data);
        } catch (e) {
            setErr(e?.response?.data ?? "Không tải được danh sách phiên.");
        }
    };

    React.useEffect(() => { load(); }, []);

    const revoke = async (id) => {
        try {
            await AuthService.revokeSession(id);
            setMsg("Đã thu hồi phiên.");
            await load();
        } catch (e) { setErr(e?.response?.data ?? "Thu hồi thất bại."); }
    };

    const logoutAll = async () => {
        try {
            await AuthService.logoutAll();
            setMsg("Đã đăng xuất khỏi tất cả thiết bị.");
            await load();
        } catch (e) { setErr(e?.response?.data ?? "Thao tác thất bại."); }
    };

    return (
        <div className="profile-container" style={{ padding: 24 }}>
            <h2>Phiên đăng nhập</h2>
            <div style={{ marginBottom: 12 }}>
                <button className="btn danger" onClick={logoutAll}>Đăng xuất tất cả thiết bị</button>
            </div>
            {msg && <p className="profile-message success">{msg}</p>}
            {err && <p className="profile-message">{err}</p>}

            <div className="address-list">
                {list.length ? list.map(s => (
                    <div key={s.refreshTokenId} className="address-item">
                        <div className="address-head">
                            <strong>#{s.refreshTokenId}</strong>
                            {s.revokedAt ? <span className="default-badge" style={{ background: '#999' }}>Revoked</span> : null}
                        </div>
                        <div className="address-body">
                            <div>UA: {s.userAgent || "-"}</div>
                            <div>IP: {s.ip || "-"}</div>
                            <div>Tạo: {new Date(s.createdAt).toLocaleString()}</div>
                            <div>Hết hạn: {new Date(s.expiresAt).toLocaleString()}</div>
                        </div>
                        <div className="address-actions">
                            {!s.revokedAt && <button className="btn danger" onClick={() => revoke(s.refreshTokenId)}>Thu hồi</button>}
                        </div>
                    </div>
                )) : <div className="empty">Không có phiên nào.</div>}
            </div>
        </div>
    );
}
