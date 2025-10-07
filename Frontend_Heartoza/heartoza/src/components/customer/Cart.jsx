import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { AuthService } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import "../css/Cart.css";
import http from "../../services/api"; // ✅ dùng API base

export default function Cart() {
    const [cart, setCart] = useState(null);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);

    useEffect(() => {
        const fetchCartAndAddresses = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login?reason=cart");
                return;
            }

            try {
                // 🔹 Lấy giỏ hàng
                const cartRes = await http.get("Cart"); // ✅ /api/Cart
                const mappedCart = {
                    ...cartRes.data,
                    cartItems: cartRes.data.cartItems.map((ci) => ({
                        ...ci,
                        cartItemId: Number(ci.cartItemId),
                        productName:
                            ci.product?.name || ci.productName || "Sản phẩm không xác định",
                        lineTotal: ci.quantity * ci.unitPrice,
                    })),
                };
                setCart(mappedCart);

                // 🔹 Lấy profile + địa chỉ
                const profile = await AuthService.getProfile(); // ✅ dùng http bên trong AuthService
                setAddresses(profile.addresses || []);
                const defaultAddr = profile.addresses?.find((a) => a.isDefault);
                if (defaultAddr) setSelectedAddress(defaultAddr.addressId);
            } catch (err) {
                console.error("Lỗi khi load Cart/Addresses:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCartAndAddresses();
    }, [navigate]);

    // 🔹 Cập nhật số lượng
    const updateQuantity = async (cartItemId, newQuantity) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            await http.post("Cart/UpdateQuantity", {
                cartItemId,
                quantity: newQuantity,
            }); // ✅ /api/Cart/UpdateQuantity

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

            await http.delete(`Cart/RemoveItem/${cartItemId}`); // ✅ /api/Cart/RemoveItem/:id

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
        if (!selectedAddress) {
            alert("Vui lòng chọn địa chỉ giao hàng.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const payload = {
                shippingAddressId: selectedAddress,
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

            // ✅ /api/orders (ASP.NET không phân biệt hoa thường, dùng "orders" như code cũ)
            const res = await http.post("orders", payload);

            alert(`✅ Thanh toán thành công! Mã đơn: ${res.data.orderCode}`);

            // Xóa các item đã mua khỏi giỏ
            await Promise.all(
                selectedItems.map((id) => http.delete(`Cart/RemoveItem/${id}`))
            );

            setCart((prev) => ({
                ...prev,
                cartItems: prev.cartItems.filter(
                    (ci) => !selectedItems.includes(ci.cartItemId)
                ),
            }));

            setSelectedItems([]);
            navigate("/orders");
        } catch (err) {
            console.error("Lỗi thanh toán:", err?.response?.data || err.message);
            alert("❌ Vui lòng thử lại!");
        }
    };

    // 🔹 Render UI
    if (loading) return <p>Đang tải giỏ hàng...</p>;
    if (!cart || !cart.cartItems || cart.cartItems.length === 0)
        return <p>Giỏ hàng trống</p>;

    const total = cart.cartItems
        .filter((i) => selectedItems.includes(i.cartItemId))
        .reduce((sum, i) => sum + i.lineTotal, 0);

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

            {selectedItems.length > 0 && (
                <h3>
                    Tổng cộng: <span className="text-red-600 font-bold">{total.toLocaleString()} đ</span>
                </h3>
            )}
            <button
                className="checkout-btn"
                onClick={handleCheckout}
                disabled={selectedItems.length === 0 || !selectedAddress}
            >
                ✅ Thanh toán
            </button>

            <div className="address-section my-4">
                <h3>🏠 Chọn địa chỉ giao hàng</h3>
                {addresses.length === 0 ? (
                    <div>
                        <p>Chưa có địa chỉ nào.</p>
                        <a href="/profile" className="text-blue-600 underline">
                            Thêm địa chỉ
                        </a>
                    </div>
                ) : (
                    <ul>
                        {addresses.map((addr) => (
                            <li key={addr.addressId}>
                                <label>
                                    <input
                                        type="radio"
                                        name="shippingAddress"
                                        value={addr.addressId}
                                        checked={selectedAddress === addr.addressId}
                                        onChange={() => setSelectedAddress(addr.addressId)}
                                    />
                                    {addr.fullName}, {addr.line1}, {addr.district}, {addr.city}
                                    {addr.isDefault && <span className="default-badge">Mặc định</span>}
                                </label>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
