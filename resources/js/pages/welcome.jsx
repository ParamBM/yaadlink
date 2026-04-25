import { useState, useEffect } from 'react';
import { Link } from 'react-router';

export default function Welcome() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <>
            <section id="showcase" className="relative flex min-h-[921px] items-center justify-center overflow-hidden py-20">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 h-full w-2/3 rounded-bl-[100px] bg-gradient-to-bl from-surface-container-low to-surface opacity-70" />
                    <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary-container/10 blur-[80px]" />
                    <div className="absolute right-[-5rem] bottom-20 h-[30rem] w-[30rem] rounded-full bg-secondary-fixed/30 blur-[100px]" />
                </div>

                <div className="container relative z-10 mx-auto px-6">
                    <div className="grid items-center gap-16 lg:grid-cols-2">
                        <div className={`mx-auto max-w-2xl text-center transition-all duration-1000 md:mx-0 md:text-left ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                            <span className="mt-8 mb-6 inline-block rounded-full bg-secondary-fixed px-4 py-1.5 font-label text-sm font-semibold text-on-secondary-fixed md:mt-0">
                                Celebrate Every Moment
                            </span>
                            <h1 className="mb-6 font-headline text-5xl font-extrabold leading-[1.1] tracking-tighter text-on-surface md:text-6xl lg:text-7xl">
                                Turn your story into something <span className="text-primary">beautiful.</span>
                            </h1>
                            <p className="mx-auto mb-10 max-w-xl font-body text-lg leading-relaxed text-on-surface-variant md:mx-0 md:text-xl">
                                Create a stunning personal page for any moment that matters - in minutes, no design skills needed.
                            </p>
                            <div className="flex flex-col gap-4 sm:flex-row">
                                <Link
                                    to="/onboarding"
                                    className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-container px-8 py-4 font-label text-lg font-semibold text-on-primary shadow-[0_20px_40px_rgba(183,16,42,0.15)] transition-transform duration-200 hover:scale-[0.98]"
                                >
                                    Create your page
                                    <span aria-hidden="true" className="material-symbols-outlined text-xl">arrow_forward</span>
                                </Link>
                                <button
                                    type="button"
                                    className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-outline-variant/30 px-8 py-4 font-label text-primary font-semibold transition-colors duration-200 hover:bg-surface-container-low"
                                >
                                    <span aria-hidden="true" className="material-symbols-outlined text-xl">play_circle</span>
                                    See Examples
                                </button>
                            </div>
                        </div>

                        <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
                            <div className="relative z-10 rotate-[-2deg] overflow-hidden rounded-[3rem] border border-surface-container-high/50 bg-surface-container-lowest p-2 shadow-[0_40px_80px_rgba(183,16,42,0.08)] transition-transform duration-500 hover:rotate-0">
                                <img
                                    alt="Premium Indian wedding microsite template mockup"
                                    className="h-[600px] w-full rounded-[2.5rem] object-cover"
                                    src="/images/hero-indian-wedding.png"
                                />
                            </div>

                            <div className="absolute -bottom-8 -left-8 z-20 flex max-w-xs rotate-3 items-center gap-4 rounded-3xl border border-surface-container-low bg-white/90 p-6 shadow-[0_30px_60px_rgba(0,0,0,0.05)] backdrop-blur-md transition-transform duration-300 hover:-translate-y-2">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-fixed text-on-secondary-fixed">
                                    <span aria-hidden="true" className="material-symbols-outlined">favorite</span>
                                </div>
                                <div>
                                    <p className="font-headline font-bold text-on-surface">"Absolutely perfect!"</p>
                                    <p className="font-body text-sm text-on-surface-variant">Arjun &amp; Anjali, Wedding Page</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="more-templates" className="bg-surface py-20">
                <div className="container mx-auto px-6">
                    <div className="grid gap-12 sm:gap-16 lg:grid-cols-3">
                        {/* Special Moment Frame */}
                        <div className="relative group">
                            <div className="relative z-10 rotate-[-1deg] overflow-hidden rounded-[2.5rem] border border-surface-container-high/40 bg-surface-container-lowest p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-all duration-500 group-hover:rotate-0 group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)]">
                                <img
                                    alt="Special Moment template mockup"
                                    className="h-[400px] w-full rounded-[2rem] object-cover"
                                    src="/images/hero-special-moment.png"
                                />
                            </div>
                            <div className="absolute -bottom-6 -right-4 z-20 flex max-w-[240px] rotate-2 items-center gap-3 rounded-2xl border border-surface-container-low bg-white/90 p-4 shadow-xl backdrop-blur-md transition-transform duration-300 group-hover:-translate-y-2">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary">
                                    <span aria-hidden="true" className="material-symbols-outlined text-xl">auto_awesome</span>
                                </div>
                                <div>
                                    <p className="font-headline text-sm font-bold text-on-surface">"Simply beautiful!"</p>
                                    <p className="font-body text-xs text-on-surface-variant">Aarav, Special Moment</p>
                                </div>
                            </div>
                        </div>

                        {/* Birthday Frame */}
                        <div className="relative group lg:mt-8">
                            <div className="relative z-10 rotate-[1deg] overflow-hidden rounded-[2.5rem] border border-surface-container-high/40 bg-surface-container-lowest p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-all duration-500 group-hover:rotate-0 group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)]">
                                <img
                                    alt="Birthday template mockup"
                                    className="h-[400px] w-full rounded-[2rem] object-cover"
                                    src="/images/hero-birthday.png"
                                />
                            </div>
                            <div className="absolute -bottom-6 -left-4 z-20 flex max-w-[240px] -rotate-2 items-center gap-3 rounded-2xl border border-surface-container-low bg-white/90 p-4 shadow-xl backdrop-blur-md transition-transform duration-300 group-hover:-translate-y-2">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-fixed text-on-secondary-fixed">
                                    <span aria-hidden="true" className="material-symbols-outlined text-xl">cake</span>
                                </div>
                                <div>
                                    <p className="font-headline text-sm font-bold text-on-surface">"Loved the vibes!"</p>
                                    <p className="font-body text-xs text-on-surface-variant">Ishan, 1st Birthday</p>
                                </div>
                            </div>
                        </div>

                        {/* Anniversary Frame */}
                        <div className="relative group">
                            <div className="relative z-10 rotate-[-1deg] overflow-hidden rounded-[2.5rem] border border-surface-container-high/40 bg-surface-container-lowest p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-all duration-500 group-hover:rotate-0 group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)]">
                                <img
                                    alt="Anniversary template mockup"
                                    className="h-[400px] w-full rounded-[2rem] object-cover"
                                    src="/images/hero-anniversary.png"
                                />
                            </div>
                            <div className="absolute -bottom-6 -right-4 z-20 flex max-w-[240px] rotate-2 items-center gap-3 rounded-2xl border border-surface-container-low bg-white/90 p-4 shadow-xl backdrop-blur-md transition-transform duration-300 group-hover:-translate-y-2">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tertiary-container text-tertiary">
                                    <span aria-hidden="true" className="material-symbols-outlined text-xl">favorite</span>
                                </div>
                                <div>
                                    <p className="font-headline text-sm font-bold text-on-surface">"A timeless gift!"</p>
                                    <p className="font-body text-xs text-on-surface-variant">Vikram &amp; Meera</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="features" className="bg-surface-container-low py-24">
                <div className="container mx-auto px-6">
                    <div className="mx-auto mb-16 max-w-2xl text-center">
                        <h2 className="mb-4 font-headline text-4xl font-bold tracking-tight text-on-surface md:text-5xl">Crafted for your memories</h2>
                        <p className="font-body text-lg text-on-surface-variant">Everything you need to share your joy, elegantly designed.</p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        <div className="flex flex-col items-center text-center md:items-start md:text-left rounded-[2rem] bg-surface-container-lowest p-8 shadow-[0_20px_50px_rgba(0,0,0,0.02)] transition-transform duration-300 hover:scale-[1.02]">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-fixed/50 text-primary">
                                <span aria-hidden="true" className="material-symbols-outlined text-3xl">auto_awesome</span>
                            </div>
                            <h3 className="mb-3 font-headline text-2xl font-bold text-on-surface">AI-Crafted Stories</h3>
                            <p className="font-body leading-relaxed text-on-surface-variant">Let our intelligent writing assistant help you articulate the perfect sentiment for your special occasion.</p>
                        </div>

                        <div className="flex flex-col items-center text-center md:items-start md:text-left rounded-[2rem] bg-surface-container-lowest p-8 shadow-[0_20px_50px_rgba(0,0,0,0.02)] transition-transform duration-300 hover:scale-[1.02]">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-fixed/50 text-primary">
                                <span aria-hidden="true" className="material-symbols-outlined text-3xl">palette</span>
                            </div>
                            <h3 className="mb-3 font-headline text-2xl font-bold text-on-surface">Stunning Templates</h3>
                            <p className="font-body leading-relaxed text-on-surface-variant">Choose from dozens of premium, hand-crafted layouts designed to showcase your photos beautifully.</p>
                        </div>

                        <div className="flex flex-col items-center text-center md:items-start md:text-left rounded-[2rem] bg-surface-container-lowest p-8 shadow-[0_20px_50px_rgba(0,0,0,0.02)] transition-transform duration-300 hover:scale-[1.02]">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-fixed/50 text-primary">
                                <span aria-hidden="true" className="material-symbols-outlined text-3xl">send</span>
                            </div>
                            <h3 className="mb-3 font-headline text-2xl font-bold text-on-surface">One-Tap Sharing</h3>
                            <p className="font-body leading-relaxed text-on-surface-variant">Instantly generate beautiful digital invitations and share your unique link via text, email, or social.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="testimonials" className="relative overflow-hidden bg-surface py-24">
                <div className="absolute top-1/2 left-1/2 z-0 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-container/5 blur-[120px]" />
                <div className="container relative z-10 mx-auto px-6">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 font-headline text-4xl font-bold tracking-tight text-on-surface">Loved by celebrants</h2>
                    </div>
                    <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
                        <div className="rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-10 shadow-[0_30px_60px_rgba(183,16,42,0.03)]">
                            <div className="mb-6 flex gap-1 text-primary">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <span key={index} aria-hidden="true" className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        star
                                    </span>
                                ))}
                            </div>
                            <p className="mb-8 font-body text-lg italic text-on-surface-variant">
                                "Our wedding website was the talk of the family. The traditional yet modern touch was exactly what we wanted for our big day."
                            </p>
                            <div className="flex items-center gap-4">
                                <img
                                    alt="Priya Verma"
                                    className="h-12 w-12 rounded-full object-cover border-2 border-primary/10"
                                    src="/images/profile-priya.png"
                                />
                                <div>
                                    <p className="font-headline font-bold text-on-surface">Priya Verma</p>
                                    <p className="font-body text-sm text-on-surface-variant">Bride-to-be</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-10 shadow-[0_30px_60px_rgba(183,16,42,0.03)]">
                            <div className="mb-6 flex gap-1 text-primary">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <span key={index} aria-hidden="true" className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        star
                                    </span>
                                ))}
                            </div>
                            <p className="mb-8 font-body text-lg italic text-on-surface-variant">
                                "Sach mein, itna aasaan aur sundar! Sabne pucha ki kisne banaya. Best for Indian weddings!"
                            </p>
                            <div className="flex items-center gap-4">
                                <img
                                    alt="Rahul Kapoor"
                                    className="h-12 w-12 rounded-full object-cover border-2 border-primary/10"
                                    src="/images/profile-rahul.png"
                                />
                                <div>
                                    <p className="font-headline font-bold text-on-surface">Rahul Kapoor</p>
                                    <p className="font-body text-sm text-on-surface-variant">Groom</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-10 shadow-[0_30px_60px_rgba(183,16,42,0.03)]">
                            <div className="mb-6 flex gap-1 text-primary">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <span key={index} aria-hidden="true" className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        star
                                    </span>
                                ))}
                            </div>
                            <p className="mb-8 font-body text-lg italic text-on-surface-variant">
                                "Created a super cool birthday page for my daughter's 1st birthday. The milestones timeline was a hit with all our relatives!"
                            </p>
                            <div className="flex items-center gap-4">
                                <img
                                    alt="Anjali Sharma"
                                    className="h-12 w-12 rounded-full object-cover border-2 border-primary/10"
                                    src="/images/profile-anjali.png"
                                />
                                <div>
                                    <p className="font-headline font-bold text-on-surface">Anjali Sharma</p>
                                    <p className="font-body text-sm text-on-surface-variant">Mother</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="plans" className="bg-surface-container-low py-24">
                <div className="container mx-auto px-6">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 font-headline text-4xl font-bold tracking-tight text-on-surface">Simple, transparent pricing</h2>
                        <p className="font-body text-lg text-on-surface-variant">Start for free, upgrade when you need more magic.</p>
                    </div>
                    <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
                        <div className="rounded-[2.5rem] bg-surface-container-lowest p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                            <h3 className="mb-2 font-headline text-2xl font-bold text-on-surface">Essential</h3>
                            <p className="mb-6 font-body text-on-surface-variant">Perfect for simple gatherings.</p>
                            <div className="mb-8">
                                <span className="font-headline text-5xl font-bold text-on-surface">Free</span>
                            </div>
                            <ul className="mb-10 space-y-4 font-body text-on-surface-variant">
                                <li className="flex items-center gap-3">
                                    <span aria-hidden="true" className="material-symbols-outlined text-primary">check_circle</span>
                                    AI Story Assistant
                                </li>
                                <li className="flex items-center gap-3">
                                    <span aria-hidden="true" className="material-symbols-outlined text-primary">check_circle</span>
                                    3 Premium Templates
                                </li>
                                <li className="flex items-center gap-3">
                                    <span aria-hidden="true" className="material-symbols-outlined text-primary">check_circle</span>
                                    Digital RSVP Collection
                                </li>
                            </ul>
                            <Link
                                to="/onboarding"
                                className="block w-full text-center rounded-full border border-outline-variant/30 px-8 py-4 font-label font-semibold text-primary transition-colors duration-200 hover:bg-surface-container-low"
                            >
                                Start Free
                            </Link>
                        </div>

                        <div className="relative overflow-hidden rounded-[2.5rem] border-2 border-primary/10 bg-surface-container-lowest p-10 shadow-[0_30px_60px_rgba(183,16,42,0.08)]">
                            <div className="absolute top-6 right-[-35px] rotate-45 bg-primary px-10 py-1 font-label text-xs font-bold uppercase tracking-wider text-on-primary">
                                Coming Soon
                            </div>
                            <h3 className="mb-2 font-headline text-2xl font-bold text-on-surface">Heirloom</h3>
                            <p className="mb-6 font-body text-on-surface-variant">For life's biggest milestones.</p>
                            <div className="mb-8">
                                <div className="relative inline-block">
                                    <span className="font-headline text-5xl font-bold text-on-surface blur-md select-none">₹5,999</span>
                                    <span className="text-on-surface-variant blur-sm select-none">/event</span>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="bg-surface/80 px-2 py-1 rounded text-xs font-bold text-primary uppercase tracking-widest shadow-sm">Revealing Soon</span>
                                    </div>
                                </div>
                            </div>
                            <ul className="mb-10 space-y-4 font-body text-on-surface-variant opacity-50">
                                <li className="flex items-center gap-3">
                                    <span aria-hidden="true" className="material-symbols-outlined text-primary">check_circle</span>
                                    All Premium Templates
                                </li>
                                <li className="flex items-center gap-3">
                                    <span aria-hidden="true" className="material-symbols-outlined text-primary">check_circle</span>
                                    Custom Background Music
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
                            <Link
                                to="/contact-us"
                                className="block w-full text-center rounded-full bg-gradient-to-r from-primary to-primary-container px-8 py-4 font-label font-semibold text-on-primary shadow-lg transition-transform duration-200 hover:scale-[0.98]"
                            >
                                Notify Me
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
