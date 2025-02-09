import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "../authentication/user/Login";
import Register from "../authentication/user/Register";
import ProductPage from "../components/userComponents/ProductPage";
import PublicRoute from "./ProtectRoute/PublicRoute";
import PrivateRoute from "./ProtectRoute/PrivateRoute";
import Layout from "../authentication/user/Layout/Layout";
import HomePage from "../authentication/user/Home";
import ShopPage from "../components/userComponents/ShopPage";
import ForgotPassword from "../pages/ForgotPassword";
import ErrorPage from "../pages/Error/ErrorPage";
import ResetPassword from "../pages/resetPassword";
import UserDashboard from "../components/userComponents/UserDashboard";
import ShoppingCart from "../components/userComponents/ShoppingCart";
import Wishlist from "../components/userComponents/Wishlist";
import Wallet from "../components/userComponents/WalletDashboard";
import Address from "../components/userComponents/Address";
import AccountDetails from "../components/userComponents/AccountDetails";
import OrderHistory from "../components/userComponents/OrderHistory";
import TrackOrder from "../components/userComponents/TrackOrder";
import CheckoutPage from "../components/userComponents/CheckOut";
import OrderSuccessPage from "../components/userComponents/OrderSuccessPage"
import OrderDetails from "../components/userComponents/OrderDetail";
import OrderFailurePage from "../components/userComponents/OrderFailurePage";
import AboutPage from "../components/userComponents/AboutPage";
import ContactPage from "../components/userComponents/ContactPage";
import LandingPage from "../components/userComponents/LandingPage";

const UserRoutes = () => {
  return (
    <Routes>
      {/* Layout wrapper for all routes */}
      <Route element={<Layout />}>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="product/:id" element={<ProductPage />} />
        <Route path="home" element={<HomePage/>}/>
        <Route path="shop" element={<ShopPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="cart" element={<ShoppingCart />} />
        
        {/* Authentication Routes */}
        <Route
          path="login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="signup"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="reset-password/:token"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          element={
            <PrivateRoute allowedRole="user" redirectTo="/user/login">
              {/* No children prop here, using Outlet */}
            </PrivateRoute>
          }
        >
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="address" element={<Address />} />
          <Route path="account" element={<AccountDetails />} />
          <Route path="orders" element={<OrderHistory />} />
          <Route path="track" element={<TrackOrder />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="success" element={<OrderSuccessPage />} />
          <Route path="failure" element={<OrderFailurePage />} />
          <Route path="orders/:orderId" element={<OrderDetails />} />
        </Route>
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
};
export default UserRoutes;

