import { useSelector } from 'react-redux';
import Stories from './Stories';
import UserStoriesDashboard from './UserStoriesDashboard';
import { isPrivilegedRole } from '@/lib/auth';

export default function DashboardStoriesRoute() {
    const { role } = useSelector((state) => state.auth);

    return isPrivilegedRole(role) ? <Stories mode="admin" /> : <UserStoriesDashboard />;
}
