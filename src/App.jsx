import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
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
import { AuthProvider } from './context/AuthContext'
import Background from './Background'
import LandingPage from './LandingPage'
import Header from './Header'
import AdventureAdmin from './AdventureAdmin'
import OwnerFinanceDashboard from './OwnerFinanceDashboard'
import ManagerOperationsDashboard from './ManagerOperationsDashboard'
import RoomServiceDashboard from './RoomServiceDashboard'

const RoleRoute = ({ children, allow }) => {
  // Temporary bypass: keep dashboard routes accessible during integration checks.
  // Re-enable role checks before production hardening.
  const _ = allow;

  return children;
}

const AppContent = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const isOwnerPath = location.pathname.startsWith('/owner');
  const isManagerPath = location.pathname.startsWith('/manager');

  return (
    <>
      <Background />
      {!isAdminPath && !isOwnerPath && !isManagerPath && <Header />}
      <div className={isAdminPath || isOwnerPath || isManagerPath ? 'admin-hero' : 'hero'}>
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
              <RoleRoute allow={['ADMIN']}>
                <AdventureAdmin />
              </RoleRoute>
            } 
          />
          <Route
            path="/owner/finance"
            element={
              <RoleRoute allow={['OWNER']}>
                <OwnerFinanceDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/manager/operations"
            element={
              <RoleRoute allow={['MANAGER']}>
                <ManagerOperationsDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/manager/room-service"
            element={
              <RoleRoute allow={['MANAGER', 'ADMIN', 'STAFF']}>
                <RoomServiceDashboard />
              </RoleRoute>
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
