import { useEffect, useState } from "react";
import "../App.css";

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [transfersRes, balanceRes] = await Promise.all([
          fetch("http://localhost:3000/user/transfers", { credentials: "include" }),
          fetch("http://localhost:3000/user/balance", { credentials: "include" }),
        ]);

        if (!transfersRes.ok || !balanceRes.ok) throw new Error("Failed to load data");

        const transfersData = await transfersRes.json();
        const balanceData = await balanceRes.json();

        setTransfers(transfersData);
        setOverview(balanceData);
      } catch (err) {
        setError(err.message);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="container transfers-page">
      <h2 className="page-title">Transaction History</h2>

      {overview && (
        <div className="overview-cards">
          <div className="overview-card">
            <h3>Current Balance</h3>
            <p className="gold-text">R {overview.balance.toFixed(2)}</p>
          </div>
          <div className="overview-card">
            <h3>Total Sent</h3>
            <p className="silver-text">R {overview.totalSent.toFixed(2)}</p>
          </div>
          <div className="overview-card">
            <h3>Total Received</h3>
            <p className="gold-text">R {overview.totalReceived.toFixed(2)}</p>
          </div>
        </div>
      )}

      {error && <p className="message error">{error}</p>}

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
                <td>{t.from}</td>
                <td>{t.to}</td>
                <td className="amount">R {t.amount.toFixed(2)}</td>
                <td>{new Date(t.date).toLocaleString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>
                No transfers yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
