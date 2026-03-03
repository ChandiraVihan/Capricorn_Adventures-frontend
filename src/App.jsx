import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Header from './Header'
import HotelLanding from './HotelLanding'
import Footer from './Footer'
import Auth from './Auth'
import OAuth2RedirectHandler from './OAuth2RedirectHandler'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="hero">
          <Header />
          <Routes>
            <Route path="/home" element={<HotelLanding />} />
            <Route path="/signin" element={<Auth mode="signin" />} />
            <Route path="/signup" element={<Auth mode="signup" />} />
            <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
          </Routes>
        </div>
        <Footer />
      </Router>
    </AuthProvider>
  )
}

export default App

