import { useState } from "react";
import { transferFunds } from "../api";

export default function Transfer() {
  const [form, setForm] = useState({
    toAccountNumber: "",
    amount: ""
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
    // Clear message when user starts typing
    if (message) setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");


    const accRegex = /^\d{8,12}$/;
    if(!accRegex.test(form.toAccountNumber)) {
      setMessage("Invalid account number format");
      setIsSubmitting(false);
      return;
    }
    if(!form.amount || Number(form.amount) <= 0) {
      setMessage("Amount must be a positive number");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await transferFunds(form.toAccountNumber, form.amount);

      if (result.message == "Transfer successful") {
        setMessage("Transfer successful");
        setForm({ toAccountNumber: "", amount: "" });
      }
      else if (result.message?.includes("Too many requests")) {
        setMessage("Too many transfer attempts. Temporarily blocked (429)");
      }
      else if (result.message?.includes("invalid") || result.message?.includes("failed")) {
        setMessage("Transfer blocked. Invalid or suspicious (401)");
      }
      else {
        setMessage("Transfer failed");
      }
    } catch (error) {
      setMessage("Network/CORS error: " + (error.message || error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4" style={{ color: "#d4af37" }}>Transfer Funds</h2>
      
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
            type="text" 
            name="toAccountNumber"
            value={form.toAccountNumber}
            onChange={handleChange}
            placeholder="Recipient Account Number (8-12 digits)"
            className="form-control"
            disabled={isSubmitting}
            required
          />
        </div>
        <div className="mb-3">
          <input 
            type="number" 
            name="amount"
            value={form.amount}
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
          {isSubmitting ? "Processing..." : "Transfer"}
        </button>
      </form>
    </div>
  );
}