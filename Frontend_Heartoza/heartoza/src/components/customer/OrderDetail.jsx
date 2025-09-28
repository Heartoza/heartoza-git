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

    fetch(`https://localhost:7109/api/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("Không tải được chi tiết đơn hàng");
        return res.json();
      })
      .then(data => setOrder(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
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
          {order.items?.map((i) => (
            <li key={i.orderItemId}>
              {i.productName} x{i.quantity} = {i.lineTotal.toLocaleString()} đ
            </li>
          ))}
        </ul>
      </div>

      <div className="section">
        <h3>Thanh toán</h3>
        <ul>
          {order.payments?.map((p) => (
            <li key={p.paymentId}>
              {p.method} - {p.status} ({p.amount.toLocaleString()} đ)
            </li>
          ))}
        </ul>
      </div>

      <div className="section">
        <h3>Giao hàng</h3>
        <ul>
          {order.shipments?.map((s) => (
            <li key={s.shipmentId}>
              {s.status} {s.trackingCode ? `- ${s.trackingCode}` : ""}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
