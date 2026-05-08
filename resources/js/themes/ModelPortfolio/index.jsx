import React, { useEffect, useMemo, useRef, useState } from 'react';
import { formatDisplayDate, formatMilestoneDate, getThemeStoryContent } from '../shared';


function ShareModal({ onClose, title }) {
    const [copied, setCopied] = useState(false);
    const url = typeof window !== 'undefined' ? window.location.href : '';

    const handleCopy = () => {
        navigator.clipboard?.writeText(url).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        });
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-md border border-[#b8946a]/40 bg-[#0c0c0c] p-10 text-center">
                <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#b8946a] to-transparent" />
                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.4em] text-[#b8946a]">
                    Press Kit
                </p>
                <h3 className="mb-2 font-['Bodoni_Moda'] text-3xl italic text-[#ebe6dd]">
                    Share Portfolio
                </h3>
                <p className="mb-7 text-xs leading-6 text-[#ebe6dd]/55">
                    Send {title || 'this portfolio'} to agencies, casting directors and clients.
                </p>
                <div className="flex gap-0">
                    <input
                        readOnly
                        value={url}
                        className="min-w-0 flex-1 border border-[#ebe6dd]/15 bg-black px-4 py-3 text-xs text-[#ebe6dd]/80 outline-none"
                    />
                    <button
                        onClick={handleCopy}
                        className="whitespace-nowrap bg-[#ebe6dd] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-black transition hover:bg-[#b8946a]"
                    >
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="mt-6 text-[10px] uppercase tracking-[0.32em] text-[#ebe6dd]/40 transition hover:text-[#b8946a]"
                >
                    Close
                </button>
            </div>
        </div>
    );
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
        { id: 'cover', label: 'Cover' },
        hasStory ? { id: 'biography', label: 'Bio' } : null,
        hasMilestones ? { id: 'work', label: 'Work' } : null,
        hasGallery ? { id: 'editorial', label: 'Editorial' } : null,
        { id: 'representation', label: 'Booking' },
    ].filter(Boolean);
}

function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* Reveals on scroll — IntersectionObserver hook */
function useReveal() {
    useEffect(() => {
        const els = document.querySelectorAll('[data-reveal]');
        if (!els.length) return undefined;

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('mp-in');
                        io.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
        );

        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, []);
}

