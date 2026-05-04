import { useSelector } from 'react-redux';
import { Navigate } from 'react-router';
import Stories from './Stories';
import { isPrivilegedRole } from '@/lib/auth';
import PublishingLoader from '../components/PublishingLoader';

export default function UserStoriesDashboard() {
    const { token, isAuthenticated, isInitialized, role } = useSelector((state) => state.auth);

    if (token && !isInitialized) {
        return <PublishingLoader isVisible phase="login" />;
    }

    if (!token || !isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (isPrivilegedRole(role)) {
        return <Navigate to="/dashboard/analytics" replace />;
    }

    return <Stories mode="user" />;
}
