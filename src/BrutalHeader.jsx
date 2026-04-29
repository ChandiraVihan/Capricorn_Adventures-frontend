import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import logo from './assets/logo.png';
import './LandingPage.css'; // Reuse the brutalist styles

export default function BrutalHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/home");
  };

  return (
    <nav className="nav-bar">
      <div className="nav-logo-box">
        <Link to="/home" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
          <img src={logo} alt="Logo" style={{ height: '40px', filter: 'invert(1)' }} />
          <span style={{ marginLeft: '1rem', fontWeight: 900, fontSize: '1.2rem' }}>COLOMBO WATER FRONT</span>
        </Link>
      </div>
      <div className="nav-links-box">
        <Link to="/search">PLAN STAY</Link>
        <Link to="/adventures">ADVENTURES</Link>
        <Link to="/find-booking">TRACK</Link>
        {user && <Link to="/my-bookings">MY ADVENTURES</Link>}
        {user ? (
          <button onClick={handleLogout} className="nav-brutal-btn" style={{ background: 'transparent', color: 'var(--black)', borderLeft: 'var(--border)', height: '100%', cursor: 'pointer' }}>
            LOGOUT
          </button>
        ) : (
          <Link to="/signin">SIGN IN</Link>
        )}
        <Link to="/search" className="nav-brutal-btn" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          BOOK NOW
        </Link>
      </div>
    </nav>
  );
}
