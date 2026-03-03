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
            <Link to="/packages" className="nav-link">PACKAGES</Link>
            <Link to="/about us" className="nav-link">ABOUT US</Link>
            <Link to="/contact" className="nav-link">CONTACT</Link>
            {user ? (
              <button onClick={handleLogout} className="nav-link logout-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', font: 'inherit' }}>SIGN OUT</button>
            ) : (
              <Link to="/signin" className="nav-link">SIGN IN</Link>
            )}
          </nav>

          {/* CTA Button */}
          <div className="cta-wrapper">
            <Link to="/signup" className="cta-button">Book Now</Link>
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
            <Link to="/HOME" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>COLLECTIVE</Link>
            <Link to="/PACKAGES" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>ENTERPRISE</Link>
            <Link to="/ABOUT US" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>PRICING</Link>
            <Link to="/Contact" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>REQUEST A DEMO</Link>
            {user ? (
              <button
                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                className="nav-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', font: 'inherit', textAlign: 'left', padding: '0.5rem 1rem' }}
              >
                SIGN OUT
              </button>
            ) : (
              <Link to="/signin" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>SIGN IN</Link>
            )}
            <Link to="/signup" className="mobile-cta" onClick={() => setIsMobileMenuOpen(false)}>Book Now</Link>
          </nav>
        )}
      </header>
    </div>
  );
}
