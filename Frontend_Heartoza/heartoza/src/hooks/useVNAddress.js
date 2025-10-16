// src/hooks/useVNAddress.js
import { useEffect, useMemo, useState } from "react";

// Nguồn dữ liệu chính thức (đã bạn gửi)
const DATA_URL =
    "https://cdn.jsdelivr.net/npm/vietnam-address-database@1.0.0/address.json";

// Cache Promise ở scope module để chỉ tải 1 lần cho toàn app
let _cachePromise = null;

/** Tải & build index cho dữ liệu địa chỉ VN (2 cấp: Tỉnh/Thành -> Phường/Xã) */
export function getVNAddressData() {
    if (_cachePromise) return _cachePromise;

    _cachePromise = fetch(DATA_URL)
        .then((r) => {
            if (!r.ok) throw new Error("Failed to load VN address database");
            return r.json();
        })
        .then(buildIndex);

    return _cachePromise;
}

/** Chuyển JSON gốc thành structures dễ dùng */
function buildIndex(json) {
    const provincesTable = json.find(
        (x) => x.type === "table" && x.name === "provinces"
    );
    const wardsTable = json.find((x) => x.type === "table" && x.name === "wards");

    const provincesRaw = provincesTable?.data || [];
    const wardsRaw = wardsTable?.data || [];

    const provinces = provincesRaw.map((p) => ({
        code: p.province_code, // "01", "79", ...
        name: p.short_name || p.name, // ưu tiên short_name nếu có
    }));

    // group wards theo province_code
    const wardsByProvince = {};
    for (const w of wardsRaw) {
        const pcode = w.province_code;
        (wardsByProvince[pcode] ||= []).push({
            code: w.ward_code, // "00004", ...
            name: w.name, // "Phường ... / Xã ..."
        });
    }

    // sort theo tiếng Việt
    const collator = new Intl.Collator("vi");
    provinces.sort((a, b) => collator.compare(a.name, b.name));
    Object.values(wardsByProvince).forEach((arr) =>
        arr.sort((a, b) => collator.compare(a.name, b.name))
    );

    return { provinces, wardsByProvince };
}

/** Hook tiện dùng trên UI */
export function useVNAddress() {
    const [state, setState] = useState({
        provinces: [],
        wardsByProvince: {},
        loading: true,
        error: null,
    });

    useEffect(() => {
        let alive = true;
        getVNAddressData()
            .then((data) => {
                if (!alive) return;
                setState({ ...data, loading: false, error: null });
            })
            .catch((err) => {
                if (!alive) return;
                setState((s) => ({ ...s, loading: false, error: err }));
            });
        return () => {
            alive = false;
        };
    }, []);

    const helpers = useMemo(
        () => ({
            getProvinceName: (code) =>
                state.provinces.find((p) => p.code === code)?.name || "",
            getWardName: (provinceCode, wardCode) =>
                (state.wardsByProvince[provinceCode] || []).find(
                    (w) => w.code === wardCode
                )?.name || "",
        }),
        [state.provinces, state.wardsByProvince]
    );

    return { ...state, ...helpers };
}
