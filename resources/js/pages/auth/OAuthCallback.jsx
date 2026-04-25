import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/slices/authSlice';
import axios from 'axios';

export default function OAuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const handleCallback = async () => {
            const token = searchParams.get('token');
            const error = searchParams.get('error');

            if (error) {
                console.error("OAuth Error:", error);
                navigate(`/login?error=${encodeURIComponent(error)}`);
                return;
            }

            if (token) {
                // Only the token is persisted — user data lives in Redux only
                sessionStorage.setItem('token', token);

                try {
                    // Fetch user details from backend to complete login flow
                    const response = await axios.get('/api/auth/check', {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (response.data.success) {
                        const user = response.data.user;
                        dispatch(loginSuccess({ user, token }));

                        const redirectTo = sessionStorage.getItem('oauth_redirect_to');
                        if (redirectTo) {
                            sessionStorage.removeItem('oauth_redirect_to');
                            navigate(redirectTo);
                            return;
                        }

                        navigate('/dashboard');
                    } else {
                        navigate('/login?error=Failed to retrieve user data');
                    }
                } catch (err) {
                    console.error("Failed to fetch user:", err);
                    navigate('/login?error=Failed to authenticate user');
                }
            } else {
                navigate('/login?error=Invalid authentication callback');
            }
        };

        handleCallback();
    }, [searchParams, navigate, dispatch]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-primary-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-on-surface font-body font-medium">Completing authentication...</p>
            </div>
        </div>
    );
}
