import '../css/main.css';

import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import { Provider } from 'react-redux';
import store from './store';

import Layout from './components/Layout';
import Welcome from './pages/welcome';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

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

    // Optional: add a global loader here if (token && !isInitialized && loading) returning null or a spinner

    return (
        <BrowserRouter>
            <Routes>
                {/* Routes that share the persistent Header + Footer */}
                <Route element={<Layout />}>
                    <Route path="/" element={<Welcome />} />
                </Route>

                {/* Standalone routes — no Header/Footer */}
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
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
