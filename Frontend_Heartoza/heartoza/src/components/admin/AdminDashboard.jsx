import React, { useEffect, useState } from "react";
import { AdminService } from "../../services/adminService";
import api from "../../services/api";
import "../css/Admin.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    totalCategories: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [categories, setCategories] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load categories
      const categoriesResponse = await AdminService.getCategories();
      console.log('📂 Categories response:', categoriesResponse);
      const categoriesData = Array.isArray(categoriesResponse) 
        ? categoriesResponse 
        : (categoriesResponse?.data || []);
      setCategories(categoriesData);

      // Load products for statistics
      const productsResponse = await AdminService.getProducts(1, 1000); // Get more products
      console.log('📦 Products response:', productsResponse);
      
      // Handle different response structures
      let products = [];
      let totalProductsCount = 0;
      let activeCount = 0;
      let inactiveCount = 0;
      
      if (Array.isArray(productsResponse)) {
        // If response is array directly
        products = productsResponse;
        totalProductsCount = products.length;
      } else if (productsResponse?.data && Array.isArray(productsResponse.data)) {
        // If response has data property with array
        products = productsResponse.data;
        // Try to get total from response, fallback to data.length
        totalProductsCount = productsResponse.total || productsResponse.totalCount || products.length;
      } else if (productsResponse?.items && Array.isArray(productsResponse.items)) {
        // If response has items property
        products = productsResponse.items;
        totalProductsCount = productsResponse.total || productsResponse.totalCount || products.length;
      }
      
      console.log('📦 Total products count:', totalProductsCount);
      console.log('📦 Products loaded:', products.length);
      
      // Calculate statistics from loaded products
      activeCount = products.filter(p => p.isActive).length;
      inactiveCount = products.filter(p => !p.isActive).length;
      
      // If we have total count from API but loaded products is less, 
      // we can't calculate exact active/inactive, so we use loaded data as approximation
      console.log('✅ Active products:', activeCount);
      console.log('⛔ Inactive products:', inactiveCount);
      
      // Get best selling products from API
      let bestSellingProducts = [];
      try {
        const topSellingResponse = await api.get('/products/top-selling');
        const topSellingData = topSellingResponse.data;
        console.log('🔥 Top selling API response:', topSellingData);
        
        // Merge top selling data with full product info to get isActive and other fields
        if (Array.isArray(topSellingData) && topSellingData.length > 0) {
          // Create a map of products by productId for quick lookup
          const productsMap = new Map(products.map(p => [p.productId, p]));
          
          // Merge top selling with full product data
          bestSellingProducts = topSellingData.map(topProduct => {
            const fullProduct = productsMap.get(topProduct.productId);
            if (fullProduct) {
              // Merge: use totalSold from API, other fields from full product
              return { ...fullProduct, totalSold: topProduct.totalSold };
            }
            // If not found in products list, use API data as-is (will have undefined isActive)
            return topProduct;
          }).slice(0, 5);
        } else {
          // API returned empty, fallback to products sorted by totalSold
          bestSellingProducts = products
            .sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))
            .slice(0, 5);
        }
        
        console.log('🔥 Best selling products (merged with full data):', bestSellingProducts);
      } catch (topSellingError) {
        console.warn('⚠️ Could not load top selling products, fallback to regular products:', topSellingError);
        // Fallback: sort current products by totalSold
        bestSellingProducts = products
          .sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))
          .slice(0, 5);
      }

      // Load orders for revenue statistics
      let totalOrdersCount = 0;
      let totalRevenueAmount = 0;
      
      try {
        const ordersResponse = await AdminService.getOrders(1, 1000); // Get all orders
        console.log('🛒 Orders response:', ordersResponse);
        
        // Handle different response structures
        const orders = Array.isArray(ordersResponse) 
          ? ordersResponse 
          : (ordersResponse?.data || ordersResponse?.items || []);
        
        console.log('🛒 Processed orders:', orders);
        totalOrdersCount = orders.length;
        
        // Calculate total revenue from shipped orders only
        const completedOrders = orders.filter(order => {
          const status = order.status?.toLowerCase();
          return status === 'shipped';
        });
        
        console.log('✅ Shipped orders (counted for revenue):', completedOrders);
        
        totalRevenueAmount = completedOrders.reduce((sum, order) => {
          const amount = order.grandTotal || order.totalAmount || order.total || order.amount || 0;
          console.log(`Order ${order.orderId}: ${amount}`);
          return sum + amount;
        }, 0);
        
        console.log('💰 Total revenue:', totalRevenueAmount);
        
        // Get recent orders (last 5)
        const recentOrdersList = orders
          .sort((a, b) => {
            const dateA = new Date(a.orderDate || a.createdAt || a.created || 0);
            const dateB = new Date(b.orderDate || b.createdAt || b.created || 0);
            return dateB - dateA;
          })
          .slice(0, 5);
        
        setRecentOrders(recentOrdersList);
      } catch (orderError) {
        console.warn('⚠️ Could not load orders data:', orderError);
      }

      setRecentProducts(bestSellingProducts);
      setStats({
        totalProducts: totalProductsCount, // Use total count from API
        activeProducts: activeCount,
        inactiveProducts: inactiveCount,
        totalCategories: categoriesData.length,
        totalOrders: totalOrdersCount,
        totalRevenue: totalRevenueAmount
      });
      
      console.log('📊 Final stats:', {
        totalProducts: totalProductsCount,
        activeProducts: activeCount,
        inactiveProducts: inactiveCount,
        totalCategories: categoriesData.length,
        totalOrders: totalOrdersCount,
        totalRevenue: totalRevenueAmount
      });
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon, title, value, subtitle, color, bgColor, isCurrency }) => (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    }}
    >
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        fontSize: '100px',
        opacity: '0.1',
        transform: 'rotate(-15deg)'
      }}>
        {icon}
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-block',
          padding: '12px',
          borderRadius: '12px',
          background: bgColor,
          marginBottom: '12px'
        }}>
          <span style={{ fontSize: '28px' }}>{icon}</span>
        </div>
        <h3 style={{
          fontSize: '13px',
          color: '#6b7280',
          marginBottom: '8px',
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {title}
        </h3>
        <p style={{
          fontSize: isCurrency ? '24px' : '32px',
          fontWeight: '700',
          color: color,
          margin: '0 0 4px 0',
          display: 'flex',
          alignItems: 'baseline',
          gap: '4px'
        }}>
          {isCurrency ? (
            <>
              <span>{value.toLocaleString('vi-VN')}</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#9ca3af' }}>₫</span>
            </>
          ) : (
            value.toLocaleString('vi-VN')
          )}
        </p>
        {subtitle && (
          <p style={{
            fontSize: '12px',
            color: '#9ca3af',
            margin: 0
          }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );

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
        <p style={{ fontSize: '14px', color: '#6b7280' }}>⏳ Đang tải dữ liệu thống kê...</p>
      </div>
    );
  }

  return (
    <div className="admin-page" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#111827',
          margin: '0 0 8px 0'
        }}>
          📊 Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
          Tổng quan và thống kê hệ thống
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <StatCard
          icon="💰"
          title="Tổng doanh thu"
          value={stats.totalRevenue}
          subtitle="Từ đơn hàng hoàn thành"
          color="#059669"
          bgColor="#d1fae5"
          isCurrency={true}
        />
        <StatCard
          icon="🛒"
          title="Tổng đơn hàng"
          value={stats.totalOrders}
          subtitle="Tất cả đơn hàng"
          color="#7c3aed"
          bgColor="#ede9fe"
          isCurrency={false}
        />
        <StatCard
          icon="📦"
          title="Tổng sản phẩm"
          value={stats.totalProducts}
          subtitle={`${stats.activeProducts} đang hoạt động`}
          color="#6366f1"
          bgColor="#eef2ff"
        />
        <StatCard
          icon="✅"
          title="Sản phẩm hoạt động"
          value={stats.activeProducts}
          subtitle={`${((stats.activeProducts / stats.totalProducts) * 100 || 0).toFixed(0)}% tổng số`}
          color="#10b981"
          bgColor="#f0fdf4"
        />
        <StatCard
          icon="📂"
          title="Danh mục"
          value={stats.totalCategories}
          subtitle="Tổng số danh mục"
          color="#f59e0b"
          bgColor="#fffbeb"
        />
        <StatCard
          icon="⛔"
          title="Sản phẩm ẩn"
          value={stats.inactiveProducts}
          subtitle={`${((stats.inactiveProducts / stats.totalProducts) * 100 || 0).toFixed(0)}% tổng số`}
          color="#ef4444"
          bgColor="#fef2f2"
        />
      </div>

      {/* Revenue Summary */}
      {stats.totalRevenue > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
          marginBottom: '32px',
          color: 'white'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px'
          }}>
            <div>
              <div style={{ fontSize: '14px', opacity: '0.9', marginBottom: '8px' }}>
                💎 Tổng doanh thu
              </div>
              <div style={{ fontSize: '36px', fontWeight: '700' }}>
                {stats.totalRevenue.toLocaleString('vi-VN')} ₫
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', opacity: '0.9', marginBottom: '8px' }}>
                📊 Trung bình/đơn
              </div>
              <div style={{ fontSize: '36px', fontWeight: '700' }}>
                {stats.totalOrders > 0 
                  ? Math.round(stats.totalRevenue / stats.totalOrders).toLocaleString('vi-VN')
                  : '0'} ₫
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', opacity: '0.9', marginBottom: '8px' }}>
                🎯 Đơn hàng
              </div>
              <div style={{ fontSize: '36px', fontWeight: '700' }}>
                {stats.totalOrders} đơn
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Categories Chart */}
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
            color: '#111827',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📂 Danh mục sản phẩm
          </h3>
          
          {categories.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {categories.slice(0, 5).map((cat, index) => {
                const maxProducts = Math.max(...categories.map(c => c.productCount || 0));
                const percentage = maxProducts > 0 ? ((cat.productCount || 0) / maxProducts) * 100 : 0;
                const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
                
                return (
                  <div key={cat.categoryId}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                      fontSize: '14px'
                    }}>
                      <span style={{ fontWeight: '500', color: '#374151' }}>{cat.name}</span>
                      <span style={{ fontWeight: '600', color: colors[index % colors.length] }}>
                        {cat.productCount || 0} SP
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: '#f3f4f6',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: colors[index % colors.length],
                        transition: 'width 0.5s ease',
                        borderRadius: '4px'
                      }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>
              Chưa có danh mục nào
            </p>
          )}
        </div>

        {/* Product Status Pie Chart (Visual) */}
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
            color: '#111827',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📊 Tỷ lệ trạng thái sản phẩm
          </h3>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '40px',
            padding: '20px 0'
          }}>
            {/* Simple Donut Chart */}
            <div style={{ position: 'relative', width: '160px', height: '160px' }}>
              <svg width="160" height="160" viewBox="0 0 160 160">
                {/* Background circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="30"
                />
                {/* Active products arc */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="30"
                  strokeDasharray={`${(stats.activeProducts / stats.totalProducts) * 439.6 || 0} 439.6`}
                  strokeDashoffset="0"
                  transform="rotate(-90 80 80)"
                  strokeLinecap="round"
                />
                {/* Inactive products arc */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="30"
                  strokeDasharray={`${(stats.inactiveProducts / stats.totalProducts) * 439.6 || 0} 439.6`}
                  strokeDashoffset={`-${(stats.activeProducts / stats.totalProducts) * 439.6 || 0}`}
                  transform="rotate(-90 80 80)"
                  strokeLinecap="round"
                />
                {/* Center text */}
                <text
                  x="80"
                  y="75"
                  textAnchor="middle"
                  fontSize="32"
                  fontWeight="700"
                  fill="#111827"
                >
                  {stats.totalProducts}
                </text>
                <text
                  x="80"
                  y="95"
                  textAnchor="middle"
                  fontSize="12"
                  fill="#6b7280"
                >
                  Sản phẩm
                </text>
              </svg>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: '#10b981',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  ✅
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                    {stats.activeProducts}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>Đang hoạt động</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: '#ef4444',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  ⛔
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
                    {stats.inactiveProducts}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>Đã ẩn</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders and Products Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: recentOrders.length > 0 ? '1fr 1fr' : '1fr',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Recent Orders Table */}
        {recentOrders.length > 0 && (
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
              color: '#111827',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              � Đơn hàng gần đây
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentOrders.map((order) => {
                const statusColors = {
                  'Pending': { bg: '#fef3c7', text: '#92400e', label: '⏳ Chờ xử lý' },
                  'Processing': { bg: '#dbeafe', text: '#1e40af', label: '⚙️ Đang xử lý' },
                  'Completed': { bg: '#d1fae5', text: '#065f46', label: '✅ Hoàn thành' },
                  'Delivered': { bg: '#d1fae5', text: '#065f46', label: '🚚 Đã giao' },
                  'Cancelled': { bg: '#fee2e2', text: '#991b1b', label: '❌ Đã hủy' }
                };
                const statusStyle = statusColors[order.status] || statusColors['Pending'];

                return (
                  <div
                    key={order.orderId}
                    style={{
                      padding: '16px',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#6366f1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f9fafb';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                          Đơn hàng #{order.orderId}
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                          {(order.grandTotal || order.totalAmount || 0).toLocaleString('vi-VN')} ₫
                        </div>
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: statusStyle.bg,
                        color: statusStyle.text
                      }}>
                        {statusStyle.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {order.orderDate || order.createdAt
                        ? new Date(order.orderDate || order.createdAt).toLocaleString('vi-VN')
                        : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Products Table */}
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
            color: '#111827',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            � Sản phẩm bán chạy nhất
          </h3>

          {recentProducts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentProducts.map((product) => (
                <div
                  key={product.productId}
                  style={{
                    padding: '16px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#6366f1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                        {product.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Đã bán: {(product.totalSold || 0).toLocaleString('vi-VN')} sản phẩm
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: product.isActive ? '#f0fdf4' : '#fef2f2',
                      color: product.isActive ? '#166534' : '#991b1b',
                      marginLeft: '12px'
                    }}>
                      {product.isActive ? '✅' : '⛔'}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#6366f1' }}>
                      {product.price?.toLocaleString('vi-VN')} ₫
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '700',
                      color: '#f59e0b',
                      background: '#fffbeb',
                      padding: '4px 8px',
                      borderRadius: '6px'
                    }}>
                      🔥 {(product.totalSold || 0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px 0' }}>
              Chưa có sản phẩm nào
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
