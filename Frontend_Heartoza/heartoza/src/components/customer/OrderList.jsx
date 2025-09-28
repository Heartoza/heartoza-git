import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "../css/OrderList.css";

export default function OrderList() {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    fetch(`https://localhost:7109/api/Orders?userId=${user.userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Lỗi server: " + res.status);
        return res.json();
      })
      .then((data) => {
        setOrders(data.items || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
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
            {orders.map((o) => (
              <tr key={o.orderId}>
                <td>
                  <Link to={`/orders/${o.orderId}`} className="order-link">
                    {o.orderCode}
                  </Link>
                </td>
                <td>
                  <span className={`status ${o.status.toLowerCase()}`}>
                    {o.status}
                  </span>
                </td>
                <td>{o.grandTotal.toLocaleString()} đ</td>
                <td>{new Date(o.createdAt).toLocaleString("vi-VN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
