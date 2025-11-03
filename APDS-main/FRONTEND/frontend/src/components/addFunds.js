import { useState } from "react";
import { addFunds } from "../api";

export default function AddFunds() {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await addFunds(Number(amount));
    setMessage(result.message);
  }

  return (
    <div className="container mt-4">
       <h2 className="text-center mb-4" style={{ color: "#d4af37" }}>Add Funds</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}
