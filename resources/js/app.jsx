import '../css/main.css';

import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Provider } from 'react-redux';
import store from './store';

import Layout from './components/Layout';
import Welcome from './pages/welcome';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import OAuthCallback from './pages/OAuthCallback';
import DashboardLayout from './layouts/DashboardLayout';

// Dashboard pages
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import ActivityLogs from './pages/ActivityLogs';
import OccasionTypes from './pages/OccasionTypes';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUser } from './store/slices/authSlice';

function AppContent() {
    const dispatch = useDispatch();
    const { token, isInitialized } = useSelector(state => state.auth);

    useEffect(() => {
        if (token && !isInitialized) {
            dispatch(fetchUser());
        }
    }, [token, isInitialized, dispatch]);

    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route element={<Layout />}>
                    <Route path="/" element={<Welcome />} />
                </Route>

                {/* Standalone routes */}
                <Route path="/onboarding"      element={<Onboarding />} />
                <Route path="/login"           element={<Login />} />
                <Route path="/oauth/callback"  element={<OAuthCallback />} />

                {/* Dashboard — /dashboard → /dashboard/analytics */}
                <Route element={<DashboardLayout />}>
                    <Route path="/dashboard"                    element={<Navigate to="/dashboard/analytics" replace />} />
                    <Route path="/dashboard/analytics"          element={<Analytics />} />
                    <Route path="/dashboard/users"              element={<Users />} />
                    <Route path="/dashboard/activity-logs"      element={<ActivityLogs />} />
                    <Route path="/dashboard/occasion-types"     element={<OccasionTypes />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

function App() {
    return (
        <Provider store={store}>
            <AppContent />
        </Provider>
    );
}

createRoot(document.getElementById('app')).render(<App />);
