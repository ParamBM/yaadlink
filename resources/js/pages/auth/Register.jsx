import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../../store/slices/authSlice';
import { logoPath, siteName } from '../../lib/site';

export default function Register() {
    const [isVisible, setIsVisible] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone_number: '',
        password: '',
        password_confirmation: ''
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [isRedirecting, setIsRedirecting] = useState(false);
    
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.auth);
    const [validationError, setValidationError] = useState('');
    const isPublishRegister = new URLSearchParams(location.search).get('publish') === '1';

    const clearPublishRedirectState = () => {
        localStorage.removeItem('onboarding_publish_after_login');
        sessionStorage.removeItem('auth_flow_context');
        sessionStorage.removeItem('onboarding_publish_after_login');
        sessionStorage.removeItem('oauth_redirect_to');
    };

    useEffect(() => {
        setIsVisible(true);

        if (!isPublishRegister) {
            clearPublishRedirectState();
        }
    }, [isPublishRegister]);

    const getPostRegisterRedirect = (user) => {
        const hasPublishPending =
            isPublishRegister &&
            (
                localStorage.getItem('onboarding_publish_after_login') === '1' ||
                sessionStorage.getItem('onboarding_publish_after_login') === '1' ||
                sessionStorage.getItem('auth_flow_context') === 'story_publish'
            );

        if (hasPublishPending) {
            sessionStorage.removeItem('oauth_redirect_to');
            return '/onboarding/story';
        }

        const redirectTo = sessionStorage.getItem('oauth_redirect_to');
        if (redirectTo) {
            sessionStorage.removeItem('oauth_redirect_to');
            return redirectTo;
        }

        if (user?.role === 'admin') {
            return '/dashboard';
        }

        return '/dashboard';
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidationError('');
        setSuccessMessage('');
        setIsRedirecting(false);
        
        if (formData.password !== formData.password_confirmation) {
            setValidationError("Passwords do not match");
            return;
        }

        try {
            const result = await dispatch(registerUser(formData)).unwrap();
            const user = result?.user;
            setSuccessMessage('Account created successfully.');
            setIsRedirecting(true);

            setTimeout(() => {
                navigate(getPostRegisterRedirect(user));
            }, 900);
        } catch (err) {
            setIsRedirecting(false);
            setValidationError(typeof err === 'string' ? err : 'Failed to register');
        }
    };

    return (
        <div className="bg-surface text-on-surface h-screen overflow-hidden selection:bg-primary-fixed">
            <main className="grid grid-cols-1 md:grid-cols-12 h-full overflow-hidden">
                {/* Left: Lifestyle Collage */}
                <section className={`hidden md:flex md:col-span-6 lg:col-span-6 bg-surface-container-low relative items-center justify-center px-8 py-8 lg:px-10 lg:py-8 overflow-hidden h-full transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                    <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]"></div>
                    <div className="relative w-full max-w-[600px] grid grid-cols-12 gap-3 items-start scale-[0.84] lg:scale-[0.9] origin-center">
                        <div className="col-span-8 col-start-1 row-start-1 z-10">
                            <div className="rounded-lg overflow-hidden shadow-[0_40px_80px_rgba(183,16,42,0.12)] transform -rotate-2">
                                <img className="w-full h-[270px] lg:h-[310px] object-cover" alt="Elegant outdoor wedding reception" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8sgjt_ZC00g1_P5qlLstlXvlRp3v6sCjInCFekQaNUBpvmsHhbKceVW-p1jVsNceVGU3NBlSiTo9WWUAXbuM_JnC3u7Tkm4j4aQVhhmRpenGn1hB9GCX3D8cwfbWiPP4F2BUpFGvYW4CM-HjHVrvCkoQHkZekjd9NqSQm1t12n5xNIj1jQvuEggqrxHXymcPPe0eeqUu5DjfLcowF9JSSf4y4hYeHmb6eo74w1XxX2-R2tOkGg9_WrUp6BUuv6hSo_WUKdjbBTzXV"/>
                            </div>
                        </div>
                        <div className="col-span-4 col-start-8 row-start-1 mt-16 z-20">
                            <div className="rounded-lg overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.1)] transform rotate-3 border-[8px] border-surface-container-lowest">
                                <img className="w-full h-[205px] lg:h-[235px] object-cover" alt="Close-up of anniversary cake" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRK7_99JSxV8VaOkjfXbHfwMZKrNaiBKVeIbVNQOyNzg2nV5uH9E_y-HnI0Y0bqCZCFxorC888ZNDqvxCaXGwP4vIAcUY90WNPKpU5UaJcdFdJKz2YNxMZ2uoQ_XI8ycunk9BYjJXnDJyRxwvGU1oTFjhCQsK_MOs03xc3bNhR3zBPQVvVO2S3WvJl6Pu5uKUGW8BbjfqoIYuQnsWSO_WyVW49vrD3nncmnNVzPW2v8UX-GDgP1m73nQO7wH9rLEpdQ5-Cw1MAF_ey"/>
                            </div>
                        </div>
                        <div className="col-span-4 col-start-2 row-start-2 -mt-10 z-30">
                            <div className="rounded-lg overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.08)] transform -rotate-6 border-[6px] border-surface-container-lowest">
                                <img className="w-full h-[165px] lg:h-[195px] object-cover" alt="Multi-generational family gathered" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjfVcdnSyTIBM4xVo4N0DQo_k3fvxjbtW4KJO5SkyVHcy5VNzSIiWhipZUyk2TnmRzI5u2PLekRjWZnSSx6mCgIZ1dWRifGhVHIsX61ZP6ozjTJ_aRGgd0BPRreonepxXDyu-Ai5kKDme34podLuo94PM9GUg0SSv5HY8OYHBLUqf6TGfRrFBecfxrElYzEyRPHmdAKzZAjJJmzdCpNSdMp8t-gcv-gck60bp5_gTyiP7shvBCYH62J_k54TdXVOVF9A_GbkS12fwi"/>
                            </div>
                        </div>
                        <div className="absolute bottom-3 right-3 p-4 opacity-20">
                            <img className="h-10 w-auto object-contain" src={logoPath} alt={siteName} />
                        </div>
                    </div>
                </section>

                {/* Right: Focused Signup Form */}
                <section className={`col-span-1 md:col-span-6 lg:col-span-6 flex flex-col items-center justify-center p-5 md:p-6 lg:p-8 bg-surface-container-lowest h-full overflow-hidden transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                    <div className="w-full max-w-md space-y-4">
                        {/* Brand Identity */}
                        <div className="flex flex-col items-center text-center space-y-1">
                            <img className="h-10 w-auto object-contain mb-2" src={logoPath} alt={siteName} />
                            <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight leading-tight">Create your eternity.</h1>
                            <p className="text-on-surface-variant text-sm">Preserve the moments that matter most with those you love.</p>

                            {successMessage && (
                                <div className="mt-2 w-full p-2 bg-green-100 border border-green-400 text-green-700 rounded text-xs text-center">
                                    {successMessage}
                                </div>
                            )}
                            
                            {(error || validationError) && (
                                <div className="mt-2 w-full p-2 bg-red-100 border border-red-400 text-red-700 rounded text-xs text-center">
                                    {validationError || error}
                                </div>
                            )}
                        </div>

                        {/* Social Auth */}
                        <div className="space-y-3">
                            <a
                                href="/auth/google/redirect"
                                className="w-full bg-transparent border border-outline-variant/30 text-on-surface font-body font-medium py-2.5 px-6 rounded-full hover:bg-surface-container-low transition-colors flex justify-center items-center gap-3"
                                onClick={() => {
                                    if (sessionStorage.getItem('auth_flow_context') === 'story_publish') {
                                        sessionStorage.setItem('oauth_redirect_to', '/onboarding/story');
                                    }
                                }}
                            >
                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                                Continue with Google
                            </a>
                            <div className="relative flex items-center py-1">
                                <div className="flex-grow border-t border-outline-variant/30"></div>
                                <span className="flex-shrink mx-4 text-on-surface-variant text-xs font-medium uppercase tracking-wider">or join with email</span>
                                <div className="flex-grow border-t border-outline-variant/30"></div>
                            </div>
                        </div>

                        {/* Signup Form */}
                        <form className="space-y-3" onSubmit={handleSubmit}>
                            <div className="space-y-2.5">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="group">
                                        <label className="block text-xs font-semibold text-on-surface-variant mb-1 ml-1" htmlFor="name">Full Name *</label>
                                        <input 
                                            className="w-full px-4 py-2.5 rounded-lg bg-surface-container-high border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all text-on-surface placeholder:text-on-surface-variant/50 text-sm" 
                                            id="name" 
                                            placeholder="Johnathan Doe" 
                                            type="text"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required 
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="block text-xs font-semibold text-on-surface-variant mb-1 ml-1" htmlFor="phone_number">Phone Number</label>
                                        <input 
                                            className="w-full px-4 py-2.5 rounded-lg bg-surface-container-high border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all text-on-surface placeholder:text-on-surface-variant/50 text-sm" 
                                            id="phone_number" 
                                            placeholder="+1 (555) 000-0000" 
                                            type="tel"
                                            value={formData.phone_number}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="block text-xs font-semibold text-on-surface-variant mb-1 ml-1" htmlFor="email">Email Address *</label>
                                    <input 
                                        className="w-full px-4 py-2.5 rounded-lg bg-surface-container-high border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all text-on-surface placeholder:text-on-surface-variant/50 text-sm" 
                                        id="email" 
                                        placeholder="hello@example.com" 
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required 
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="group">
                                        <label className="block text-xs font-semibold text-on-surface-variant mb-1 ml-1" htmlFor="password">Password *</label>
                                        <input 
                                            className="w-full px-4 py-2.5 rounded-lg bg-surface-container-high border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all text-on-surface placeholder:text-on-surface-variant/50 text-sm" 
                                            id="password" 
                                            placeholder="••••••••" 
                                            type="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required 
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="block text-xs font-semibold text-on-surface-variant mb-1 ml-1" htmlFor="password_confirmation">Confirm Password *</label>
                                        <input 
                                            className="w-full px-4 py-2.5 rounded-lg bg-surface-container-high border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all text-on-surface placeholder:text-on-surface-variant/50 text-sm" 
                                            id="password_confirmation" 
                                            placeholder="••••••••" 
                                            type="password"
                                            value={formData.password_confirmation}
                                            onChange={handleChange}
                                            required 
                                        />
                                    </div>
                                </div>
                            </div>
                            <button 
                                className="w-full py-3 mt-1 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-base shadow-[0_10px_30px_rgba(183,16,42,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100" 
                                type="submit"
                                disabled={loading || isRedirecting}
                            >
                                {isRedirecting ? 'Logging in...' : loading ? 'Creating Account...' : 'Sign up & Start Creating'}
                            </button>
                        </form>

                        {/* Terms & Footer */}
                        <div className="pt-1 text-center space-y-3">
                            <p className="text-on-surface-variant text-xs px-4">
                                By signing up, you agree to our <a className="text-primary font-semibold hover:underline decoration-2 underline-offset-4" href="#">Terms of Service</a> and <a className="text-primary font-semibold hover:underline decoration-2 underline-offset-4" href="#">Privacy Policy</a>.
                            </p>
                            <div className="pt-3 border-t border-outline-variant/20">
                                <p className="text-on-surface text-sm">
                                    Already have an account? 
                                    <Link className="text-primary font-bold ml-1 hover:underline decoration-2 underline-offset-4 transition-all" to="/login">Log in</Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
