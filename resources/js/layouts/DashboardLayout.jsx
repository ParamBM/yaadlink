import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router';
import DashboardShell from '../components/Dashboard/DashboardShell';
import PublishingLoader from '../components/PublishingLoader';

export default function DashboardLayout() {
    const { token, isAuthenticated, isInitialized } = useSelector((state) => state.auth);

    if (token && !isInitialized) {
        return <PublishingLoader isVisible phase="login" />;
    }

    if (!token || !isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <DashboardShell>
            <Outlet />
        </DashboardShell>
    );
}
