import { useEffect, useState } from "react";
import "../App.css";

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError("");
        
       
        const [transfersRes, balanceRes] = await Promise.all([
          fetch("http://localhost:3001/user/transfers", { credentials: "include" }),
          fetch("http://localhost:3001/user/balance", { credentials: "include" }),
        ]);

        if (!transfersRes.ok) {
          throw new Error(`Transfers API error: ${transfersRes.status}`);
        }
        
        if (!balanceRes.ok) {
          throw new Error(`Balance API error: ${balanceRes.status}`);
        }

        const transfersData = await transfersRes.json();
        const balanceData = await balanceRes.json();

        setTransfers(transfersData || []);
        setOverview(balanceData);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  
  const formatAmount = (amount) => {
    if (amount === undefined || amount === null) return '0.00';
    return parseFloat(amount).toFixed(2);
  };

  if (loading) {
    return (
      <div className="container transfers-page">
        <h2 className="text-center mb-4" style={{ color: "#d4af37" }}>Transaction History</h2>
        <div className="alert alert-info text-center">Loading transactions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container transfers-page">
        <h2 className="text-center mb-4" style={{ color: "#d4af37" }}>Transaction History</h2>
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
          <br />
          <small>Make sure you're logged in and the backend is running on port 3001</small>
        </div>
      </div>
    );
  }

  return (
    <div className="container transfers-page">
      <h2 className="text-center mb-4" style={{ color: "#d4af37" }}>Transaction History</h2>

      {overview && (
        <div className="overview-cards">
          <div className="overview-card">
            <h3>Current Balance</h3>
            <p className="gold-text">R {formatAmount(overview.balance)}</p>
          </div>
          <div className="overview-card">
            <h3>Total Sent</h3>
            <p className="silver-text">R {formatAmount(overview.totalSent)}</p>
          </div>
          <div className="overview-card">
            <h3>Total Received</h3>
            <p className="gold-text">R {formatAmount(overview.totalReceived)}</p>
          </div>
        </div>
      )}

      <table className="table table-striped">
        <thead>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>Amount (R)</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {transfers.length > 0 ? (
            transfers.map((t) => (
              <tr key={t._id}>
                <td>{t.from || 'Unknown'}</td>
                <td>{t.to || 'Unknown'}</td>
                <td className="amount">R {formatAmount(t.amount)}</td>
                <td>{t.date ? new Date(t.date).toLocaleString() : 'Unknown date'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>
                No transactions yet. Make a transfer or add funds to see history here.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}