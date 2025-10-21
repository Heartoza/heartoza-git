// src/components/customer/Profile.jsx
import React, { useEffect, useState, useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import { AuthService } from "../../services/authService";
import { AuthContext } from "../../context/AuthContext";
import "../css/Profile.css";
import VNAddressPicker from "../common/VNAddressPicker";
import { getVNAddressData } from "../../hooks/useVNAddress";

/* ---------- Tiny Toast system (no library) ---------- */
function Toast({ id, type = "info", message, onClose }) {
    const styles = {
        base: {
            width: "min(420px, 90vw)",
            borderRadius: 12,
            padding: "10px 12px",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 8,
            alignItems: "start",
            border: "1px solid rgba(0,0,0,.06)",
            boxShadow: "0 10px 30px rgba(0,0,0,.10)",
            background: "#fff",
            color: "#111827",
        },
        success: { borderColor: "#16a34a33" },
        error: { borderColor: "#dc262633" },
        info: { borderColor: "#3b82f633" },
        btn: {
            background: "transparent",
            border: "0",
            color: "inherit",
            cursor: "pointer",
            opacity: 0.8,
            padding: "2px 6px",
        },
    };
    return (
        <div style={styles.base}>
            <div>{message}</div>
            <button aria-label="Đóng" onClick={() => onClose(id)} style={styles.btn}>
                ✕
            </button>
        </div>
    );
}

function useToasts() {
    const [toasts, setToasts] = useState([]);
    const addToast = (message, type = "info", ms = 2400) => {
        const id = crypto.randomUUID();
        setToasts((t) => [...t, { id, message, type }]);
        if (ms) setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ms);
    };
    const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));
    const Container = useMemo(
        () =>
            ({ children }) => (
                <div
                    aria-live="polite"
                    style={{
                        position: "fixed",
                        right: 16,
                        bottom: 16,
                        display: "grid",
                        gap: 10,
                        zIndex: 60,
                    }}
                >
                    {toasts.map((t) => (
                        <Toast key={t.id} {...t} onClose={removeToast} />
                    ))}
                    {children}
                </div>
            ),
        [toasts]
    );
    return { addToast, ToastContainer: Container };
}
/* ---------------------------------------------------- */

