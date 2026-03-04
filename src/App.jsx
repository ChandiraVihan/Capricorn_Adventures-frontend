import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Header from './Header'
import HotelLanding from './HotelLanding'
import Footer from './Footer'
import Auth from './Auth'
import ResetPassword from './ResetPassword'
import OAuth2RedirectHandler from './OAuth2RedirectHandler'
import SearchRoom from './SearchRoom'
import RoomDetails from './RoomDetails'
import Checkout from './Checkout'
import FindBooking from './FindBooking'
import MyBookings from './MyBookings'
import UserProfile from './UserProfile'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="hero">
          <Header />
          <Routes>
            <Route path="/" element={<HotelLanding />} />
            <Route path="/home" element={<HotelLanding />} />
            <Route path="/signin" element={<Auth mode="signin" />} />
            <Route path="/signup" element={<Auth mode="signup" />} />
            <Route path="/forgot-password" element={<Auth mode="forgot-password" />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
            <Route path="/search" element={<SearchRoom />} />
            <Route path="/rooms/:roomId" element={<RoomDetails />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/find-booking" element={<FindBooking />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/profile" element={<UserProfile />} />
          </Routes>
        </div>
        <Footer />
      </Router>
    </AuthProvider>
  )
}

export default App

