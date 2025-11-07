import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminTransfers from './AdminTransfers';

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
    const [showTransfers, setShowTransfers] = useState(false);

    // new: validation error state
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
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
        // clear field-specific error and general error when user types
        setErrors(prev => ({ ...prev, [name]: '' }));
        setGeneralError('');
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

        // client-side validation, collect errors
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
            // scroll to form for visibility
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        setLoading(true);
        setErrors({});
        setGeneralError('');
        try {
            await axios.post('https://localhost:3000/admin/add-user', newUser, {
                withCredentials: true
            });
            toast.success('User added successfully');
            fetchUsers();
            setNewUser({
                fullName: '',
                idNumber: '',
                accountNumber: '',
                name: '',
                password: '',
                initialBalance: 0
            });
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to add user';
            toast.error(msg);

            // Map backend message to field where possible
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
                // username/account conflict
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

    return (
        <div className="container" ref={formRef}>
            <h1 style={{textAlign:'center', marginBottom:'1rem'}}>Admin Dashboard</h1>

            <section className="admin-panel">
                <h2 className="section-title">Add New User</h2>

                {generalError && (<div className="message error" role="alert">{generalError}</div>)}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name:</label>
                        {/* moved hint above the input */}
                        <small className={errors.fullName ? 'error-text' : 'text-muted'}>
                            {errors.fullName || validationRules.fullName.message}
                        </small>
                        <input
                            type="text"
                            name="fullName"
                            value={newUser.fullName}
                            onChange={handleInputChange}
                            className="form-control"
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
                            className="form-control"
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
                            className="form-control"
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
                            className="form-control"
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
                            className="form-control"
                        />
                    </div>

                    <button type="submit" className="primary-btn" disabled={loading}>
                        {loading ? 'Adding…' : 'Add User'}
                    </button>
                </form>
            </section>

            <section className="admin-panel" style={{marginTop:'1.5rem'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
                    <h2 className="section-title" style={{margin:0}}>
                        {showTransfers ? 'Pending Transfers' : 'User List'}
                    </h2>
                    <button 
                        className="primary-btn" 
                        onClick={() => setShowTransfers(!showTransfers)}
                        style={{marginLeft:'auto'}}
                    >
                        {showTransfers ? 'View Users' : 'View Pending Transfers'}
                    </button>
                </div>

                {showTransfers ? (
                    <AdminTransfers />
                ) : (
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
                                        <td className="amount">${Number(user.balance || 0).toFixed(2)}</td>
                                        <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};

export default Admin;