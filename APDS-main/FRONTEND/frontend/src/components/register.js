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
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({...form, [e.target.name]: e.target.value });
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Creating account...");
    
    try {
      const result = await signup(form);
      setMessage(result.message);
      if (result.message === "User created successfully") {
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (error) {
      setMessage(error.message || "Registration failed");
    }
  }

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4" style={{ color: "#d4af37" }}>Register</h2>
      
      {message && (
        <div 
          className={`alert ${
            message.includes("successfully") ? "alert-success" : "alert-danger"
          }`}
          style={{ 
            backgroundColor: message.includes("successfully") ? "#d4edda" : "#f8d7da",
            color: message.includes("successfully") ? "#155724" : "#721c24",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "20px",
            border: "1px solid #c3e6cb"
          }}
        >
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <input 
            className="form-control"
            name="fullName" 
            placeholder="Full Name" 
            value={form.fullName}
            onChange={handleChange}
            required 
          />
        </div>
        
        <div className="mb-3">
          <input 
            className="form-control"
            name="idNumber" 
            placeholder="ID Number (9 digits)" 
            value={form.idNumber}
            onChange={handleChange}
            required 
          />
        </div>
        
        <div className="mb-3">
          <input 
            className="form-control"
            name="accountNumber" 
            placeholder="Account Number (8-12 digits)" 
            value={form.accountNumber}
            onChange={handleChange}
            required 
          />
        </div>
        
        <div className="mb-3">
          <input 
            className="form-control"
            name="name" 
            placeholder="Username" 
            value={form.name}
            onChange={handleChange}
            required 
          />
        </div>
        
        <div className="mb-3 position-relative">
          <input 
            type={showPassword ? "text" : "password"}
            className="form-control"
            name="password" 
            placeholder="Password" 
            value={form.password}
            onChange={handleChange}
            required 
          />
         
        </div>
        
        <button type="submit" className="btn btn-primary w-100" style={{ backgroundColor: "#d4af37", borderColor: "#d4af37" }}>
          Sign Up
        </button>
      </form>
    </div>
  );
}