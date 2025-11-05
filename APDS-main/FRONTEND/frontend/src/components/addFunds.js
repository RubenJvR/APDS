import { useState } from "react";
import { addFunds } from "../api";

export default function AddFunds() {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const result = await addFunds(Number(amount));
      setMessage(result.message);
      if (result.message === "Funds added successfully") {
        setAmount(""); // Clear the input on success
      }
    } catch (error) {
      // Handle API errors properly
      setMessage(error.message || "Failed to add funds. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleChange = (e) => {
    setAmount(e.target.value);
    // Clear message when user starts typing
    if (message) setMessage("");
  }

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4" style={{ color: "#d4af37" }}>Add Funds</h2>
      
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
            type="number" 
            value={amount} 
            onChange={handleChange} 
            placeholder="Amount" 
            step="0.01"
            min="0.01"
            className="form-control"
            disabled={isSubmitting}
            required
          />
        </div>
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isSubmitting}
          style={{ backgroundColor: "#d4af37", borderColor: "#d4af37" }}
        >
          {isSubmitting ? "Adding..." : "Add Funds"}
        </button>
      </form>
    </div>
  );
}