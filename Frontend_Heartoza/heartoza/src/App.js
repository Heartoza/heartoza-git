import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthProvider from "./context/AuthContext";

// Common layout
import Header from "./components/common/Header.jsx";
import Home from "./components/common/Home.jsx";
import Products from "./components/common/ProductList.jsx";
import ProductDetail from "./components/common/ProductDetail.jsx";
import About from "./components/common/About.jsx";
import Contact from "./components/common/Contact.jsx";
import Footer from "./components/common/Footer.jsx";

// Customer auth/profile
import Login from "./components/customer/Login.jsx";
import Register from "./components/customer/Register.jsx";
import Profile from "./components/customer/Profile.jsx";
import ChangePassword from "./components/customer/ChangePassword.jsx";
import ForgotPassword from "./components/customer/ForgotPassword.jsx";
import ResetPassword from "./components/customer/ResetPassword.jsx";
import VerifyEmail from "./components/customer/VerifyEmail.jsx";
import OrderList from "./components/customer/OrderList.jsx";
import OrderDetail from "./components/customer/OrderDetail.jsx";
import Cart from "./components/customer/Cart.jsx";

// Admin pages
import AdminDashboard from "./components/admin/AdminDashboard.jsx";
import AdminUsers from "./components/admin/AdminUsers.jsx";
import AdminOrders from "./components/admin/AdminOrders.jsx";
import AdminOrderDetail from "./components/admin/AdminOrderDetail.jsx";
import AdminProducts from "./components/admin/AdminProducts.jsx";
import AdminProductAdd from "./components/admin/AdminProductAdd.jsx";
import AdminProductEdit from "./components/admin/AdminProductEdit";
import AdminCategories from "./components/admin/AdminCategories.jsx";
import AdminSidebar from "./components/admin/AdminSidebar.jsx";

// ✅ Marketing (FE Admin)
import AdminBanners from "./components/admin/marketing/AdminBanners.jsx";
import AdminVouchers from "./components/admin/marketing/AdminVouchers.jsx";
import AdminSeo from "./components/admin/marketing/AdminSeo.jsx";

// Route guard
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* ================= Customer layout ================= */}
                    <Route
                        path="/*"
                        element={
                            <>
                                <Header />
                                <Routes>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/products" element={<Products />} />
                                    <Route path="/products/:id" element={<ProductDetail />} />
                                    <Route path="/about" element={<About />} />
                                    <Route path="/contact" element={<Contact />} />

                                    {/* Cart */}
                                    <Route path="/cart" element={<Cart />} />
                                    <Route path="/orders" element={<OrderList />} />
                                    <Route path="/orders/:id" element={<OrderDetail />} />

                                    {/* Auth */}
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Register />} />
                                    <Route path="/forgot" element={<ForgotPassword />} />
                                    <Route path="/reset-password" element={<ResetPassword />} />
                                    <Route path="/verify-email" element={<VerifyEmail />} />

                                    {/* Protected (Customer) */}
                                    <Route
                                        path="/profile"
                                        element={
                                            <ProtectedRoute>
                                                <Profile />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="/change-password"
                                        element={
                                            <ProtectedRoute>
                                                <ChangePassword />
                                            </ProtectedRoute>
                                        }
                                    />
                                </Routes>
                                <Footer />
                            </>
                        }
                    />

                    {/* ================= Admin layout ================= */}
                    <Route
                        path="/admin/*"
                        element={
                            <ProtectedRoute role="Admin">
                                <div className="admin-layout">
                                    {/* Sidebar bên trái */}
                                    <AdminSidebar />

                                    {/* Nội dung admin bên phải */}
                                    <div className="admin-content">
                                        <Routes>
                                            {/* ✅ dùng index thay cho path="/" để target /admin */}
                                            <Route index element={<AdminDashboard />} />
                                            <Route path="dashboard" element={<AdminDashboard />} />

                                            <Route path="users" element={<AdminUsers />} />
                                            <Route path="orders" element={<AdminOrders />} />
                                            <Route path="orders/:id" element={<AdminOrderDetail />} />
                                            <Route path="products" element={<AdminProducts />} />
                                            <Route path="products/new" element={<AdminProductAdd />} />
                                            <Route path="products/:id" element={<AdminProductEdit />} />
                                            <Route path="categories" element={<AdminCategories />} />

                                            {/* ✅ Marketing */}
                                            <Route path="marketing/banners" element={<AdminBanners />} />
                                            <Route path="marketing/vouchers" element={<AdminVouchers />} />
                                            <Route path="marketing/seo" element={<AdminSeo />} />
                                        </Routes>
                                    </div>
                                </div>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
