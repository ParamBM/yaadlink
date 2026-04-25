import { useSelector } from 'react-redux';
import { Navigate } from 'react-router';
import { isPrivilegedRole } from '@/lib/auth';

export default function DashboardIndexRedirect() {
    const { role } = useSelector((state) => state.auth);

    return <Navigate to={isPrivilegedRole(role) ? '/dashboard/analytics' : '/dashboard/stories'} replace />;
}
