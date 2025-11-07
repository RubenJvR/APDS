// AdminTransfers.jsx
import React, { useState, useEffect } from 'react';
import { getPendingTransfers, approveTransfer, rejectTransfer } from '../api';
import { toast } from 'react-toastify';

const AdminTransfers = () => {
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchPendingTransfers();
    }, []);

    const fetchPendingTransfers = async () => {
        setLoading(true);
        try {
            const response = await getPendingTransfers();
            setTransfers(response.transfers || []);
        } catch (error) {
            toast.error('Failed to fetch pending transfers');
            console.error('Error fetching transfers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (transferId) => {
        setProcessingId(transferId);
        try {
            await approveTransfer(transferId);
            toast.success('Transfer approved successfully');
            fetchPendingTransfers(); // Refresh the list
        } catch (error) {
            toast.error(error.message || 'Failed to approve transfer');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (transferId) => {
        if (!window.confirm('Are you sure you want to reject this transfer? This will reverse the transaction.')) {
            return;
        }

        setProcessingId(transferId);
        try {
            await rejectTransfer(transferId);
            toast.success('Transfer rejected and reversed successfully');
            fetchPendingTransfers(); // Refresh the list
        } catch (error) {
            toast.error(error.message || 'Failed to reject transfer');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
                <p style={{ marginTop: '16px', color: '#666' }}>Loading pending transfers...</p>
            </div>
        );
    }

    if (transfers.length === 0) {
        return (
            <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                border: '2px dashed #ddd'
            }}>
                <h3 style={{ color: '#666', marginBottom: '8px' }}>No Pending Transfers</h3>
                <p style={{ color: '#999' }}>All transfers have been processed.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>From Account</th>
                        <th>To Account</th>
                        <th>Amount</th>
                        <th>Type</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {transfers.map((transfer) => (
                        <tr key={transfer._id}>
                            <td>
                                {transfer.date 
                                    ? new Date(transfer.date).toLocaleString() 
                                    : '-'}
                            </td>
                            <td>
                                <span style={{ 
                                    fontFamily: 'monospace', 
                                    fontWeight: 'bold',
                                    color: transfer.from === 'SYSTEM' || transfer.from === 'ADMIN' ? '#28a745' : '#333'
                                }}>
                                    {transfer.from}
                                </span>
                            </td>
                            <td>
                                <span style={{ 
                                    fontFamily: 'monospace', 
                                    fontWeight: 'bold' 
                                }}>
                                    {transfer.to}
                                </span>
                            </td>
                            <td className="amount">
                                R{Number(transfer.amount || 0).toFixed(2)}
                            </td>
                            <td>
                                <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    backgroundColor: 
                                        transfer.type === 'transfer' ? '#e7f3ff' :
                                        transfer.type === 'deposit' ? '#d4edda' :
                                        transfer.type === 'initial_deposit' ? '#fff3cd' :
                                        '#f8f9fa',
                                    color:
                                        transfer.type === 'transfer' ? '#004085' :
                                        transfer.type === 'deposit' ? '#155724' :
                                        transfer.type === 'initial_deposit' ? '#856404' :
                                        '#666'
                                }}>
                                    {transfer.type || 'unknown'}
                                </span>
                            </td>
                            <td>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => handleApprove(transfer._id)}
                                        disabled={processingId === transfer._id}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: '#28a745',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: processingId === transfer._id ? 'not-allowed' : 'pointer',
                                            opacity: processingId === transfer._id ? 0.6 : 1,
                                            fontSize: '14px',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {processingId === transfer._id ? 'Processing...' : 'Approve'}
                                    </button>
                                    <button
                                        onClick={() => handleReject(transfer._id)}
                                        disabled={processingId === transfer._id}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: processingId === transfer._id ? 'not-allowed' : 'pointer',
                                            opacity: processingId === transfer._id ? 0.6 : 1,
                                            fontSize: '14px',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {processingId === transfer._id ? 'Processing...' : 'Reject'}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ 
                marginTop: '20px', 
                padding: '12px', 
                backgroundColor: '#fff3cd', 
                borderRadius: '4px',
                border: '1px solid #ffc107'
            }}>
                <strong>Note:</strong> Rejecting a transfer will reverse the transaction and refund the sender.
            </div>
        </div>
    );
};

export default AdminTransfers;