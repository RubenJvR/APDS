//login.js
import React, {useState} from "react";

import { login } from "../api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ 
    name: "", 
    accountNumber: "", 
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
  setMessage("Logging in...");

  // Input validation with specific error messages
  const nameRegex = /^\w{3,15}$/;
  const accRegex = /^\d{8,12}$/;
  const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  if (!nameRegex.test(form.name)) {
    setMessage("Username must be 3-15 characters (letters, numbers, underscores only)");
    return;
  }
  if (!accRegex.test(form.accountNumber)) {
    setMessage("Account number must be 8-12 digits only");
    return;
  }
  if (!passRegex.test(form.password)) {
    setMessage(
      "Password must be: 8+ characters, include uppercase, lowercase, and a number"
    );
    return;
  }

  // Attempt login
  try {
    const result = await login(form);
    console.log("Login result:", result);

    if (result.message === "Login successful") {
      // Success handling
      const userData = {
        name: result.name,
        accountNumber: result.accountNumber,
        role: result.role,
      };
      localStorage.setItem("user", JSON.stringify(userData));
      setForm({ ...form, password: "" });

      if (result.role === "admin") {
        localStorage.setItem("isAdmin", "true");
        setMessage("Admin login successful!");

        window.location.reload();

        setTimeout(() => navigate("/admin"), 1000);
      } else {
        localStorage.setItem("isAdmin", "false");
        setMessage("Login successful!");

        window.location.reload();

        setTimeout(() => navigate("/home"), 1000);
      }
    } else {
      setMessage(result.message || "Login failed");
    }
  } catch (error) {
    console.error("Login error:", error);
    
    // Rate limiting and other errors
    if (error.status === 429) {
      setMessage(error.message || "Too many attempts, please try again later");
    } else if (error.status === 401) {
      setMessage("Invalid credentials");
    } else if (error.message?.includes("Failed to fetch")) {
      setMessage("Network error - cannot connect to server");
    } else {
      setMessage(error.message || "Login failed");
    }
  }
};

    

  

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4" style={{ color: "#d4af37" }}>Login</h2>
      
      {message && (
        <div 
          className={`alert ${
            message.includes("successful") ? "alert-success" : "alert-danger"
          }`}
          style={{ 
            backgroundColor: message.includes("successful") ? "#d4edda" : "#f8d7da",
            color: message.includes("successful") ? "#155724" : "#721c24",
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
            name="name" 
            placeholder="Username" 
            value={form.name} 
            onChange={handleChange}
            required 
          />
        </div>
        
        <div className="mb-3">
          <input 
            className="form-control"
            name="accountNumber" 
            placeholder="Account Number" 
            value={form.accountNumber} 
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
          Login
        </button>
      </form>
    </div>
  );
}