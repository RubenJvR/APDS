import { useState } from "react";
import { transferFunds } from "../api";

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
    const result = await transferFunds(form.toAccountNumber, form.amount);
    setMessage(result.message);
    if (result.message === "Transfer successful") {
      setForm({ toAccountNumber: "", amount: "" });
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4" style={{ color: "#d4af37" }}>Transfer Funds</h2>
      {message && <p style={{ color: "#d4af37" }}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          name="toAccountNumber"
          value={form.toAccountNumber}
          onChange={handleChange}
          placeholder="Recipient Account Number" 
        />
        <input 
          type="number" 
          name="amount"
          value={form.amount}
          onChange={handleChange}
          placeholder="Amount" 
        />
        <button type="submit">Transfer</button>
      </form>
    </div>
  );
}