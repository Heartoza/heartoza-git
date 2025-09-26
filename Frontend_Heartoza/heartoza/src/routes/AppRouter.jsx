import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RequireGuest from "./RequireGuest";
import { AuthContext } from "../context/AuthContext";

// Pages
import Login from "../components/customer/Login";
import Register from "../components/customer/Register";
import Profile from "../components/customer/Profile";
import ChangePassword from "../components/customer/ChangePassword";
import ForgotPassword from "../components/customer/ForgotPassword";
import VerifyEmail from "../components/customer/VerifyEmail";
import ResetPassword from "../components/customer/ResetPassword";

// Layout
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";

export default function AppRouter() {
    const { user } = useContext(AuthContext);

    return (
        <BrowserRouter>
            <Header />
            <Routes>
                {/* ✅ PUBLIC đặc biệt: KHÔNG đặt trong RequireGuest */}
                <Route path="/verify-email" element={<DebugVerify />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Root */}
                <Route path="/" element={<Navigate to={user ? "/profile" : "/login"} replace />} />

                {/* Guest-only */}
                <Route element={<RequireGuest />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot" element={<ForgotPassword />} />
                </Route>

                {/* Auth-only */}
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

                {/* Fallback */}
                <Route path="*" element={<Navigate to={user ? "/profile" : "/login"} replace />} />
            </Routes>

            <Footer />
        </BrowserRouter>
    );
}
