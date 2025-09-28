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
import OrderList from "./components/customer/OrderList.jsx";
import OrderDetail from "./components/customer/OrderDetail.jsx";
import Cart from "./components/customer/Cart.jsx";   // ✅ thêm giỏ hàng

// Admin pages
import AdminDashboard from "./components/admin/AdminDashboard.jsx";
import AdminUsers from "./components/admin/AdminUsers.jsx";
// import UserDetail from "./components/admin/UserDetail.jsx";
import AdminOrders from "./components/admin/AdminOrders.jsx";
import AdminProducts from "./components/admin/AdminProducts.jsx";
import AdminCategories from "./components/admin/AdminCategories.jsx";
import AdminSidebar from "./components/admin/AdminSidebar.jsx";

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
                                    <Route path="/about" element={<About />} />
                                    <Route path="/contact" element={<Contact />} />

                                    {/* Cart */}
                                    <Route path="/cart" element={<Cart />} />  {/* ✅ route giỏ hàng */}
                                    <Route path="/orders" element={<OrderList />} />
                                    <Route path="/orders/:id" element={<OrderDetail />} />
                                    {/* Auth */}
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Register />} />
                                    <Route path="/forgot" element={<ForgotPassword />} />

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
                                    <AdminSidebar />
                                    <div className="admin-content">
                                        <Routes>
                                            <Route path="dashboard" element={<AdminDashboard />} />
                                            <Route path="users" element={<AdminUsers />} />
                                            {/* <Route path="users/:id" element={<UserDetail />} /> */}
                                            <Route path="orders" element={<AdminOrders />} />
                                            <Route path="products" element={<AdminProducts />} />
                                            <Route path="categories" element={<AdminCategories />} />
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
