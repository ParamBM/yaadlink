import React, { useEffect, useMemo, useRef, useState } from 'react';
import { formatDisplayDate, formatMilestoneDate, getThemeStoryContent } from '../shared';

/* ═══════════════════════════════════════════════════════════════
   SHARE MODAL  (Dark Editorial)
   ═══════════════════════════════════════════════════════════════ */
function ShareModal({ onClose, title }) {
    const [copied, setCopied] = useState(false);
    const url = typeof window !== 'undefined' ? window.location.href : '';

    const handleCopy = () => {
        navigator.clipboard?.writeText(url).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
            <div className="relative w-full max-w-md border border-white/10 bg-[#0a0a0a]/95 p-8 text-center shadow-2xl">
                <span className="material-symbols-outlined mb-4 block text-4xl text-[#c9a227]">
                    share
                </span>
                <h3 className="mb-2 font-['Playfair_Display'] text-2xl text-white">Share Portfolio</h3>
                <p className="mb-6 text-sm leading-7 text-white/50">
                    Copy the link to share {title || 'this portfolio'}.
                </p>
                <div className="flex gap-2">
                    <input
                        readOnly
                        value={url}
                        className="min-w-0 flex-1 border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-[#c9a227]/50"
                    />
                    <button
                        onClick={handleCopy}
                        className="whitespace-nowrap bg-[#c9a227] px-5 py-3 text-xs font-semibold uppercase tracking-widest text-black transition hover:brightness-110"
                    >
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="mt-5 text-xs uppercase tracking-widest text-white/40 transition hover:text-[#c9a227]"
                >
                    Close
                </button>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   INTERSECTION OBSERVER HOOK
   ═══════════════════════════════════════════════════════════════ */
function useInView(threshold = 0.12) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.unobserve(el);
                }
            },
            { threshold }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold]);

    return [ref, inView];
}

/* ═══════════════════════════════════════════════════════════════
   REVEAL WRAPPER  (scroll-triggered fade-up)
   ═══════════════════════════════════════════════════════════════ */
