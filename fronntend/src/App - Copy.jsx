import { Routes, Route, BrowserRouter } from 'react-router-dom'
// import UserRoutes from './routes/UserRoutes'
import AdminRoutes from './routes/AdminRoutes'
import UserRoutes from './routes/UserRoutes';
import { Toaster } from 'sonner';
import { Provider } from 'react-redux'
import PublicRoute from './routes/ProtectRoute/PublicRoute';

function App() {
  return (
    <div>
      <BrowserRouter>
        <Toaster richColors position='top-right' />
          <Routes>
            <Routes path="/" element={<PublicRoute/>}/>
            <Route path='/user/*' element={<UserRoutes />} />
            <Route path='/admin/*' element={<AdminRoutes />} />
          </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App;
