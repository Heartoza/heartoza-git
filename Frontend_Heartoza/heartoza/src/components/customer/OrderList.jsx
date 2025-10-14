import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "../css/OrderList.css";
import http from "../../services/api"; // ✅ dùng API base

export default function OrderList() {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const res = await http.get("Orders", {
          params: { userId: user.userId }, // ✅ /api/Orders?userId=...
          // chấp nhận 204 nếu API trả về rỗng
          validateStatus: (s) => (s >= 200 && s < 300) || s === 204,
        });

        const data = res.status === 204 ? { items: [] } : res.data;
        setOrders(data.items || []);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || "Lỗi tải đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  // Status configuration
  const statusConfig = {
    Pending: { label: "⏳ Chờ xử lý", color: "#f59e0b", bg: "#fef3c7" },
    Packing: { label: "📦 Đang đóng gói", color: "#3b82f6", bg: "#dbeafe" },
    Shipped: { label: "🚚 Đã vận chuyển", color: "#8b5cf6", bg: "#ede9fe" },
    Delivering: { label: "🚛 Đang giao hàng", color: "#10b981", bg: "#d1fae5" },
    Cancelled: { label: "❌ Đã hủy", color: "#ef4444", bg: "#fee2e2" },
  };

  if (!user) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔒</div>
        <h3 style={{ fontSize: '20px', color: '#374151', marginBottom: '8px' }}>Yêu cầu đăng nhập</h3>
        <p style={{ color: '#6b7280' }}>Bạn cần đăng nhập để xem đơn hàng của mình.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>⏳ Đang tải đơn hàng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>❌</div>
        <h3 style={{ fontSize: '20px', color: '#ef4444', marginBottom: '8px' }}>Lỗi tải dữ liệu</h3>
        <p style={{ color: '#6b7280' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' }}>
          📦 Đơn hàng của tôi
        </h2>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
          Tổng số: {orders.length} đơn hàng
        </p>
      </div>

      {orders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#f9fafb',
          borderRadius: '12px',
          border: '2px dashed #e5e7eb'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
          <h3 style={{ fontSize: '20px', color: '#374151', marginBottom: '8px' }}>
            Chưa có đơn hàng nào
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Các đơn hàng của bạn sẽ xuất hiện ở đây
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {["Pending", "Packing", "Shipped", "Delivering", "Cancelled"].map((status) => {
            const filtered = orders.filter((o) => o.status === status);
            if (filtered.length === 0) return null;

            const config = statusConfig[status];

            return (
              <div key={status} style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '20px',
                  paddingBottom: '12px',
                  borderBottom: '2px solid #e5e7eb'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: 0,
                    color: '#111827'
                  }}>
                    {config.label}
                  </h3>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: config.bg,
                    color: config.color
                  }}>
                    {filtered.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filtered.map((o) => (
                    <Link
                      key={o.orderId}
                      to={`/orders/${o.orderId}`}
                      style={{
                        display: 'block',
                        padding: '16px',
                        background: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        textDecoration: 'none',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f3f4f6';
                        e.currentTarget.style.borderColor = '#6366f1';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f9fafb';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: '16px'
                      }}>
                        <div style={{ flex: '1', minWidth: '200px' }}>
                          <div style={{
                            fontSize: '15px',
                            fontWeight: '700',
                            color: '#6366f1',
                            marginBottom: '4px'
                          }}>
                            {o.orderCode}
                          </div>
                          <div style={{ fontSize: '13px', color: '#6b7280' }}>
                            {o.createdAt
                              ? new Date(new Date(o.createdAt).getTime() + 7 * 60 * 60 * 1000).toLocaleString("vi-VN")
                              : "--"}
                          </div>
                        </div>
                        
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            color: '#111827',
                            marginBottom: '4px'
                          }}>
                            {Number(o.grandTotal || 0).toLocaleString("vi-VN")} ₫
                          </div>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: config.bg,
                            color: config.color
                          }}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