function Reveal({ children, delay = 0, className = '' }) {
    const [ref, inView] = useInView();
    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: inView ? 1 : 0,
                transform: inView ? 'translateY(0)' : 'translateY(36px)',
                transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function buildGalleryImages(content) {
    const seen = new Set();
    return (content.images || [])
        .filter((image) => image?.src)
        .filter((image) => {
            if (seen.has(image.src)) return false;
            seen.add(image.src);
            return true;
        });
}

function buildNavSections(hasStory, hasMilestones, hasGallery) {
    return [
        hasStory ? { id: 'about', label: 'About' } : null,
        hasMilestones ? { id: 'series', label: 'Series' } : null,
        hasGallery ? { id: 'work', label: 'Work' } : null,
        { id: 'contact', label: 'Contact' },
    ].filter(Boolean);
}

/* ═══════════════════════════════════════════════════════════════
   APERTURE THEME
   ═══════════════════════════════════════════════════════════════ */
export default function Aperture({ data }) {
    const content = getThemeStoryContent(data);
    const [showShare, setShowShare] = useState(false);
    const [navVisible, setNavVisible] = useState(false);
    const [heroLoaded, setHeroLoaded] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            const trigger = window.innerHeight * 0.55;
            setNavVisible(window.scrollY > trigger);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setHeroLoaded(true), 120);
        return () => clearTimeout(t);
    }, []);

    const galleryImages = useMemo(() => buildGalleryImages(content), [content]);
    const storyImage = content.coverImageUrl || galleryImages[0]?.src;
    const navSections = buildNavSections(
        !!content.summary,
        content.milestones.length > 0,
        galleryImages.length > 0
    );

    const estYear = content.rawDate
        ? new Date(content.rawDate).getFullYear()
        : content.dateLabel || '2024';
    const photographerName = content.people[0] || content.title || 'Photographer';
    const displayName = content.people.length > 1
        ? `${content.people[0]} (${content.people[1]})`
        : photographerName;

    return (
        <>
            {/* ── Fonts ── */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link
                href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Space+Mono:wght@400;700&display=swap"
                rel="stylesheet"
            />
            <link
                href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL@20..48,100..700,0..1&display=swap"
                rel="stylesheet"
            />

            <style>{`
                .ap-root {
                    background: #050505;
                    color: #e5e5e5;
                    font-family: 'Inter', sans-serif;
                    min-height: 100vh;
                    overflow-x: hidden;
                }
                .ap-root ::selection {
                    background: rgba(201, 162, 39, 0.28);
                    color: #fff;
                }
                /* Film grain overlay */
                .ap-grain {
                    position: fixed;
                    inset: -8%;
                    z-index: 9999;
                    pointer-events: none;
                    opacity: 0.032;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
                    background-repeat: repeat;
                    background-size: 256px 256px;
                    animation: ap-grain 0.5s steps(1) infinite;
                }
                @keyframes ap-grain {
                    0%,100%{transform:translate(0,0)} 10%{transform:translate(-1%,-1%)} 20%{transform:translate(1%,1%)}
                    30%{transform:translate(-0.5%,0.5%)} 40%{transform:translate(0.5%,-0.5%)} 50%{transform:translate(-1%,1%)}
                    60%{transform:translate(1%,-1%)} 70%{transform:translate(-0.5%,-0.5%)} 80%{transform:translate(0.5%,0.5%)}
                    90%{transform:translate(-1%,-0.5%)}
                }
                /* Aperture iris decoration */
                .ap-iris {
                    position: relative;
                    width: 260px;
                    height: 260px;
                }
                .ap-iris svg {
                    width: 100%;
                    height: 100%;
                    fill: none;
                    stroke: rgba(201, 162, 39, 0.18);
                    stroke-width: 0.8;
                    animation: ap-spin 50s linear infinite;
                }
                @keyframes ap-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                /* Scroll cue */
                .ap-scroll-line {
                    width: 1px;
                    height: 64px;
                    background: linear-gradient(to bottom, rgba(201,162,39,0.6), transparent);
                    position: relative;
                    overflow: hidden;
                }
                .ap-scroll-line::after {
                    content: '';
                    position: absolute;
                    top: -100%;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(to bottom, transparent, #c9a227, transparent);
                    animation: ap-scroll-pulse 2.2s ease-in-out infinite;
                }
                @keyframes ap-scroll-pulse {
                    0% { top: -100%; }
                    100% { top: 100%; }
                }
                /* Gallery */
                .ap-gallery-item {
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                }
                .ap-gallery-item img {
                    transition: transform 0.9s cubic-bezier(0.16,1,0.3,1), filter 0.6s ease;
                }
                .ap-gallery-item:hover img {
                    transform: scale(1.07);
                }
                .ap-gallery-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%);
                    opacity: 0;
                    transition: opacity 0.5s ease;
                }
                .ap-gallery-item:hover .ap-gallery-overlay {
                    opacity: 1;
                }
                .ap-gallery-meta {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 28px;
                    transform: translateY(16px);
                    opacity: 0;
                    transition: transform 0.55s cubic-bezier(0.16,1,0.3,1), opacity 0.5s ease;
                }
                .ap-gallery-item:hover .ap-gallery-meta {
                    transform: translateY(0);
                    opacity: 1;
                }
                /* Series card */
                .ap-series-card {
                    position: relative;
                }
                .ap-series-card::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border: 1px solid rgba(201,162,39,0.15);
                    pointer-events: none;
                    z-index: 10;
                    transition: border-color 0.4s ease;
                }
                .ap-series-card:hover::before {
                    border-color: rgba(201,162,39,0.45);
                }
                .ap-series-card img {
                    transition: transform 0.9s cubic-bezier(0.16,1,0.3,1);
                }
                .ap-series-card:hover img {
                    transform: scale(1.04);
                }
                /* Nav underline */
                .ap-nav-link {
                    position: relative;
                }
                .ap-nav-link::after {
                    content: '';
                    position: absolute;
                    bottom: -4px;
                    left: 0;
                    width: 0;
                    height: 1px;
                    background: #c9a227;
                    transition: width 0.35s ease;
                }
                .ap-nav-link:hover::after {
                    width: 100%;
                }
                /* Scrollbar */
                .ap-root::-webkit-scrollbar { width: 5px; }
                .ap-root::-webkit-scrollbar-track { background: #050505; }
                .ap-root::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
                .ap-root::-webkit-scrollbar-thumb:hover { background: #c9a227; }
            `}</style>

            <div className="ap-root">
                {/* Film Grain */}
                <div className="ap-grain" />

                {/* ═══════════════════════════════════════════
                    NAVIGATION
                ═══════════════════════════════════════════ */}
                <header
                    className="fixed inset-x-0 top-0 z-50 border-b border-white/5 px-6 md:px-12"
                    style={{
                        background: 'rgba(5,5,5,0.92)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        opacity: navVisible ? 1 : 0,
                        transform: navVisible ? 'translateY(0)' : 'translateY(-100%)',
                        transition: 'opacity 0.5s ease, transform 0.5s ease',
                    }}
                >
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
                        <button
                            onClick={() => scrollToSection('hero')}
                            className="font-['Space_Mono'] text-[11px] uppercase tracking-[0.2em] text-[#c9a227]"
                        >
                            {displayName}
                        </button>
                        <nav className="hidden items-center gap-10 md:flex">
                            {navSections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className="ap-nav-link text-[11px] uppercase tracking-[0.16em] text-white/50 transition hover:text-white"
                                >
                                    {section.label}
                                </button>
                            ))}
                        </nav>
                        <button
                            onClick={() => setShowShare(true)}
                            className="text-[11px] uppercase tracking-[0.14em] text-white/40 transition hover:text-[#c9a227]"
                        >
                            Share
                        </button>
                    </div>
                </header>

                <main>
                    {/* ═══════════════════════════════════════════
                        HERO
                    ═══════════════════════════════════════════ */}
                    <section
                        id="hero"
                        className="relative flex min-h-screen items-end overflow-hidden pb-24 md:items-center md:pb-0"
                    >
                        {content.coverImageUrl && (
                            <div className="absolute inset-0">
                                <img
                                    src={content.coverImageUrl}
                                    alt={displayName}
                                    className="h-full w-full object-cover"
                                    style={{
                                        opacity: heroLoaded ? 0.35 : 0,
                                        transform: heroLoaded ? 'scale(1)' : 'scale(1.08)',
                                        transition: 'opacity 1.2s ease, transform 1.8s cubic-bezier(0.16,1,0.3,1)',
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-[#050505]/30" />
                                <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/70 to-transparent" />
                                <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 150px rgba(0,0,0,0.8)' }} />
                            </div>
                        )}

                        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 md:px-12">
                            <div className="max-w-3xl">
                                <p
                                    className="mb-6 font-['Space_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#c9a227]"
                                    style={{
                                        opacity: heroLoaded ? 1 : 0,
                                        transform: heroLoaded ? 'translateY(0)' : 'translateY(16px)',
                                        transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s',
                                    }}
                                >
                                    {content.eyebrow || 'Photography Portfolio'}
                                </p>
                                <h1
                                    className="font-['Playfair_Display'] text-[clamp(52px,10vw,120px)] leading-[0.9] text-white"
                                    style={{
                                        opacity: heroLoaded ? 1 : 0,
                                        transform: heroLoaded ? 'translateY(0)' : 'translateY(40px)',
                                        transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.5s',
                                    }}
                                >
                                    {displayName}
                                </h1>
                                <p
                                    className="mt-6 max-w-xl text-lg leading-relaxed text-white/50 md:text-xl"
                                    style={{
                                        opacity: heroLoaded ? 1 : 0,
                                        transform: heroLoaded ? 'translateY(0)' : 'translateY(30px)',
                                        transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.7s',
                                    }}
                                >
                                    {content.subtitle || 'Fashion & Editorial Photography'}
                                </p>
                                {(content.location || content.dateLabel) && (
                                    <p
                                        className="mt-5 font-['Space_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/30"
                                        style={{
                                            opacity: heroLoaded ? 1 : 0,
                                            transition: 'opacity 0.8s ease 0.9s',
                                        }}
                                    >
                                        {[content.location, content.dateLabel].filter(Boolean).join('  ·  ')}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Scroll Cue */}
                        <div
                            className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3"
                            style={{
                                opacity: heroLoaded ? 0.5 : 0,
                                transition: 'opacity 1s ease 1.2s',
                            }}
                        >
                            <span className="font-['Space_Mono'] text-[9px] uppercase tracking-[0.2em] text-white/40">
                                Scroll
                            </span>
                            <div className="ap-scroll-line" />
                        </div>

                        {/* Decorative Aperture */}
                        <div
                            className="absolute right-6 top-1/2 hidden -translate-y-1/2 md:block lg:right-12"
                            style={{
                                opacity: heroLoaded ? 0.25 : 0,
                                transition: 'opacity 1.5s ease 1s',
                            }}
                        >
                            <div className="ap-iris">
                                <svg viewBox="0 0 100 100">
                                    <polygon points="50,8 92,50 50,92 8,50" />
                                    <polygon points="50,18 82,50 50,82 18,50" opacity="0.5" />
                                    <circle cx="50" cy="50" r="42" opacity="0.3" />
                                </svg>
                            </div>
                        </div>
                    </section>

                    {/* ═══════════════════════════════════════════
                        ABOUT
                    ═══════════════════════════════════════════ */}
                    {content.summary && (
                        <section id="about" className="relative py-32 md:py-44">
                            <div className="mx-auto max-w-7xl px-6 md:px-12">
                                <div className="grid items-center gap-16 md:grid-cols-2 md:gap-24">
                                    <Reveal>
                                        <div className="relative">
                                            <div className="absolute -inset-3 border border-[#c9a227]/20" />
                                            <img
                                                src={storyImage}
                                                alt={displayName}
                                                className="relative block w-full object-cover shadow-2xl"
                                                style={{ aspectRatio: '3/4' }}
                                            />
                                            <div className="absolute -bottom-5 -right-5 border border-white/10 bg-[#0a0a0a] px-5 py-3">
                                                <p className="font-['Space_Mono'] text-[10px] uppercase tracking-[0.2em] text-[#c9a227]">
                                                    Est. {estYear}
                                                </p>
                                            </div>
                                        </div>
                                    </Reveal>

                                    <div>
                                        <Reveal delay={150}>
                                            <p className="mb-4 font-['Space_Mono'] text-[10px] uppercase tracking-[0.25em] text-[#c9a227]">
                                                About
                                            </p>
                                        </Reveal>
                                        <Reveal delay={250}>
                                            <h2 className="mb-8 font-['Playfair_Display'] text-[clamp(30px,4vw,46px)] leading-tight text-white">
                                                The Eye Behind<br />the Lens
                                            </h2>
                                        </Reveal>
                                        <Reveal delay={350}>
                                            <div className="space-y-5 text-[15px] leading-8 text-white/55">
                                                {content.summary
                                                    .split(/\n{2,}/)
                                                    .map((p, i) => (
                                                        <p key={i}>{p.trim()}</p>
                                                    ))}
                                            </div>
                                        </Reveal>
                                        {content.finalMessage && (
                                            <Reveal delay={450}>
                                                <div className="mt-10 border-l-2 border-[#c9a227] pl-6">
                                                    <p className="font-['Playfair_Display'] text-lg italic leading-8 text-white/75">
                                                        "{content.finalMessage}"
                                                    </p>
                                                </div>
                                            </Reveal>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ═══════════════════════════════════════════
                        SERIES  (Milestones)
                    ═══════════════════════════════════════════ */}
                    {content.milestones.length > 0 && (
                        <section id="series" className="bg-[#080808] py-32 md:py-44">
                            <div className="mx-auto max-w-7xl px-6 md:px-12">
                                <Reveal>
                                    <div className="mb-20 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                                        <div>
                                            <p className="mb-3 font-['Space_Mono'] text-[10px] uppercase tracking-[0.25em] text-[#c9a227]">
                                                Selected Works
                                            </p>
                                            <h2 className="font-['Playfair_Display'] text-[clamp(30px,4vw,46px)] leading-tight text-white">
                                                Photo Series
                                            </h2>
                                        </div>
                                        <p className="max-w-xs text-sm leading-relaxed text-white/35">
                                            Curated collections exploring light, form, and human emotion.
                                        </p>
                                    </div>
                                </Reveal>

                                <div className="flex flex-col gap-24">
                                    {content.milestones.map((milestone, index) => (
                                        <div
                                            key={milestone.key}
                                            className={`grid items-center gap-12 md:grid-cols-2 ${index % 2 === 1 ? 'md:[direction:rtl]' : ''}`}
                                        >
                                            <Reveal className={index % 2 === 1 ? 'md:[direction:ltr]' : ''}>
                                                <div className="ap-series-card overflow-hidden">
                                                    {milestone.imageUrl ? (
                                                        <img
                                                            src={milestone.imageUrl}
                                                            alt={milestone.title}
                                                            className="h-[420px] w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-[420px] w-full items-center justify-center bg-white/5">
                                                            <span className="material-symbols-outlined text-5xl text-white/15">
                                                                photo_camera
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </Reveal>

                                            <div className={index % 2 === 1 ? 'md:[direction:ltr]' : ''}>
                                                <Reveal delay={200}>
                                                    <span className="mb-4 inline-block bg-[#c9a227]/10 px-3 py-1 font-['Space_Mono'] text-[10px] uppercase tracking-[0.2em] text-[#c9a227]">
                                                        {formatMilestoneDate(milestone.date) ||
                                                            `Series ${String(index + 1).padStart(2, '0')}`}
                                                    </span>
                                                </Reveal>
                                                <Reveal delay={300}>
                                                    <h3 className="mb-4 font-['Playfair_Display'] text-[clamp(24px,3vw,34px)] text-white">
                                                        {milestone.title}
                                                    </h3>
                                                </Reveal>
                                                {milestone.description && (
                                                    <Reveal delay={400}>
                                                        <p className="max-w-md text-[15px] leading-7 text-white/45">
                                                            {milestone.description}
                                                        </p>
                                                    </Reveal>
                                                )}
                                                <Reveal delay={500}>
                                                    <div className="mt-6 flex items-center gap-3 text-white/30">
                                                        <div className="h-px w-8 bg-[#c9a227]/40" />
                                                        <span className="font-['Space_Mono'] text-[10px] uppercase tracking-[0.15em]">
                                                            View Project
                                                        </span>
                                                    </div>
                                                </Reveal>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ═══════════════════════════════════════════
                        GALLERY
                    ═══════════════════════════════════════════ */}
                    {galleryImages.length > 0 && (
                        <section id="work" className="py-32 md:py-44">
                            <div className="mx-auto max-w-7xl px-6 md:px-12">
                                <Reveal>
                                    <div className="mb-16 text-center">
                                        <p className="mb-3 font-['Space_Mono'] text-[10px] uppercase tracking-[0.25em] text-[#c9a227]">
                                            Portfolio
                                        </p>
                                        <h2 className="font-['Playfair_Display'] text-[clamp(30px,4vw,46px)] text-white">
                                            Frames & Moments
                                        </h2>
                                    </div>
                                </Reveal>

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:gap-4">
                                    {galleryImages.map((image, index) => {
                                        const spanClass =
                                            index === 0
                                                ? 'md:col-span-8'
                                                : index === 3
                                                ? 'md:col-span-6'
                                                : 'md:col-span-4';
                                        const aspect =
                                            index === 0 ? 'aspect-[16/10]' : 'aspect-[4/5]';

                                        return (
                                            <Reveal
                                                key={image.key || image.src || index}
                                                delay={index * 80}
                                                className={spanClass}
                                            >
                                                <div className={`ap-gallery-item ${aspect}`}>
                                                    <img
                                                        src={image.src}
                                                        alt={image.alt || `Portfolio ${index + 1}`}
                                                        className="h-full w-full object-cover"
                                                        loading="lazy"
                                                    />
                                                    <div className="ap-gallery-overlay" />
                                                    <div className="ap-gallery-meta">
                                                        <p className="font-['Playfair_Display'] text-sm text-white">
                                                            {image.caption ||
                                                                `Frame ${String(index + 1).padStart(2, '0')}`}
                                                        </p>
                                                        <p className="mt-1 font-['Space_Mono'] text-[9px] uppercase tracking-[0.15em] text-white/45">
                                                            {displayName}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Reveal>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ═══════════════════════════════════════════
                        CONTACT / CLOSING
                    ═══════════════════════════════════════════ */}
                    <section id="contact" className="relative overflow-hidden py-32 md:py-48">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,162,39,0.07),transparent_50%)]" />

                        {/* Large background aperture */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.06]">
                            <div className="ap-iris" style={{ width: 480, height: 480 }}>
                                <svg viewBox="0 0 100 100">
                                    <polygon points="50,5 95,50 50,95 5,50" />
                                    <polygon points="50,20 80,50 50,80 20,50" opacity="0.6" />
                                    <circle cx="50" cy="50" r="35" opacity="0.4" />
                                </svg>
                            </div>
                        </div>

                        <div className="relative mx-auto max-w-4xl px-6 text-center md:px-12">
                            <Reveal>
                                <div className="mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-full border border-[#c9a227]/25">
                                    <span className="material-symbols-outlined text-xl text-[#c9a227]">
                                        photo_camera
                                    </span>
                                </div>
                            </Reveal>

                            <Reveal delay={200}>
                                <h2 className="font-['Playfair_Display'] text-[clamp(28px,5vw,48px)] leading-tight text-white">
                                    Let's Create Something<br />Timeless
                                </h2>
                            </Reveal>

                            <Reveal delay={300}>
                                <p className="mx-auto mt-6 max-w-xl text-lg italic leading-8 text-white/45">
                                    {content.finalMessage
                                        ? `"${content.finalMessage}"`
                                        : '"Photography is the story I fail to put into words."'}
                                </p>
                            </Reveal>

                            <Reveal delay={400}>
                                <div className="mt-10 flex items-center justify-center gap-4">
                                    <div className="h-px w-12 bg-[#c9a227]/30" />
                                    <span className="font-['Space_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#c9a227]">
                                        {displayName}
                                    </span>
                                    <div className="h-px w-12 bg-[#c9a227]/30" />
                                </div>
                            </Reveal>

                            {content.coverImageUrl && (
                                <Reveal delay={500}>
                                    <div className="mx-auto mt-12 max-w-2xl overflow-hidden border border-white/10">
                                        <img
                                            src={content.coverImageUrl}
                                            alt="Closing visual"
                                            className="h-[280px] w-full object-cover opacity-50 grayscale transition-all duration-1000 hover:grayscale-0 hover:opacity-80"
                                        />
                                    </div>
                                </Reveal>
                            )}
                        </div>
                    </section>
                </main>

                {/* ═══════════════════════════════════════════
                    FOOTER
                ═══════════════════════════════════════════ */}
                <footer className="border-t border-white/5 bg-[#050505] px-6 py-12 md:px-12">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 md:flex-row">
                        <p className="font-['Space_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/25">
                            {displayName} · {content.location || 'Worldwide'}
                        </p>
                        <p className="text-[11px] text-white/15">
                            Crafted with light & shadow
                        </p>
                    </div>
                </footer>

                {/* ═══════════════════════════════════════════
                    SHARE FAB
                ═══════════════════════════════════════════ */}
                <button
                    aria-label="Share portfolio"
                    onClick={() => setShowShare(true)}
                    className="fixed bottom-8 right-8 z-50 flex items-center gap-2 bg-[#c9a227] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-black shadow-[0_8px_30px_rgba(201,162,39,0.25)] transition hover:scale-105"
                >
                    <span className="material-symbols-outlined text-lg">share</span>
                    Share
                </button>

                {/* ═══════════════════════════════════════════
                    MODAL
                ═══════════════════════════════════════════ */}
                {showShare && (
                    <ShareModal onClose={() => setShowShare(false)} title={displayName} />
                )}
            </div>
        </>
    );
}
