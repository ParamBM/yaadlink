import '../css/main.css';
import './api/axiosConfig';

import React, { Suspense, lazy, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './store';
import { fetchUser } from './store/slices/authSlice';
import PublishingLoader from './components/PublishingLoader';

const Layout = lazy(() => import('./components/Layout'));
const Welcome = lazy(() => import('./pages/welcome'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const OnboardingStepper = lazy(() => import('./pages/OnboardingStepper'));
const PublicStoryPage = lazy(() => import('./pages/PublicStoryPage'));
const PublishSuccess = lazy(() => import('./pages/PublishSuccess'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const OAuthCallback = lazy(() => import('./pages/auth/OAuthCallback'));
const Legal = lazy(() => import('./pages/Legal'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const AdminOnlyRoute = lazy(() => import('./components/routes/AdminOnlyRoute'));
const DashboardIndexRedirect = lazy(() => import('./pages/DashboardIndexRedirect'));
const DashboardStoriesRoute = lazy(() => import('./pages/DashboardStoriesRoute'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Users = lazy(() => import('./pages/Users'));
const ActivityLogs = lazy(() => import('./pages/ActivityLogs'));
const OccasionTypes = lazy(() => import('./pages/OccasionTypes'));
const Themes = lazy(() => import('./pages/Themes'));
const ContactQueries = lazy(() => import('./pages/ContactQueries'));

function RouteFallback() {
    return <PublishingLoader isVisible phase="login" />;
}

function AppContent() {
    const dispatch = useDispatch();
    const { token, isInitialized } = useSelector((state) => state.auth);

    useEffect(() => {
        if (token && !isInitialized) {
            dispatch(fetchUser());
        }
    }, [token, isInitialized, dispatch]);

    if (token && !isInitialized) {
        return <PublishingLoader isVisible phase="login" />;
    }

    return (
        <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
                <Routes>
                    <Route element={<Layout />}>
                        <Route path="/" element={<Welcome />} />
                        <Route path="/legal" element={<Legal />} />
                        <Route path="/contact-us" element={<ContactUs />} />
                    </Route>

                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/onboarding/story" element={<OnboardingStepper />} />
                    <Route path="/story/published/:slug" element={<PublishSuccess />} />
                    <Route path="/story/:slug" element={<PublicStoryPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/oauth/callback" element={<OAuthCallback />} />

                    <Route element={<DashboardLayout />}>
                        <Route path="/dashboard" element={<DashboardIndexRedirect />} />
                        <Route path="/dashboard/analytics" element={<AdminOnlyRoute><Analytics /></AdminOnlyRoute>} />
                        <Route path="/dashboard/users" element={<AdminOnlyRoute><Users /></AdminOnlyRoute>} />
                        <Route path="/dashboard/activity-logs" element={<AdminOnlyRoute><ActivityLogs /></AdminOnlyRoute>} />
                        <Route path="/dashboard/occasion-types" element={<AdminOnlyRoute><OccasionTypes /></AdminOnlyRoute>} />
                        <Route path="/dashboard/themes" element={<AdminOnlyRoute><Themes /></AdminOnlyRoute>} />
                        <Route path="/dashboard/stories" element={<DashboardStoriesRoute />} />
                        <Route path="/dashboard/contact-queries" element={<AdminOnlyRoute><ContactQueries /></AdminOnlyRoute>} />
                    </Route>
                </Routes>
            </Suspense>
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
