import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../css/OrderDetail.css";

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!id) return;

    const fetchOrder = async () => {
      try {
        // Lấy chi tiết đơn hàng
        const resOrder = await fetch(`https://localhost:7109/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resOrder.ok) throw new Error("Không tải được chi tiết đơn hàng");

        const data = await resOrder.json();

        let address = null;
        // Lấy địa chỉ nếu có shippingAddressId
        if (data.shippingAddressId) {
          const resAddr = await fetch(
            `https://localhost:7109/api/orders/address/${data.shippingAddressId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (resAddr.ok && resAddr.status !== 204) {
            try {
              address = await resAddr.json();
            } catch {
              address = null;
            }
          }
        }


        setOrder({ ...data, shippingAddress: address });
      } catch (err) {
        setError(err.message);
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
          <span className={`status-badge ${order.status.toLowerCase()}`}>
            {order.status}
          </span>
        </p>
        <p>Tổng tiền: {order.grandTotal.toLocaleString()} đ</p>
        <p>Ngày tạo: {new Date(order.createdAt).toLocaleString("vi-VN")}</p>
      </div>

      <div className="section">
        <h3>Sản phẩm</h3>
        <ul>
          {order.items?.length ? (
            order.items.map((i) => (
              <li key={i.orderItemId}>
                {i.productName} x{i.quantity} = {i.lineTotal.toLocaleString()} đ
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
                {p.method} - {p.status} ({p.amount.toLocaleString()} đ)
              </li>
            ))
          ) : (
            <li>Chưa có thông tin thanh toán.</li>
          )}
        </ul>
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
