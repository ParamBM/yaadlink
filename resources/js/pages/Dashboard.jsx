import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import { logout } from '../store/slices/authSlice';
import axios from 'axios';

export default function Dashboard() {
    const { user, token, isAuthenticated } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        } else if (user && user.role !== 'admin' && user.role !== 'ADM') {
            navigate('/');
        }
    }, [isAuthenticated, user, navigate]);

    const handleLogout = async () => {
        try {
            if (token) {
                await axios.post('/api/auth/logout', {}, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            sessionStorage.removeItem('token');
            dispatch(logout());
            navigate('/login');
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-on-surface">
            <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-8 border border-outline-variant/20 shadow-lg text-center">
                <div className="w-20 h-20 bg-primary-container rounded-full mx-auto flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-on-primary-container">dashboard</span>
                </div>
                
                <h1 className="text-3xl font-headline font-bold mb-2">Welcome to Dashboard</h1>
                <p className="text-on-surface-variant font-body mb-8">
                    Hello, {user?.name || 'User'}. You are logged in as <span className="font-semibold">{user?.role || 'user'}</span>.
                </p>

                <button 
                    onClick={handleLogout}
                    className="w-full bg-error text-on-error font-headline font-semibold py-3 px-6 rounded-full hover:bg-error/90 transition-all flex justify-center items-center gap-2"
                >
                    Logout
                    <span className="material-symbols-outlined text-lg">logout</span>
                </button>
            </div>
        </div>
    );
}
