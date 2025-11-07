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

    // Your validation and login logic here
    const nameRegex = /^\w{3,15}$/;
    const accRegex = /^\d{8,12}$/;
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!nameRegex.test(form.name)) {
      setMessage("Invalid username format");
      return;
    }
    if (!accRegex.test(form.accountNumber)) {
      setMessage("Invalid account number format");
      return;
    }
    if (!passRegex.test(form.password)) {
      setMessage("Password must be at least 8 characters long and include uppercase, lowercase letters, and a number");
      return;
    }

    try {
      const result = await login(form);
      console.log("Login result:", result);

      if (result.message === "Login successful") {
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
          setTimeout(() => navigate("/admin"), 1000);
        } else {
          localStorage.setItem("isAdmin", "false");
          setMessage("Login successful!");
          setTimeout(() => navigate("/home"), 1000);
        }
      } else {
        setMessage(result.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Network error: " + (error.message || error));
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
        
        {/* Fixed Password Field using input-group */}
        <div className="mb-3">
          <div className="input-group">
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
        </div>
        
        <button type="submit" className="btn btn-primary w-100" style={{ backgroundColor: "#d4af37", borderColor: "#d4af37" }}>
          Login
        </button>
      </form>
    </div>
  );
}