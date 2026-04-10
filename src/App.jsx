import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './App.css'
import Auth from './Auth'
import ResetPassword from './ResetPassword'
import OAuth2RedirectHandler from './OAuth2RedirectHandler'
import SearchRoom from './SearchRoom'
import RoomDetails from './RoomDetails'
import Adventures from './Adventures'
import AdventureDetails from './AdventureDetails'
import AdventureCheckout from './AdventureCheckout'
import AdventureCompare from './AdventureCompare'
import Checkout from './Checkout'
import FindBooking from './FindBooking'
import MyBookings from './MyBookings'
import UserProfile from './UserProfile'
import { AuthProvider, useAuth } from './context/AuthContext'
import Background from './Background'
import LandingPage from './LandingPage'
import Header from './Header'
import AdventureAdmin from './AdventureAdmin'
import FinanceDashboard from "./FinanceDashboard";


const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/home" replace />;
  }
  
  return children;
};

const OwnerRoute = ({ children }) => {
  const { user, loading } = useAuth();

  console.log("[OwnerRoute] loading:", loading, "user:", user, "role:", user?.role);

  if (loading) return null;

  if (!user || user.role !== 'OWNER') {
    console.log("[OwnerRoute] ACCESS DENIED — redirecting to /home");
    return <Navigate to="/home" replace />;
  }

  return children;
};

const AppContent = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const isOwnerPath = location.pathname.startsWith('/owner');

  return (
    <>
      <Background />
      {!isAdminPath && !isOwnerPath && <Header />}
      <div className={isAdminPath || isOwnerPath ? "admin-hero" : "hero"}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<LandingPage />} />
          <Route path="/signin" element={<Auth mode="signin" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />
          <Route path="/forgot-password" element={<Auth mode="forgot-password" />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
          <Route path="/search" element={<SearchRoom />} />
          <Route path="/rooms/:roomId" element={<RoomDetails />} />
          <Route path="/adventures" element={<Adventures />} />
          <Route path="/adventures/compare" element={<AdventureCompare />} />
          <Route path="/adventures/checkout" element={<AdventureCheckout />} />
          <Route path="/adventures/:adventureId" element={<AdventureDetails />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/find-booking" element={<FindBooking />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route 
            path="/admin/adventures" 
            element={
              <AdminRoute>
                <AdventureAdmin />
              </AdminRoute>
            } 
          />
          <Route
            path="/owner/finance"
            element={
              <OwnerRoute>
                <FinanceDashboard />
              </OwnerRoute>
            }
          />
        </Routes>
      </div>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App
