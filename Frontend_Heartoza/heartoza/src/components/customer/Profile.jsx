// src/components/customer/Profile.jsx
import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthService } from "../../services/authService";
import { AuthContext } from "../../context/AuthContext";
import "../css/Profile.css"; // chú ý: src/components/css/Profile.css

export default function Profile() {
    const { logout } = useContext(AuthContext);

    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({ fullName: "", phone: "", avatarUrl: "" });
    const [msg, setMsg] = useState("");
    const [err, setErr] = useState("");

    // address modal
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null); // address object or null
    const [addrForm, setAddrForm] = useState({
        fullName: "",
        line1: "",
        district: "",
        city: "",
        country: "Vietnam",
        postalCode: "",
        phone: "",
        isDefault: false,
    });

    const load = async () => {
        try {
            const data = await AuthService.getProfile();
            setMe(data);
            setForm({
                fullName: data.fullName || "",
                phone: data.phone || "",
                avatarUrl: data.avatarUrl || "",
            });
            setErr("");
        } catch (e) {
            setErr(e?.response?.data ?? "Không tải được hồ sơ.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const update = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMsg("");
        setErr("");
        try {
            await AuthService.updateProfile(form);
            setMsg("Đã lưu thay đổi ✨");
            await load();
        } catch (e) {
            setErr(e?.response?.data ?? "Cập nhật thất bại.");
        } finally {
            setSaving(false);
        }
    };

    const openAdd = () => {
        setEditing(null);
        setAddrForm({
            fullName: me?.fullName || "",
            line1: "",
            district: "",
            city: "",
            country: "Vietnam",
            postalCode: "",
            phone: me?.phone || "",
            isDefault: me?.addresses?.length === 0,
        });
        setShowModal(true);
    };

    const openEdit = (a) => {
        setEditing(a);
        setAddrForm({ ...a });
        setShowModal(true);
    };

    const saveAddress = async () => {
        try {
            if (editing) {
                await AuthService.updateAddress(editing.addressId, addrForm);
            } else {
                await AuthService.addAddress(addrForm);
            }
            setShowModal(false);
            await load();
        } catch (e) {
            alert(e?.response?.data ?? "Lưu địa chỉ thất bại.");
        }
    };

    const removeAddress = async (id) => {
        if (!window.confirm("Xoá địa chỉ này?")) return;
        try {
            await AuthService.deleteAddress(id);
            await load();
        } catch (e) {
            alert(e?.response?.data ?? "Xoá thất bại.");
        }
    };

    const setDefault = async (id) => {
        try {
            await AuthService.setDefaultAddress(id);
            await load();
        } catch (e) {
            alert(e?.response?.data ?? "Thiết lập thất bại.");
        }
    };

    if (loading) return <div className="profile-skeleton">Đang tải hồ sơ…</div>;

    return (
        <div className="profile-wrapper">
            <div className="profile-card">
                <div className="profile-top">
                    <div className="avatar">
                        {form.avatarUrl ? (
                            <img src={form.avatarUrl} alt="avatar" />
                        ) : (
                            <div className="avatar-fallback">
                                {(me?.fullName || me?.email || "U")[0]}
                            </div>
                        )}
                    </div>
                    <div className="info">
                        <h2>{me?.fullName || "Người dùng"}</h2>
                        <p>{me?.email}</p>
                        <span className="role-badge">{me?.role}</span>
                    </div>
                    <div className="actions">
                        <Link className="btn light" to="/change-password">
                            Đổi mật khẩu
                        </Link>
                        <button className="btn danger" onClick={logout}>
                            Đăng xuất
                        </button>
                    </div>
                </div>

                <form className="profile-form" onSubmit={update}>
                    <div className="form-row">
                        <label>Họ tên</label>
                        <input
                            value={form.fullName}
                            onChange={(e) =>
                                setForm((s) => ({ ...s, fullName: e.target.value }))
                            }
                            autoComplete="name"
                            required
                        />
                    </div>
                    <div className="form-row">
                        <label>Số điện thoại</label>
                        <input
                            value={form.phone}
                            onChange={(e) =>
                                setForm((s) => ({ ...s, phone: e.target.value }))
                            }
                            autoComplete="tel"
                        />
                    </div>
                    <div className="form-row">
                        <label>Avatar URL</label>
                        <input
                            value={form.avatarUrl}
                            onChange={(e) =>
                                setForm((s) => ({ ...s, avatarUrl: e.target.value }))
                            }
                            placeholder="https://..."
                        />
                    </div>

                    <div className="form-actions">
                        <button className="btn primary" type="submit" disabled={saving}>
                            {saving ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                        {msg && <span className="msg ok">{msg}</span>}
                        {err && <span className="msg err">{String(err)}</span>}
                    </div>
                </form>
            </div>

            <div className="address-card">
                <div className="address-header">
                    <h3>Địa chỉ nhận hàng</h3>
                    <button className="btn primary" onClick={openAdd}>
                        + Thêm địa chỉ
                    </button>
                </div>

                <div className="address-list">
                    {me?.addresses?.length ? (
                        me.addresses.map((a) => (
                            <div
                                key={a.addressId}
                                className={`address-item ${a.isDefault ? "default" : ""}`}
                            >
                                <div className="address-head">
                                    <strong>{a.fullName || me.fullName}</strong>
                                    {a.isDefault && (
                                        <span className="default-badge">Mặc định</span>
                                    )}
                                </div>
                                <div className="address-body">
                                    <div>{a.line1}</div>
                                    <div>
                                        {a.district}, {a.city}
                                    </div>
                                    <div>
                                        {a.country}
                                        {a.postalCode ? ` • ${a.postalCode}` : ""}
                                    </div>
                                    <div>📞 {a.phone || me.phone}</div>
                                </div>
                                <div className="address-actions">
                                    {!a.isDefault && (
                                        <button
                                            className="btn light"
                                            onClick={() => setDefault(a.addressId)}
                                        >
                                            Đặt mặc định
                                        </button>
                                    )}
                                    <button className="btn light" onClick={() => openEdit(a)}>
                                        Sửa
                                    </button>
                                    <button
                                        className="btn danger"
                                        onClick={() => removeAddress(a.addressId)}
                                    >
                                        Xoá
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty">
                            Chưa có địa chỉ nào. Thêm ngay để đặt hàng nhanh hơn!
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h4>{editing ? "Sửa địa chỉ" : "Thêm địa chỉ"}</h4>
                        <div className="grid">
                            <label>
                                Họ tên
                                <input
                                    value={addrForm.fullName || ""}
                                    onChange={(e) =>
                                        setAddrForm((s) => ({ ...s, fullName: e.target.value }))
                                    }
                                />
                            </label>
                            <label>
                                Điện thoại
                                <input
                                    value={addrForm.phone || ""}
                                    onChange={(e) =>
                                        setAddrForm((s) => ({ ...s, phone: e.target.value }))
                                    }
                                />
                            </label>
                            <label>
                                Địa chỉ
                                <input
                                    placeholder="Số nhà, đường…"
                                    value={addrForm.line1 || ""}
                                    onChange={(e) =>
                                        setAddrForm((s) => ({ ...s, line1: e.target.value }))
                                    }
                                />
                            </label>
                            <label>
                                Quận/Huyện
                                <input
                                    value={addrForm.district || ""}
                                    onChange={(e) =>
                                        setAddrForm((s) => ({ ...s, district: e.target.value }))
                                    }
                                />
                            </label>
                            <label>
                                Tỉnh/Thành
                                <input
                                    value={addrForm.city || ""}
                                    onChange={(e) =>
                                        setAddrForm((s) => ({ ...s, city: e.target.value }))
                                    }
                                />
                            </label>
                            <label>
                                Quốc gia
                                <input
                                    value={addrForm.country || "Vietnam"}
                                    onChange={(e) =>
                                        setAddrForm((s) => ({ ...s, country: e.target.value }))
                                    }
                                />
                            </label>
                            <label>
                                Mã bưu chính
                                <input
                                    value={addrForm.postalCode || ""}
                                    onChange={(e) =>
                                        setAddrForm((s) => ({ ...s, postalCode: e.target.value }))
                                    }
                                />
                            </label>
                            <label className="row">
                                <input
                                    type="checkbox"
                                    checked={!!addrForm.isDefault}
                                    onChange={(e) =>
                                        setAddrForm((s) => ({ ...s, isDefault: e.target.checked }))
                                    }
                                />
                                Đặt làm địa chỉ mặc định
                            </label>
                        </div>
                        <div className="modal-actions">
                            <button className="btn light" onClick={() => setShowModal(false)}>
                                Huỷ
                            </button>
                            <button className="btn primary" onClick={saveAddress}>
                                {editing ? "Lưu" : "Thêm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
