import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router';
import { logoutUser } from '../../store/slices/authSlice';
import { isPrivilegedRole } from '@/lib/auth';

const adminNavLinks = [
    { label: 'Analytics',      icon: 'bar_chart',    href: '/dashboard/analytics' },
    { label: 'Users',          icon: 'group',        href: '/dashboard/users' },
    { label: 'Activity Logs',  icon: 'history',      href: '/dashboard/activity-logs' },
    { label: 'Occasion Types', icon: 'event_note',   href: '/dashboard/occasion-types' },
    { label: 'Themes',         icon: 'palette',      href: '/dashboard/themes' },
    { label: 'Stories',        icon: 'auto_stories', href: '/dashboard/stories' },
    { label: 'Contact Queries', icon: 'contact_mail', href: '/dashboard/contact-queries' },
];

const userNavLinks = [
    { label: 'My Stories', icon: 'auto_stories', href: '/dashboard/stories' },
];

export default function DashboardShell({ children }) {
    const { user, role } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const [isDark, setIsDark] = useState(
        localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
    const [mobileOpen, setMobileOpen] = useState(false);
    const [confirmLogout, setConfirmLogout] = useState(false);
    const privilegedUser = isPrivilegedRole(role);
    const navLinks = privilegedUser ? adminNavLinks : userNavLinks;

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate('/login');
    };

    const activePage = navLinks.find((link) => link.href === location.pathname)?.label ?? (privilegedUser ? 'Dashboard' : 'My Stories');

    return (
        <div className="flex h-screen overflow-hidden antialiased bg-surface dark:bg-stone-950 text-on-surface dark:text-white transition-colors duration-300 selection:bg-primary selection:text-on-primary">

            {/* ── Sidebar ─────────────────────────────────────────────────── */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 flex flex-col
                bg-surface-container-low dark:bg-stone-900
                rounded-r-[2rem]
                shadow-[30px_0_60px_-15px_rgba(183,16,42,0.05)] dark:shadow-[30px_0_60px_-15px_rgba(0,0,0,0.5)]
                transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full p-5 gap-6">

                    {/* Profile */}
                    <div className="flex items-center gap-3 px-2">
                        <img
                            alt={user?.name || (privilegedUser ? 'Admin' : 'User')}
                            className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
                            src={user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=b7102a&color=fff&size=64`}
                        />
                        <div className="overflow-hidden">
                            <h2 className="text-on-surface dark:text-white font-headline font-bold text-base leading-tight truncate">
                                {user?.name || (privilegedUser ? 'Admin' : 'User')}
                            </h2>
                            <p className="text-primary dark:text-red-400 text-xs font-semibold capitalize mt-0.5 truncate font-body">
                                {user?.role || (privilegedUser ? 'Administrator' : 'User')}
                            </p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 flex flex-col gap-1.5 font-headline">
                        {navLinks.map((link) => {
                            const isActive = location.pathname === link.href;
                            return (
                                <Link
                                    key={link.label}
                                    to={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-300 active:scale-95 ${
                                        isActive
                                            ? 'bg-surface-container-lowest dark:bg-stone-800 text-primary dark:text-red-400 font-bold shadow-sm'
                                            : 'text-on-surface-variant dark:text-stone-400 hover:bg-surface/60 dark:hover:bg-stone-800/50 hover:scale-[1.02] hover:text-on-surface dark:hover:text-white'
                                    }`}
                                >
                                    <span
                                        className="material-symbols-outlined text-[1.15rem]"
                                        style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0", fontSize: '1.15rem' }}
                                    >
                                        {link.icon}
                                    </span>
                                    <span className="text-sm">{link.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Sign Out button */}
                    <button
                        className="w-full py-3 px-5 rounded-full bg-surface-container hover:bg-error-container/30 dark:bg-stone-800 dark:hover:bg-red-900/30 text-on-surface-variant dark:text-stone-400 hover:text-error dark:hover:text-red-400 font-bold text-sm hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2 font-headline border border-outline-variant/20 dark:border-stone-700/50"
                        onClick={() => setConfirmLogout(true)}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>logout</span>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 md:hidden backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* ── Main Content ─────────────────────────────────────────────── */}
            <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-surface dark:bg-stone-950 relative transition-colors duration-300">

                {/* Top App Bar */}
                <header className="w-full h-20 shrink-0 sticky top-0 z-40 bg-surface/80 dark:bg-stone-950/80 backdrop-blur-md flex items-center justify-between px-8 border-b border-outline-variant/10 dark:border-stone-800 transition-colors duration-300">
                    <img 
                        src="/branding/logo.webp" 
                        alt="Yaad Link Logo" 
                        className="h-7 hidden md:block object-contain" 
                    />

                    <div className="flex items-center justify-between w-full md:w-auto md:gap-6 ml-auto">
                        {/* Mobile menu */}
                        <button
                            className="md:hidden text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-container transition-colors -ml-2"
                            onClick={() => setMobileOpen(true)}
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <h1 className="md:hidden font-headline font-bold text-primary dark:text-red-400 text-lg mr-auto ml-2">{activePage}</h1>

                        <div className="flex items-center gap-2">
                            {/* Dark mode */}
                            <button
                                onClick={() => setIsDark(d => !d)}
                                className="text-on-surface-variant dark:text-stone-400 hover:text-primary dark:hover:text-red-400 hover:bg-surface-container dark:hover:bg-stone-800 rounded-full p-2 transition-all active:scale-95"
                                aria-label="Toggle Dark Mode"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                                    {isDark ? 'light_mode' : 'dark_mode'}
                                </span>
                            </button>

                            {/* Avatar (mobile) */}
                            <img
                                alt="User Avatar"
                                className="w-8 h-8 rounded-full object-cover ml-1 md:hidden border border-primary/20"
                                src={user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=b7102a&color=fff&size=64`}
                            />
                        </div>
                    </div>
                </header>

                {/* Page content */}
                {children}
            </main>

            {/* Logout Confirmation Modal */}
            {confirmLogout && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-surface dark:bg-stone-900 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-outline-variant/20 dark:border-stone-700 animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 rounded-full bg-error-container dark:bg-red-900/30 text-error dark:text-red-400 flex items-center justify-center mb-6 mx-auto">
                            <span className="material-symbols-outlined text-3xl">logout</span>
                        </div>
                        <h2 className="font-headline text-xl font-bold text-center text-on-surface dark:text-white mb-2">
                            Sign Out?
                        </h2>
                        <p className="text-on-surface-variant dark:text-stone-400 text-center text-sm font-body mb-8">
                            Are you sure you want to sign out? You will need to log back in to access the dashboard.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmLogout(false)}
                                className="flex-1 py-3 px-4 rounded-full border border-outline-variant dark:border-stone-700 text-on-surface-variant dark:text-stone-300 font-bold text-sm hover:bg-surface-variant dark:hover:bg-stone-800 transition-colors font-headline"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setConfirmLogout(false);
                                    handleLogout();
                                }}
                                className="flex-1 py-3 px-4 rounded-full bg-error hover:bg-error/90 dark:bg-red-500 dark:hover:bg-red-400 font-bold text-sm text-white transition-colors font-headline"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
