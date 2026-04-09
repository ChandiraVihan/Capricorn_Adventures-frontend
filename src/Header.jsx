import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import "./Header.css";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/home");
  };

  return (
    <div className="header-container">
      <header className="main-header">
        <div className="header-content">
          {/* Logo Area - Premium Gradient Triangle */}
          <Link to="/home" className="logo-area">
            <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#bef264" />
                  <stop offset="100%" stopColor="#7dd3fc" />
                </linearGradient>
              </defs>
              <path d="M20 20L80 50L20 80V20Z" stroke="url(#logo-gradient)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M35 40L65 50L35 60V40Z" fill="url(#logo-gradient)" fillOpacity="0.4"/>
            </svg>
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-nav">
            <Link to="/home" className="nav-link">Home</Link>
            <Link to="/search" className="nav-link">Plan Stay</Link>
            <Link to="/adventures" className="nav-link">Adventures</Link>
            <Link to="/find-booking" className="nav-link">Track Booking</Link>
            {user && <Link to="/my-bookings" className="nav-link">My Adventures</Link>}
            {user && <Link to="/profile" className="nav-link">Profile</Link>}
            {user && user.role === "OWNER" && <Link to="/owner/finance" className="nav-link">Finance</Link>}
            {user ? (
              <button onClick={handleLogout} className="nav-link logout-btn">Log Out</button>
            ) : (
              <Link to="/signin" className="nav-link">Sign In</Link>
            )}
          </nav>

          {/* CTA Button */}
          <div className="cta-wrapper">
            <Link to="/search" className="cta-button">Book Now</Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <span className={`hamburger ${isMobileMenuOpen ? "open" : ""}`}></span>
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <nav className="mobile-nav">
            <Link to="/home" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
            <Link to="/search" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Plan Stay</Link>
            <Link to="/adventures" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Adventures</Link>
            <Link to="/find-booking" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Track Booking</Link>
            {user && <Link to="/my-bookings" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>My Adventures</Link>}
            {user && <Link to="/profile" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Profile</Link>}
            {user && user.role === "OWNER" && <Link to="/owner/finance" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Finance</Link>}
            {user ? (
              <button
                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                className="nav-link logout-btn"
              >
                Log Out
              </button>
            ) : (
              <Link to="/signin" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>
            )}
            <Link to="/search" className="mobile-cta" onClick={() => setIsMobileMenuOpen(false)}>Book Now</Link>
          </nav>
        )}
      </header>
    </div>
  );
}
