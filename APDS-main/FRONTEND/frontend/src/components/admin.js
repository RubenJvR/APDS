import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('http://localhost:3001/admin/users', {
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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('http://localhost:3001/admin/add-user', newUser, {
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
            toast.error(error.response?.data?.message || 'Failed to add user');
            console.error('Add user error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-center">Admin Dashboard</h1>
            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Add New User</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Full Name</label>
                            <input type="text" name="fullName" value={newUser.fullName} onChange={handleInputChange} className="w-full p-2 border rounded" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">ID Number</label>
                            <input type="text" name="idNumber" value={newUser.idNumber} onChange={handleInputChange} className="w-full p-2 border rounded" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Account Number</label>
                            <input type="text" name="accountNumber" value={newUser.accountNumber} onChange={handleInputChange} className="w-full p-2 border rounded" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Username</label>
                            <input type="text" name="name" value={newUser.name} onChange={handleInputChange} className="w-full p-2 border rounded" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Password</label>
                            <input type="password" name="password" value={newUser.password} onChange={handleInputChange} className="w-full p-2 border rounded" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Initial Balance</label>
                            <input type="number" name="initialBalance" value={newUser.initialBalance} onChange={handleInputChange} className="w-full p-2 border rounded" min="0" step="0.01" />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white py-2 px-4 rounded">
                        {loading ? 'Adding User...' : 'Add User'}
                    </button>
                </form>
            </div>

            <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">User List</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-4 py-2">Full Name</th>
                                <th className="px-4 py-2">Username</th>
                                <th className="px-4 py-2">Account Number</th>
                                <th className="px-4 py-2">Balance</th>
                                <th className="px-4 py-2">Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => (
                                <tr key={index} className="border-b">
                                    <td className="px-4 py-2">{user.fullName}</td>
                                    <td className="px-4 py-2">{user.name}</td>
                                    <td className="px-4 py-2">{user.accountNumber}</td>
                                    <td className="px-4 py-2">
                                        ${Number(user.balance || 0).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-2">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Admin;