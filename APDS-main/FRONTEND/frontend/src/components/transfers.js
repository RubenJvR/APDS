import { useEffect, useState } from "react";
import "../App.css";

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showRejected, setShowRejected] = useState(false);

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

  const getStatusBadge = (transfer) => {
    const status = transfer.status || 'completed';
    
    switch (status) {
      case 'pending':
        return <span className="badge badge-warning">Pending</span>;
      case 'approved':
        return <span className="badge badge-success">Completed</span>;
      case 'rejected':
        return <span className="badge badge-danger">Rejected</span>;
      default:
        return <span className="badge badge-secondary">Completed</span>;
    }
  };

  const getRowClassName = (transfer) => {
    const status = transfer.status || 'completed';
    
    switch (status) {
      case 'pending':
        return 'table-warning';
      case 'rejected':
        return 'table-danger';
      default:
        return '';
    }
  };

  // Filter transfers based on showRejected setting
  const filteredTransfers = showRejected 
    ? transfers 
    : transfers.filter(t => t.status !== 'rejected');

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

      {/* Filter Toggle */}
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h4 style={{ color: "#d4af37", margin: 0 }}>Transactions</h4>
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="showRejected"
            checked={showRejected}
            onChange={(e) => setShowRejected(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="showRejected" style={{ color: "#666" }}>
            Show Rejected Transactions
          </label>
        </div>
      </div>

      <table className="table table-striped">
        <thead>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>Amount (R)</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransfers.length > 0 ? (
            filteredTransfers.map((t) => (
              <tr key={t._id} className={getRowClassName(t)}>
                <td>
                  <span style={{ 
                    fontFamily: 'monospace', 
                    fontWeight: 'bold',
                    color: t.from === 'SYSTEM' || t.from === 'ADMIN' ? '#28a745' : '#333'
                  }}>
                    {t.from || 'Unknown'}
                  </span>
                </td>
                <td>
                  <span style={{ 
                    fontFamily: 'monospace', 
                    fontWeight: 'bold' 
                  }}>
                    {t.to || 'Unknown'}
                  </span>
                </td>
                <td className="amount">
                  <strong>R {formatAmount(t.amount)}</strong>
                </td>
                <td>{t.date ? new Date(t.date).toLocaleString() : 'Unknown date'}</td>
                <td>{getStatusBadge(t)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
                No transactions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

     
    </div>
  );
}