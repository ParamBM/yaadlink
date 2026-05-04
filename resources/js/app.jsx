import '../css/main.css';
import './api/axiosConfig';

import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Provider } from 'react-redux';
import store from './store';

import Layout from './components/Layout';
import Welcome from './pages/welcome';
import Onboarding from './pages/Onboarding';
import OnboardingStepper from './pages/OnboardingStepper';
import PublicStoryPage from './pages/PublicStoryPage';
import PublishSuccess from './pages/PublishSuccess';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import OAuthCallback from './pages/auth/OAuthCallback';
import Legal from './pages/Legal';
import ContactUs from './pages/ContactUs';
import DashboardLayout from './layouts/DashboardLayout';
import AdminOnlyRoute from './components/routes/AdminOnlyRoute';
import DashboardIndexRedirect from './pages/DashboardIndexRedirect';
import DashboardStoriesRoute from './pages/DashboardStoriesRoute';

// Dashboard pages
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import ActivityLogs from './pages/ActivityLogs';
import OccasionTypes from './pages/OccasionTypes';
import Themes from './pages/Themes';
import ContactQueries from './pages/ContactQueries';

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
                    <Route path="/legal" element={<Legal />} />
                    <Route path="/contact-us" element={<ContactUs />} />
                </Route>

                {/* Standalone routes */}
                <Route path="/onboarding"      element={<Onboarding />} />
                <Route path="/onboarding/story" element={<OnboardingStepper />} />
                <Route path="/story/published/:slug" element={<PublishSuccess />} />
                <Route path="/story/:slug" element={<PublicStoryPage />} />
                <Route path="/login"           element={<Login />} />
                <Route path="/register"        element={<Register />} />
                <Route path="/oauth/callback"  element={<OAuthCallback />} />

                {/* Dashboard — /dashboard → /dashboard/analytics */}
                <Route element={<DashboardLayout />}>
                    <Route path="/dashboard"                    element={<DashboardIndexRedirect />} />
                    <Route path="/dashboard/analytics"          element={<AdminOnlyRoute><Analytics /></AdminOnlyRoute>} />
                    <Route path="/dashboard/users"              element={<AdminOnlyRoute><Users /></AdminOnlyRoute>} />
                    <Route path="/dashboard/activity-logs"      element={<AdminOnlyRoute><ActivityLogs /></AdminOnlyRoute>} />
                    <Route path="/dashboard/occasion-types"     element={<AdminOnlyRoute><OccasionTypes /></AdminOnlyRoute>} />
                    <Route path="/dashboard/themes"             element={<AdminOnlyRoute><Themes /></AdminOnlyRoute>} />
                    <Route path="/dashboard/stories"            element={<DashboardStoriesRoute />} />
                    <Route path="/dashboard/contact-queries"   element={<AdminOnlyRoute><ContactQueries /></AdminOnlyRoute>} />
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

const container = document.getElementById('app');
if (!container.__reactRoot) {
    container.__reactRoot = createRoot(container);
}
container.__reactRoot.render(<App />);
