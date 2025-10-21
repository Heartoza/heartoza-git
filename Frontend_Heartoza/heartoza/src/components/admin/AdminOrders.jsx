import React, { useEffect, useState } from "react";
import { AdminService } from "../../services/adminService";
import "../css/Admin.css";
import { NavLink } from "react-router-dom";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    (async () => {
      const data = await AdminService.getOrders(1, 1000); // Get more orders
      setOrders(data.items || data || []);
    })();
  }, []);

  // Define order statuses with colors and labels
  const statusConfig = {
    Pending: { label: "⏳ Chờ xử lý", color: "#f59e0b", bg: "#fef3c7" },
    Packing: { label: "📦 Đang đóng gói", color: "#3b82f6", bg: "#dbeafe" },
    Shipped: { label: "🚚 Đã vận chuyển", color: "#8b5cf6", bg: "#ede9fe" },
    Delivering: { label: "🚛 Đang giao hàng", color: "#10b981", bg: "#d1fae5" },
    Cancelled: { label: "❌ Đã hủy", color: "#ef4444", bg: "#fee2e2" },
  };

  // Filter orders by status
  const filterOrders = (status) => {
    if (status === "All") return orders;
    return orders.filter((o) => o.status === status);
  };

  const filteredOrders = filterOrders(activeTab);

  // Count orders by status
  const getStatusCount = (status) => {
    if (status === "All") return orders.length;
    return orders.filter((o) => o.status === status).length;
  };

  const tabs = [
    { key: "All", label: "📋 Tất cả", count: getStatusCount("All") },
    { key: "Pending", label: "⏳ Chờ xử lý", count: getStatusCount("Pending") },
    { key: "Packing", label: "📦 Đang đóng gói", count: getStatusCount("Packing") },
    { key: "Shipped", label: "🚚 Đã vận chuyển", count: getStatusCount("Shipped") },
    { key: "Delivering", label: "🚛 Đang giao hàng", count: getStatusCount("Delivering") },
    { key: "Cancelled", label: "❌ Đã hủy", count: getStatusCount("Cancelled") },
  ];

  return (
    <div className="admin-page" style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 8px 0" }}>
          📦 Quản lý Đơn hàng
        </h2>
        <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
          Tổng số: {orders.length} đơn hàng
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
          borderBottom: "2px solid #e5e7eb",
          overflowX: "auto",
          paddingBottom: "0",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "12px 20px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: activeTab === tab.key ? "600" : "500",
              color: activeTab === tab.key ? "#6366f1" : "#6b7280",
              borderBottom: activeTab === tab.key ? "2px solid #6366f1" : "2px solid transparent",
              marginBottom: "-2px",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.key) {
                e.currentTarget.style.color = "#374151";
                e.currentTarget.style.background = "#f9fafb";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.key) {
                e.currentTarget.style.color = "#6b7280";
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            {tab.label}
            <span
              style={{
                padding: "2px 8px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: "600",
                background: activeTab === tab.key ? "#eef2ff" : "#f3f4f6",
                color: activeTab === tab.key ? "#6366f1" : "#6b7280",
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Orders Table */}
      {filteredOrders.length > 0 ? (
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table" style={{ width: "100%", minWidth: "800px" }}>
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o, index) => {
                const config = statusConfig[o.status] || {
                  label: o.status,
                  color: "#6b7280",
                  bg: "#f3f4f6",
                };
                return (
                  <tr key={o.orderId}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{o.orderCode}</strong>
                    </td>
                    <td>{o.userName}</td>
                    <td>
                      <strong style={{ color: "#6366f1" }}>
                        {o.grandTotal.toLocaleString()} ₫
                      </strong>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          background: config.bg,
                          color: config.color,
                        }}
                      >
                        {config.label}
                      </span>
                    </td>

                    <td>
                      {new Date(new Date(o.createdAt).getTime() + 7 * 60 * 60 * 1000).toLocaleString("vi-VN")}
                    </td>

                    <td>
                      <NavLink
                        to={`/admin/orders/${o.orderId}`}
                        style={{
                          padding: "6px 12px",
                          background: "#6366f1",
                          color: "white",
                          borderRadius: "6px",
                          textDecoration: "none",
                          fontSize: "13px",
                          fontWeight: "500",
                          display: "inline-block",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#4f46e5")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#6366f1")}
                      >
                        Chi tiết →
                      </NavLink>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "#f9fafb",
            borderRadius: "12px",
            border: "2px dashed #e5e7eb",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
          <h3 style={{ fontSize: "18px", color: "#374151", marginBottom: "8px" }}>
            Không có đơn hàng
          </h3>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>
            {activeTab === "All"
              ? "Chưa có đơn hàng nào trong hệ thống"
              : `Không có đơn hàng nào ở trạng thái "${tabs.find((t) => t.key === activeTab)?.label}"`}
          </p>
        </div>
      )}
    </div>
  );
}
