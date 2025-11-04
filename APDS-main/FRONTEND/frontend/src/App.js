// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Navbar from './components/navbar';
import Register from './components/register';
import Login from './components/login';
import AddFunds from './components/addFunds';
import Transfer from './components/transfer'; 
import Transfers from './components/transfers';
import Home from './components/home';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/add-funds" element={<AddFunds />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/transfers" element={<Transfers />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;