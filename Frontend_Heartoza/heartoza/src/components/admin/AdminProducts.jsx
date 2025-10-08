import React, { useEffect, useMemo, useState } from "react";
import { AdminService } from "../../services/adminService";
import ProductImagesModal from "./ProductImagesModal";
import "../css/Admin.css";

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [q, setQ] = useState("");
    const [cats, setCats] = useState([]);
    const [showImagesFor, setShowImagesFor] = useState(null);

    const load = async (p = page, keyword = q) => {
        const res = await AdminService.getProducts(p, pageSize, keyword);
        setProducts(res.items || []);
        setTotal(res.total || 0);
    };

    const loadCats = async () => {
        const res = await AdminService.getCategories();
        setCats(res || []);
    };

    useEffect(() => { load(); loadCats(); /* eslint-disable-next-line */ }, []);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
    const catName = (id) => cats.find(c => c.categoryId === id)?.name || id || "-";

    const onSearch = async (e) => {
        e.preventDefault();
        setPage(1);
        await load(1, q.trim());
    };

    const go = async (p) => {
        if (p < 1 || p > totalPages) return;
        setPage(p);
        await load(p, q.trim());
    };

    return (
        <div className="admin-page">
            <div className="admin-head">
                <h2>Quản lý Sản phẩm</h2>
                <form onSubmit={onSearch} className="searchbar">
                    <input
                        placeholder="Tìm theo tên hoặc SKU…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <button className="btn primary" type="submit">Tìm</button>
                </form>
            </div>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>STT</th>
                        <th>Tên</th>
                        <th>SKU</th>
                        <th>Giá</th>
                        <th>Danh mục</th>
                        <th>Trạng thái</th>
                        <th style={{ width: 180 }}>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((p, i) => (
                        <tr key={p.productId}>
                            <td>{(page - 1) * pageSize + i + 1}</td>
                            <td>{p.name}</td>
                            <td>{p.sku || "-"}</td>
                            <td>{Number(p.price).toLocaleString()} đ</td>
                            <td>{catName(p.categoryId)}</td>
                            <td>{p.isActive ? "✅ Active" : "⛔ Inactive"}</td>
                            <td className="row-actions">
                                <button className="btn ghost" onClick={() => setShowImagesFor(p)}>Ảnh</button>
                                {/* Anh có thể thêm nút Sửa/Xoá ở đây */}
                            </td>
                        </tr>
                    ))}
                    {!products.length && (
                        <tr><td colSpan={7} className="empty">Không có sản phẩm</td></tr>
                    )}
                </tbody>
            </table>

            <div className="pagination">
                <button className="btn" onClick={() => go(page - 1)} disabled={page <= 1}>‹ Trước</button>
                <span>Trang {page} / {totalPages}</span>
                <button className="btn" onClick={() => go(page + 1)} disabled={page >= totalPages}>Sau ›</button>
            </div>

            {showImagesFor && (
                <ProductImagesModal
                    product={showImagesFor}
                    onClose={async () => { setShowImagesFor(null); /* reload if needed */ }}
                />
            )}
        </div>
    );
}
