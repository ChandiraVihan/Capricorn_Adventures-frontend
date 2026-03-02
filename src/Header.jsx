import { useState } from "react";
import { Link } from "react-router-dom";
import "./Header.css";
import "./Header.css";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            <Link to="/collective" className="nav-link">COLLECTIVE</Link>
            <Link to="/enterprise" className="nav-link">ENTERPRISE</Link>
            <Link to="/pricing" className="nav-link">PRICING</Link>
            <Link to="/request-demo" className="nav-link">REQUEST A DEMO</Link>
            <Link to="/signin" className="nav-link">SIGN IN</Link>
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
            <Link to="/collective" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>COLLECTIVE</Link>
            <Link to="/enterprise" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>ENTERPRISE</Link>
            <Link to="/pricing" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>PRICING</Link>
            <Link to="/request-demo" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>REQUEST A DEMO</Link>
            <Link to="/signin" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>SIGN IN</Link>
            <Link to="/signup" className="mobile-cta" onClick={() => setIsMobileMenuOpen(false)}>Book Now</Link>
          </nav>
        )}
      </header>
    </div>
  );
}