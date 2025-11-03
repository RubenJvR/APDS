import { useState } from "react";
import { login } from "../api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ name: "", accountNumber: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({...form, [e.target.name]: e.target.value });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form);
    setMessage(result.message);
    if (result.message === "Authentication successful") {
      navigate("/"); // redirect to homepage or dashboard
    }
  }

  return (
    <div className="container mt-4">
       <h2 className="text-center mb-4" style={{ color: "#d4af37" }}>Login</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
  {message && <p className={`message ${message.includes("success") ? "success" : "error"}`}>{message}</p>}
  <input name="fullName" placeholder="Full Name" onChange={handleChange} />
  <input name="idNumber" placeholder="ID Number" onChange={handleChange} />
  <input name="accountNumber" placeholder="Account Number" onChange={handleChange} />
  <input name="name" placeholder="Username" onChange={handleChange} />
  <input type="password" name="password" placeholder="Password" onChange={handleChange} />
  <button type="submit">Sign Up</button>
</form>
    </div>
  );
  
}
