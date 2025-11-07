import { useState, useEffect } from "react";
import { transferFunds, getTransfers, getBalance } from "../api";


export default function Transfer() {
  const [form, setForm] = useState({
    toAccountNumber: "",
    amount: ""
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingTransfers, setPendingTransfers] = useState([]);

  // Fetch user's transfers
  useEffect(() => {
    fetchUserTransfers();
  }, []);

  const fetchUserTransfers = async () => {
    try {
      const transfers = await getTransfers();
      const pending = transfers.filter(t => t.status === "pending");
      setPendingTransfers(pending);
    } catch (error) {
      console.error("Error fetching transfers:", error);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
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
 
    const balanceResponse = await getBalance();
    const currentBalance = balanceResponse.balance || 0;
    const transferAmount = Number(form.amount);
    
    if (transferAmount > currentBalance) {
      setMessage(`Insufficient funds. Your balance is R${currentBalance.toFixed(2)}`);
      setIsSubmitting(false);
      return;
    }
    
    
    const result = await transferFunds(form.toAccountNumber, form.amount);

    if (result.message && result.message.includes("submitted")) {
      setMessage("Transfer request submitted! Waiting for admin approval.");
      setForm({ toAccountNumber: "", amount: "" });
      fetchUserTransfers(); 
    } else {
      setMessage(result.message || "Transfer request failed");
    }
  } catch (error) {
    setMessage("Network error: " + (error.message || error));
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
            message.includes("submitted") || message.includes("successful") ? "alert-info" : "alert-danger"
          }`}
          style={{ 
            backgroundColor: message.includes("submitted") ? "#d1ecf1" : 
                          message.includes("successful") ? "#d4edda" : "#f8d7da",
            color: message.includes("submitted") ? "#0c5460" : 
                  message.includes("successful") ? "#155724" : "#721c24",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "20px",
            border: "1px solid #bee5eb"
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
          {isSubmitting ? "Submitting..." : "Request Transfer"}
        </button>
      </form>

      
      {pendingTransfers.length > 0 && (
        <div className="mt-5">
          <h4 style={{ color: "#d4af37" }}>Pending Transfers</h4>
          <div className="list-group">
            {pendingTransfers.map(transfer => (
              <div key={transfer._id} className="list-group-item">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>To: {transfer.to}</strong>
                    <br />
                    Amount: R{transfer.amount}
                    <br />
                    <small className="text-muted">
                      Requested: {new Date(transfer.date).toLocaleString()}
                    </small>
                  </div>
                  <span className="badge bg-warning text-dark">Pending Approval</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}