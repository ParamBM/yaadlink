import { useSelector } from 'react-redux';
import { Navigate } from 'react-router';
import Stories from './Stories';
import { isPrivilegedRole } from '@/lib/auth';

export default function UserStoriesDashboard() {
    const { token, isAuthenticated, isInitialized, role } = useSelector((state) => state.auth);

    if (token && !isInitialized) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-surface px-6 text-on-surface dark:bg-stone-950 dark:text-white">
                <div className="flex items-center gap-3 rounded-full border border-outline-variant/20 bg-surface-container-lowest px-5 py-3 text-sm font-medium dark:border-stone-700/50 dark:bg-stone-900">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/25 border-t-current" />
                    Checking session...
                </div>
            </div>
        );
    }

    if (!token || !isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (isPrivilegedRole(role)) {
        return <Navigate to="/dashboard/analytics" replace />;
    }

    return <Stories mode="user" />;
}
