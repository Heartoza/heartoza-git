import React, { useMemo } from "react";
import { useVNAddress } from "../../hooks/useVNAddress";

/**
 * Props:
 * - value: { provinceCode, districtCode }
 * - onChange: ({ provinceCode, districtCode }) => void
 * - disabled?: boolean
 * - labels?: { province?: string, district?: string }
 * - required?: boolean
 */
export default function VNAddressPicker({
    value,
    onChange,
    disabled = false,
    labels = {},
    required = false,
}) {
    const { loading, provinces } = useVNAddress();
    const provinceCode = value?.provinceCode || "";
    const districtCode = value?.districtCode || "";

    const districts = useMemo(() => {
        const p = provinces.find((x) => x.code === provinceCode);
        return p?.districts || [];
    }, [provinces, provinceCode]);

    const handleProvince = (e) => {
        const p = e.target.value;
        // reset district khi đổi tỉnh
        onChange?.({ provinceCode: p, districtCode: "" });
    };

    const handleDistrict = (e) => {
        const d = e.target.value;
        onChange?.({ provinceCode, districtCode: d });
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
                <label style={{ display: "block", marginBottom: 6 }}>
                    {labels.province || "Tỉnh/Thành phố"}
                </label>
                <select
                    value={provinceCode}
                    onChange={handleProvince}
                    disabled={disabled || loading}
                    required={required}
                    style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                    }}
                >
                    <option value="">— Chọn Tỉnh/TP —</option>
                    {provinces.map((p) => (
                        <option key={p.code} value={p.code}>
                            {p.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label style={{ display: "block", marginBottom: 6 }}>
                    {labels.district || "Quận/Huyện"}
                </label>
                <select
                    value={districtCode}
                    onChange={handleDistrict}
                    disabled={disabled || loading || !provinceCode}
                    required={required}
                    style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                    }}
                >
                    <option value="">— Chọn Quận/Huyện (Cũ) —</option>
                    {districts.map((d) => (
                        <option key={d.code} value={d.code}>
                            {d.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
