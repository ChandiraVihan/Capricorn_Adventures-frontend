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
      {/* Top Banner */}
      <div className="top-banner">
        <div className="banner-content">
          <span className="banner-icon">🎨</span>
          <span className="banner-separator">×</span>
          <span className="banner-text">CAPRICORN ADVENTURES</span>
        </div>
      </div>

      {/* Main Navigation */}
      <header className="main-header">
        <div className="header-content">
          {/* Logo Area */}
          <div className="logo-area">
            <div className="logo-mark">
              <div className="logo-stripe"></div>
              <div className="logo-stripe short"></div>
              <div className="logo-stripe"></div>
            </div>
            <div className="logo-text-block">
              <span className="brand-name">WEAVY</span>
              <span className="tagline">ARTISTIC<br />INTELLIGENCE</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="desktop-nav">
            <Link to="/home" className="nav-link">HOME</Link>
            <Link to="/search" className="nav-link">PLAN STAY</Link>
            <Link to="/adventures" className="nav-link">ADVENTURES</Link>
            <Link to="/find-booking" className="nav-link">TRACK BOOKING</Link>
            {user && <Link to="/my-bookings" className="nav-link">MY ADVENTURES</Link>}
            {user && <Link to="/profile" className="nav-link">MY PROFILE</Link>}
            {user ? (
              <button onClick={handleLogout} className="nav-link logout-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', font: 'inherit' }}>LOG OUT</button>
            ) : (
              <Link to="/signin" className="nav-link">SIGN IN</Link>
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
            <Link to="/home" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>HOME</Link>
            <Link to="/search" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>PLAN STAY</Link>
            <Link to="/adventures" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>ADVENTURES</Link>
            <Link to="/find-booking" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>TRACK BOOKING</Link>
            {user && <Link to="/my-bookings" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>MY ADVENTURES</Link>}
            {user && <Link to="/profile" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>MY PROFILE</Link>}
            {user ? (
              <button
                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                className="nav-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', font: 'inherit', textAlign: 'left', padding: '0.5rem 1rem' }}
              >
                LOG OUT
              </button>
            ) : (
              <Link to="/signin" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>SIGN IN</Link>
            )}
            <Link to="/search" className="mobile-cta" onClick={() => setIsMobileMenuOpen(false)}>Book Now</Link>
          </nav>
        )}
      </header>
    </div>
  );
}
