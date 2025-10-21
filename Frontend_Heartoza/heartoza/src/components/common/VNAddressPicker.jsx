// src/components/common/VNAddressPicker.jsx
import React from "react";
import { useVNAddress } from "../../hooks/useVNAddress";

/**
 * Props:
 *  value: { provinceCode?: string, wardCode?: string }
 *  onChange: ({ provinceCode, wardCode, provinceName, wardName }) => void
 *  required?: boolean
 *  labels?: { province?: string, ward?: string }
 *  className?: string
 */
export default function VNAddressPicker({
    value = {},
    onChange,
    required = false,
    labels = { province: "Tỉnh/Thành phố", ward: "Phường/Xã" },
    className = "vn-address-picker",
}) {
    const { loading, error, provinces, wardsByProvince } = useVNAddress();

    const provinceCode = value.provinceCode || "";
    const wardCode = value.wardCode || "";
    const wards = provinceCode ? (wardsByProvince[provinceCode] || []) : [];

    const handleProvince = (e) => {
        const code = e.target.value || "";
        const p = provinces.find(x => x.code === code);
        // reset ward khi đổi province
        onChange?.({
            provinceCode: code,
            wardCode: "",
            provinceName: p?.name || "",
            wardName: "",
        });
    };

    const handleWard = (e) => {
        const code = e.target.value || "";
        const w = wards.find(x => x.code === code);
        onChange?.({
            provinceCode,
            wardCode: code,
            provinceName: provinces.find(x => x.code === provinceCode)?.name || "",
            wardName: w?.name || "",
        });
    };

    if (loading) return <div className={className}>Đang tải danh mục địa chỉ…</div>;
    if (error) return <div className={className} style={{ color: "#c62828" }}>Lỗi: {error}</div>;

    return (
        <div className={className}>
            <label>
                {labels.province}
                <select value={provinceCode} onChange={handleProvince} required={required}>
                    <option value="">{`— Chọn ${labels.province} —`}</option>
                    {provinces.map(p => (
                        <option key={p.code} value={p.code}>{p.name}</option>
                    ))}
                </select>
            </label>

            <label>
                {labels.ward}
                <select value={wardCode} onChange={handleWard} required={required} disabled={!provinceCode}>
                    <option value="">{`— Chọn ${labels.ward} —`}</option>
                    {wards.map(w => (
                        <option key={w.code} value={w.code}>{w.name}</option>
                    ))}
                </select>
            </label>
        </div>
    );
}
