import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthProvider from "./context/AuthContext";

import Header from "./components/common/Header.jsx";
import Home from "./components/common/Home.jsx";
import Products from "./components/common/ProductList.jsx";
import About from "./components/common/About.jsx";
import Contact from "./components/common/Contact.jsx";
import Footer from "./components/common/Footer.jsx";

// Customer auth/profile
import Login from "./components/customer/Login.jsx";
import Register from "./components/customer/Register.jsx";
import Profile from "./components/customer/Profile.jsx";
import ChangePassword from "./components/customer/ChangePassword.jsx";
import ForgotPassword from "./components/customer/ForgotPassword.jsx";

// Route guard
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Header />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />

                    {/* auth routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot" element={<ForgotPassword />} />

                    {/* protected */}
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
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
