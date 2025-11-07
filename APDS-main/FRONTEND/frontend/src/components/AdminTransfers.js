import { useState, useEffect } from "react";
import { getPendingTransfers, approveTransfer, rejectTransfer } from "../api";

export default function AdminTransfers() {
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPendingTransfers();
  }, []);

  const fetchPendingTransfers = async () => {
    try {
      const response = await getPendingTransfers();
      setPendingTransfers(response.transfers || []);
    } catch (error) {
      setMessage("Error fetching pending transfers");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (transferId) => {
    try {
      await approveTransfer(transferId);
      setMessage("Transfer approved successfully");
      fetchPendingTransfers(); // Refresh the list
    } catch (error) {
      setMessage("Error approving transfer");
      console.error(error);
    }
  };

  const handleReject = async (transferId) => {
    const reason = prompt("Enter rejection reason:");
    if (reason !== null) {
      try {
        await rejectTransfer(transferId, reason);
        setMessage("Transfer rejected successfully");
        fetchPendingTransfers(); // Refresh the list
      } catch (error) {
        setMessage("Error rejecting transfer");
        console.error(error);
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4" style={{ color: "#d4af37" }}>
        Pending Transfers Approval
      </h2>

      {message && (
        <div className={`alert ${message.includes("Error") ? "alert-danger" : "alert-success"}`}>
          {message}
        </div>
      )}

      {pendingTransfers.length === 0 ? (
        <div className="alert alert-info">No pending transfers</div>
      ) : (
        <div className="list-group">
          {pendingTransfers.map(transfer => (
            <div key={transfer._id} className="list-group-item">
              <div className="row">
                <div className="col-md-8">
                  <h5>Transfer Request</h5>
                  <p><strong>From:</strong> {transfer.from} ({transfer.requestedBy})</p>
                  <p><strong>To:</strong> {transfer.to}</p>
                  <p><strong>Amount:</strong> ${transfer.amount}</p>
                  <p><strong>Date:</strong> {new Date(transfer.date).toLocaleString()}</p>
                </div>
                <div className="col-md-4 d-flex align-items-center justify-content-end">
                  <button
                    className="btn btn-success me-2"
                    onClick={() => handleApprove(transfer._id)}
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleReject(transfer._id)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}