export default function ModelPortfolio({ data }) {
    const content = getThemeStoryContent(data);
    const [showShare, setShowShare] = useState(false);
    const [navVisible, setNavVisible] = useState(false);
    const [scrollPct, setScrollPct] = useState(0);
    const heroRef = useRef(null);

    useEffect(() => {
        const onScroll = () => {
            const trigger = window.innerHeight * 0.7;
            setNavVisible(window.scrollY > trigger);

            const h = document.documentElement;
            const total = h.scrollHeight - h.clientHeight;
            setScrollPct(total > 0 ? (window.scrollY / total) * 100 : 0);

            // hero parallax
            if (heroRef.current) {
                heroRef.current.style.setProperty('--mp-py', `${window.scrollY * 0.18}px`);
            }
        };

        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useReveal();

    const displayDate = formatDisplayDate(content.rawDate) || content.dateLabel;
    const yearLabel = (() => {
        const m = String(displayDate || '').match(/\b(19|20)\d{2}\b/);
        return m ? m[0] : new Date().getFullYear();
    })();
    const storyParagraphs = (content.summary || '')
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean);
    const galleryImages = useMemo(() => buildGalleryImages(content), [content]);
    const heroImage = content.coverImageUrl || galleryImages[0]?.src;
    const bioImage = galleryImages[1]?.src || galleryImages[0]?.src || heroImage;
    const closingImage = galleryImages[3]?.src || galleryImages[2]?.src || heroImage;

    const modelName = content.people?.length > 1
        ? `${content.people[0]} (${content.people[1]})`
        : content.title || content.people?.[0] || 'Untitled Model';
    const heroNameLines = content.people?.length > 1 ? [content.people[0], `(${content.people[1]})`] : [modelName];
    const initials = content.initials || modelName.split(' ').map((n) => n.charAt(0).toUpperCase()).join('').slice(0, 2) || 'MP';
    const navSections = buildNavSections(storyParagraphs.length > 0, content.milestones.length > 0, galleryImages.length > 0);

    const marqueeText = `${(content.eyebrow || 'Available for Representation').toUpperCase()}  ✦  ${modelName.toUpperCase()}  ✦  PORTFOLIO ${yearLabel}  ✦  ${(content.location || 'Worldwide').toUpperCase()}  ✦  `;

    return (
        <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link
                href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Archivo:wght@300;400;500;600;700;900&family=JetBrains+Mono:wght@300;400;500&display=swap"
                rel="stylesheet"
            />

            <style>{`
                .mp-root {
                    background: #0a0a0a;
                    color: #ebe6dd;
                    font-family: 'Archivo', sans-serif;
                    min-height: 100vh;
                    overflow-x: hidden;
                    font-feature-settings: 'ss01' on, 'cv11' on;
                }
                .mp-root ::selection { background: #b8946a; color: #0a0a0a; }
                .mp-grain {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    z-index: 60;
                    opacity: 0.06;
                    mix-blend-mode: overlay;
                    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
                }
                .mp-progress {
                    position: fixed; top: 0; left: 0; height: 2px;
                    background: linear-gradient(90deg, #b8946a, #ebe6dd);
                    z-index: 80;
                    transition: width .15s linear;
                }
                .mp-display { font-family: 'Bodoni Moda', serif; font-weight: 500; letter-spacing: -0.02em; }
                .mp-italic { font-family: 'Bodoni Moda', serif; font-style: italic; }
                .mp-mono { font-family: 'JetBrains Mono', monospace; }
                .mp-wrap { overflow-wrap: anywhere; word-break: normal; }

                /* hero */
                .mp-hero-img {
                    transform: translate3d(0, var(--mp-py, 0px), 0) scale(1.05);
                    transition: transform .2s linear;
                    filter: contrast(1.05) saturate(0.92);
                }
                .mp-hero-name {
                    line-height: 0.82;
                    text-shadow: 0 4px 60px rgba(0,0,0,0.55);
                }
                .mp-vline { width: 1px; background: linear-gradient(to bottom, transparent, #b8946a, transparent); }

                /* marquee */
                .mp-marquee {
                    display: flex; gap: 2.5rem;
                    animation: mp-scroll 38s linear infinite;
                    white-space: nowrap;
                }
                @keyframes mp-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }

                /* gallery */
                .mp-tile { overflow: hidden; position: relative; background: #111; }
                .mp-tile img {
                    width: 100%; height: 100%; object-fit: cover; display: block;
                    transform: scale(1.02);
                    transition: transform 1.2s cubic-bezier(.2,.8,.2,1), filter .6s;
                    filter: grayscale(0.18) contrast(1.04);
                }
                .mp-tile:hover img { transform: scale(1.08); filter: grayscale(0) contrast(1.08); }
                .mp-tile::after {
                    content: ''; position: absolute; inset: 0;
                    background: linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.78));
                    opacity: .55; transition: opacity .5s;
                    pointer-events: none;
                }
                .mp-tile:hover::after { opacity: .9; }
                .mp-tile-num {
                    position: absolute; top: 14px; left: 16px;
                    font-family: 'JetBrains Mono', monospace; font-size: 11px;
                    color: #ebe6dd; letter-spacing: 0.2em;
                    mix-blend-mode: difference; z-index: 2;
                }
                .mp-tile-cap {
                    position: absolute; left: 18px; right: 18px; bottom: 16px;
                    z-index: 2;
                    transform: translateY(8px);
                    opacity: 0; transition: all .5s;
                }
                .mp-tile:hover .mp-tile-cap { transform: translateY(0); opacity: 1; }

                /* reveals */
                [data-reveal] {
                    opacity: 0; transform: translateY(28px);
                    transition: opacity .9s cubic-bezier(.2,.8,.2,1), transform .9s cubic-bezier(.2,.8,.2,1);
                }
                [data-reveal].mp-in { opacity: 1; transform: translateY(0); }
                [data-reveal-delay="1"] { transition-delay: .08s; }
                [data-reveal-delay="2"] { transition-delay: .16s; }
                [data-reveal-delay="3"] { transition-delay: .24s; }
                [data-reveal-delay="4"] { transition-delay: .32s; }

                /* word reveal for hero name */
                .mp-name-letter {
                    display: inline-block; opacity: 0;
                    transform: translateY(40%);
                    animation: mp-letter .9s cubic-bezier(.2,.8,.2,1) forwards;
                }
                @keyframes mp-letter { to { opacity: 1; transform: translateY(0); } }

                /* nav */
                .mp-navlink { position: relative; }
                .mp-navlink::after {
                    content: ''; position: absolute; left: 0; right: 0; bottom: -6px;
                    height: 1px; background: #b8946a;
                    transform: scaleX(0); transform-origin: left;
                    transition: transform .35s cubic-bezier(.2,.8,.2,1);
                }
                .mp-navlink:hover::after { transform: scaleX(1); }

                /* badge dot */
                .mp-dot { width:7px; height:7px; border-radius:50%; background:#b8946a; box-shadow:0 0 0 0 rgba(184,148,106,.7); animation: mp-pulse 2s infinite; }
                @keyframes mp-pulse {
                    0% { box-shadow: 0 0 0 0 rgba(184,148,106,.55); }
                    70% { box-shadow: 0 0 0 12px rgba(184,148,106,0); }
                    100% { box-shadow: 0 0 0 0 rgba(184,148,106,0); }
                }

                /* timeline rail */
                .mp-rail {
                    background: linear-gradient(to bottom, transparent, #b8946a 12%, #b8946a 88%, transparent);
                    width: 1px;
                }

                /* CTA button */
                .mp-cta {
                    position: relative; overflow: hidden;
                    transition: color .4s;
                }
                .mp-cta::before {
                    content: ''; position: absolute; inset: 0;
                    background: #ebe6dd;
                    transform: translateY(100%);
                    transition: transform .45s cubic-bezier(.2,.8,.2,1);
                    z-index: -1;
                }
                .mp-cta:hover::before { transform: translateY(0); }
                .mp-cta:hover { color: #0a0a0a; }
                .mp-floating-share {
                    position: fixed;
                    right: 1.25rem;
                    bottom: 1.25rem;
                    left: auto;
                }
                @media (min-width: 640px) {
                    .mp-floating-share { right: 1.5rem; bottom: 1.5rem; }
                }
                @media (min-width: 768px) {
                    .mp-floating-share { right: 2rem; bottom: 2rem; }
                }
            `}</style>

            <div className="mp-root">
                <div className="mp-grain" />
                <div className="mp-progress" style={{ width: `${scrollPct}%` }} />

                {/* ── Top corner brand mark — always visible ─────────────────── */}
                <div className="pointer-events-none fixed left-5 top-5 z-40 md:left-8 md:top-8">
                    <div className="mp-mono text-[10px] uppercase tracking-[0.4em] text-[#ebe6dd]/65">
                        ✦ {initials}
                    </div>
                </div>
                <div className="pointer-events-none fixed right-5 top-5 z-40 hidden text-right md:right-8 md:top-8 md:block">
                    <div className="mp-mono text-[10px] uppercase tracking-[0.4em] text-[#ebe6dd]/65">
                        Portfolio / {yearLabel}
                    </div>
                </div>

                {/* ── Floating Nav (appears after hero) ──────────────────────── */}
                <header
                    className="fixed inset-x-0 top-0 z-50 border-b border-[#ebe6dd]/8 px-6 md:px-10"
                    style={{
                        background: 'rgba(10,10,10,0.78)',
                        backdropFilter: 'blur(14px)',
                        WebkitBackdropFilter: 'blur(14px)',
                        opacity: navVisible ? 1 : 0,
                        transform: navVisible ? 'translateY(0)' : 'translateY(-100%)',
                        transition: 'opacity .45s ease, transform .45s ease',
                    }}
                >
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6">
                        <button
                            onClick={() => scrollToSection('cover')}
                            className="mp-display text-2xl italic text-[#ebe6dd]"
                        >
                            {modelName.split(' ')[0] || initials}
                        </button>
                        <nav className="hidden items-center gap-9 md:flex">
                            {navSections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className="mp-navlink mp-mono text-[10px] uppercase tracking-[0.3em] text-[#ebe6dd]/70 transition hover:text-[#ebe6dd]"
                                >
                                    {section.label}
                                </button>
                            ))}
                        </nav>
                        <button
                            onClick={() => setShowShare(true)}
                            className="mp-cta border border-[#ebe6dd]/40 px-5 py-2.5 text-[10px] uppercase tracking-[0.28em] text-[#ebe6dd]"
                        >
                            Press Kit
                        </button>
                    </div>
                </header>

                <main>
                    {/* ── COVER ─────────────────────────────────────────────── */}
                    <section
                        id="cover"
                        ref={heroRef}
                        className="relative flex min-h-[100svh] items-end overflow-hidden"
                    >
                        {heroImage && (
                            <img
                                src={heroImage}
                                alt={modelName}
                                className="mp-hero-img absolute inset-0 h-[110%] w-full object-cover"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-black/90" />

                        {/* Vertical "PORTFOLIO" type, left edge */}
                        <div className="absolute left-6 top-1/2 hidden -translate-y-1/2 -rotate-90 md:block">
                            <span className="mp-mono text-[10px] uppercase tracking-[0.6em] text-[#ebe6dd]/70">
                                Portfolio — Vol. {yearLabel}
                            </span>
                        </div>

                        {/* Side meta column, right */}
                        <div className="absolute right-8 top-28 hidden text-right md:block">
                            <div className="flex items-center justify-end gap-2">
                                <span className="mp-dot" />
                                <span className="mp-mono mp-wrap text-[10px] uppercase tracking-[0.32em] text-[#ebe6dd]/85">
                                    {content.eyebrow || 'Available for Representation'}
                                </span>
                            </div>
                            {content.location && (
                                <p className="mp-mono mp-wrap mt-3 text-[10px] uppercase tracking-[0.32em] text-[#ebe6dd]/55">
                                    Based — {content.location}
                                </p>
                            )}
                        </div>

                        {/* Big name */}
                        <div className="relative z-10 w-full px-6 pb-20 md:px-12 md:pb-28">
                            <p
                                className="mp-mono mp-wrap mb-6 text-[10px] uppercase tracking-[0.5em] text-[#b8946a]"
                                data-reveal
                            >
                                {content.subtitle || 'Model · Editorial · Runway'}
                            </p>
                            <h1 className="mp-display mp-hero-name mp-wrap text-[clamp(58px,14vw,200px)] uppercase text-[#ebe6dd]">
                                {heroNameLines.map((line, li) => (
                                    <span key={line} className="block">
                                        {line.split(' ').map((word, wi) => (
                                            <span key={wi} className="mr-[0.18em] inline">
                                                {word.split('').map((ch, ci) => (
                                                    <span
                                                        key={ci}
                                                        className="mp-name-letter"
                                                        style={{ animationDelay: `${(li * 8 + wi * 6 + ci) * 0.04 + 0.1}s` }}
                                                    >
                                                        {ch}
                                                    </span>
                                                ))}
                                            </span>
                                        ))}
                                    </span>
                                ))}
                            </h1>
                            <div
                                className="mt-8 grid max-w-3xl gap-6 border-t border-[#ebe6dd]/15 pt-6 sm:grid-cols-3"
                                data-reveal
                                data-reveal-delay="2"
                            >
                                <div>
                                    <p className="mp-mono mb-1 text-[9px] uppercase tracking-[0.32em] text-[#ebe6dd]/45">
                                        Active Since
                                    </p>
                                    <p className="mp-display mp-wrap text-lg italic text-[#ebe6dd]">
                                        {displayDate || '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="mp-mono mb-1 text-[9px] uppercase tracking-[0.32em] text-[#ebe6dd]/45">
                                        Location
                                    </p>
                                    <p className="mp-display mp-wrap text-lg italic text-[#ebe6dd]">
                                        {content.location || 'Worldwide'}
                                    </p>
                                </div>
                                <div>
                                    <p className="mp-mono mb-1 text-[9px] uppercase tracking-[0.32em] text-[#ebe6dd]/45">
                                        Status
                                    </p>
                                    <p className="mp-display text-lg italic text-[#b8946a]">
                                        Now Booking
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* scroll cue */}
                        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-center">
                            <div className="mx-auto h-10 w-px bg-[#ebe6dd]/40" />
                            <p className="mp-mono mt-2 text-[9px] uppercase tracking-[0.4em] text-[#ebe6dd]/50">
                                Scroll
                            </p>
                        </div>
                    </section>

                    {/* ── MARQUEE STRIP ─────────────────────────────────────── */}
                    <section
                        aria-hidden
                        className="relative overflow-hidden border-y border-[#ebe6dd]/10 bg-[#0a0a0a] py-5"
                    >
                        <div className="mp-marquee mp-display text-[clamp(28px,5vw,56px)] uppercase italic text-[#ebe6dd]">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <span key={i} className="shrink-0">
                                    {marqueeText}
                                </span>
                            ))}
                        </div>
                    </section>

                    {/* ── BIOGRAPHY ─────────────────────────────────────────── */}
                    {storyParagraphs.length > 0 && (
                        <section
                            id="biography"
                            className="relative px-6 py-28 md:px-12 md:py-36"
                        >
                            <div className="mx-auto grid max-w-7xl gap-16 md:grid-cols-[42%_58%]">
                                <div className="relative" data-reveal>
                                    {bioImage && (
                                        <div className="mp-tile aspect-[3/4]">
                                            <img src={bioImage} alt={modelName} />
                                        </div>
                                    )}
                                    <p className="mp-mono mt-3 text-[10px] uppercase tracking-[0.32em] text-[#ebe6dd]/45">
                                        Fig. 01 — Studio
                                    </p>
                                </div>

                                <div className="md:pl-10 md:pt-10">
                                    <p
                                        className="mp-mono mb-6 text-[10px] uppercase tracking-[0.4em] text-[#b8946a]"
                                        data-reveal
                                    >
                                        ✦ Biography
                                    </p>
                                    <h2
                                        className="mp-display mb-10 text-[clamp(36px,5vw,68px)] leading-[0.95] text-[#ebe6dd]"
                                        data-reveal
                                        data-reveal-delay="1"
                                    >
                                        Behind <em className="mp-italic text-[#b8946a]">the lens.</em>
                                    </h2>
                                    {storyParagraphs.map((paragraph, idx) => (
                                        <p
                                            key={idx}
                                            className="mb-6 max-w-xl text-[15px] leading-9 text-[#ebe6dd]/80 md:text-base"
                                            data-reveal
                                            data-reveal-delay={String(Math.min(idx + 2, 4))}
                                        >
                                            {paragraph}
                                        </p>
                                    ))}

                                    {/* signature line */}
                                    <div
                                        className="mt-10 flex items-center gap-4"
                                        data-reveal
                                        data-reveal-delay="4"
                                    >
                                        <div className="h-px w-14 bg-[#b8946a]" />
                                        <span className="mp-italic text-2xl text-[#ebe6dd]">
                                            {modelName}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ── WORK / CAMPAIGNS (milestones) ─────────────────────── */}
                    {content.milestones.length > 0 && (
                        <section
                            id="work"
                            className="relative bg-[#070707] px-6 py-28 md:px-12 md:py-36"
                        >
                            <div className="mx-auto max-w-7xl">
                                <div className="mb-20 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
                                    <div data-reveal>
                                        <p className="mp-mono mb-4 text-[10px] uppercase tracking-[0.4em] text-[#b8946a]">
                                            ✦ Selected Work
                                        </p>
                                        <h2 className="mp-display text-[clamp(40px,6vw,84px)] leading-[0.95] text-[#ebe6dd]">
                                            Campaigns &<br />
                                            <em className="mp-italic text-[#b8946a]">Editorials.</em>
                                        </h2>
                                    </div>
                                    <p
                                        className="mp-mono max-w-xs text-xs uppercase tracking-[0.22em] text-[#ebe6dd]/45"
                                        data-reveal
                                        data-reveal-delay="1"
                                    >
                                        A curated index of recent shoots, runways and brand collaborations.
                                    </p>
                                </div>

                                <div className="relative">
                                    {/* gold rail */}
                                    <div className="mp-rail absolute bottom-0 left-3 top-0 hidden md:left-[28%] md:block" />
                                    <ul className="space-y-16">
                                        {content.milestones.map((m, i) => (
                                            <li
                                                key={m.key}
                                                className="grid items-start gap-6 md:grid-cols-[28%_72%]"
                                                data-reveal
                                                data-reveal-delay={String(Math.min(i + 1, 4))}
                                            >
                                                <div className="md:pr-10 md:text-right">
                                                    <p className="mp-mono text-[10px] uppercase tracking-[0.32em] text-[#b8946a]">
                                                        № {String(i + 1).padStart(2, '0')}
                                                    </p>
                                                    <p className="mp-display mp-wrap mt-2 text-2xl italic text-[#ebe6dd]">
                                                        {formatMilestoneDate(m.date) || `Chapter ${i + 1}`}
                                                    </p>
                                                </div>

                                                <div className="relative md:pl-10">
                                                    {/* dot */}
                                                    <span className="absolute -left-[5px] top-3 hidden h-2 w-2 rounded-full bg-[#b8946a] shadow-[0_0_0_4px_#070707] md:block" />
                                                    <h3 className="mp-display mp-wrap mb-3 text-[28px] leading-tight text-[#ebe6dd] md:text-3xl">
                                                        {m.title}
                                                    </h3>
                                                    {m.description && (
                                                        <p className="mp-wrap mb-5 max-w-2xl text-[15px] leading-8 text-[#ebe6dd]/65">
                                                            {m.description}
                                                        </p>
                                                    )}
                                                    {m.imageUrl && (
                                                        <div className="mp-tile mt-4 aspect-[16/9] max-w-3xl">
                                                            <img src={m.imageUrl} alt={m.title} />
                                                            <div className="mp-tile-cap mp-mono mp-wrap text-[10px] uppercase tracking-[0.28em] text-[#ebe6dd]">
                                                                {m.title}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ── EDITORIAL GALLERY (magazine spread) ───────────────── */}
                    {galleryImages.length > 0 && (
                        <section id="editorial" className="relative px-3 py-28 md:px-6 md:py-36">
                            <div className="mx-auto mb-16 max-w-7xl px-3 md:px-6">
                                <div className="flex items-end justify-between gap-6">
                                    <div data-reveal>
                                        <p className="mp-mono mb-4 text-[10px] uppercase tracking-[0.4em] text-[#b8946a]">
                                            ✦ Editorial
                                        </p>
                                        <h2 className="mp-display text-[clamp(40px,6vw,80px)] leading-[0.95] text-[#ebe6dd]">
                                            The <em className="mp-italic text-[#b8946a]">Lookbook.</em>
                                        </h2>
                                    </div>
                                    <span
                                        className="mp-mono hidden text-[10px] uppercase tracking-[0.32em] text-[#ebe6dd]/45 md:block"
                                        data-reveal
                                        data-reveal-delay="1"
                                    >
                                        {galleryImages.length} Frames
                                    </span>
                                </div>
                            </div>

                            {/* asymmetric magazine grid */}
                            <div className="mx-auto grid max-w-7xl grid-cols-12 gap-3 md:gap-5">
                                {galleryImages.map((image, i) => {
                                    // pattern: large, tall, square, wide, repeat
                                    const layouts = [
                                        'col-span-12 md:col-span-7 aspect-[4/5]',
                                        'col-span-12 md:col-span-5 aspect-[3/4] md:mt-16',
                                        'col-span-6 md:col-span-4 aspect-[3/4]',
                                        'col-span-6 md:col-span-4 aspect-[3/4] md:mt-10',
                                        'col-span-12 md:col-span-4 aspect-[3/4]',
                                        'col-span-12 md:col-span-8 aspect-[16/10]',
                                        'col-span-12 md:col-span-4 aspect-[3/4] md:mt-[-40px]',
                                    ];
                                    const cls = layouts[i % layouts.length];
                                    return (
                                        <figure
                                            key={image.key || image.src || i}
                                            className={`mp-tile ${cls}`}
                                            data-reveal
                                            data-reveal-delay={String((i % 4) + 1)}
                                        >
                                            <img
                                                src={image.src}
                                                alt={image.alt || `Frame ${i + 1}`}
                                            />
                                            <span className="mp-tile-num">
                                                Fr. {String(i + 1).padStart(2, '0')}
                                            </span>
                                            {image.caption && (
                                                <figcaption className="mp-tile-cap mp-italic mp-wrap text-base text-[#ebe6dd] md:text-lg">
                                                    “{image.caption}”
                                                </figcaption>
                                            )}
                                        </figure>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* ── STATEMENT / CLOSING ───────────────────────────────── */}
                    <section
                        id="statement"
                        className="relative overflow-hidden bg-[#070707] px-6 py-28 md:px-12 md:py-40"
                    >
                        {closingImage && (
                            <img
                                src={closingImage}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover opacity-25"
                                style={{ filter: 'grayscale(0.6) contrast(1.1)' }}
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-[#070707] via-[#070707]/85 to-[#070707]" />
                        <div className="relative mx-auto max-w-4xl text-center">
                            <p
                                className="mp-mono mb-8 text-[10px] uppercase tracking-[0.4em] text-[#b8946a]"
                                data-reveal
                            >
                                ✦ Statement
                            </p>
                            <p
                                className="mp-display text-[clamp(28px,4.6vw,56px)] italic leading-[1.2] text-[#ebe6dd]"
                                data-reveal
                                data-reveal-delay="1"
                            >
                                “{content.finalMessage ||
                                    'Fashion is armour to survive the reality of everyday life. The camera is where I am most myself.'}”
                            </p>
                            <div
                                className="mx-auto mt-10 flex items-center justify-center gap-4"
                                data-reveal
                                data-reveal-delay="2"
                            >
                                <div className="h-px w-12 bg-[#b8946a]" />
                                <span className="mp-mono mp-wrap min-w-0 text-[10px] uppercase tracking-[0.4em] text-[#ebe6dd]/70">
                                    {modelName}
                                </span>
                                <div className="h-px w-12 bg-[#b8946a]" />
                            </div>
                        </div>
                    </section>

                    {/* ── BOOKING / REPRESENTATION ──────────────────────────── */}
                    <section
                        id="representation"
                        className="relative px-6 py-28 md:px-12 md:py-36"
                    >
                        <div className="mx-auto grid max-w-6xl gap-16 md:grid-cols-2">
                            <div data-reveal>
                                <p className="mp-mono mb-5 text-[10px] uppercase tracking-[0.4em] text-[#b8946a]">
                                    ✦ Booking
                                </p>
                                <h2 className="mp-display text-[clamp(40px,5.5vw,76px)] leading-[0.95] text-[#ebe6dd]">
                                    Let&apos;s create <em className="mp-italic text-[#b8946a]">something iconic.</em>
                                </h2>
                                <p className="mt-8 max-w-md text-[15px] leading-8 text-[#ebe6dd]/65">
                                    Open to representation, editorial commissions, runway and brand campaigns worldwide. Send the link below to your booking agency or casting team.
                                </p>
                            </div>

                            <div className="md:pt-6" data-reveal data-reveal-delay="1">
                                <div className="border border-[#ebe6dd]/15 bg-[#0c0c0c] p-8 md:p-10">
                                    <div className="mb-6 flex items-center gap-2">
                                        <span className="mp-dot" />
                                        <span className="mp-mono text-[10px] uppercase tracking-[0.32em] text-[#ebe6dd]/85">
                                            Currently Available
                                        </span>
                                    </div>
                                    <dl className="divide-y divide-[#ebe6dd]/10">
                                        <div className="flex items-center justify-between py-4">
                                            <dt className="mp-mono text-[10px] uppercase tracking-[0.32em] text-[#ebe6dd]/45">
                                                Name
                                            </dt>
                                            <dd className="mp-display mp-wrap text-right italic text-[#ebe6dd]">{modelName}</dd>
                                        </div>
                                        <div className="flex items-center justify-between py-4">
                                            <dt className="mp-mono text-[10px] uppercase tracking-[0.32em] text-[#ebe6dd]/45">
                                                Based In
                                            </dt>
                                            <dd className="mp-display mp-wrap text-right italic text-[#ebe6dd]">
                                                {content.location || 'Worldwide'}
                                            </dd>
                                        </div>
                                        <div className="flex items-center justify-between py-4">
                                            <dt className="mp-mono text-[10px] uppercase tracking-[0.32em] text-[#ebe6dd]/45">
                                                Active Since
                                            </dt>
                                            <dd className="mp-display mp-wrap text-right italic text-[#ebe6dd]">
                                                {displayDate || '—'}
                                            </dd>
                                        </div>
                                        <div className="flex items-center justify-between py-4">
                                            <dt className="mp-mono text-[10px] uppercase tracking-[0.32em] text-[#ebe6dd]/45">
                                                Specialty
                                            </dt>
                                            <dd className="mp-display mp-wrap text-right italic text-[#ebe6dd]">
                                                {content.subtitle || 'Editorial · Runway'}
                                            </dd>
                                        </div>
                                    </dl>

                                    <button
                                        onClick={() => setShowShare(true)}
                                        className="mp-cta mt-8 flex w-full items-center justify-center gap-3 border border-[#ebe6dd] py-4 text-[11px] uppercase tracking-[0.32em] text-[#ebe6dd]"
                                    >
                                        Share Press Kit →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                {/* ── FOOTER ────────────────────────────────────────────────── */}
                <footer className="border-t border-[#ebe6dd]/10 bg-[#070707] px-6 py-14 md:px-12">
                    <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-end">
                        <div>
                            <p className="mp-display mp-wrap text-5xl italic text-[#ebe6dd] md:text-6xl">
                                {modelName}
                            </p>
                            <p className="mp-mono mp-wrap mt-3 text-[10px] uppercase tracking-[0.32em] text-[#b8946a]">
                                Portfolio — Vol. {yearLabel}
                            </p>
                        </div>
                        <div className="text-left md:text-right">
                            <p className="mp-mono text-[10px] uppercase tracking-[0.32em] text-[#ebe6dd]/45">
                                © {yearLabel} · All Rights Reserved
                            </p>
                            <p className="mp-mono mt-2 text-[10px] uppercase tracking-[0.32em] text-[#ebe6dd]/30">
                                Crafted as a sealed lookbook
                            </p>
                        </div>
                    </div>
                </footer>

                {/* Floating share */}
                <button
                    aria-label="Share portfolio"
                    onClick={() => setShowShare(true)}
                    className="mp-cta mp-floating-share z-50 flex max-w-[calc(100vw-2.5rem)] items-center gap-3 border border-[#ebe6dd]/60 bg-[#0a0a0a]/85 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-[#ebe6dd] backdrop-blur-md"
                >
                    <span className="mp-dot" />
                    Share
                </button>

                {showShare && <ShareModal onClose={() => setShowShare(false)} title={modelName} />}
            </div>
        </>
    );
}

