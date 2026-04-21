import { Link, useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import axios from 'axios';
import { headerLinks, logoPath, siteName } from '@/lib/site';

export default function Header() {
    const { isAuthenticated, token } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            if (token) {
                await axios.post('/api/auth/logout', {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            dispatch(logout());
            navigate('/login');
        }
    };

    return (
        <header className="fixed inset-x-0 top-0 z-50">
            <nav className="bg-surface/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(183,16,42,0.05)]" aria-label="Primary">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 md:px-8">
                    <Link className="flex items-center" to="/" aria-label={siteName}>
                        <img className="h-11 w-auto object-contain" src={logoPath} alt={siteName} />
                    </Link>

                    <div className="hidden items-center gap-8 font-headline text-sm font-semibold tracking-tight md:flex">
                        {headerLinks.map((link) => (
                            <a
                                key={link.label}
                                className="text-on-surface-variant transition-colors duration-300 hover:text-primary"
                                href={link.href}
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {isAuthenticated ? (
                        <button
                            onClick={handleLogout}
                            className="cursor-pointer rounded-full bg-error/10 px-6 py-2.5 font-label font-medium text-error hover:bg-error hover:text-white transition-colors duration-200 inline-flex items-center justify-center gap-2 border border-error/20 hover:border-error"
                        >
                            Logout
                            <span className="material-symbols-outlined text-[18px]">logout</span>
                        </button>
                    ) : (
                        <Link
                            to="/login"
                            className="cursor-pointer rounded-full bg-gradient-to-r from-primary to-primary-container px-6 py-2.5 font-label font-medium text-on-primary shadow-[0_20px_40px_rgba(183,16,42,0.15)] transition-transform duration-200 hover:scale-[0.98] inline-flex items-center justify-center hover:text-on-primary"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </nav>
        </header>
    );
}
