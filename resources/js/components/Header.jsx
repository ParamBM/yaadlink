import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/slices/authSlice';
import { headerLinks, logoPath, siteName } from '@/lib/site';
import { isPrivilegedRole } from '@/lib/auth';

function NavItem({ link, className = '', onClick = null, children = null }) {
    const content = children || link.label;

    if (link.to) {
        return (
            <Link className={className} onClick={onClick} to={link.to}>
                {content}
            </Link>
        );
    }

    return (
        <a className={className} href={link.href} onClick={onClick}>
            {content}
        </a>
    );
}

export default function Header() {
    const { isAuthenticated, role } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [confirmLogout, setConfirmLogout] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        setDrawerOpen(false);
    }, [location.pathname, location.hash]);

    useEffect(() => {
        if (!drawerOpen) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [drawerOpen]);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate('/login');
    };

    const dashboardLabel = isPrivilegedRole(role) ? 'Dashboard' : 'My Dashboard';

    return (
        <>
            <header className="fixed inset-x-0 top-0 z-50">
                <nav className="bg-surface/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(183,16,42,0.05)]" aria-label="Primary">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-4 sm:gap-4 sm:px-6 md:px-8">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Link className="flex items-center" to="/" aria-label={siteName}>
                                <img className="h-9 w-auto object-contain sm:h-11" src={logoPath} alt={siteName} />
                            </Link>
                            <button
                                aria-expanded={drawerOpen}
                                aria-label="Open navigation drawer"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-lowest text-on-surface-variant transition-colors hover:border-primary/30 hover:text-primary"
                                onClick={() => setDrawerOpen(true)}
                                type="button"
                            >
                                <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
                            </button>
                        </div>

                        <div className="hidden items-center gap-8 font-headline text-sm font-semibold tracking-tight md:flex">
                            {headerLinks.map((link) => (
                                <NavItem
                                    key={link.label}
                                    link={link}
                                    className="text-on-surface-variant transition-colors duration-300 hover:text-primary"
                                />
                            ))}
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            {isAuthenticated && (
                                <Link
                                    className="hidden whitespace-nowrap rounded-full border border-outline-variant/20 px-5 py-2.5 font-label text-sm font-medium text-on-surface-variant transition-colors duration-200 hover:border-primary/30 hover:bg-surface-container-low hover:text-primary md:inline-flex"
                                    to="/dashboard"
                                >
                                    {dashboardLabel}
                                </Link>
                            )}

                            {isAuthenticated ? (
                                <button
                                    onClick={() => setConfirmLogout(true)}
                                    className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-error/20 bg-error/10 px-4 py-2.5 font-label text-sm font-medium text-error transition-colors duration-200 hover:border-error hover:bg-error hover:text-white sm:px-6"
                                >
                                    Logout
                                    <span className="material-symbols-outlined text-[18px]">logout</span>
                                </button>
                            ) : (
                                <Link
                                    to="/login"
                                    className="inline-flex min-w-fit shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-gradient-to-r from-primary to-primary-container px-4 py-2.5 font-label text-sm font-medium leading-none text-on-primary shadow-[0_20px_40px_rgba(183,16,42,0.15)] transition-transform duration-200 hover:scale-[0.98] hover:text-on-primary sm:px-6"
                                >
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                </nav>
            </header>

            <div className={`fixed inset-0 z-[90] transition-opacity duration-300 ${drawerOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
                <button
                    aria-label="Close navigation drawer"
                    className="absolute inset-0 bg-black/35 backdrop-blur-sm"
                    onClick={() => setDrawerOpen(false)}
                    type="button"
                />

                <div className={`absolute inset-x-0 top-0 mx-auto w-full max-w-6xl px-4 pt-0 transition-transform duration-300 sm:px-6 ${drawerOpen ? 'translate-y-0' : '-translate-y-full'}`}>
                    <div className="overflow-hidden rounded-b-[2rem] border border-outline-variant/15 bg-surface/95 shadow-[0_30px_80px_rgba(27,28,28,0.16)] backdrop-blur-xl">
                        <div className="flex items-center justify-between border-b border-outline-variant/10 px-5 py-4 sm:px-6">
                            <div>
                                <p className="font-headline text-lg font-bold text-on-surface">Navigate YaadLink</p>
                                <p className="text-sm text-on-surface-variant">Quick links for stories, pages, and your dashboard.</p>
                            </div>
                            <button
                                aria-label="Close drawer"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:text-primary"
                                onClick={() => setDrawerOpen(false)}
                                type="button"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
                            {headerLinks.map((link) => (
                                <NavItem
                                    key={link.label}
                                    link={link}
                                    onClick={() => setDrawerOpen(false)}
                                    className="flex min-h-10 items-center justify-between rounded-[1.2rem] border border-outline-variant/15 bg-surface-container-lowest px-4 py-4 font-headline text-base font-semibold text-on-surface transition-colors hover:border-primary/20 hover:bg-surface-container-low hover:text-primary"
                                >
                                    {link.label}
                                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">arrow_forward</span>
                                </NavItem>
                            ))}

                            <Link
                                className="flex min-h-10 items-center justify-between rounded-[1.2rem] border border-outline-variant/15 bg-surface-container-lowest px-4 py-4 font-headline text-base font-semibold text-on-surface transition-colors hover:border-primary/20 hover:bg-surface-container-low hover:text-primary"
                                onClick={() => setDrawerOpen(false)}
                                to="/onboarding"
                            >
                                Create a Page
                                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">add</span>
                            </Link>

                            {isAuthenticated ? (
                                <Link
                                    className="flex min-h-10 items-center justify-between rounded-[1.2rem] border border-primary/15 bg-primary/5 px-4 py-4 font-headline text-base font-semibold text-primary transition-colors hover:bg-primary/10"
                                    onClick={() => setDrawerOpen(false)}
                                    to="/dashboard"
                                >
                                    {dashboardLabel}
                                    <span className="material-symbols-outlined text-[18px]">dashboard</span>
                                </Link>
                            ) : (
                                <Link
                                    className="flex min-h-10 items-center justify-between rounded-[1.2rem] border border-primary/15 bg-primary/5 px-4 py-4 font-headline text-base font-semibold text-primary transition-colors hover:bg-primary/10"
                                    onClick={() => setDrawerOpen(false)}
                                    to="/login"
                                >
                                    <span className="whitespace-nowrap">Sign In to Continue</span>
                                    <span className="material-symbols-outlined text-[18px]">login</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

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
                            Are you sure you want to sign out?
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
        </>
    );
}
