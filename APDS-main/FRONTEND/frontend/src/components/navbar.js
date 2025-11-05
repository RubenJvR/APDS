import React from "react"; 
import logo from '../logo.svg';
import "bootstrap/dist/css/bootstrap.css";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  // prefer storing the whole user object; fallback to legacy flag
  let isAdmin = false;
  try {
    const stored = localStorage.getItem('user');
    if (stored) {
      const user = JSON.parse(stored);
      isAdmin = user?.role === 'admin';
    } else {
      isAdmin = localStorage.getItem('isAdmin') === 'true';
    }
  } catch (e) {
    isAdmin = localStorage.getItem('isAdmin') === 'true';
  }

  const handleLogout = () => {
    // clear flags on logout
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    // if you have a logout API call, call it here then redirect
    window.location.href = '/login';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container">
        <NavLink className="navbar-brand" to="/" style={{ 
          display: 'flex', 
          alignItems: 'center',
          textDecoration: 'none'
        }}>
          <img 
            src={logo} 
            alt="Logo" 
            width="45" 
            height="45" 
            style={{ 
              marginRight: '15px',
              filter: 'drop-shadow(0 2px 4px rgba(212, 175, 55, 0.4))'
            }}
          />
          <div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#d4af37',
              lineHeight: '1',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}>
              MyBank
            </div>
          </div>
        </NavLink>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <NavLink className="nav-link" to="/transfers">Transaction History</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/transfer">Transfer Funds</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/add-funds">Add Funds</NavLink>
            </li>
            {isAdmin && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/admin" style={{ color: '#d4af37' }}>Admin Portal</NavLink>
              </li>
            )}
            <li className="nav-item">
              <NavLink className="nav-link" to="/register">Register</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/login">Login</NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}