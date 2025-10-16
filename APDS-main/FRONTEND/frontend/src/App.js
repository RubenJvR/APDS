import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Navbar from './components/navbar';
import Register from './components/register';
import Login from './components/login';

const App = () => {
  return (
    <Router>
      <div>
        <Navbar />
       <Routes>
  <Route path="/register" element={<Register/>} />
  <Route path="/login" element={<Login/>} />
  <Route path="/add-funds" element={<ddFunds />} />
  <Route path="/transfer" element={<transfers />} />
</Routes>

      </div>
    </Router>
  );
};

export default App;
