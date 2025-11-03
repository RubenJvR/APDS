import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Navbar from './components/navbar';
import Register from './components/register';
import Login from './components/login';
import AddFunds from './components/addFunds';
import Transfer from './components/transfer'; 
import Transfers from './components/transfers'; // For transaction history

const App = () => {
  return (
    <Router>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<Transfers />} /> {/* Default page */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/add-funds" element={<AddFunds />} />
          <Route path="/transfer" element={<Transfer />} /> {/* Transfer form */}
          <Route path="/transfers" element={<Transfers />} /> {/* Transaction history */}
        </Routes>
      </div>
    </Router>
  );
};

export default App;