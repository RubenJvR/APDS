import { useState } from "react";
import { signup } from "../api";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    fullName: "", 
    idNumber: "", 
    accountNumber: "", 
    name: "", 
    password: ""
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({...form, [e.target.name]: e.target.value });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Creating account...");
    
    try {
      const result = await signup(form);
      setMessage(result.message);
      if (result.message === "User created") {
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (error) {
      setMessage(error.message || "Registration failed");
    }
  }

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4" style={{ color: "#d4af37" }}>Register</h2>
      
      {message && <p style={{ color: "#d4af37" }}>{message}</p>}
      
      <form onSubmit={handleSubmit}>
        <input 
          name="fullName" 
          placeholder="Full Name" 
          value={form.fullName}
          onChange={handleChange}
          required 
        />
        
        <input 
          name="idNumber" 
          placeholder="ID Number (9 digits)" 
          value={form.idNumber}
          onChange={handleChange}
          required 
        />
        
        <input 
          name="accountNumber" 
          placeholder="Account Number (8-12 digits)" 
          value={form.accountNumber}
          onChange={handleChange}
          required 
        />
        
        <input 
          name="name" 
          placeholder="Username" 
          value={form.name}
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
          Sign Up
        </button>
      </form>
    </div>
  );
}