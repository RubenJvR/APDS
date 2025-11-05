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
    
    try {
      const result = await login(form);
      console.log("Login result:", result);
      
      if (result.message === "Login successful") {
  
        const userData = {
          name: result.name,
          accountNumber: result.accountNumber,
          role: result.role
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        
        if (result.role === "admin") {
          localStorage.setItem('isAdmin', 'true');
          setMessage("Admin login successful!");
          setTimeout(() => navigate("/admin"), 1000);
        } else {
          localStorage.setItem('isAdmin', 'false');
          setMessage("Login successful!");
          setTimeout(() => navigate("/home"), 1000);
        }
      } else {
        setMessage(result.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage(error.message || "Login failed");
    }
  }

  

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
          <button
            type="button"
            className="btn btn-outline-secondary position-absolute"
            style={{
              right: "5px",
              top: "50%",
              transform: "translateY(-50%)",
              border: "none",
              background: "transparent"
            }}
            onClick={togglePasswordVisibility}
          >
            {showPassword ? (
              <i className="bi bi-eye-slash"></i> // Hide icon
            ) : (
              <i className="bi bi-eye"></i> // Show icon
            )}
          </button>
        </div>
        
        <button type="submit" className="btn btn-primary w-100" style={{ backgroundColor: "#d4af37", borderColor: "#d4af37" }}>
          Login
        </button>
      </form>
    </div>
  );
}