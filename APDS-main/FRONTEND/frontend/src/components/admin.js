import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Admin = () => {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({
        fullName: '',
        idNumber: '',
        accountNumber: '',
        name: '',
        password: '',
        initialBalance: 0
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const formRef = useRef(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('https://localhost:3000/admin/users', {
                withCredentials: true
            });
            const list = response.data?.users || response.data || [];
            setUsers(list);
        } catch (error) {
            toast.error('Failed to fetch users');
            console.error('Error fetching users:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewUser(prev => ({
            ...prev,
            [name]: value
        }));
        setErrors(prev => ({ ...prev, [name]: '' }));
        setGeneralError('');
        setSuccessMessage('');
    };

    const validationRules = {
        fullName: {
            pattern: /^[A-Za-z]+(?: [A-Za-z]+)*$/,
            message: "Full name must only contain letters and spaces"
        },
        idNumber: {
            pattern: /^\d{9}$/,
            message: "ID number must be exactly 9 digits"
        },
        accountNumber: {
            pattern: /^\d{8,12}$/,
            message: "Account number must be between 8 and 12 digits"
        },
        name: {
            pattern: /^\w{3,15}$/,
            message: "Username must be 3-15 characters (letters, numbers, underscores)"
        },
        password: {
            pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/,
            message: "Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number"
        }
    };

    const validateField = (fieldName, value) => {
        const rule = validationRules[fieldName];
        if (!rule) return true;
        return rule.pattern.test(String(value));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        Object.entries(validationRules).forEach(([field, rule]) => {
            const val = newUser[field];
            if (!validateField(field, val)) {
                newErrors[field] = rule.message;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setGeneralError('Please fix the highlighted fields.');
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        setLoading(true);
        setErrors({});
        setGeneralError('');
        setSuccessMessage('');
        
        try {
            await axios.post('https://localhost:3000/admin/add-user', newUser, {
                withCredentials: true
            });
            
            // Enhanced success feedback
            toast.success('User added successfully', {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "colored"
            });
            
            setSuccessMessage('User added successfully! The form has been reset and you can add another user.');
            
            fetchUsers();
            setNewUser({
                fullName: '',
                idNumber: '',
                accountNumber: '',
                name: '',
                password: '',
                initialBalance: 0
            });

            // Auto-clear success message after 8 seconds
            setTimeout(() => {
                setSuccessMessage('');
            }, 8000);

        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to add user';
            toast.error(msg);

            const lower = String(msg).toLowerCase();
            const backendErrors = {};
            if (lower.includes('full name') || lower.includes('full name must')) {
                backendErrors.fullName = msg;
            } else if (lower.includes('id number') || lower.includes('id number must')) {
                backendErrors.idNumber = msg;
            } else if (lower.includes('account number')) {
                backendErrors.accountNumber = msg;
            } else if (lower.includes('username') || lower.includes('name must')) {
                backendErrors.name = msg;
            } else if (lower.includes('password')) {
                backendErrors.password = msg;
            } else if (error.response?.status === 409) {
                backendErrors.name = msg;
                backendErrors.accountNumber = msg;
            } else {
                setGeneralError(msg);
            }

            if (Object.keys(backendErrors).length) {
                setErrors(backendErrors);
                setGeneralError('Please fix the highlighted fields.');
                formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            console.error('Add user error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Format amount as Rands
    const formatAmount = (amount) => {
        return `R ${Number(amount || 0).toFixed(2)}`;
    };

    return (
        <div className="container" ref={formRef}>
            <h1 className="text-center mb-4" style={{ color: "#d4af37" }}>Admin Dashboard</h1>

            <section className="admin-panel">
                <h2 className="section-title">Add New User</h2>

                {generalError && (
                    <div className="message error" role="alert">
                        {generalError}
                    </div>
                )}

                {successMessage && (
                    <div className="message success" role="alert">
                        {successMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name:</label>
                        <small className={errors.fullName ? 'error-text' : 'text-muted'}>
                            {errors.fullName || validationRules.fullName.message}
                        </small>
                        <input
                            type="text"
                            name="fullName"
                            value={newUser.fullName}
                            onChange={handleInputChange}
                            className={`form-control ${errors.fullName ? 'error-border' : ''}`}
                        />
                    </div>

                    <div className="form-group">
                        <label>ID Number:</label>
                        <small className={errors.idNumber ? 'error-text' : 'text-muted'}>
                            {errors.idNumber || validationRules.idNumber.message}
                        </small>
                        <input
                            type="text"
                            name="idNumber"
                            value={newUser.idNumber}
                            onChange={handleInputChange}
                            className={`form-control ${errors.idNumber ? 'error-border' : ''}`}
                        />
                    </div>

                    <div className="form-group">
                        <label>Account Number:</label>
                        <small className={errors.accountNumber ? 'error-text' : 'text-muted'}>
                            {errors.accountNumber || validationRules.accountNumber.message}
                        </small>
                        <input
                            type="text"
                            name="accountNumber"
                            value={newUser.accountNumber}
                            onChange={handleInputChange}
                            className={`form-control ${errors.accountNumber ? 'error-border' : ''}`}
                        />
                    </div>

                    <div className="form-group">
                        <label>Username:</label>
                        <small className={errors.name ? 'error-text' : 'text-muted'}>
                            {errors.name || validationRules.name.message}
                        </small>
                        <input
                            type="text"
                            name="name"
                            value={newUser.name}
                            onChange={handleInputChange}
                            className={`form-control ${errors.name ? 'error-border' : ''}`}
                        />
                    </div>

                    <div className="form-group">
                        <label>Password:</label>
                        <small className={errors.password ? 'error-text' : 'text-muted'}>
                            {errors.password || validationRules.password.message}
                        </small>
                        <input
                            type="password"
                            name="password"
                            value={newUser.password}
                            onChange={handleInputChange}
                            className={`form-control ${errors.password ? 'error-border' : ''}`}
                        />
                    </div>

                    <div className="form-group">
                        <label>Initial Balance (Rands):</label>
                        <input
                            type="number"
                            name="initialBalance"
                            value={newUser.initialBalance}
                            onChange={handleInputChange}
                            className="form-control"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="primary-btn" 
                        disabled={loading}
                        style={{
                            opacity: loading ? 0.6 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Adding User...' : 'Add User'}
                    </button>
                </form>
            </section>

            <section className="admin-panel" style={{marginTop:'1.5rem'}}>
                <h2 className="section-title">User List</h2>
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Full Name</th>
                                <th>Username</th>
                                <th>Account Number</th>
                                <th>Balance</th>
                                <th>Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => (
                                <tr key={index}>
                                    <td>{user.fullName}</td>
                                    <td>{user.name}</td>
                                    <td>{user.accountNumber}</td>
                                    <td className="amount">{formatAmount(user.balance)}</td>
                                    <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <style jsx>{`
                .message.success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                    padding: 12px;
                    border-radius: 4px;
                    margin-bottom: 16px;
                    font-weight: bold;
                }
                
                .message.error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                    padding: 12px;
                    border-radius: 4px;
                    margin-bottom: 16px;
                }
                
                .error-text {
                    color: #dc3545;
                    font-weight: bold;
                }
                
                .error-border {
                    border-color: #dc3545;
                    border-width: 2px;
                }
                
                .amount {
                    font-weight: bold;
                    color: #2e8b57;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateY(-10px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                
                .message {
                    animation: slideIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};
  
export default Admin;