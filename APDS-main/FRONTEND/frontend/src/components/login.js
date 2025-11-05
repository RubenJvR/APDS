// src/components/login.js
import { useState } from "react";
import { login } from "../api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ 
    name: "", 
    accountNumber: "", 
    password: "" 
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({...form, [e.target.name]: e.target.value });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Logging in...");
    
    try {
      const result = await login(form);
      setMessage(result.message);
      if (result.message === "Login successful") {

        const userRole = result.role;
        if (userRole === "admin"){

          setMessage("Admin Login");
          localStorage.setItem("user", JSON.stringify(result.user));
          setTimeout(() => navigate("/admin"), 1000);
        } else{
          setMessage("Correct Login");
          localStorage.setItem("user", JSON.stringify(result.user));
          setTimeout(() => navigate("/home"), 1000);
        }

        
      }
    } catch (error) {
      setMessage(error.message || "Login failed");
    }
  }

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4" style={{ color: "#d4af37" }}>Login</h2>
      
      {message && <p style={{ color: "#d4af37" }}>{message}</p>}
      
      <form onSubmit={handleSubmit}>
        <input 
          name="name" 
          placeholder="Username" 
          value={form.name} 
          onChange={handleChange}
          required 
        />
        
        <input 
          name="accountNumber" 
          placeholder="Account Number" 
          value={form.accountNumber} 
          onChange={handleChange}
          required 
        />
        
        <input 
          type="password" 
          name="password" 
          placeholder="Password" 
          value={form.password} 
          onChange={handleChange}
          required 
        />
        
        <button type="submit">
          Login
        </button>
      </form>
    </div>
  );
}