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

    if (!user) return <div className="order-list-container">Bạn cần đăng nhập để xem đơn hàng.</div>;
    if (loading) return <div className="order-list-container">Đang tải đơn hàng...</div>;
    if (error) return <div className="order-list-container" style={{ color: "red" }}>Lỗi: {error}</div>;

    return (
        <div className="order-list-container">
            <h2 className="order-list-title">Đơn hàng của tôi</h2>
            {orders.length === 0 ? (
  <p>Chưa có đơn hàng nào.</p>
) : (
  <>
    {["Pending", "Paid", "Packing", "Shipped", "Delivered", "Cancelled"].map((status) => {
      const filtered = orders.filter((o) => o.status === status);
      if (filtered.length === 0) return null;

      return (
        <div key={status} className="order-group">
          <h3 className="status-header">{status}</h3>
          <table className="order-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Trạng thái</th>
                <th>Tổng tiền</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.orderId}>
                  <td>
                    <Link to={`/orders/${o.orderId}`} className="order-link">
                      {o.orderCode}
                    </Link>
                  </td>
                  <td>
                    <span className={`status ${o.status?.toLowerCase()}`}>{o.status}</span>
                  </td>
                  <td>{Number(o.grandTotal || 0).toLocaleString("vi-VN")} đ</td>
                  <td>{o.createdAt ? new Date(o.createdAt).toLocaleString("vi-VN") : "--"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    })}
  </>
)}
        </div>
    );
}
