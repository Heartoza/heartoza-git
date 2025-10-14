import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { AuthService } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import "../css/Cart.css";
import http from "../../services/api";

const PHONE_RE = /^[0-9+()\s-]{8,}$/;

export default function Cart() {
    const [cart, setCart] = useState(null);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [accessory, setAccessory] = useState("");
    const [led, setLed] = useState("Không");
    const [wish, setWish] = useState("");
    const [cardMessage, setCardMessage] = useState("");

    const [selectedItems, setSelectedItems] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    const [addresses, setAddresses] = useState([]);            // tất cả địa chỉ (raw)
    const [usableAddresses, setUsableAddresses] = useState([]); // địa chỉ có SĐT hợp lệ
    const [selectedAddress, setSelectedAddress] = useState(null);

    useEffect(() => {
        const fetchCartAndAddresses = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login?reason=cart");
                return;
            }

            try {
                const cartRes = await http.get("Cart");
                const mappedCart = {
                    ...cartRes.data,
                    cartItems: cartRes.data.cartItems.map((ci) => ({
                        ...ci,
                        cartItemId: Number(ci.cartItemId),
                        productName: ci.product?.name || ci.productName || "Sản phẩm không xác định",
                        lineTotal: ci.quantity * ci.unitPrice,
                    })),
                };
                setCart(mappedCart);

                const profile = await AuthService.getProfile();
                const raw = profile.addresses || [];
                const usable = raw.filter((a) => PHONE_RE.test((a.phone || "").trim()));

                setAddresses(raw);
                setUsableAddresses(usable);

                // ưu tiên default hợp lệ, nếu không lấy cái đầu tiên hợp lệ
                const defaultUsable = usable.find((a) => a.isDefault);
                if (defaultUsable) setSelectedAddress(defaultUsable.addressId);
                else if (usable.length) setSelectedAddress(usable[0].addressId);
                else setSelectedAddress(null);
            } catch (err) {
                console.error("Lỗi khi load Cart/Addresses:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCartAndAddresses();
    }, [navigate]);

    const updateQuantity = async (cartItemId, newQuantity) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            await http.post("Cart/UpdateQuantity", {
                cartItemId,
                quantity: newQuantity,
            });

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
            alert(err.userMessage || "Cập nhật giỏ hàng thất bại.");
        }
    };

    const removeItem = async (cartItemId, productName) => {
        if (!window.confirm(`Bạn có chắc muốn xóa "${productName}" khỏi giỏ hàng?`)) return;

        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            await http.delete(`Cart/RemoveItem/${cartItemId}`);

            setCart((prev) => ({
                ...prev,
                cartItems: prev.cartItems.filter((ci) => ci.cartItemId !== cartItemId),
            }));

            setSelectedItems((prev) => prev.filter((id) => id !== cartItemId));
        } catch (err) {
            console.error("Lỗi xóa item:", err);
            alert(err.userMessage || "Xoá sản phẩm thất bại.");
        }
    };

    const toggleSelectItem = (cartItemId) => {
        setSelectedItems((prev) =>
            prev.includes(cartItemId) ? prev.filter((x) => x !== cartItemId) : [...prev, cartItemId]
        );
    };

    const toggleSelectAll = () => {
        if (!cart) return;

        if (selectAll) {
            setSelectedItems([]);
        } else {
            setSelectedItems(cart.cartItems.map((ci) => ci.cartItemId));
        }
        setSelectAll(!selectAll);
    };

    const handleCheckout = async () => {
        if (selectedItems.length === 0) {
            alert("Vui lòng chọn ít nhất một sản phẩm để thanh toán.");
            return;
        }
        if (!selectedAddress) {
            alert("Vui lòng chọn địa chỉ giao hàng.");
            return;
        }

        // ✅ bảo hiểm: selectedAddress phải nằm trong usableAddresses
        const isUsable = usableAddresses.some((a) => a.addressId === selectedAddress);
        if (!isUsable) {
            alert("Địa chỉ giao hàng thiếu số điện thoại hợp lệ. Vui lòng cập nhật trong trang Hồ sơ.");
            return;
        }

        if (!accessory.trim() || !led.trim() || !cardMessage.trim() || !wish.trim()) {
            alert("⚠️ Vui lòng điền đầy đủ tất cả các trường trong phần ghi chú (Phụ kiện, LED, Lời nhắn, Mong muốn).");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const payload = {
                shippingAddressId: selectedAddress,
                shippingFee: 0,
                method: "COD",
                comment: `🎁 Phụ kiện kèm theo: ${accessory}\n💡 LED: ${led}\n✉️ Lời nhắn trong thiệp: ${cardMessage}\n💭 Mong muốn: ${wish}`,
                items: selectedItems.map((id) => {
                    const item = cart.cartItems.find((ci) => ci.cartItemId === id);
                    return {
                        productId: item.productId,
                        quantity: item.quantity,
                    };
                }),
            };

            const res = await http.post("orders", payload);
            alert(`✅ Thanh toán thành công! Mã đơn: ${res.data.orderCode}`);

            await Promise.all(selectedItems.map((id) => http.delete(`Cart/RemoveItem/${id}`)));

            setCart((prev) => ({
                ...prev,
                cartItems: prev.cartItems.filter((ci) => !selectedItems.includes(ci.cartItemId)),
            }));

            setSelectedItems([]);
            navigate("/orders");
        } catch (err) {
            console.error("Lỗi thanh toán chi tiết:", err);
            // dùng message chuẩn hoá từ interceptor
            const msg =
                err?.userMessage ||
                err?.response?.data?.message ||
                err?.response?.data?.title ||
                err?.response?.data ||
                "Có lỗi xảy ra khi tạo đơn hàng.";
            alert(`❌ ${msg}`);
        }
    };

    if (loading) {
        return (
            <div className="cart-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Đang tải giỏ hàng...</p>
                </div>
            </div>
        );
    }

    if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
        return (
            <div className="cart-container">
                <div className="empty-cart">
                    <div className="empty-cart-icon">🛒</div>
                    <p>Giỏ hàng của bạn đang trống</p>
                </div>
            </div>
        );
    }

    const total = cart.cartItems
        .filter((i) => selectedItems.includes(i.cartItemId))
        .reduce((sum, i) => sum + i.lineTotal, 0);

    const selectedCount = selectedItems.length;

    return (
        <div className="cart-container">
            <h2>Giỏ hàng của bạn</h2>

            <div className="cart-layout">
                {/* Main Cart Section */}
                <div className="cart-main">
                    {/* Select All Bar */}
                    <div className="select-all-bar">
                        <label>
                            <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
                            Chọn tất cả ({cart.cartItems.length} sản phẩm)
                        </label>
                    </div>

                    {/* Cart Items */}
                    {cart.cartItems.map((item) => (
                        <div
                            key={item.cartItemId}
                            className={`cart-item-card ${selectedItems.includes(item.cartItemId) ? "selected" : ""}`}
                        >
                            <div className="item-checkbox">
                                <input
                                    type="checkbox"
                                    checked={selectedItems.includes(item.cartItemId)}
                                    onChange={() => toggleSelectItem(item.cartItemId)}
                                />
                            </div>

                            <div className="item-info">
                                <h3 className="item-name">{item.productName}</h3>
                            </div>

                            <div className="item-quantity">
                                <div className="quantity-control">
                                    <button
                                        className="quantity-btn"
                                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                                        disabled={item.quantity <= 1}
                                    >
                                        −
                                    </button>
                                    <span className="quantity-value">{item.quantity}</span>
                                    <button
                                        className="quantity-btn"
                                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="item-total">
                                <span>{item.lineTotal.toLocaleString()} đ</span>
                            </div>

                            <div className="item-remove">
                                <button
                                    className="remove-btn"
                                    onClick={() => removeItem(item.cartItemId, item.productName)}
                                    title="Xóa sản phẩm"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Comment Section */}
                    <div className="comment-section">
                        <h3>💬 Ghi chú cho đơn hàng</h3>

                        <div className="comment-field">
                            <label>🎁 Phụ kiện kèm theo</label>
                            <input
                                type="text"
                                value={accessory}
                                onChange={(e) => setAccessory(e.target.value)}
                                placeholder="Ví dụ: Gấu bông nhỏ, hoa khô..."
                            />
                        </div>

                        <div className="comment-field">
                            <label>💡 LED trang trí</label>
                            <select value={led} onChange={(e) => setLed(e.target.value)}>
                                <option value="Không">Không</option>
                                <option value="Có">Có</option>
                            </select>
                        </div>

                        <div className="comment-field">
                            <label>✉️ Lời nhắn trong thiệp</label>
                            <textarea
                                value={cardMessage}
                                onChange={(e) => setCardMessage(e.target.value)}
                                placeholder="Nhập lời nhắn bạn muốn ghi trong thiệp..."
                                rows={3}
                            />
                        </div>
                        <div className="comment-field">
                            <label>💭 Mong muốn của bạn</label>
                            <textarea
                                value={wish}
                                onChange={(e) => setWish(e.target.value)}
                                placeholder="Ví dụ: Giao hàng sớm trước ngày lễ, gói quà thật đẹp..."
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Address Section */}
                    <div className="address-section">
                        <h3>🏠 Địa chỉ giao hàng</h3>

                        {usableAddresses.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "20px" }}>
                                <p style={{ color: "#718096", marginBottom: "12px" }}>
                                    Chưa có địa chỉ hợp lệ (thiếu số điện thoại).
                                </p>
                                <a
                                    href="/profile"
                                    style={{ color: "#ff6f61", textDecoration: "none", fontWeight: 600 }}
                                >
                                    + Cập nhật số điện thoại trong địa chỉ
                                </a>
                            </div>
                        ) : (
                            <>
                                {/* nếu có địa chỉ bị ẩn vì thiếu SĐT, nhắc nhẹ */}
                                {addresses.length > usableAddresses.length && (
                                    <div className="note" style={{ marginBottom: 8, color: "#b45309" }}>
                                        Một số địa chỉ đã ẩn vì thiếu số điện thoại. Hãy cập nhật trong trang Hồ sơ.
                                    </div>
                                )}

                                <ul>
                                    {usableAddresses.map((addr) => (
                                        <li
                                            key={addr.addressId}
                                            className={`address-item ${selectedAddress === addr.addressId ? "selected" : ""}`}
                                        >
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="shippingAddress"
                                                    value={addr.addressId}
                                                    checked={selectedAddress === addr.addressId}
                                                    onChange={() => setSelectedAddress(addr.addressId)}
                                                />
                                                <div className="address-content">
                                                    <div className="address-name">
                                                        {addr.fullName}
                                                        {addr.isDefault && <span className="default-badge">Mặc định</span>}
                                                    </div>
                                                    <div className="address-details">
                                                        {addr.line1}, {addr.district}, {addr.city} • 📞 {addr.phone}
                                                    </div>
                                                </div>
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                </div>

                {/* Sidebar Summary */}
                <div className="cart-sidebar">
                    <div className="summary-card">
                        <h3>📋 Tóm tắt đơn hàng</h3>

                        <div className="summary-row">
                            <span className="summary-label">Sản phẩm đã chọn</span>
                            <span className="summary-value">{selectedCount} sản phẩm</span>
                        </div>

                        <div className="summary-row">
                            <span className="summary-label">Tạm tính</span>
                            <span className="summary-value">{total.toLocaleString()} đ</span>
                        </div>

                        <div className="summary-row">
                            <span className="summary-label">Thanh toán</span>
                            <span className="summary-value" style={{ color: "#48bb78" }}>
                                Khi nhận hàng
                            </span>
                        </div>

                        <div className="summary-total">
                            <span className="label">Tổng cộng</span>
                            <span className="value">{total.toLocaleString()} đ</span>
                        </div>

                        <button
                            className="checkout-btn"
                            onClick={handleCheckout}
                            disabled={selectedItems.length === 0 || !selectedAddress || usableAddresses.length === 0}
                        >
                            {selectedItems.length === 0
                                ? "⚠️ Chọn sản phẩm"
                                : !selectedAddress || usableAddresses.length === 0
                                    ? "⚠️ Chọn địa chỉ hợp lệ"
                                    : "✅ Thanh toán ngay"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
