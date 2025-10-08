// /components/admin/AdminProductEdit.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminService } from '../../services/adminService';
import ProductImagesModal from './ProductImagesModal';
import '../css/Admin.css';

export default function AdminProductEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new';

    const [formData, setFormData] = useState({
        name: '', sku: '', price: 0, categoryId: null, isActive: true, description: ''
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(!isNew);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [productImages, setProductImages] = useState([]);
    const [showImagesModal, setShowImagesModal] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const cats = await AdminService.getCategories();
            setCategories(cats || []);

            if (!isNew) {
                const productDetail = await AdminService.getProductById(id);
                setFormData({
                    name: productDetail.name || '',
                    sku: productDetail.sku || '',
                    price: productDetail.price || 0,
                    categoryId: productDetail.categoryId,
                    isActive: productDetail.isActive,
                    description: productDetail.description || ''
                });
                const images = await AdminService.getProductImages(id);
                setProductImages(images || []);
            }
        } catch (err) {
            setError('Không thể tải dữ liệu sản phẩm.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id, isNew]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            const payload = { ...formData, price: Number(formData.price) };
            if (isNew) {
                const newProduct = await AdminService.createProduct(payload);
                alert('Thêm sản phẩm thành công!');
                navigate(`/admin/products/${newProduct.productId}`, { replace: true });
            } else {
                await AdminService.updateProduct(id, payload);
                alert('Cập nhật sản phẩm thành công!');
            }
        } catch (err) {
            setError(err?.response?.data || 'Có lỗi xảy ra, vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };
    
    const handleImageModalClose = () => {
        setShowImagesModal(false);
        if (!isNew) {
            AdminService.getProductImages(id).then(setProductImages);
        }
    };

    if (loading) return <p className="loading-text">⏳ Đang tải chi tiết sản phẩm...</p>;
    if (error && !isNew) return <p className="auth-message error">{error}</p>;

    return (
        <div className="admin-page product-edit-page">
            <div className="admin-head">
                <h2>{isNew ? 'Thêm sản phẩm mới' : `Chỉnh sửa: ${formData.name}`}</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="admin-form-layout">
                {/* ✅ BỎ COMMENT VÀ HIỂN THỊ CỘT TRÁI */}
                <div className="form-main-column">
                    <div className="form-card">
                        <h3>Thông tin cơ bản</h3>
                        <div className="form-group">
                            <label>Tên sản phẩm</label>
                            <input name="name" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Mô tả</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows="5" />
                        </div>
                    </div>
                    <div className="form-card">
                        <h3>Giá & Phân loại</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>SKU</label>
                                <input name="sku" value={formData.sku} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Giá (VNĐ)</label>
                                <input name="price" type="number" value={formData.price} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Danh mục</label>
                            <select name="categoryId" value={formData.categoryId || ''} onChange={handleChange}>
                                <option value="">-- Chọn danh mục --</option>
                                {categories.map(cat => (
                                    <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* ✅ BỎ COMMENT VÀ HIỂN THỊ CỘT PHẢI */}
                <div className="form-side-column">
                    <div className="form-card">
                        <h3>Trạng thái</h3>
                        <div className="form-group toggle-switch">
                            <label htmlFor="isActive">
                                {formData.isActive ? '✅ Đang hoạt động' : '⛔ Đã ẩn'}
                            </label>
                            <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} className="switch" />
                        </div>
                        <p className="form-hint">
                            Khi sản phẩm bị ẩn, nó sẽ không hiển thị trên trang bán hàng.
                        </p>
                    </div>
                    {!isNew && (
                        <div className="form-card">
                            <h3>Hình ảnh sản phẩm</h3>
                            {productImages.length > 0 ? (
                                <div className="image-preview-grid">
                                    {productImages.map(img => (
                                        <div key={img.productMediaId} className={`preview-card ${img.isPrimary ? 'primary' : ''}`}>
                                            <img src={img.url} alt="Product" />
                                            {img.isPrimary && <span className="primary-badge">Ảnh chính</span>}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="form-hint">Sản phẩm này chưa có hình ảnh.</p>
                            )}
                            <button type="button" className="btn secondary full-width" onClick={() => setShowImagesModal(true)}>
                                Thêm / Sửa ảnh
                            </button>
                        </div>
                    )}
                </div>

                <div className="form-actions-footer">
                    {error && <p className="auth-message error">{String(error)}</p>}
                    <button type="button" className="btn secondary" onClick={() => navigate('/admin/products')}>Hủy</button>
                    <button type="submit" className="btn primary" disabled={saving}>
                        {saving ? 'Đang lưu...' : (isNew ? 'Thêm sản phẩm' : 'Lưu thay đổi')}
                    </button>
                </div>
            </form>

            {showImagesModal && (
                <ProductImagesModal
                    product={{ productId: id, name: formData.name }}
                    onClose={handleImageModalClose}
                />
            )}
        </div>
    );
}