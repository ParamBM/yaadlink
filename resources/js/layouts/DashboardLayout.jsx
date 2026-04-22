import React from 'react';
import { Outlet } from 'react-router';
import DashboardShell from '../components/Dashboard/DashboardShell';

export default function DashboardLayout() {
    return (
        <DashboardShell>
            <Outlet />
        </DashboardShell>
    );
}
