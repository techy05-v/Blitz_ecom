import { Routes, Route, BrowserRouter } from 'react-router-dom';
import AdminRoutes from './routes/AdminRoutes';
import UserRoutes from './routes/UserRoutes';
import { Toaster } from 'sonner';
import PublicRoute from './routes/ProtectRoute/PublicRoute';
import Layout from "./authentication/user/Layout/Layout";
import LandingPage from "./components/userComponents/LandingPage";

function App() {
  return (
    <div>
      <BrowserRouter>
        <Toaster richColors position="top-right" />
        <Routes>
          {/* Wrap LandingPage inside Layout using nested routes */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <Layout /> {/* Layout will now handle nested routes */}
              </PublicRoute>
            }
          >
            <Route index element={<LandingPage />} /> {/* This is the default content for "/" */}
          </Route>

          <Route path="/user/*" element={<UserRoutes />} />
          <Route path="/admin/*" element={<AdminRoutes />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