export default function Profile() {
    const { logout } = useContext(AuthContext);

    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({ fullName: "", phone: "" });
    const [msg, setMsg] = useState("");
    const [err, setErr] = useState("");

    // toast
    const { addToast, ToastContainer } = useToasts();

    // avatar preview
    const [previewFile, setPreviewFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // address modal
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [addrForm, setAddrForm] = useState({
        fullName: "",
        line1: "",
        district: "", // sẽ là tên Phường/Xã (FAKE)
        city: "", // sẽ là tên Tỉnh/Thành
        country: "Vietnam",
        postalCode: "",
        phone: "",
        isDefault: false,
    });

    // 2 dropdown theo mô hình mới
    const [provinceCode, setProvinceCode] = useState(""); // code Tỉnh/Thành
    const [wardCode, setWardCode] = useState(""); // code Phường/Xã

    const load = async () => {
        try {
            const data = await AuthService.getProfile();
            setMe(data);
            setForm({
                fullName: data.fullName || "",
                phone: data.phone || "",
            });
            setErr("");
        } catch (e) {
            const m = e?.response?.data ?? "Không tải được hồ sơ.";
            setErr(m);
            addToast(m, "error");
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
            addToast("Đã lưu thay đổi ✨", "success");
            await load();
        } catch (e2) {
            const m = e2?.response?.data ?? "Cập nhật thất bại.";
            setErr(m);
            addToast(m, "error");
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
        setProvinceCode("");
        setWardCode("");
        setShowModal(true);
    };

    const openEdit = async (a) => {
        setEditing(a);
        setAddrForm({ ...a });
        setShowModal(true);

        // Map tên city/district → code để hiển thị đúng trong dropdown
        try {
            const data = await getVNAddressData();
            const norm = (s) => (s || "").trim().toLowerCase();
            const p = data.provinces.find((x) => norm(x.name) === norm(a.city));
            if (p) {
                setProvinceCode(p.code);
                const wards = data.wardsByProvince[p.code] || [];
                const w = wards.find((x) => norm(x.name) === norm(a.district));
                setWardCode(w ? w.code : "");
            } else {
                setProvinceCode("");
                setWardCode("");
            }
        } catch {
            setProvinceCode("");
            setWardCode("");
        }
    };

    const saveAddress = async () => {
        try {
            // validate phone
            const phone = (addrForm.phone || "").trim();
            if (!/^[0-9+()\s-]{8,}$/.test(phone)) {
                addToast("Vui lòng nhập số điện thoại hợp lệ cho địa chỉ.", "error");
                return;
            }
            // validate chọn tỉnh/phường
            if (!provinceCode || !wardCode) {
                addToast("Vui lòng chọn đầy đủ Tỉnh/Thành và Phường/Xã.", "error");
                return;
            }

            // Tra tên theo code (để gửi text cho BE, giữ nguyên schema DB)
            const data = await getVNAddressData();
            const province = data.provinces.find((p) => p.code === provinceCode);
            const ward =
                (data.wardsByProvince[provinceCode] || []).find((w) => w.code === wardCode) ||
                null;

            const payload = {
                ...addrForm,
                city: province?.name || addrForm.city,
                district: ward?.name || addrForm.district, // district = tên Phường/Xã (FAKE)
            };

            if (editing) {
                await AuthService.updateAddress(editing.addressId, payload);
                addToast("Đã cập nhật địa chỉ.", "success");
            } else {
                await AuthService.addAddress(payload);
                addToast("Đã thêm địa chỉ mới.", "success");
            }
            setShowModal(false);
            await load();
        } catch (e) {
            addToast(e?.response?.data ?? "Lưu địa chỉ thất bại.", "error");
        }
    };

    const removeAddress = async (id) => {
        if (!window.confirm("Xoá địa chỉ này?")) return;
        try {
            await AuthService.deleteAddress(id);
            addToast("Đã xoá địa chỉ.", "success");
            await load();
        } catch (e) {
            addToast(e?.response?.data ?? "Xoá thất bại.", "error");
        }
    };

    const setDefault = async (id) => {
        try {
            await AuthService.setDefaultAddress(id);
            addToast("Đã đặt địa chỉ mặc định.", "success");
            await load();
        } catch (e) {
            addToast(e?.response?.data ?? "Thiết lập thất bại.", "error");
        }
    };

    // open preview when file chosen
    const onPickAvatar = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            addToast("File không phải hình ảnh.", "error");
            return;
        }
        if (file.size > 3 * 1024 * 1024) {
            addToast("Ảnh quá lớn (>3MB).", "error");
            return;
        }
        setPreviewFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const confirmUploadAvatar = async () => {
        if (!previewFile) return;
        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append("file", previewFile);
            await AuthService.uploadAvatar(formData);
            addToast("Đã cập nhật ảnh đại diện.", "success");
            setPreviewFile(null);
            setPreviewUrl("");
            await load();
        } catch {
            addToast("Tải ảnh thất bại.", "error");
        } finally {
            setUploadingAvatar(false);
        }
    };

    const cancelPreview = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
        setPreviewFile(null);
    };

    if (loading) return <div className="profile-skeleton">Đang tải hồ sơ…</div>;

    return (
        <>
            <div className="profile-wrapper" aria-live="polite">
                {/* Header card */}
                <div className="profile-card">
                    <div className="profile-top">
                        <div className="avatar" aria-label="Ảnh đại diện">
                            {me?.avatar?.url ? (
                                <img src={me.avatar.url} alt="Ảnh đại diện" />
                            ) : (
                                <div className="avatar-fallback" aria-hidden>
                                    {(me?.fullName || me?.email || "U")[0]}
                                </div>
                            )}
                        </div>

                        <div className="top-main">
                            <div className="top-line">
                                <div className="identity">
                                    <h2 className="fullname">{me?.fullName || "Người dùng"}</h2>
                                    <span className="role-badge">{me?.role}</span>
                                </div>
                                <div className="actions">
                                    <Link className="btn ghost" to="/change-password">
                                        Đổi mật khẩu
                                    </Link>
                                    <button className="btn danger" onClick={logout} aria-label="Đăng xuất">
                                        Đăng xuất
                                    </button>
                                </div>
                            </div>

                            <p className="email">{me?.email}</p>

                            <div className="avatar-actions" style={{ display: "flex", gap: 8, marginTop: 10 }}>
                                <label className="btn ghost file-btn">
                                    <input type="file" accept="image/*" hidden onChange={onPickAvatar} />
                                    📤 Tải ảnh lên <span className="hint">(tối đa 3MB)</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content 2 cột */}
                <div className="content-grid">
                    {/* Form */}
                    <div className="profile-card">
                        <h3 className="section-title">Thông tin cá nhân</h3>
                        <form className="profile-form" onSubmit={update}>
                            <div className="form-row">
                                <label htmlFor="fullName">Họ tên</label>
                                <input
                                    id="fullName"
                                    value={form.fullName}
                                    onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
                                    autoComplete="name"
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <label htmlFor="phone">Số điện thoại</label>
                                <input
                                    id="phone"
                                    inputMode="tel"
                                    pattern="^[0-9+()\\s-]{8,}$"
                                    value={form.phone}
                                    onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                                    autoComplete="tel"
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

                    {/* Addresses */}
                    <div className="address-card">
                        <div className="address-header">
                            <h3 className="section-title">Địa chỉ nhận hàng</h3>
                            <button className="btn primary" onClick={openAdd}>+ Thêm địa chỉ</button>
                        </div>

                        <div className="address-list">
                            {me?.addresses?.length ? (
                                me.addresses.map((a) => (
                                    <div key={a.addressId} className={`address-item ${a.isDefault ? "default" : ""}`}>
                                        <div className="address-head">
                                            <strong>{a.fullName || me.fullName}</strong>
                                            {a.isDefault && <span className="default-badge">Mặc định</span>}
                                        </div>
                                        <div className="address-body">
                                            <div>{a.line1}</div>
                                            <div>{a.district}, {a.city}</div>
                                            <div>{a.country}{a.postalCode ? ` • ${a.postalCode}` : ""}</div>
                                            <div>📞 {a.phone || me.phone}</div>
                                        </div>
                                        <div className="address-actions">
                                            {!a.isDefault && !!(a.phone || "").trim() && (
                                                <button className="btn ghost" onClick={() => setDefault(a.addressId)}>
                                                    Đặt mặc định
                                                </button>
                                            )}
                                            <button className="btn ghost" onClick={() => openEdit(a)}>Sửa</button>
                                            <button className="btn danger" onClick={() => removeAddress(a.addressId)}>Xoá</button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty">Chưa có địa chỉ nào. Thêm ngay để đặt hàng nhanh hơn!</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Address Modal */}
                {showModal && (
                    <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <h4>{editing ? "Sửa địa chỉ" : "Thêm địa chỉ"}</h4>
                            <div className="grid">
                                <label>
                                    Họ tên
                                    <input
                                        value={addrForm.fullName || ""}
                                        onChange={(e) => setAddrForm((s) => ({ ...s, fullName: e.target.value }))}
                                    />
                                </label>

                                <label>
                                    Điện thoại
                                    <input
                                        value={addrForm.phone || ""}
                                        onChange={(e) => setAddrForm((s) => ({ ...s, phone: e.target.value }))}
                                    />
                                </label>

                                <label className="row">
                                    Địa chỉ (Số nhà, đường…)
                                    <input
                                        placeholder="Số nhà, đường…"
                                        value={addrForm.line1 || ""}
                                        onChange={(e) => setAddrForm((s) => ({ ...s, line1: e.target.value }))}
                                    />
                                </label>

                                <div className="full">
                                    <VNAddressPicker
                                        value={{ provinceCode, wardCode }}
                                        onChange={({ provinceCode, wardCode, provinceName, wardName }) => {
                                            setProvinceCode(provinceCode);
                                            setWardCode(wardCode);
                                            // Ghi TEXT vào form để gửi về BE (giữ schema cũ)
                                            setAddrForm((s) => ({
                                                ...s,
                                                city: provinceName,   // Tỉnh/Thành
                                                district: wardName,   // Phường/Xã (FAKE district)
                                            }));
                                        }}
                                        required
                                        labels={{ province: "Tỉnh/Thành phố", ward: "Phường/Xã" }}
                                    />
                                </div>

                                <label>
                                    Quốc gia
                                    <input
                                        value={addrForm.country || "Vietnam"}
                                        onChange={(e) => setAddrForm((s) => ({ ...s, country: e.target.value }))}
                                    />
                                </label>

                                <label>
                                    Mã bưu chính
                                    <input
                                        value={addrForm.postalCode || ""}
                                        onChange={(e) => setAddrForm((s) => ({ ...s, postalCode: e.target.value }))}
                                    />
                                </label>

                                <label className="row">
                                    <input
                                        type="checkbox"
                                        checked={!!addrForm.isDefault}
                                        onChange={(e) => setAddrForm((s) => ({ ...s, isDefault: e.target.checked }))}
                                    />
                                    Đặt làm địa chỉ mặc định
                                </label>
                            </div>

                            <div className="modal-actions">
                                <button className="btn ghost" onClick={() => setShowModal(false)}>Huỷ</button>
                                <button className="btn primary" onClick={saveAddress}>
                                    {editing ? "Lưu" : "Thêm"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Avatar Preview Modal */}
                {!!previewUrl && (
                    <div className="modal-backdrop" onClick={cancelPreview}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <h4>Xem trước ảnh đại diện</h4>
                            <div style={{ display: "grid", placeItems: "center", marginBottom: 12 }}>
                                <img
                                    src={previewUrl}
                                    alt="Xem trước"
                                    style={{ width: 180, height: 180, borderRadius: "999px", objectFit: "cover", border: "1px solid #e5e7eb" }}
                                />
                            </div>
                            <div className="modal-actions">
                                <button className="btn ghost" onClick={cancelPreview} disabled={uploadingAvatar}>Huỷ</button>
                                <button className="btn primary" onClick={confirmUploadAvatar} disabled={uploadingAvatar}>
                                    {uploadingAvatar ? "Đang tải..." : "Lưu ảnh"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Toasts (fixed bottom-right) */}
            <ToastContainer />
        </>
    );
}
