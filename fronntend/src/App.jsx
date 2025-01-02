import { Routes, Route, BrowserRouter } from 'react-router-dom'
import AdminRoutes from './routes/AdminRoutes'
import UserRoutes from './routes/UserRoutes'
import { Toaster } from 'sonner'
import PublicRoute from './routes/ProtectRoute/PublicRoute'
import Layout from "./authentication/user/Layout/Layout"
import "./App.css"
function App() {
  return (
    <div>
      <BrowserRouter>
        <Toaster richColors position='top-right' />
        <Routes>
          <Route path="/" element={<PublicRoute/>} />
          <Route path='/user/*' element={<UserRoutes />} />
          <Route path='/admin/*' element={<AdminRoutes />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App