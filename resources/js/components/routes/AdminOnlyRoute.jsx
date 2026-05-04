import { useSelector } from 'react-redux';
import { Navigate } from 'react-router';
import { isPrivilegedRole } from '@/lib/auth';
import PublishingLoader from '../PublishingLoader';

export default function AdminOnlyRoute({ children }) {
    const { token, isAuthenticated, isInitialized, role } = useSelector((state) => state.auth);

    if (token && !isInitialized) {
        return <PublishingLoader isVisible phase="login" />;
    }

    if (!token || !isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!isPrivilegedRole(role)) {
        return <Navigate to="/dashboard/stories" replace />;
    }

    return children;
}
