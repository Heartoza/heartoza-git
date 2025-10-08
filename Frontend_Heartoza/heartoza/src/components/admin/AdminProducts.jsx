// /components/admin/AdminProducts.jsx

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
        try {
            const res = await AdminService.getProducts(p, pageSize, keyword);
            setProducts(res.items || []);
            setTotal(res.total || 0);
        } catch (error) {
            console.error("Lỗi tải danh sách sản phẩm:", error);
            alert("Không thể tải danh sách sản phẩm.");
        }
    };

    const loadCats = async () => {
        try {
            const res = await AdminService.getCategories();
            setCats(res || []);
        } catch (error) {
            console.error("Lỗi tải danh mục:", error);
        }
    };

    useEffect(() => {
        load();
        loadCats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
    const catName = (id) => cats.find(c => c.categoryId === id)?.name || id || "-";

    const onSearch = (e) => {
        e.preventDefault();
        setPage(1);
        load(1, q.trim());
    };

    const go = (p) => {
        if (p < 1 || p > totalPages || p === page) return;
        setPage(p);
        load(p, q.trim());
    };

    // ✅ HÀM XỬ LÝ XÓA SẢN PHẨM
    const handleDelete = async (productId, productName) => {
        // Hiển thị hộp thoại xác nhận
        if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${productName}" không? Hành động này không thể hoàn tác.`)) {
            try {
                await AdminService.deleteProduct(productId);
                alert(`Đã xóa thành công sản phẩm "${productName}".`);
                // Tải lại danh sách sản phẩm sau khi xóa
                load(page, q.trim());
            } catch (err) {
                console.error("Lỗi xóa sản phẩm:", err);
                alert(err?.response?.data || "Không thể xóa sản phẩm. Vui lòng thử lại.");
            }
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-head">
                <h2>Quản lý Sản phẩm</h2>
                <div className="admin-actions">
                    <Link to="/admin/products/new" className="btn-add">
                        Thêm sản phẩm
                    </Link>
                    <form onSubmit={onSearch} className="searchbar">
                        <input
                            placeholder="Tìm theo tên hoặc SKU…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                        <button className="btn primary" type="submit">Tìm</button>
                    </form>
                </div>
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
                        <th style={{ width: 220 }}>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {products.length > 0 ? (
                        products.map((p, i) => (
                            <tr key={p.productId}>
                                <td>{(page - 1) * pageSize + i + 1}</td>
                                <td>{p.name}</td>
                                <td>{p.sku || "-"}</td>
                                <td>{Number(p.price).toLocaleString()} đ</td>
                                <td>{catName(p.categoryId)}</td>
                                <td>{p.isActive ? "✅ Hoạt động" : "⛔ Ẩn"}</td>
                                <td className="row-actions">
                                    <button className="btn ghost" onClick={() => setShowImagesFor(p)}>Xem ảnh</button>
                                    <Link to={`/admin/products/${p.productId}`} className="btn primary">Sửa</Link>
                                    {/* ✅ NÚT XÓA SẢN PHẨM */}
                                    <button className="btn danger" onClick={() => handleDelete(p.productId, p.name)}>Xóa</button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan="7" className="empty">Không có sản phẩm nào.</td></tr>
                    )}
                </tbody>
            </table>

            {totalPages > 1 && (
                <div className="pagination">
                    <button className="btn" onClick={() => go(page - 1)} disabled={page <= 1}>‹ Trước</button>
                    <span>Trang {page} / {totalPages}</span>
                    <button className="btn" onClick={() => go(page + 1)} disabled={page >= totalPages}>Sau ›</button>
                </div>
            )}

            {showImagesFor && (
                <ProductImagesModal
                    product={showImagesFor}
                    onClose={() => setShowImagesFor(null)}
                />
            )}
        </div>
    );
}