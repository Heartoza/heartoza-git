import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; // dùng để decode token
import "../css/Cart.css";

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // 🔹 Load giỏ hàng
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Bạn cần đăng nhập để xem giỏ hàng.");
          return;
        }

        const res = await axios.get("https://localhost:7109/api/Cart", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const mappedCart = {
          ...res.data,
          cartItems: res.data.cartItems.map((ci) => ({
            ...ci,
            cartItemId: Number(ci.cartItemId),
            productName:
              ci.product?.name || ci.productName || "Sản phẩm không xác định",
            lineTotal: ci.quantity * ci.unitPrice,
          })),
        };

        setCart(mappedCart);
      } catch (error) {
        console.error("Lỗi khi lấy giỏ hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  // 🔹 Cập nhật số lượng
  const updateQuantity = async (cartItemId, newQuantity) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await axios.post(
        "https://localhost:7109/api/Cart/UpdateQuantity",
        { cartItemId, quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCart((prev) => {
        const updatedItems = prev.cartItems
          .map((ci) =>
            ci.cartItemId === cartItemId
              ? {
                  ...ci,
                  quantity: newQuantity,
                  lineTotal: newQuantity * ci.unitPrice,
                }
              : ci
          )
          .filter((ci) => ci.quantity > 0);
        return { ...prev, cartItems: updatedItems };
      });
    } catch (err) {
      console.error("Lỗi cập nhật giỏ hàng:", err);
    }
  };

  // 🔹 Xóa sản phẩm
  const removeItem = async (cartItemId, productName) => {
    if (!window.confirm(`Bạn có chắc muốn xóa "${productName}" khỏi giỏ hàng?`)) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await axios.delete(`https://localhost:7109/api/Cart/RemoveItem/${cartItemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCart((prev) => ({
        ...prev,
        cartItems: prev.cartItems.filter((ci) => ci.cartItemId !== cartItemId),
      }));

      setSelectedItems((prev) => prev.filter((id) => id !== cartItemId));
    } catch (err) {
      console.error("Lỗi xóa item:", err);
    }
  };

  // 🔹 Chọn / Bỏ chọn 1 item
  const toggleSelectItem = (cartItemId) => {
    setSelectedItems((prev) =>
      prev.includes(cartItemId)
        ? prev.filter((x) => x !== cartItemId)
        : [...prev, cartItemId]
    );
  };

  // 🔹 Chọn tất cả
  const toggleSelectAll = () => {
    if (!cart) return;

    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cart.cartItems.map((ci) => ci.cartItemId));
    }
    setSelectAll(!selectAll);
  };

  // 🔹 Thanh toán
  const handleCheckout = async () => {
    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm để thanh toán.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const payload = {
        shippingAddressId: 1, // TODO: sau này user chọn địa chỉ
        shippingFee: 0,
        method: "COD",
        items: selectedItems.map((id) => {
          const item = cart.cartItems.find((ci) => ci.cartItemId === id);
          return {
            productId: item.productId,
            quantity: item.quantity,
          };
        }),
      };

      const res = await axios.post("https://localhost:7109/api/orders", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert(`✅ Thanh toán thành công! Mã đơn: ${res.data.orderCode}`);
      setSelectedItems([]);
    } catch (err) {
      console.error("Lỗi thanh toán:", err.response?.data || err.message);
      alert("❌ Vui lòng chọn 1 hộp cho đơn hàng!");
    }
  };

  // 🔹 Render UI
  if (loading) return <p>Đang tải giỏ hàng...</p>;
  if (!cart || !cart.cartItems || cart.cartItems.length === 0) return <p>Giỏ hàng trống</p>;

const total = cart.cartItems.reduce((sum, i) => sum + i.lineTotal, 0);


  return (
    <div className="cart-container">
      <h2>🛒 Giỏ hàng của bạn</h2>
      <table className="cart-table">
        <thead>
          <tr>
            <th>
              <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
            </th>
            <th>Sản phẩm</th>
            <th>Số lượng</th>
            <th>Giá</th>
            <th>Tổng</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {cart.cartItems.map((item) => (
            <tr key={item.cartItemId}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.cartItemId)}
                  onChange={() => toggleSelectItem(item.cartItemId)}
                />
              </td>
              <td>{item.productName}</td>
              <td>
                <button
                  onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                {item.quantity}
                <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}>
                  +
                </button>
              </td>
              <td>{item.unitPrice.toLocaleString()} đ</td>
              <td>{item.lineTotal.toLocaleString()} đ</td>
              <td>
                <button onClick={() => removeItem(item.cartItemId, item.productName)}>
                  🗑 Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Tổng cộng: {total.toLocaleString()} đ</h3>
      <button className="checkout-btn" onClick={handleCheckout}>
        ✅ Thanh toán
      </button>
    </div>
  );
}
