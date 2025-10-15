import { useEffect, useMemo, useState } from "react";

/**
 * useVNAddress
 * - Tải dữ liệu tỉnh/thành (tinh_tp.json) và quận/huyện (quan_huyen.json) từ hanhchinhvn (chuẩn tên nhà nước).
 * - Hợp nhất thành cấu trúc: [{ code, name, districts: [{ code, name }] }]
 * - Cache localStorage 7 ngày + theo VERSION để chủ động làm mới.
 */

const VERSION = "v1.0"; // đổi nếu muốn ép làm mới cache
const LS_KEY = "vn_admin_2level_cache";

const SRC = {
    provinces:
        "https://cdn.jsdelivr.net/gh/madnh/hanhchinhvn/dist/tinh_tp.json",
    districts:
        "https://cdn.jsdelivr.net/gh/madnh/hanhchinhvn/dist/quan_huyen.json",
};

function loadCache() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const isVersionOk = parsed?.version === VERSION;
        const isFresh =
            Date.now() - (parsed?.ts || 0) < 7 * 24 * 60 * 60 * 1000; // 7 ngày
        return isVersionOk && isFresh ? parsed.data : null;
    } catch {
        return null;
    }
}

function saveCache(data) {
    try {
        localStorage.setItem(
            LS_KEY,
            JSON.stringify({ version: VERSION, ts: Date.now(), data })
        );
    } catch { }
}

export function useVNAddress() {
    const [loading, setLoading] = useState(true);
    const [provinces, setProvinces] = useState([]); // [{ code, name, districts: [...] }]

    useEffect(() => {
        const fromCache = loadCache();
        if (fromCache?.length) {
            setProvinces(fromCache);
            setLoading(false);
            return;
        }

        (async () => {
            try {
                // tải 2 file
                const [pRes, dRes] = await Promise.all([
                    fetch(SRC.provinces),
                    fetch(SRC.districts),
                ]);
                const pJson = await pRes.json(); // object map { code: { name, ... } }
                const dJson = await dRes.json(); // object map { code: { name, parent_code, ... } }

                // build provinces
                const pList = Object.entries(pJson).map(([pCode, pVal]) => ({
                    code: pCode,
                    name: pVal?.name || "",
                }));

                // group districts
                const dMapByProvince = {};
                for (const [dCode, dVal] of Object.entries(dJson)) {
                    const parent = dVal?.parent_code;
                    if (!parent) continue;
                    if (!dMapByProvince[parent]) dMapByProvince[parent] = [];
                    dMapByProvince[parent].push({
                        code: dCode,
                        name: dVal?.name || "",
                    });
                }

                // merge
                const merged = pList
                    .map((p) => ({
                        ...p,
                        districts: (dMapByProvince[p.code] || []).sort((a, b) =>
                            a.name.localeCompare(b.name, "vi")
                        ),
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name, "vi"));

                setProvinces(merged);
                saveCache(merged);
            } catch (e) {
                console.error("Tải dữ liệu tỉnh/quận thất bại:", e);
                setProvinces([]); // tránh undefined
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // helpers
    const codes = useMemo(() => {
        const p = {};
        const d = {};
        for (const prov of provinces) {
            p[prov.code] = prov.name;
            for (const qh of prov.districts || []) {
                d[`${prov.code}:${qh.code}`] = qh.name;
            }
        }
        return { p, d };
    }, [provinces]);

    const getProvinceName = (provinceCode) => codes.p[provinceCode] || "";
    const getDistrictName = (provinceCode, districtCode) =>
        codes.d[`${provinceCode}:${districtCode}`] || "";

    const getProvinceByName = (name) =>
        provinces.find((x) => (x.name || "").trim() === (name || "").trim());
    const getDistrictByName = (provinceCode, districtName) => {
        const prov = provinces.find((x) => x.code === provinceCode);
        if (!prov) return undefined;
        return (prov.districts || []).find(
            (d) => (d.name || "").trim() === (districtName || "").trim()
        );
    };

    return {
        loading,
        provinces, // [{ code, name, districts: [{code, name}] }]
        getProvinceName,
        getDistrictName,
        getProvinceByName,
        getDistrictByName,
    };
}
