import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Auth from './Auth'
import ResetPassword from './ResetPassword'
import OAuth2RedirectHandler from './OAuth2RedirectHandler'
import SearchRoom from './SearchRoom'
import RoomDetails from './RoomDetails'
import Adventures from './Adventures'
import AdventureDetails from './AdventureDetails'
import AdventureCheckout from './AdventureCheckout'
import Checkout from './Checkout'
import FindBooking from './FindBooking'
import MyBookings from './MyBookings'
import UserProfile from './UserProfile'
import { AuthProvider } from './context/AuthContext'
import Background from './Background'
import LandingPage from './LandingPage'
import Header from './Header'
import Adventure from './Adventure'
import AdventureAdmin from './AdventureAdmin'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Background />
        <Header />
        <div className="hero">
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
            <Route path="/adventures/checkout" element={<AdventureCheckout />} />
            <Route path="/adventures/:adventureId" element={<AdventureDetails />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/find-booking" element={<FindBooking />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/adventures" element={<Adventure />} />
            <Route path="/admin/adventures" element={<AdventureAdmin />} />

          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
