import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import './UserProfile.css';
import { API_BASE_URL } from './api/config';

const UserProfile = () => {
    const { user, setUser } = useAuth();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${API_BASE_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const updatedUser = await res.json();
                // Update local auth context if needed
                if (setUser) setUser(updatedUser);
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
            } else {
                const errorText = await res.text();
                setMessage({ type: 'error', text: errorText || 'Failed to update profile.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Server connection error.' });
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <div className="profile-container"><p>Please sign in to view your profile.</p></div>;
    }

    return (
        <div className="profile-container">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="profile-card"
            >
                <div className="profile-header">
                    <h1>Account Settings</h1>
                    <p>Manage your sanctuary profile and security preferences.</p>
                </div>

                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="Your first name"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Your last name"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your@email.com"
                            required
                        />
                    </div>

                    <AnimatePresence>
                        {message.text && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`profile-message ${message.type}`}
                            >
                                {message.text}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button type="submit" className="save-btn" disabled={loading}>
                        {loading ? 'Securing Changes...' : 'Save Profile'}
                    </button>
                </form>

                <div className="profile-footer">
                    <p>Looking for your stay history? <a href="/my-bookings">View Adventures</a></p>
                </div>
            </motion.div>
        </div>
    );
};

export default UserProfile;
