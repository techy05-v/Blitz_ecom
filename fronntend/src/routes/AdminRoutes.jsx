import React from "react";
import { Route, Routes } from "react-router-dom";
import Sidebar from "../components/adminComponents/Sidebar";
import Header from "../components/adminComponents/Header";
import Dashboard from "../components/adminComponents/Dashboard";
import ProductList from "../components/adminComponents/ProductList";
import OrderList from "../components/adminComponents/OrderList";
import CustomerList from "../components/adminComponents/CustomerList";
import CategoryList from "../components/adminComponents/CategoryList";
import OfferProducts from "../components/adminComponents/OfferProducts";
import Banner from "../components/adminComponents/Banner";
import Coupon from "../components/adminComponents/Coupon";
import Settings from "../components/adminComponents/Settings";
import AddCategory from "../components/adminComponents/AddCatergory";
import AddProduct from "../components/adminComponents/AddProduct";
import AdminLogin from "../authentication/admin/AdminLogin";
import AdminLayout from "../authentication/admin/AdminLayout";
import EditCategory from "../components/adminComponents/EditCategory";
import EditPage from "../components/adminComponents/EditPage";
import PublicRoute from "../routes/ProtectRoute/PublicRoute";
import PrivateRoute from "./ProtectRoute/PrivateRoute";
import ErrorPage from "../pages/Error/ErrorPage"; 

function AdminRoutes() {
  return (
    <Routes>
      <Route
        path="login"
        element={
          <PublicRoute>
            <AdminLogin />
          </PublicRoute>
        }
      />
      <Route
        element={
          <PrivateRoute allowedRole="admin" redirectTo="/admin/login">
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/category" element={<CategoryList />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/offer-products" element={<OfferProducts />} />
        <Route path="/category/add" element={<AddCategory />} />
        <Route path="/category/edit/:id" element={<EditCategory />} />
        <Route path="/products/add" element={<AddProduct />} />
        <Route path="/products/edit/:id" element={<EditPage />} />
        <Route path="/customers" element={<CustomerList />} />
        <Route path="/orders" element={<OrderList />} />
        <Route path="/banner" element={<Banner />} />
        <Route path="/coupon" element={<Coupon />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      {/* Catch-all route for undefined paths */}
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
}

export default AdminRoutes;
