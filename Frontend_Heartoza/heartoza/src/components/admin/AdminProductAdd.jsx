// /components/admin/AdminProductAdd.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminService } from '../../services/adminService';
import '../css/Admin.css';

export default function AdminProductAdd() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: 0,
        categoryId: '',
        isActive: true
    });

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [selectedImages, setSelectedImages] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [primaryImageIndex, setPrimaryImageIndex] = useState(0);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const cats = await AdminService.getCategories();
            setCategories(cats || []);
            setError('');
        } catch (err) {
            setError('Không thể tải danh sách danh mục.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const errors = {};
        
        if (!formData.name.trim()) {
            errors.name = 'Tên sản phẩm không được để trống';
        } else if (formData.name.length < 3) {
            errors.name = 'Tên sản phẩm phải có ít nhất 3 ký tự';
        }

        if (formData.price <= 0) {
            errors.price = 'Giá sản phẩm phải lớn hơn 0';
        }

        if (!formData.categoryId) {
            errors.categoryId = 'Vui lòng chọn danh mục';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        
        setFormData(prev => ({ ...prev, [name]: newValue }));
        
        // Clear validation error khi user nhập lại
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setError('');
        setSaving(true);

        try {
            const payload = {
                name: formData.name.trim(),
                sku: formData.sku.trim() || null,
                price: Number(formData.price),
                categoryId: Number(formData.categoryId),
                isActive: formData.isActive
            };

            // Create product first
            const newProduct = await AdminService.createProduct(payload);
            const productId = newProduct.productId;
            
            // Upload images if any
            if (selectedImages.length > 0) {
                try {
                    // Upload images one by one
                    for (let i = 0; i < selectedImages.length; i++) {
                        const formData = new FormData();
                        formData.append('file', selectedImages[i]);
                        formData.append('isPrimary', i === primaryImageIndex);

                        await AdminService.uploadProductImage(productId, formData);
                    }
                } catch (imgErr) {
                    console.error('Error uploading images:', imgErr);
                    alert('⚠️ Sản phẩm đã tạo nhưng có lỗi khi upload ảnh. Bạn có thể thêm ảnh sau.');
                }
            }
            
            // Success notification
            alert('✅ Thêm sản phẩm thành công!');
            
            // Navigate to edit page
            navigate(`/admin/products/${productId}`);
        } catch (err) {
            console.error('Error creating product:', err);
            setError(err?.response?.data?.message || 'Có lỗi xảy ra khi thêm sản phẩm. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setFormData({
            name: '',
            sku: '',
            price: 0,
            categoryId: '',
            isActive: true
        });
        setValidationErrors({});
        setError('');
        setSelectedImages([]);
        setPreviewUrls([]);
        setPrimaryImageIndex(0);
    };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Validate file types
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const invalidFiles = files.filter(f => !validTypes.includes(f.type));
        
        if (invalidFiles.length > 0) {
            alert('⚠️ Chỉ chấp nhận file ảnh (JPG, PNG, WEBP)');
            return;
        }

        // Limit total images
        const currentTotal = selectedImages.length + files.length;
        if (currentTotal > 5) {
            alert('⚠️ Tối đa 5 ảnh cho mỗi sản phẩm');
            return;
        }

        // Create preview URLs
        const newPreviewUrls = files.map(file => URL.createObjectURL(file));
        
        setSelectedImages(prev => [...prev, ...files]);
        setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    };

    const handleRemoveImage = (index) => {
        // Revoke URL to prevent memory leak
        URL.revokeObjectURL(previewUrls[index]);
        
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
        
        // Adjust primary index if needed
        if (primaryImageIndex === index) {
            setPrimaryImageIndex(0);
        } else if (primaryImageIndex > index) {
            setPrimaryImageIndex(prev => prev - 1);
        }
    };

    const handleSetPrimary = (index) => {
        setPrimaryImageIndex(index);
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                gap: '16px'
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid #e5e7eb',
                    borderTopColor: '#6366f1',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>⏳ Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <div className="admin-page product-add-page">
            <div className="admin-head" style={{
                marginBottom: '32px',
                paddingBottom: '24px',
                borderBottom: '2px solid #e5e7eb'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={() => navigate('/admin/products')}
                        style={{
                            padding: '8px 12px',
                            background: 'white',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '20px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.target.style.background = 'white'}
                        title="Quay lại danh sách"
                    >
                        ← 
                    </button>
                    <div>
                        <h2 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: '700', color: '#111827' }}>
                            ➕ Thêm sản phẩm mới
                        </h2>
                        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                            Điền thông tin chi tiết để tạo sản phẩm mới
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 400px',
                gap: '24px',
                maxWidth: '1400px',
                margin: '0 auto'
            }}>
                {/* Main Content Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{
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
                            📦 Thông tin cơ bản
                        </h3>

                        {/* Product Name */}
                        <div style={{ marginBottom: '20px' }}>
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
                                placeholder="VD: Áo thun cotton cao cấp"
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    fontSize: '14px',
                                    border: validationErrors.name ? '2px solid #ef4444' : '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => !validationErrors.name && (e.target.style.borderColor = '#6366f1')}
                                onBlur={(e) => !validationErrors.name && (e.target.style.borderColor = '#d1d5db')}
                            />
                            {validationErrors.name && (
                                <p style={{ fontSize: '13px', color: '#ef4444', marginTop: '6px', marginBottom: 0 }}>
                                    ⚠️ {validationErrors.name}
                                </p>
                            )}
                        </div>

                        {/* SKU & Price Row */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '16px',
                            marginBottom: '20px'
                        }}>
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#374151',
                                    marginBottom: '8px'
                                }}>
                                    Mã SKU
                                </label>
                                <input
                                    name="sku"
                                    value={formData.sku}
                                    onChange={handleChange}
                                    placeholder="VD: PROD-001"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
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
                                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px', marginBottom: 0 }}>
                                    Để trống nếu không có
                                </p>
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#374151',
                                    marginBottom: '8px'
                                }}>
                                    Giá bán <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        name="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={handleChange}
                                        placeholder="0"
                                        min="0"
                                        step="1000"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            paddingRight: '50px',
                                            fontSize: '14px',
                                            border: validationErrors.price ? '2px solid #ef4444' : '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            outline: 'none',
                                            transition: 'all 0.2s',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => !validationErrors.price && (e.target.style.borderColor = '#6366f1')}
                                        onBlur={(e) => !validationErrors.price && (e.target.style.borderColor = '#d1d5db')}
                                    />
                                    <span style={{
                                        position: 'absolute',
                                        right: '16px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        fontSize: '14px',
                                        color: '#6b7280',
                                        fontWeight: '500'
                                    }}>
                                        VNĐ
                                    </span>
                                </div>
                                {validationErrors.price && (
                                    <p style={{ fontSize: '13px', color: '#ef4444', marginTop: '6px', marginBottom: 0 }}>
                                        ⚠️ {validationErrors.price}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#374151',
                                marginBottom: '8px'
                            }}>
                                Danh mục <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    fontSize: '14px',
                                    border: validationErrors.categoryId ? '2px solid #ef4444' : '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    boxSizing: 'border-box',
                                    backgroundColor: 'white',
                                    cursor: 'pointer'
                                }}
                                onFocus={(e) => !validationErrors.categoryId && (e.target.style.borderColor = '#6366f1')}
                                onBlur={(e) => !validationErrors.categoryId && (e.target.style.borderColor = '#d1d5db')}
                            >
                                <option value="" disabled selected>-- Chọn danh mục --</option>
                                {categories.map(cat => (
                                    <option key={cat.categoryId} value={cat.categoryId}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            {validationErrors.categoryId && (
                                <p style={{ fontSize: '13px', color: '#ef4444', marginTop: '6px', marginBottom: 0 }}>
                                    ⚠️ {validationErrors.categoryId}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Status Card */}
                    <div style={{
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

                        <div style={{
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
                                    {formData.isActive ? '✅ Hoạt động ngay' : '⛔ Tạm ẩn'}
                                </span>
                            </label>
                        </div>

                        <p style={{
                            marginTop: '12px',
                            fontSize: '13px',
                            color: '#6b7280',
                            lineHeight: '1.5',
                            marginBottom: 0
                        }}>
                            {formData.isActive
                                ? '💡 Sản phẩm sẽ hiển thị trên trang bán hàng ngay sau khi tạo'
                                : '🚫 Sản phẩm sẽ bị ẩn và không hiển thị cho khách hàng'}
                        </p>
                    </div>

                    {/* Images Card */}
                    <div style={{
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

                        {/* Image Previews */}
                        {previewUrls.length > 0 ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '12px',
                                marginBottom: '16px'
                            }}>
                                {previewUrls.map((url, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            position: 'relative',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            border: primaryImageIndex === index ? '3px solid #fbbf24' : '1px solid #e5e7eb',
                                            boxShadow: primaryImageIndex === index ? '0 4px 6px rgba(251, 191, 36, 0.3)' : 'none'
                                        }}
                                    >
                                        <img
                                            src={url}
                                            alt={`Preview ${index + 1}`}
                                            style={{
                                                width: '100%',
                                                height: '120px',
                                                objectFit: 'cover',
                                                display: 'block'
                                            }}
                                        />
                                        
                                        {/* Primary Badge */}
                                        {primaryImageIndex === index && (
                                            <span style={{
                                                position: 'absolute',
                                                top: '8px',
                                                left: '8px',
                                                background: '#fbbf24',
                                                color: '#78350f',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                fontWeight: '600'
                                            }}>
                                                ⭐ Chính
                                            </span>
                                        )}

                                        {/* Action Buttons */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            display: 'flex',
                                            gap: '4px'
                                        }}>
                                            {primaryImageIndex !== index && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleSetPrimary(index)}
                                                    title="Đặt làm ảnh chính"
                                                    style={{
                                                        padding: '4px 8px',
                                                        background: 'rgba(255, 255, 255, 0.9)',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        color: '#374151'
                                                    }}
                                                >
                                                    ⭐
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index)}
                                                title="Xóa ảnh"
                                                style={{
                                                    padding: '4px 8px',
                                                    background: 'rgba(239, 68, 68, 0.9)',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    color: 'white'
                                                }}
                                            >
                                                ✖
                                            </button>
                                        </div>
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
                                <p style={{
                                    margin: '0',
                                    fontSize: '14px',
                                    color: '#9ca3af'
                                }}>
                                    Chưa có ảnh nào
                                </p>
                            </div>
                        )}

                        {/* Upload Button */}
                        <input
                            type="file"
                            id="imageUpload"
                            multiple
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleImageSelect}
                            style={{ display: 'none' }}
                        />
                        <label
                            htmlFor="imageUpload"
                            style={{
                                display: 'block',
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
                                textAlign: 'center'
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
                            ➕ Thêm ảnh ({previewUrls.length}/5)
                        </label>
                        
                        <p style={{
                            fontSize: '12px',
                            color: '#9ca3af',
                            marginTop: '8px',
                            marginBottom: 0,
                            textAlign: 'center'
                        }}>
                            JPG, PNG, WEBP • Tối đa 5 ảnh
                        </p>
                    </div>

                    {/* Tips Card */}
                    <div style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '12px',
                        padding: '24px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        color: 'white'
                    }}>
                        <h4 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            marginBottom: '12px',
                            marginTop: 0
                        }}>
                            💡 Mẹo nhỏ
                        </h4>
                        <ul style={{
                            fontSize: '13px',
                            lineHeight: '1.6',
                            paddingLeft: '20px',
                            marginBottom: 0
                        }}>
                            <li>Tên sản phẩm nên rõ ràng, dễ hiểu</li>
                            <li>Giá bán nên là số tròn nghìn</li>
                            <li>Ảnh đầu tiên sẽ là ảnh chính</li>
                            <li>Nên upload ít nhất 2-3 ảnh</li>
                            <li>Ảnh nên rõ nét, kích thước phù hợp</li>
                        </ul>
                    </div>
                </div>

                {/* Action Footer */}
                <div style={{
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
                            onClick={handleReset}
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
                                e.target.style.background = '#f9fafb';
                                e.target.style.borderColor = '#9ca3af';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'white';
                                e.target.style.borderColor = '#d1d5db';
                            }}
                        >
                            🔄 Làm mới
                        </button>

                        <button
                            type="button"
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
                            disabled={saving}
                            style={{
                                minWidth: '180px',
                                padding: '12px 24px',
                                fontSize: '14px',
                                fontWeight: '600',
                                border: 'none',
                                borderRadius: '8px',
                                background: saving ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: saving ? 'none' : '0 4px 6px rgba(102, 126, 234, 0.4)'
                            }}
                            onMouseEnter={(e) => {
                                if (!saving) {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 6px 8px rgba(102, 126, 234, 0.5)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!saving) {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 4px 6px rgba(102, 126, 234, 0.4)';
                                }
                            }}
                        >
                            {saving ? '⏳ Đang tạo...' : '✨ Tạo sản phẩm'}
                        </button>
                    </div>
                </div>
            </form>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
