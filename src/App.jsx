import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthWrapper from './components/AuthWrapper';

import Welcome from './pages/Welcome'; 
import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import About from './pages/About';
import Contact from './pages/Contact';
import Order from './pages/Order';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/Forgotpassword';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Kiosk from './pages/Kiosk'; 
import Checkout from './pages/Checkout';
import Cashier from './pages/Cashier';
import Driver from './pages/Driver';

const MainLayout = () => (
  <>
    <Header />
    <main>
      <Outlet />
    </main>
    <Footer />
  </>
);

const NoFooterLayout = () => (
  <>
    <Header />
    <main>
      <Outlet />
    </main>
  </>
);

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* Public Routes without layout restrictions */}
            <Route path="/" element={<Welcome />} />
            <Route path="/kiosk" element={<Kiosk />} />
            
            {/* Standard Layout Routes */}
            <Route element={<MainLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              <Route path="/profile" element={
                <AuthWrapper allowedRoles={['customer', 'admin', 'cashier', 'rider', 'guest']}>
                  <Profile />
                </AuthWrapper>
              } />
              
              <Route path="/checkout" element={
                <AuthWrapper allowedRoles={['customer', 'admin', 'guest']}>
                  <Checkout />
                </AuthWrapper>
              } />
            </Route>
            
            {/* Edge-to-Edge Layout Routes (No Footer) */}
            <Route element={<NoFooterLayout />}>
              <Route path="/menu" element={<Menu />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              
              {/* Authenticated Customer Routes */}
              <Route path="/order" element={
                <AuthWrapper allowedRoles={['customer', 'admin', 'guest']}>
                  <Order />
                </AuthWrapper>
              } />
              
              {/* Protected Staff Routes */}
              <Route path="/admin" element={
                <AuthWrapper allowedRoles={['admin']}>
                  <Admin />
                </AuthWrapper>
              } />
              
              <Route path="/cashier" element={
                <AuthWrapper allowedRoles={['admin', 'cashier']}>
                  <Cashier />
                </AuthWrapper>
              } />
              
              <Route path="/driver" element={
                <AuthWrapper allowedRoles={['admin', 'rider']}>
                  <Driver />
                </AuthWrapper>
              } />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;