import { useState, useEffect } from "react";
import { transferFunds, getTransfers, getBalance, checkAccountExists } from "../api";

export default function Transfer() {
  const [form, setForm] = useState({
    toAccountNumber: "",
    amount: ""
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [accountInfo, setAccountInfo] = useState(null);
  const [checkingAccount, setCheckingAccount] = useState(false);

  // Fetch user's transfers and balance
  useEffect(() => {
    fetchUserTransfers();
    fetchUserBalance();
  }, []);

  // Check account when account number changes
  useEffect(() => {
    const checkAccount = async () => {
      const accNumber = form.toAccountNumber.trim();
      
      if (accNumber.length >= 8 && /^\d+$/.test(accNumber)) {
        setCheckingAccount(true);
        try {
          const result = await checkAccountExists(accNumber);
          setAccountInfo(result);
        } catch (error) {
          console.error("Error checking account:", error);
          setAccountInfo({ exists: false, message: "Error checking account" });
        } finally {
          setCheckingAccount(false);
        }
      } else {
        setAccountInfo(null);
      }
    };

    // Debounce the account check
    const timeoutId = setTimeout(checkAccount, 500);
    return () => clearTimeout(timeoutId);
  }, [form.toAccountNumber]);

  const fetchUserTransfers = async () => {
    try {
      const transfers = await getTransfers();
      const pending = transfers.filter(t => t.status === "pending");
      setPendingTransfers(pending);
    } catch (error) {
      console.error("Error fetching transfers:", error);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const balance = await getBalance();
      setCurrentBalance(balance.balance || 0);
    } catch (error) {
      console.error("Error fetching balance:", error);
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
    const transferAmount = Number(form.amount);
    
    // Validation checks
    if (!accRegex.test(form.toAccountNumber)) {
      setMessage("Invalid account number format");
      setIsSubmitting(false);
      return;
    }
    
    if (!form.amount || transferAmount <= 0) {
      setMessage("Amount must be a positive number");
      setIsSubmitting(false);
      return;
    }

    // Check if account exists
    if (!accountInfo || !accountInfo.exists) {
      setMessage("Recipient account not found. Please check the account number.");
      setIsSubmitting(false);
      return;
    }

    // Check if user has sufficient balance
    if (transferAmount > currentBalance) {
      setMessage(`Insufficient funds. Your balance is R${currentBalance.toFixed(2)}`);
      setIsSubmitting(false);
      return;
    }

    // Check if trying to transfer to own account
    if (accountInfo.exists) {
      try {
        const userBalance = await getBalance();
        if (form.toAccountNumber === userBalance.accountNumber) {
          setMessage("Cannot transfer to your own account");
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        console.error("Error checking own account:", error);
      }
    }

    try {
      const result = await transferFunds(form.toAccountNumber, form.amount);

      if (result.message && result.message.includes("submitted")) {
        setMessage("Transfer request submitted! Waiting for admin approval.");
        setForm({ toAccountNumber: "", amount: "" });
        setAccountInfo(null);
        fetchUserTransfers();
        fetchUserBalance();
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
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '10px', 
            borderRadius: '5px',
            marginBottom: '10px',
            border: '1px solid #dee2e6',
            textAlign: 'center'
          }}>
            <strong>Available Balance: </strong>
            <span style={{ color: '#28a745', fontWeight: 'bold', fontSize: '18px' }}>
              R{currentBalance.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="toAccountNumber" className="form-label" style={{color: "white"}}>
            Recipient Account Number
          </label>
          <input 
            type="text" 
            id="toAccountNumber"
            name="toAccountNumber"
            value={form.toAccountNumber}
            onChange={handleChange}
            placeholder="Enter 8-12 digit account number"
            className="form-control"
            disabled={isSubmitting}
            required
          />
          
          
          {form.toAccountNumber && (
            <div className="mt-2">
              {checkingAccount ? (
                <div style={{ color: '#6c757d', fontSize: '14px' }}>
                  Checking account...
                </div>
              ) : accountInfo ? (
                accountInfo.exists ? (
                  <div style={{ color: '#28a745', fontSize: '14px' }}>
                    Account found: {accountInfo.fullName || accountInfo.accountName}
                  </div>
                ) : (
                  <div style={{ color: '#dc3545', fontSize: '14px' }}>
                    {accountInfo.message || "Account not found"}
                  </div>
                )
              ) : form.toAccountNumber.length < 8 ? (
                <div style={{ color: '#ffc107', fontSize: '14px' }}>
                  Enter at least 8 digits
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="mb-3">
          <label htmlFor="amount" className="form-label" style={{color: "white"}}>
            Amount
          </label>
          <input 
            type="number" 
            id="amount"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            placeholder="Enter amount" 
            step="0.01"
            min="0.01"
            max={currentBalance}
            className="form-control"
            disabled={isSubmitting}
            required
          />
          
          
          {form.amount && (
            <div className="mt-2">
              {Number(form.amount) > currentBalance ? (
                <div style={{ color: '#dc3545', fontSize: '14px' }}>
                  Amount exceeds your available balance
                </div>
              ) : (
                <div style={{ color: '#6c757d', fontSize: '14px' }}>
                  Remaining balance: R{(currentBalance - Number(form.amount)).toFixed(2)}
                </div>
              )}
            </div>
          )}
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={
            isSubmitting || 
            !accountInfo?.exists || 
            !form.amount || 
            Number(form.amount) <= 0 || 
            Number(form.amount) > currentBalance
          }
          style={{ 
            backgroundColor: "#d4af37", 
            borderColor: "#d4af37",
            opacity: (
              isSubmitting || 
              !accountInfo?.exists || 
              !form.amount || 
              Number(form.amount) <= 0 || 
              Number(form.amount) > currentBalance
            ) ? 0.6 : 1
          }}
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