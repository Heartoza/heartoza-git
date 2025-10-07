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

    if (loading) return <p>⏳ Đang tải chi tiết đơn hàng...</p>;
    if (error) return <p className="text-red-500">❌ {error}</p>;
    if (!order) return <p>Không tìm thấy đơn hàng.</p>;

    return (
        <div className="order-detail-container">
            <h2 className="order-detail-title">Đơn hàng {order.orderCode}</h2>

            <div className="order-info">
                <p>
                    Trạng thái:{" "}
                    <span className={`status-badge ${order.status?.toLowerCase()}`}>
                        {order.status}
                    </span>
                </p>
                <p>Tổng tiền: {Number(order.grandTotal || 0).toLocaleString("vi-VN")} đ</p>
                <p>Ngày tạo: {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "--"}</p>
            </div>

            <div className="section">
                <h3>Sản phẩm</h3>
                <ul>
                    {order.items?.length ? (
                        order.items.map((i) => (
                            <li key={i.orderItemId}>
                                {i.productName} x{i.quantity} = {Number(i.lineTotal || 0).toLocaleString("vi-VN")} đ
                            </li>
                        ))
                    ) : (
                        <li>Không có sản phẩm nào.</li>
                    )}
                </ul>
            </div>

            <div className="section">
                <h3>Thanh toán</h3>
                <ul>
                    {order.payments?.length ? (
                        order.payments.map((p) => (
                            <li key={p.paymentId}>
                                {p.method} - {p.status} ({Number(p.amount || 0).toLocaleString("vi-VN")} đ)
                            </li>
                        ))
                    ) : (
                        <li>Chưa có thông tin thanh toán.</li>
                    )}
                </ul>
            </div>
            <div className="section">
                <h3>Ghi chú đơn hàng</h3>
                <p>{order.comment ? order.comment : "Không có ghi chú nào."}</p>
            </div>

            <div className="section">
                <h3>Giao hàng</h3>
                <ul>
                    {order.shipments?.length ? (
                        order.shipments.map((s) => (
                            <li key={s.shipmentId}>
                                {s.status} {s.trackingCode ? `- ${s.trackingCode}` : ""}
                            </li>
                        ))
                    ) : (
                        <li>Chưa có thông tin giao hàng.</li>
                    )}
                </ul>
            </div>

            <div className="section">
                <h3>Địa chỉ nhận hàng</h3>
                {order.shippingAddress ? (
                    <div className="shipping-address">
                        <p><strong>{order.shippingAddress.fullName}</strong></p>
                        <p>{order.shippingAddress.line1}</p>
                        <p>
                            {order.shippingAddress.district}, {order.shippingAddress.city}
                        </p>
                        <p>
                            {order.shippingAddress.country}
                            {order.shippingAddress.postalCode ? ` • ${order.shippingAddress.postalCode}` : ""}
                        </p>
                        <p>📞 {order.shippingAddress.phone}</p>
                    </div>
                ) : (
                    <p>Chưa có địa chỉ.</p>
                )}
            </div>
        </div>
    );
}
