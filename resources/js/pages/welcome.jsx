import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';

export default function Welcome() {
    const [isVisible, setIsVisible] = useState(false);

    // Using useEffect to handle component mount state for better UI (fade in on load)
    useEffect(() => {
        setIsVisible(true);
        // In the future this can also be used for API calls
    }, []);

    return (
        <>
            <Head title="Landing Page - The Modern Heirloom" />

            <div className="bg-surface text-on-surface antialiased min-h-screen flex flex-col">
                <Header />

                <main className="flex-grow">
                    {/* Hero Section */}
                    <section className="relative min-h-[921px] flex items-center justify-center overflow-hidden py-20">
                        {/* Background Elements */}
                        <div className="absolute inset-0 z-0">
                            <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-bl from-surface-container-low to-surface rounded-bl-[100px] opacity-70"></div>
                            <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-container/10 rounded-full blur-[80px]"></div>
                            <div className="absolute bottom-20 -right-20 w-[30rem] h-[30rem] bg-secondary-fixed/30 rounded-full blur-[100px]"></div>
                        </div>

                        <div className="container mx-auto px-6 relative z-10">
                            <div className="grid lg:grid-cols-2 gap-16 items-center">
                                <div className={`max-w-2xl transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                                    <span className="inline-block py-1.5 px-4 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label text-sm font-semibold mb-6 mt-8 md:mt-0">
                                        Celebrate Every Moment
                                    </span>
                                    <h1 className="font-headline text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-on-surface leading-[1.1] mb-6">
                                        Turn your story into something <span className="text-primary">beautiful.</span>
                                    </h1>
                                    <p className="font-body text-lg md:text-xl text-on-surface-variant leading-relaxed mb-10 max-w-xl">
                                        Create a stunning personal page for any moment that matters — in minutes, no design skills needed.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button className="cursor-pointer bg-gradient-to-r from-primary to-primary-container text-on-primary px-8 py-4 rounded-full font-label font-semibold text-lg hover:scale-[0.98] transition-transform duration-200 shadow-[0_20px_40px_rgba(183,16,42,0.15)] flex items-center justify-center gap-2">
                                            Create your page
                                            <span aria-hidden="true" className="material-symbols-outlined text-xl">arrow_forward</span>
                                        </button>
                                        <button className="cursor-pointer px-8 py-4 rounded-full font-label font-semibold text-primary border border-outline-variant/30 hover:bg-surface-container-low transition-colors duration-200 flex items-center justify-center gap-2">
                                            <span aria-hidden="true" className="material-symbols-outlined text-xl">play_circle</span>
                                            See Examples
                                        </button>
                                    </div>
                                </div>

                                <div className={`relative transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
                                    <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-[0_40px_80px_rgba(183,16,42,0.08)] bg-surface-container-lowest p-2 border border-surface-container-high/50 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                                        <img
                                            alt="Soft romantic couple holding hands outdoors in warm sunset light with gentle bokeh"
                                            className="w-full h-[600px] object-cover rounded-[2.5rem]"
                                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLn15Naca_6wP8xVsGTbmDthlQutXA3372H9V6_Utjo--w0DAe1_g_mxKEuczkRf9pwoBVfn1pW9Oo2AdEILblvvgYy1GZwoGEnRNVLWUury2OoDHhfhg7OfENzPHexmMa-X8AJjeUyjnhJErFQE_k1FPRugpGwThVXShlEfI7CSxSYbqVfmQT78w7FB3JOxq9Yjtdzep1AYo4HijbZ4KwlzswEZzipWOIjT-FMTcAWgmMxkzGrEzw02qEkuOtvxnVtzkAHoitCruu"
                                        />
                                    </div>

                                    {/* Floating Card */}
                                    <div className="absolute -bottom-8 -left-8 bg-surface-container-lowest p-6 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.05)] border border-surface-container-low z-20 transform rotate-3 flex items-center gap-4 max-w-xs backdrop-blur-md bg-white/90 hover:-translate-y-2 transition-transform duration-300">
                                        <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                                            <span aria-hidden="true" className="material-symbols-outlined">favorite</span>
                                        </div>
                                        <div>
                                            <p className="font-headline font-bold text-on-surface">"Absolutely perfect!"</p>
                                            <p className="font-body text-sm text-on-surface-variant">Emma &amp; James, Wedding Page</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Features Bento Grid */}
                    <section className="py-24 bg-surface-container-low">
                        <div className="container mx-auto px-6">
                            <div className="text-center max-w-2xl mx-auto mb-16">
                                <h2 className="font-headline text-4xl md:text-5xl font-bold tracking-tight text-on-surface mb-4">Crafted for your memories</h2>
                                <p className="font-body text-lg text-on-surface-variant">Everything you need to share your joy, elegantly designed.</p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-8">
                                {/* Feature 1 */}
                                <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.02)] hover:scale-[1.02] transition-transform duration-300">
                                    <div className="w-14 h-14 rounded-full bg-secondary-fixed/50 flex items-center justify-center mb-6 text-primary">
                                        <span aria-hidden="true" className="material-symbols-outlined text-3xl">auto_awesome</span>
                                    </div>
                                    <h3 className="font-headline text-2xl font-bold text-on-surface mb-3">AI-Crafted Stories</h3>
                                    <p className="font-body text-on-surface-variant leading-relaxed">Let our intelligent writing assistant help you articulate the perfect sentiment for your special occasion.</p>
                                </div>

                                {/* Feature 2 */}
                                <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.02)] hover:scale-[1.02] transition-transform duration-300">
                                    <div className="w-14 h-14 rounded-full bg-secondary-fixed/50 flex items-center justify-center mb-6 text-primary">
                                        <span aria-hidden="true" className="material-symbols-outlined text-3xl">palette</span>
                                    </div>
                                    <h3 className="font-headline text-2xl font-bold text-on-surface mb-3">Stunning Templates</h3>
                                    <p className="font-body text-on-surface-variant leading-relaxed">Choose from dozens of premium, hand-crafted layouts designed to showcase your photos beautifully.</p>
                                </div>

                                {/* Feature 3 */}
                                <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.02)] hover:scale-[1.02] transition-transform duration-300">
                                    <div className="w-14 h-14 rounded-full bg-secondary-fixed/50 flex items-center justify-center mb-6 text-primary">
                                        <span aria-hidden="true" className="material-symbols-outlined text-3xl">send</span>
                                    </div>
                                    <h3 className="font-headline text-2xl font-bold text-on-surface mb-3">One-Tap Sharing</h3>
                                    <p className="font-body text-on-surface-variant leading-relaxed">Instantly generate beautiful digital invitations and share your unique link via text, email, or social.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Social Proof */}
                    <section className="py-24 bg-surface relative overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-container/5 rounded-full blur-[120px] z-0"></div>
                        <div className="container mx-auto px-6 relative z-10">
                            <div className="text-center mb-16">
                                <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface mb-4">Loved by celebrants</h2>
                            </div>
                            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                                {/* Testimonial 1 */}
                                <div className="bg-surface-container-lowest p-10 rounded-[2rem] shadow-[0_30px_60px_rgba(183,16,42,0.03)] border border-outline-variant/10">
                                    <div className="flex gap-1 text-primary mb-6">
                                        <span aria-hidden="true" className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                        <span aria-hidden="true" className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                        <span aria-hidden="true" className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                        <span aria-hidden="true" className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                        <span aria-hidden="true" className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                    </div>
                                    <p className="font-body text-lg text-on-surface-variant mb-8 italic">"We built our wedding website in literally 15 minutes. The templates are so elegant, and it felt like a premium experience from start to finish."</p>
                                    <div className="flex items-center gap-4">
                                        <img alt="Sarah Jenkins" className="w-12 h-12 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjeabPMJdYLvms9x3v4stzY0lAMCA7WqRDG__281F4UKh2d7fx5gT1ihbbH793lYc6zsGkwzj9D4tkCYoLXf-qDnebqEt1ucw62nzRWX0A7s5Gl4lBupwqWSgjVyAVjDcK-Rcdf4uLLetF1lXbG4CYZk_K6xkl562hNVVIgxS69EDQbN-ANsncRMSGezUpwaAZbajMv3W7v03JBcys7SY9xfG3EWqrARyn4ctKMWoL_ixjTbstVls3_8NupVC-6ucj5cfi139HrGKD" />
                                        <div>
                                            <p className="font-headline font-bold text-on-surface">Sarah Jenkins</p>
                                            <p className="font-body text-sm text-on-surface-variant">Bride-to-be</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Testimonial 2 */}
                                <div className="bg-surface-container-lowest p-10 rounded-[2rem] shadow-[0_30px_60px_rgba(183,16,42,0.03)] border border-outline-variant/10">
                                    <div className="flex gap-1 text-primary mb-6">
                                        <span aria-hidden="true" className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                        <span aria-hidden="true" className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                        <span aria-hidden="true" className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                        <span aria-hidden="true" className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                        <span aria-hidden="true" className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                    </div>
                                    <p className="font-body text-lg text-on-surface-variant mb-8 italic">"I used this for my parent's 50th anniversary. Everyone thought I hired a designer. The digital RSVP system saved us so much headache!"</p>
                                    <div className="flex items-center gap-4">
                                        <img alt="Michael Chen" className="w-12 h-12 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrINNIqyvSFgARTx4RK62YqarfnKb6f1ZydTldR7P2pYzYAZkQ-w1bAmGmrVyAvfS09WvXaQcs_UiaI2CHtgliRCEMC4pSJrVWq8dofoKxcip9Zad_b0kpwQaP2Nu4Fnb_BUg892X_gZYO7Mbvv8SJh0Be7YKqmOm9H9ZDjWbf3zNH8RmHtnsfY9iO81yKgS6-i1go3UHA10Dbxgp2w4nnYgpDjKGXS_tny3DUavkC9VzB-cJm5D5qxusMox0zn8IbneESyrmQ9nHZ" />
                                        <div>
                                            <p className="font-headline font-bold text-on-surface">Michael Chen</p>
                                            <p className="font-body text-sm text-on-surface-variant">Event Organizer</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Pricing */}
                    <section className="py-24 bg-surface-container-low">
                        <div className="container mx-auto px-6">
                            <div className="text-center mb-16">
                                <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface mb-4">Simple, transparent pricing</h2>
                                <p className="font-body text-lg text-on-surface-variant">Start for free, upgrade when you need more magic.</p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                                {/* Free Tier */}
                                <div className="bg-surface-container-lowest rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                                    <h3 className="font-headline text-2xl font-bold text-on-surface mb-2">Essential</h3>
                                    <p className="font-body text-on-surface-variant mb-6">Perfect for simple gatherings.</p>
                                    <div className="mb-8">
                                        <span className="font-headline text-5xl font-bold text-on-surface">Free</span>
                                    </div>
                                    <ul className="space-y-4 mb-10 font-body text-on-surface-variant">
                                        <li className="flex items-center gap-3">
                                            <span aria-hidden="true" className="material-symbols-outlined text-primary">check_circle</span>
                                            3 Premium Templates
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <span aria-hidden="true" className="material-symbols-outlined text-primary">check_circle</span>
                                            Digital RSVP Collection
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <span aria-hidden="true" className="material-symbols-outlined text-primary">check_circle</span>
                                            Standard Support
                                        </li>
                                    </ul>
                                    <button className="cursor-pointer w-full px-8 py-4 rounded-full font-label font-semibold text-primary border border-outline-variant/30 hover:bg-surface-container-low transition-colors duration-200">
                                        Start Free
                                    </button>
                                </div>

                                {/* Premium Tier */}
                                <div className="bg-surface-container-lowest rounded-[2.5rem] p-10 shadow-[0_30px_60px_rgba(183,16,42,0.08)] border-2 border-primary/10 relative">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-secondary-fixed text-on-secondary-fixed px-4 py-1 rounded-full font-label text-xs font-bold uppercase tracking-wider">
                                        Most Popular
                                    </div>
                                    <h3 className="font-headline text-2xl font-bold text-on-surface mb-2">Heirloom</h3>
                                    <p className="font-body text-on-surface-variant mb-6">For life's biggest milestones.</p>
                                    <div className="mb-8">
                                        <span className="font-headline text-5xl font-bold text-on-surface">$49</span>
                                        <span className="text-on-surface-variant">/event</span>
                                    </div>
                                    <ul className="space-y-4 mb-10 font-body text-on-surface-variant">
                                        <li className="flex items-center gap-3">
                                            <span aria-hidden="true" className="material-symbols-outlined text-primary">check_circle</span>
                                            All Premium Templates
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <span aria-hidden="true" className="material-symbols-outlined text-primary">check_circle</span>
                                            AI Story Assistant
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <span aria-hidden="true" className="material-symbols-outlined text-primary">check_circle</span>
                                            Custom Domain Integration
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <span aria-hidden="true" className="material-symbols-outlined text-primary">check_circle</span>
                                            Priority Support
                                        </li>
                                    </ul>
                                    <button className="cursor-pointer w-full bg-gradient-to-r from-primary to-primary-container text-on-primary px-8 py-4 rounded-full font-label font-semibold hover:scale-[0.98] transition-transform duration-200 shadow-lg">
                                        Get Premium
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <Footer />
            </div>
        </>
    );
}
