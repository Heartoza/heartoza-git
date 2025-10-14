import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../css/OrderDetail.css";
import http from "../../services/api"; // ✅ dùng client baseURL + token + refresh

export default function OrderDetail() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;

        const fetchOrder = async () => {
            try {
                // 🔹 Lấy chi tiết đơn hàng
                const resOrder = await http.get(`orders/${id}`);
                const data = resOrder.data;

                // 🔹 Lấy địa chỉ (nếu có shippingAddressId)
                let address = null;
                if (data.shippingAddressId) {
                    // cho phép 204 để không throw
                    const resAddr = await http.get(
                        `orders/address/${data.shippingAddressId}`,
                        { validateStatus: (s) => (s >= 200 && s < 300) || s === 204 }
                    );
                    address = resAddr.status === 204 ? null : resAddr.data ?? null;
                }

                setOrder({ ...data, shippingAddress: address });
            } catch (err) {
                setError(err?.response?.data?.message || err.message || "Không tải được chi tiết đơn hàng");
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id]);

    const statusLabels = {
        Pending: "⏳ Chờ xử lý",
        Packing: "📦 Đang đóng gói",
        Shipped: "🚚 Đã vận chuyển",
        Delivering: "🚛 Đang giao hàng",
        Cancelled: "❌ Đã hủy"
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>⏳ Đang tải chi tiết đơn hàng...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '24px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>❌</div>
                <h3 style={{ fontSize: '20px', color: '#ef4444', marginBottom: '8px' }}>Lỗi tải dữ liệu</h3>
                <p style={{ color: '#6b7280' }}>{error}</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div style={{ padding: '24px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
                <h3 style={{ fontSize: '20px', color: '#374151', marginBottom: '8px' }}>Không tìm thấy đơn hàng</h3>
            </div>
        );
    }

    const statusConfig = {
        Pending: { color: "#f59e0b", bg: "#fef3c7" },
        Packing: { color: "#3b82f6", bg: "#dbeafe" },
        Shipped: { color: "#8b5cf6", bg: "#ede9fe" },
        Delivering: { color: "#10b981", bg: "#d1fae5" },
        Cancelled: { color: "#ef4444", bg: "#fee2e2" },
    };

    const currentStatus = statusConfig[order.status] || { color: "#6b7280", bg: "#f3f4f6" };

    return (
        <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ 
                background: 'white', 
                borderRadius: '12px', 
                padding: '24px', 
                marginBottom: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb'
            }}>
                <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 16px 0', color: '#111827' }}>
                    📦 Đơn hàng {order.orderCode}
                </h2>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                        <span style={{ fontSize: '13px', color: '#6b7280', marginRight: '8px' }}>Trạng thái:</span>
                        <span style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: '600',
                            background: currentStatus.bg,
                            color: currentStatus.color,
                        }}>
                            {statusLabels[order.status] || order.status}
                        </span>
                    </div>
                    <div>
                        <span style={{ fontSize: '13px', color: '#6b7280', marginRight: '8px' }}>Ngày đặt:</span>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                            {order.createdAt
                                ? new Date(new Date(order.createdAt).getTime() + 7 * 60 * 60 * 1000).toLocaleString("vi-VN")
                                : "--"}
                        </span>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Tổng tiền</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#6366f1' }}>
                            {Number(order.grandTotal || 0).toLocaleString("vi-VN")} ₫
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Products */}
                    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📦 Sản phẩm ({order.items?.length || 0})
                        </h3>
                        {order.items?.length ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {order.items.map((i) => (
                                    <div key={i.orderItemId} style={{
                                        padding: '16px',
                                        background: '#f9fafb',
                                        borderRadius: '8px',
                                        border: '1px solid #e5e7eb',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                                                {i.productName}
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                                Số lượng: {i.quantity}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#6366f1', textAlign: 'right' }}>
                                            {Number(i.lineTotal || 0).toLocaleString("vi-VN")} ₫
                                        </div>
                                    </div>
                                ))}
                                <div style={{
                                    padding: '16px',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    color: 'white'
                                }}>
                                    <span style={{ fontSize: '16px', fontWeight: '600' }}>Tổng cộng</span>
                                    <span style={{ fontSize: '24px', fontWeight: '700' }}>{Number(order.grandTotal || 0).toLocaleString("vi-VN")} ₫</span>
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>Không có sản phẩm nào.</p>
                        )}
                    </div>

                    {/* Comment */}
                    {order.comment && (
                        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 12px 0', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                💬 Ghi chú đơn hàng
                            </h3>
                            <p style={{ 
                                margin: 0, 
                                padding: '12px', 
                                background: '#fef3c7', 
                                borderRadius: '8px', 
                                fontSize: '14px', 
                                color: '#92400e',
                                borderLeft: '4px solid #f59e0b'
                            }}>
                                {order.comment}
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Shipping Address */}
                    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📍 Địa chỉ nhận hàng
                        </h3>
                        {order.shippingAddress ? (
                            <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#374151' }}>
                                <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '8px', color: '#111827' }}>
                                    {order.shippingAddress.fullName}
                                </div>
                                <div>{order.shippingAddress.line1}</div>
                                <div>{order.shippingAddress.district}, {order.shippingAddress.city}</div>
                                <div>
                                    {order.shippingAddress.country}
                                    {order.shippingAddress.postalCode ? ` • ${order.shippingAddress.postalCode}` : ""}
                                </div>
                                <div style={{ 
                                    marginTop: '12px', 
                                    padding: '8px 12px', 
                                    background: '#eef2ff', 
                                    borderRadius: '6px',
                                    color: '#6366f1',
                                    fontWeight: '600'
                                }}>
                                    📞 {order.shippingAddress.phone}
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>Chưa có địa chỉ.</p>
                        )}
                    </div>

                    {/* Payment */}
                    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            💳 Thanh toán
                        </h3>
                        {order.payments?.length ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {order.payments.map((p) => (
                                    <div key={p.paymentId} style={{
                                        padding: '12px',
                                        background: '#f9fafb',
                                        borderRadius: '8px',
                                        border: '1px solid #e5e7eb',
                                        fontSize: '14px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: '600', color: '#111827' }}>{p.method}</span>
                                            <span style={{ color: '#6366f1', fontWeight: '700' }}>{Number(p.amount || 0).toLocaleString("vi-VN")} ₫</span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                            Trạng thái: <span style={{ fontWeight: '600' }}>{p.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>Chưa có thông tin thanh toán.</p>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @media (max-width: 1024px) {
                    div[style*="grid-template-columns: 1fr 350px"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
