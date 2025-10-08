import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AdminService } from "../../services/adminService";
import "../css/Admin.css";
import http from "../../services/api"; // ✅ dùng client baseURL + token + refresh

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  const statusList = ["Pending", "Paid", "Packing", "Shipped", "Delivered", "Cancelled"];

  useEffect(() => {
  if (!id) return;

  const fetchOrder = async () => {
    try {
      const data = await AdminService.getOrderById(id);

      // 🔹 Gọi thêm API địa chỉ
      let address = null;
      if (data.shippingAddressId) {
        const resAddr = await http.get(
          `orders/address/${data.shippingAddressId}`,
          { validateStatus: (s) => (s >= 200 && s < 300) || s === 204 }
        );
        address = resAddr.status === 204 ? null : resAddr.data ?? null;
      }

      setOrder({ ...data, shippingAddress: address });
      setNewStatus(data.status);
    } catch (err) {
      setError(err.message || "Không tải được chi tiết đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  fetchOrder();
}, [id]);

  const handleUpdateStatus = async () => {
    try {
      await AdminService.updateOrderStatus(id, newStatus);
      alert("✅ Cập nhật trạng thái thành công!");
      setOrder({ ...order, status: newStatus });
    } catch (err) {
      alert("❌ " + (err.message || "Không cập nhật được trạng thái"));
    }
  };

  if (loading) return <p>⏳ Đang tải chi tiết đơn hàng...</p>;
  if (error) return <p className="text-red-500">❌ {error}</p>;
  if (!order) return <p>Không tìm thấy đơn hàng.</p>;

  return (
    <div className="order-detail-container">
      <h2 className="order-detail-title">Đơn hàng {order.orderCode}</h2>

      <div className="order-info">
        <p>
          Trạng thái: <span className={`status-badge ${order.status.toLowerCase()}`}>{order.status}</span>
        </p>
        <p>Tổng tiền: {order.grandTotal.toLocaleString()} đ</p>
        <p>Ngày tạo: {new Date(order.createdAt).toLocaleString("vi-VN")}</p>
      </div>

      {/* Update trạng thái */}
      <div className="section">
        <h3>Cập nhật trạng thái</h3>
        <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
          {statusList.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button onClick={handleUpdateStatus} className="btn-update">Cập nhật</button>
      </div>

      {/* Sản phẩm */}
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

      {/* Thanh toán */}
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
      {/* Ghi chú đơn hàng */}
<div className="section">
  <h3>Ghi chú đơn hàng</h3>
  <p>{order.comment ? order.comment : "Không có ghi chú nào."}</p>
</div>

      {/* Giao hàng */}
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

      {/* Địa chỉ */}
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
