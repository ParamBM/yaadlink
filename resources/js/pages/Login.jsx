import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice';
import axios from 'axios';

export default function Login() {
    const [isVisible, setIsVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.auth);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(loginStart());
        try {
            const response = await axios.post('/api/auth/login', { email, password });
            if (response.data.success) {
                const { user, token } = response.data;
                sessionStorage.setItem('token', token);
                
                dispatch(loginSuccess({ user, token }));
                
                // Check role and navigate conditionally
                if (user.role === 'admin') {
                    navigate('/dashboard');
                } else {
                    navigate('/');
                }
            } else {
                dispatch(loginFailure('Login failed'));
            }
        } catch (err) {
            dispatch(loginFailure(err.response?.data?.error || 'Invalid credentials'));
        }
    };

    return (
        <div className="min-h-screen flex flex-col antialiased bg-background text-foreground overflow-hidden">
            {/* Main Content: Split Screen */}
            <main className="flex-grow flex flex-col md:flex-row h-screen">
                {/* Left Side: Imagery */}
                <div className={`hidden md:flex md:w-1/2 relative bg-surface-container-low items-center justify-center p-12 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                    <div className="absolute inset-0 bg-black/30 z-10"></div>
                    <div className="absolute inset-0 z-0 grid grid-cols-2 grid-rows-2 gap-1 p-2">
                        <img 
                            alt="Wedding celebration" 
                            className="w-full h-full object-cover rounded-tl-xl" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDPMfk2yDhpckOcfNusYc4jher0SY265tkiD5utGhClwGCiWhZq40rpAW00Cj0KGzjpNifDMTPgdTK206uYMshx5BhRwD1pboNQFvWLKihNf8YV5yvH_9bUbhhlQnk_IsFqk4v48s11EzUwC5ZjD5UukUyAvCUQk_eKh21De3Cn48qnUwjQXwUr3b4PEXStlSp4ZTlEkDEaJnD4X162ml9a7ShOv-0JsQfHt1g7dAGLvTvecMXzwXMvno9AhHztDAe0817Caz6QJgJ"
                        />
                        <img 
                            alt="Birthday party" 
                            className="w-full h-full object-cover rounded-tr-xl" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKT3Sswyz0IdssTNG3APoaC-R0-XLXPhbj6ObHz2Ar5ds5bGqZJzZnV3YLlKjt0sNQZLIKnek0P75Jm4csX5XNQsqru6ti1VhcY7nF7fFXWfe6g1ZD9YefNaX22V1xGaslMUhYkvVh5alVCW3QKZb3ZtILgtchabhrH85CmpRj2pogjeo7cgacKDIVMYi9ZG1eJLAAO3nzFm527AyqDy8iPkMdktzs9eNi46uZllDITixmpiW32XVjc3atLA59H2zUVX5kOBY17SBR"
                        />
                        <img 
                            alt="Anniversary dinner" 
                            className="w-full h-full object-cover rounded-bl-xl" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMHTLlQR0Tbpq_3USX9pFv9MJIEZVcpfgUsqgqlZw8sl1zbH_DCAV3vVHld4KNBBYpwsIQwEmqsWm8UKAqwEbFiYL9UA1UYelW9vKitCNbrL--qqQ4uNw269bxSEzozSAONZLsStQqmDXzaMiCOroUjtOGwnC2YreazowJnmmlJQjlJ1vGfWwsPRUTpjbBkpw66DSo7M1XMmRw5P197Q-wKHxpJKXAwvxPnsTEJJ1P9eq5d6AvUpJvI3BgEJUs4E_4HeMI0BLsno9O"
                        />
                        <img 
                            alt="Graduation" 
                            className="w-full h-full object-cover rounded-br-xl" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcoOb60eSQ1-e_CN59Vi8FtTJ650BXnM2zQPuhq3q4mB00ZAjhX8RCk7uFR4pvPMbKEt6Jts30fTllRvsCmn292lDQRYIGTO8ZxeNYXVb1WMem1QUk4Tr8WYv-rwIJrX-r2QDXLv0kYw31UCNjGRVFVOfOH2cqP29hwAapK9Y3t8ybgtlCN6IKI1Ovk6lLlndosy1aC-g_fccj-_C_6WSP8_idRMDXVgftA18L218X_voGu6f6UEgH9cZpKcNiLymHMHzsU2n25AJx"
                        />
                    </div>
                    <div className="relative z-20 max-w-lg text-center bg-black/20 p-8 rounded-2xl backdrop-blur-sm border border-white/10">
                        <h2 className="text-5xl font-extrabold text-white mb-6 drop-shadow-lg font-headline tracking-tight leading-tight">Preserve Your Timeless Moments.</h2>
                        <p className="text-lg text-white/90 font-body drop-shadow-md leading-relaxed">Join Amour &amp; Milestone to craft heirlooms that echo through eternity. From weddings to birthdays, celebrate every milestone.</p>
                    </div>
                </div>

                {/* Right Side: Auth Form */}
                <div className={`w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-24 bg-surface relative h-full overflow-y-auto transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                    <div className="w-full max-w-md bg-surface-container-lowest rounded-xl p-8 md:p-10 ambient-shadow relative z-10 border border-outline-variant/15">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-on-background font-headline tracking-tight mb-2">Welcome Back</h1>
                            <p className="text-on-surface-variant font-body text-sm leading-relaxed">Sign in to continue your story with Amour &amp; Milestone.</p>
                            {error && (
                                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm text-center">
                                    {error}
                                </div>
                            )}
                        </div>
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div>
                                <label className="block text-sm font-medium text-on-surface mb-1 font-label" htmlFor="email">Email Address</label>
                                <input 
                                    className="w-full bg-surface-container-high border-none rounded-[1rem] px-4 py-3 text-on-background font-body focus:ring-2 focus:ring-primary-accent/50 focus:bg-surface-container-lowest transition-colors" 
                                    id="email" 
                                    name="email" 
                                    placeholder="you@example.com" 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-on-surface mb-1 font-label flex justify-between" htmlFor="password">
                                    Password
                                    <Link className="text-primary-accent hover:text-red-700 text-xs transition-colors" to="/forgot-password">Forgot?</Link>
                                </label>
                                <input 
                                    className="w-full bg-surface-container-high border-none rounded-[1rem] px-4 py-3 text-on-background font-body focus:ring-2 focus:ring-primary-accent/50 focus:bg-surface-container-lowest transition-colors" 
                                    id="password" 
                                    name="password" 
                                    placeholder="••••••••" 
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button 
                                className="w-full bg-primary-accent text-white font-headline font-semibold py-3.5 px-6 rounded-full hover-bg-primary-accent transition-all active:scale-95 duration-200 shadow-md flex justify-center items-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed" 
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? 'Logging in...' : 'Log In'}
                                {!loading && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
                            </button>
                        </form>
                        
                        <div className="my-6 flex items-center gap-4">
                            <div className="h-px bg-outline-variant/30 flex-grow"></div>
                            <span className="text-on-surface-variant text-xs font-body uppercase tracking-wider">Or continue with</span>
                            <div className="h-px bg-outline-variant/30 flex-grow"></div>
                        </div>
                        
                        <button className="w-full bg-transparent border border-outline-variant/30 text-on-surface font-body font-medium py-3 px-6 rounded-full hover:bg-surface-container-low transition-colors flex justify-center items-center gap-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                            </svg>
                            Google
                        </button>
                        
                        <p className="text-center mt-8 text-sm text-on-surface-variant font-body">
                            Don't have an account? 
                            <Link className="text-primary-accent font-semibold hover:text-red-700 transition-colors underline decoration-primary-accent/20 underline-offset-4 ml-1" to="/register">Sign up now</Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
