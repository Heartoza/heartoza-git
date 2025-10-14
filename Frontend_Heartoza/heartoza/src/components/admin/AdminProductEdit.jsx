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
        name: '', sku: '', price: 0, categoryId: null, isActive: true
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
                    isActive: productDetail.isActive
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
            
            <form onSubmit={handleSubmit} className="admin-form-layout" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 400px',
                gap: '24px',
                maxWidth: '1400px',
                margin: '0 auto'
            }}>
                <div className="form-main-column">
                    <div className="form-card" style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '24px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        border: '1px solid #e5e7eb'
                    }}>
                        <h3 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            marginBottom: '20px',
                            color: '#111827',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            📦 Thông tin sản phẩm
                        </h3>
                        
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#374151',
                                marginBottom: '8px'
                            }}>
                                Tên sản phẩm <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                placeholder="Nhập tên sản phẩm..." 
                                required
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    fontSize: '14px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            />
                        </div>

                        <div className="form-row" style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '16px',
                            marginBottom: '20px'
                        }}>
                            <div className="form-group">
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#374151',
                                    marginBottom: '8px'
                                }}>
                                    SKU
                                </label>
                                <input 
                                    name="sku" 
                                    value={formData.sku} 
                                    onChange={handleChange} 
                                    placeholder="Mã sản phẩm"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        fontSize: '14px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        outline: 'none',
                                        transition: 'all 0.2s',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#374151',
                                    marginBottom: '8px'
                                }}>
                                    Giá (VNĐ) <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input 
                                    name="price" 
                                    type="number" 
                                    value={formData.price} 
                                    onChange={handleChange} 
                                    placeholder="0" 
                                    min="0"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        fontSize: '14px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        outline: 'none',
                                        transition: 'all 0.2s',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#374151',
                                marginBottom: '8px'
                            }}>
                                Danh mục
                            </label>
                            <select 
                                name="categoryId" 
                                value={formData.categoryId || ''} 
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    fontSize: '14px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    boxSizing: 'border-box',
                                    backgroundColor: 'white',
                                    cursor: 'pointer'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            >
                                {categories.map(cat => (
                                    <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-side-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="form-card" style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '24px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        border: '1px solid #e5e7eb'
                    }}>
                        <h3 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            marginBottom: '20px',
                            color: '#111827',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            ⚙️ Trạng thái
                        </h3>
                        
                        <div className="form-group toggle-switch" style={{
                            background: formData.isActive ? '#f0fdf4' : '#fef2f2',
                            padding: '16px',
                            borderRadius: '8px',
                            border: formData.isActive ? '2px solid #86efac' : '2px solid #fca5a5',
                            transition: 'all 0.3s'
                        }}>
                            <label htmlFor="isActive" style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px',
                                cursor: 'pointer'
                            }}>
                                <input 
                                    type="checkbox" 
                                    id="isActive" 
                                    name="isActive" 
                                    checked={formData.isActive} 
                                    onChange={handleChange}
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        cursor: 'pointer',
                                        accentColor: '#10b981'
                                    }}
                                />
                                <span style={{ 
                                    fontSize: '15px', 
                                    fontWeight: '600',
                                    color: formData.isActive ? '#166534' : '#991b1b'
                                }}>
                                    {formData.isActive ? '✅ Đang hoạt động' : '⛔ Đã ẩn'}
                                </span>
                            </label>
                        </div>
                        
                        <p className="form-hint" style={{ 
                            marginTop: '12px', 
                            fontSize: '13px', 
                            color: '#6b7280',
                            lineHeight: '1.5'
                        }}>
                            {formData.isActive 
                                ? '💡 Sản phẩm đang hiển thị trên trang bán hàng' 
                                : '🚫 Sản phẩm đã bị ẩn và không hiển thị cho khách hàng'}
                        </p>
                    </div>
                    {!isNew && (
                        <div className="form-card" style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            border: '1px solid #e5e7eb'
                        }}>
                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: '600',
                                marginBottom: '20px',
                                color: '#111827',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                🖼️ Hình ảnh sản phẩm
                            </h3>
                            
                            {productImages.length > 0 ? (
                                <div className="image-preview-grid" style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: '12px',
                                    marginBottom: '16px'
                                }}>
                                    {productImages.map(img => (
                                        <div 
                                            key={img.productMediaId} 
                                            className={`preview-card ${img.isPrimary ? 'primary' : ''}`}
                                            style={{
                                                position: 'relative',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                border: img.isPrimary ? '3px solid #fbbf24' : '1px solid #e5e7eb',
                                                boxShadow: img.isPrimary ? '0 4px 6px rgba(251, 191, 36, 0.3)' : 'none'
                                            }}
                                        >
                                            <img 
                                                src={img.url} 
                                                alt="Product"
                                                style={{
                                                    width: '100%',
                                                    height: '120px',
                                                    objectFit: 'cover',
                                                    display: 'block'
                                                }}
                                            />
                                            {img.isPrimary && (
                                                <span className="primary-badge" style={{
                                                    position: 'absolute',
                                                    top: '8px',
                                                    right: '8px',
                                                    background: '#fbbf24',
                                                    color: '#78350f',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '11px',
                                                    fontWeight: '600'
                                                }}>
                                                    ⭐ Ảnh chính
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ 
                                    padding: '40px 20px', 
                                    textAlign: 'center', 
                                    background: '#fafafa', 
                                    borderRadius: '8px',
                                    border: '2px dashed #d1d5db',
                                    marginBottom: '16px'
                                }}>
                                    <p style={{ 
                                        fontSize: '48px', 
                                        margin: '0 0 12px 0',
                                        filter: 'grayscale(1)',
                                        opacity: '0.5'
                                    }}>📷</p>
                                    <p className="form-hint" style={{ 
                                        margin: '0',
                                        fontSize: '14px',
                                        color: '#9ca3af'
                                    }}>
                                        Sản phẩm này chưa có hình ảnh
                                    </p>
                                </div>
                            )}
                            
                            <button 
                                type="button" 
                                className="btn secondary full-width" 
                                onClick={() => setShowImagesModal(true)}
                                style={{ 
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    background: 'white',
                                    color: '#374151',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#f9fafb';
                                    e.target.style.borderColor = '#6366f1';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'white';
                                    e.target.style.borderColor = '#d1d5db';
                                }}
                            >
                                {productImages.length > 0 ? '✏️ Quản lý ảnh' : '➕ Thêm ảnh'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="form-actions-footer" style={{ 
                    gridColumn: '1 / -1',
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '24px',
                    background: 'white',
                    borderTop: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    marginTop: '0',
                    boxShadow: '0 -1px 3px rgba(0,0,0,0.05)'
                }}>
                    {error && (
                        <div style={{ 
                            flex: 1,
                            marginRight: '20px',
                            padding: '12px 16px',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span style={{ fontSize: '18px' }}>⚠️</span>
                            <p style={{ 
                                margin: 0,
                                fontSize: '14px',
                                color: '#991b1b',
                                fontWeight: '500'
                            }}>
                                {String(error)}
                            </p>
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                        <button 
                            type="button" 
                            className="btn secondary" 
                            onClick={() => navigate('/admin/products')}
                            style={{ 
                                minWidth: '120px',
                                padding: '12px 24px',
                                fontSize: '14px',
                                fontWeight: '500',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                background: 'white',
                                color: '#374151',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#f3f4f6';
                                e.target.style.borderColor = '#9ca3af';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'white';
                                e.target.style.borderColor = '#d1d5db';
                            }}
                        >
                            ✖️ Hủy
                        </button>
                        <button 
                            type="submit" 
                            className="btn primary" 
                            disabled={saving}
                            style={{ 
                                minWidth: '160px',
                                padding: '12px 24px',
                                fontSize: '14px',
                                fontWeight: '600',
                                border: 'none',
                                borderRadius: '8px',
                                background: saving ? '#9ca3af' : '#6366f1',
                                color: 'white',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: saving ? 'none' : '0 2px 4px rgba(99, 102, 241, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                if (!saving) {
                                    e.target.style.background = '#4f46e5';
                                    e.target.style.boxShadow = '0 4px 6px rgba(99, 102, 241, 0.4)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!saving) {
                                    e.target.style.background = '#6366f1';
                                    e.target.style.boxShadow = '0 2px 4px rgba(99, 102, 241, 0.3)';
                                }
                            }}
                        >
                            {saving ? '⏳ Đang lưu...' : (isNew ? '➕ Thêm sản phẩm' : '💾 Lưu thay đổi')}
                        </button>
                    </div>
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