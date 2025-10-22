import React, { useEffect, useState } from "react";
import { getActiveBanners } from "../../services/marketingApi";

export default function BannerStrip({ position = "home-top", className = "" }) {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const data = await getActiveBanners(position);
                if (mounted) setBanners(Array.isArray(data) ? data : []);
            } catch (e) {
                setErr("Không tải được banner.");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => (mounted = false);
    }, [position]);

    if (loading) return <div className={`banner-strip ${className}`}>Đang tải…</div>;
    if (err) return <div className={`banner-strip ${className}`}>{err}</div>;
    if (!banners.length) return null;

    return (
        <div className={`banner-strip ${className}`}>
            {banners.map(b => (
                <a
                    key={b.bannerId}
                    href={b.linkUrl || "#"}
                    target={b.openInNewTab ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    className="banner-item"
                    style={{ display: "block", marginBottom: 12 }}
                >
                    <img
                        src={b.imageUrl}
                        alt={b.title || "banner"}
                        style={{ width: "100%", borderRadius: 12, display: "block" }}
                        loading="lazy"
                    />
                </a>
            ))}
        </div>
    );
}
