import { useEffect } from "react";
import { getSeoMeta } from "../services/marketingApi";

/**
 * Dùng ở mỗi page:
 *   useSeoMeta("/collections/noel")
 * hoặc tự lấy slug từ router.
 */
export default function useSeoMeta(slug) {
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const meta = await getSeoMeta(slug);
                if (cancelled || !meta) return;

                if (meta.title) document.title = meta.title;

                const set = (name, content) => {
                    if (!content) return;
                    let el = document.querySelector(`meta[name="${name}"]`);
                    if (!el) {
                        el = document.createElement("meta");
                        el.setAttribute("name", name);
                        document.head.appendChild(el);
                    }
                    el.setAttribute("content", content);
                };

                const setProp = (property, content) => {
                    if (!content) return;
                    let el = document.querySelector(`meta[property="${property}"]`);
                    if (!el) {
                        el = document.createElement("meta");
                        el.setAttribute("property", property);
                        document.head.appendChild(el);
                    }
                    el.setAttribute("content", content);
                };

                set("description", meta.description || "");
                set("keywords", meta.keywords || "");

                setProp("og:title", meta.title || "");
                setProp("og:description", meta.description || "");
                if (meta.OgImage) setProp("og:image", meta.OgImage);
                if (meta.canonicalUrl) {
                    let link = document.querySelector('link[rel="canonical"]');
                    if (!link) {
                        link = document.createElement("link");
                        link.setAttribute("rel", "canonical");
                        document.head.appendChild(link);
                    }
                    link.setAttribute("href", meta.canonicalUrl);
                }

                // noindex/nofollow
                const robots = [];
                if (meta.noIndex) robots.push("noindex");
                if (meta.noFollow) robots.push("nofollow");
                if (robots.length) set("robots", robots.join(","));

            } catch (e) {
                // bỏ qua
            }
        })();
        return () => (cancelled = true);
    }, [slug]);
}
