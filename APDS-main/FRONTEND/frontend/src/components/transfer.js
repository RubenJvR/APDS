import { useState } from "react";
import "../App.css";

export default function Transfer() {
  const [form, setForm] = useState({
    toAccountNumber: "",
    amount: ""
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Transfer functionality would work when backend is fully connected");
    // For now, just show a message
    console.log("Transfer attempt:", form);
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4" style={{ color: "#d4af37" }}>Transfer Funds</h2>
      
      {message && (
        <div className={`message ${message.includes("success") ? "success" : "error"}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="transfer-form">
        <div className="form-group">
          <label htmlFor="toAccountNumber" style={{ color: "#c0c0c0", marginBottom: "0.5rem" }}>
            Recipient Account Number
          </label>
          <input
            type="text"
            id="toAccountNumber"
            name="toAccountNumber"
            value={form.toAccountNumber}
            onChange={handleChange}
            placeholder="Enter 8-12 digit account number"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount" style={{ color: "#c0c0c0", marginBottom: "0.5rem" }}>
            Amount (R)
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            placeholder="Enter amount"
            min="1"
            step="0.01"
            required
          />
        </div>

        <button type="submit">
          Transfer Funds
        </button>
      </form>

      <div className="transfer-guidelines" style={{ 
        marginTop: "2rem", 
        padding: "1rem", 
        backgroundColor: "#1a1a1a", 
        borderRadius: "8px",
        border: "1px solid #333"
      }}>
        <h4 style={{ color: "#d4af37", marginBottom: "1rem" }}>Transfer Guidelines:</h4>
        <ul style={{ color: "#c0c0c0", margin: 0, paddingLeft: "1.5rem" }}>
          <li>Account number must be 8-12 digits</li>
          <li>Amount must be a positive number</li>
          <li>Transfers are processed immediately</li>
          <li>Ensure you have sufficient balance</li>
        </ul>
      </div>
    </div>
  );
}