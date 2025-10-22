import React, { useState } from "react";
import { validateVoucher, applyVoucher } from "../../services/marketingApi";
// userId: lấy từ auth context/local storage tùy app anh

export default function VoucherBox({ orderSubtotal, userId, onApplied }) {
    const [code, setCode] = useState("");
    const [hint, setHint] = useState("");
    const [busy, setBusy] = useState(false);

    const onValidate = async () => {
        setBusy(true);
        setHint("");
        try {
            const res = await validateVoucher(code, orderSubtotal, userId);
            if (!res.valid) {
                setHint(res.reason || "Mã không hợp lệ.");
            } else {
                setHint(`Áp dụng được: giảm ${Number(res.discount || 0).toLocaleString()}đ`);
            }
        } catch {
            setHint("Lỗi khi kiểm tra mã.");
        } finally {
            setBusy(false);
        }
    };

    const onApply = async () => {
        setBusy(true);
        setHint("");
        try {
            const res = await applyVoucher(code, orderSubtotal, userId, null);
            setHint(`Đã áp dụng: -${Number(res.discount || 0).toLocaleString()}đ`);
            if (onApplied) onApplied({ code, discount: res.discount || 0 });
        } catch (e) {
            setHint("Không áp dụng được mã.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="voucher-box">
            <input
                className="voucher-input"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã giảm giá"
            />
            <button onClick={onValidate} disabled={!code || busy} className="voucher-btn outline">
                Kiểm tra
            </button>
            <button onClick={onApply} disabled={!code || busy} className="voucher-btn primary">
                Áp dụng
            </button>

            {!!hint && (
                <div
                    className={
                        "voucher-hint " +
                        (hint.toLowerCase().includes("đã áp dụng") ? "success" :
                            hint.toLowerCase().includes("không") || hint.toLowerCase().includes("lỗi") ? "error" : "muted")
                    }
                >
                    {hint}
                </div>
            )}
        </div>
    );

}
