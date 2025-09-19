import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// Các page (đặt trong components/customer)
import Login from "../components/customer/Login";
import Register from "../components/customer/Register";
import Profile from "../components/customer/Profile";
import ChangePassword from "../components/customer/ChangePassword";
import ForgotPassword from "../components/customer/ForgotPassword";

// (Optional) các phần layout sẵn có
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<ForgotPassword />} />

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

        {/* fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
