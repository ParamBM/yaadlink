import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';

export default function LoginPublishModal({ isOpen, onClose, onSuccess, draftState }) {
    const dispatch = useDispatch();
    const { loading, error } = useSelector((state) => state.auth);

    const [isVisible, setIsVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setIsVisible(false);
            return;
        }

        const frame = window.requestAnimationFrame(() => setIsVisible(true));
        return () => window.cancelAnimationFrame(frame);
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleSubmit = async (event) => {
        event.preventDefault();

        const result = await dispatch(loginUser({ email, password }));
        if (loginUser.fulfilled.match(result)) {
            setPassword('');
            await onSuccess?.(result.payload.user);
        }
    };

    const handleGoogleContinue = () => {
        sessionStorage.setItem('oauth_redirect_to', '/onboarding/story');
        sessionStorage.setItem('onboarding_publish_after_login', '1');

        if (draftState) {
            sessionStorage.setItem('onboarding_story_draft', JSON.stringify(draftState));
        }

        window.location.href = '/auth/google/redirect';
    };

    return (
        <div className={`fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 z-0 select-none pointer-events-none">
                <div className={`w-full h-full flex flex-col items-center pt-24 px-8 opacity-40 blur-sm scale-105 transform origin-top transition-all duration-500 ${isVisible ? 'translate-y-0' : 'translate-y-4'}`}>
                    <div className="w-full max-w-4xl mx-auto space-y-12">
                        <div className="flex items-center justify-between border-b border-surface-variant pb-8">
                            <h1 className="text-4xl font-bold font-headline tracking-tight">Review &amp; Publish</h1>
                            <div className="flex gap-4">
                                <div className="h-10 w-24 bg-surface-container-high rounded-full"></div>
                                <div className="h-10 w-32 bg-primary rounded-full"></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="col-span-2 space-y-6">
                                <div className="h-64 bg-surface-container rounded-lg w-full"></div>
                                <div className="space-y-4">
                                    <div className="h-4 bg-surface-container-high w-3/4 rounded-full"></div>
                                    <div className="h-4 bg-surface-container-high w-full rounded-full"></div>
                                    <div className="h-4 bg-surface-container-high w-5/6 rounded-full"></div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="h-48 bg-surface-container rounded-lg w-full"></div>
                                <div className="h-32 bg-surface-container rounded-lg w-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute inset-0 bg-surface/50 backdrop-blur-md" />
            </div>

            <div className="absolute inset-0 bg-surface/40" onClick={onClose} />

            <div className={`w-full max-w-md relative z-10 transition-all duration-300 ${isVisible ? 'translate-y-0 scale-100' : 'translate-y-6 scale-95'}`}>
                <div className="absolute -inset-4 bg-primary/10 rounded-[3rem] blur-3xl -z-10"></div>
                <div className="bg-surface-container-lowest/70 backdrop-blur-xl rounded-[2rem] p-8 sm:p-10 shadow-[0_40px_80px_rgba(183,16,42,0.08)] flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-primary-fixed to-transparent opacity-30 blur-2xl rounded-br-full -z-10"></div>

                    <button
                        aria-label="Close"
                        className="absolute top-6 right-6 text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-low"
                        onClick={onClose}
                        type="button"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>

                    <div className="text-center mb-8 mt-2">
                        <h2 className="text-[28px] leading-tight font-bold font-headline text-primary tracking-tight mb-2">One last step.</h2>
                        <p className="text-sm text-on-surface-variant font-body">Log in to save and publish your beautiful page.</p>
                    </div>

                    {error && (
                        <div className="mb-5 rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container">
                            {error}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-on-surface ml-1" htmlFor="publish-login-email">Email address</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-4 flex items-center text-on-surface-variant pointer-events-none">
                                    <span className="material-symbols-outlined text-[18px]">mail</span>
                                </span>
                                <input
                                    className="w-full pl-11 pr-4 py-3.5 bg-surface-container-high/50 border-0 rounded-[1rem] text-on-surface placeholder:text-on-surface-variant/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                                    id="publish-login-email"
                                    placeholder="you@example.com"
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between ml-1">
                                <label className="block text-sm font-medium text-on-surface" htmlFor="publish-login-password">Password</label>
                                <Link className="text-xs text-primary hover:text-secondary transition-colors font-medium" to="/login">
                                    Forgot?
                                </Link>
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-4 flex items-center text-on-surface-variant pointer-events-none">
                                    <span className="material-symbols-outlined text-[18px]">lock</span>
                                </span>
                                <input
                                    className="w-full pl-11 pr-10 py-3.5 bg-surface-container-high/50 border-0 rounded-[1rem] text-on-surface placeholder:text-on-surface-variant/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                                    id="publish-login-password"
                                    placeholder="••••••••"
                                    required
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                />
                                <button
                                    className="absolute inset-y-0 right-4 flex items-center text-on-surface-variant hover:text-on-surface transition-colors"
                                    type="button"
                                    onClick={() => setShowPassword((current) => !current)}
                                >
                                    <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                </button>
                            </div>
                        </div>

                        <button
                            className="w-full mt-2 bg-gradient-to-r from-primary to-primary-container text-on-primary font-semibold py-4 rounded-full shadow-[0_8px_20px_rgba(183,16,42,0.15)] hover:shadow-[0_8px_25px_rgba(183,16,42,0.25)] hover:from-secondary hover:to-primary transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-[0.99] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                            type="submit"
                            disabled={loading}
                        >
                            <span>{loading ? 'Logging in...' : 'Log in & Publish'}</span>
                            {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-outline-variant/30"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-surface-container-lowest text-on-surface-variant text-xs font-medium uppercase tracking-widest">or</span>
                        </div>
                    </div>

                    <button
                        className="w-full flex items-center justify-center gap-3 bg-surface-container-lowest text-on-surface font-medium py-3.5 rounded-full border border-outline-variant/15 hover:bg-surface-container-low hover:border-outline-variant/30 transition-all duration-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                        type="button"
                        onClick={handleGoogleContinue}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                        </svg>
                        Continue with Google
                    </button>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-on-surface-variant">
                            Don't have an account?
                            <Link className="text-primary font-semibold hover:text-secondary transition-colors underline-offset-2 hover:underline ml-1" to="/register">
                                Sign up now
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
