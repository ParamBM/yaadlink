
import React, { useEffect, useMemo, useState } from 'react';
import { formatDisplayDate, formatMilestoneDate, getThemeStoryContent } from '../shared';

function ApertureMark({ className = '', size = 56 }) {
    return (
        <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.45" />
            <circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.85" />
            {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i * 360) / 8;
                return (
                    <line
                        key={i}
                        x1="50"
                        y1="50"
                        x2="50"
                        y2="16"
                        stroke="currentColor"
                        strokeWidth="1"
                        opacity="0.7"
                        transform={`rotate(${angle} 50 50)`}
                    />
                );
            })}
            <circle cx="50" cy="50" r="3" fill="currentColor" />
        </svg>
    );
}

function CrossMark({ className = '' }) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="1" />
            <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1" />
            <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
    );
}

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
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-md border border-[#e85d3a]/40 bg-[#0a0908] p-10 text-left">
                <div className="absolute -top-px left-6 -translate-y-1/2 bg-[#0a0908] px-3 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.32em] text-[#e85d3a]">
                    REC ?
                </div>
                <p className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#7a756c]">
                    Frame / Share
                </p>
                <h3 className="mt-3 font-['Bodoni_Moda'] text-[34px] leading-none text-[#ede8df]">
                    Share this roll
                </h3>
                <p className="mt-3 text-[13px] leading-6 text-[#a39f96]">
                    Send {title || 'this portfolio'} as a single link to a collaborator, agent, or magazine.
                </p>
                <div className="mt-6 flex items-stretch border border-[#2a2723]">
                    <input
                        readOnly
                        value={url}
                        className="min-w-0 flex-1 bg-transparent px-3 py-3 font-['JetBrains_Mono'] text-[11px] text-[#ede8df] outline-none"
                    />
                    <button
                        onClick={handleCopy}
                        className="whitespace-nowrap bg-[#e85d3a] px-5 py-3 font-['JetBrains_Mono'] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#0a0908] transition hover:bg-[#ff7a4f]"
                    >
                        {copied ? 'COPIED ?' : 'COPY LINK'}
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="mt-6 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.28em] text-[#7a756c] transition hover:text-[#e85d3a]"
                >
                    [ esc ] close
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

function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function pad(n, len = 2) {
    return String(n).padStart(len, '0');
}

export default function LensNoir({ data }) {
    const content = getThemeStoryContent(data);
    const [showShare, setShowShare] = useState(false);
    const [navVisible, setNavVisible] = useState(false);
    const [clock, setClock] = useState('00:00:00');
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const onScroll = () => {
            setScrollY(window.scrollY);
            setNavVisible(window.scrollY > window.innerHeight * 0.6);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const tick = () => {
            const d = new Date();
            setClock(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
        };
        tick();
        const id = window.setInterval(tick, 1000);
        return () => window.clearInterval(id);
    }, []);

    const galleryImages = useMemo(() => buildGalleryImages(content), [content]);
    const heroImage = content.coverImageUrl || galleryImages[0]?.src;
    const aboutImage = galleryImages[0]?.src || content.coverImageUrl;
    const closingImage = galleryImages[galleryImages.length - 1]?.src;

    const photographer = content.people[0] || content.title || 'Photographer';
    const alias = content.people[1] || '';
    const displayName = alias ? `${photographer} (${alias})` : photographer;
    const initials = (photographer.charAt(0) || 'L').toUpperCase() + (alias.charAt(0) || photographer.split(' ')[1]?.charAt(0) || 'N').toUpperCase();

    const displayDate = formatDisplayDate(content.rawDate) || content.dateLabel;
    const storyParagraphs = (content.summary || '')
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean);

    const navSections = [
        storyParagraphs.length ? { id: 'about', label: 'About', code: '01' } : null,
        content.milestones.length ? { id: 'works', label: 'Works', code: '02' } : null,
        galleryImages.length ? { id: 'gallery', label: 'Gallery', code: '03' } : null,
        { id: 'closing', label: 'Closing', code: '04' },
    ].filter(Boolean);

    const marqueeBits = [
        photographer.toUpperCase(),
        alias ? `(${alias.toUpperCase()})` : null,
        content.location?.toUpperCase(),
        displayDate,
        'ISO 400',
        'F/1.4',
        '35MM',
        'KODAK PORTRA',
        'ROLL 01',
    ].filter(Boolean);
    const marqueeText = marqueeBits.join('   ?   ');

    return (
        <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link
                href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Anton&family=JetBrains+Mono:wght@300;400;500;700&display=swap"
                rel="stylesheet"
            />

            <style>{`
                .ln-root {
                    background: #0a0908;
                    color: #ede8df;
                    font-family: 'JetBrains Mono', monospace;
                    min-height: 100vh;
                    overflow-x: hidden;
                    cursor: none;
                }
                .ln-root ::selection {
                    background: #e85d3a;
                    color: #0a0908;
                }
                .ln-wrap { overflow-wrap: anywhere; word-break: normal; }
                /* Film grain overlay (entire page) */
                .ln-grain {
                    pointer-events: none;
                    position: fixed;
                    inset: 0;
                    z-index: 90;
                    opacity: 0.18;
                    mix-blend-mode: overlay;
                    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.92  0 0 0 0 0.91  0 0 0 0 0.87  0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
                    animation: ln-grain-shift 1.6s steps(6) infinite;
                }
                /* Light leak / vignette overlay */
                .ln-leak {
                    pointer-events: none;
                    position: absolute;
                    inset: 0;
                    background:
                        radial-gradient(ellipse at 12% 8%, rgba(232, 93, 58, 0.22), transparent 36%),
                        radial-gradient(ellipse at 92% 70%, rgba(58, 92, 116, 0.18), transparent 42%),
                        radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.85), transparent 55%),
                        linear-gradient(180deg, rgba(10,9,8,0.45) 0%, rgba(10,9,8,0.05) 35%, rgba(10,9,8,0.95) 100%);
                }
                .ln-vignette::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at 50% 55%, transparent 40%, rgba(0,0,0,0.75) 100%);
                    pointer-events: none;
                }
                /* Custom crosshair cursor */
                .ln-cursor {
                    position: fixed;
                    width: 28px;
                    height: 28px;
                    pointer-events: none;
                    z-index: 200;
                    transform: translate(-50%, -50%);
                    color: #e85d3a;
                    mix-blend-mode: difference;
                    transition: transform 0.08s ease-out;
                }
                /* Marquee */
                @keyframes ln-marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .ln-marquee {
                    display: inline-flex;
                    white-space: nowrap;
                    animation: ln-marquee 38s linear infinite;
                }
                /* Aperture rotation */
                @keyframes ln-spin { to { transform: rotate(360deg); } }
                .ln-spin-slow { animation: ln-spin 32s linear infinite; }
                /* Blink */
                @keyframes ln-blink { 0%, 70% { opacity: 1; } 71%, 100% { opacity: 0.15; } }
                .ln-blink { animation: ln-blink 1.4s steps(2) infinite; }
                /* Grain shift */
                @keyframes ln-grain-shift {
                    0%, 100% { transform: translate(0,0); }
                    20% { transform: translate(-2%, 1%); }
                    40% { transform: translate(1%, -2%); }
                    60% { transform: translate(-1%, 2%); }
                    80% { transform: translate(2%, -1%); }
                }
                /* Sprocket / film strip */
                .ln-sprocket {
                    background-image:
                        radial-gradient(circle at 50% 50%, #0a0908 0 6px, transparent 7px);
                    background-size: 28px 28px;
                    background-repeat: repeat-x;
                }
                /* Hero typography fill animation on hover */
                .ln-name-line {
                    background: linear-gradient(90deg, #ede8df 0% 50%, transparent 50% 100%);
                    background-size: 200% 100%;
                    background-position: 100% 0;
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    -webkit-text-stroke: 1px #ede8df;
                    transition: background-position 0.9s cubic-bezier(0.7, 0, 0.3, 1);
                }
                .ln-name-line.is-filled,
                .ln-name-line:hover {
                    background-position: 0 0;
                }
                /* Frame card hover */
                .ln-frame-card {
                    position: relative;
                    transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
                }
                .ln-frame-card:hover {
                    transform: translateY(-4px);
                }
                .ln-frame-card:hover .ln-frame-img {
                    filter: grayscale(0%) contrast(1.05);
                }
                .ln-frame-img {
                    filter: grayscale(60%) contrast(1.08);
                    transition: filter 0.6s ease, transform 0.7s ease;
                }
                /* Gallery hover (aperture close) */
                .ln-gallery-tile {
                    position: relative;
                    overflow: hidden;
                }
                .ln-gallery-tile img {
                    transition: transform 1s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.6s ease;
                    filter: grayscale(40%) brightness(0.85) contrast(1.08);
                }
                .ln-gallery-tile:hover img {
                    transform: scale(1.06);
                    filter: grayscale(0%) brightness(1) contrast(1.1);
                }
                .ln-gallery-tile::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(160deg, rgba(232,93,58,0.0) 60%, rgba(232,93,58,0.35) 100%);
                    opacity: 0;
                    transition: opacity 0.5s ease;
                    pointer-events: none;
                    z-index: 1;
                }
                .ln-gallery-tile:hover::before { opacity: 1; }
                .ln-gallery-meta {
                    position: absolute;
                    inset: auto 0 0 0;
                    padding: 14px 16px;
                    z-index: 2;
                    display: flex;
                    justify-content: space-between;
                    align-items: end;
                    transform: translateY(8px);
                    opacity: 0;
                    transition: opacity 0.5s ease, transform 0.5s ease;
                }
                .ln-gallery-tile:hover .ln-gallery-meta {
                    opacity: 1;
                    transform: translateY(0);
                }
                /* Side rails */
                .ln-rail {
                    position: fixed;
                    top: 0;
                    bottom: 0;
                    width: 56px;
                    z-index: 60;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    pointer-events: none;
                    border-left: 1px solid rgba(237,232,223,0.08);
                    border-right: 1px solid rgba(237,232,223,0.08);
                }
                .ln-rail-text {
                    writing-mode: vertical-rl;
                    transform: rotate(180deg);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 10px;
                    letter-spacing: 0.4em;
                    color: #7a756c;
                    text-transform: uppercase;
                }
                /* Hero giant type */
                .ln-hero-name {
                    font-family: 'Bodoni Moda', serif;
                    font-weight: 500;
                    font-style: italic;
                    line-height: 0.82;
                    letter-spacing: -0.04em;
                }
                .ln-anton {
                    font-family: 'Anton', sans-serif;
                    letter-spacing: 0.02em;
                }
                .ln-bracket {
                    color: #e85d3a;
                    font-style: normal;
                    font-weight: 400;
                }
                /* Hide custom cursor on touch */
                @media (hover: none) {
                    .ln-root { cursor: auto; }
                    .ln-cursor { display: none; }
                }
                /* Reveal */
                @keyframes ln-rise {
                    from { transform: translateY(40px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .ln-rise { animation: ln-rise 1.1s cubic-bezier(0.2,0.8,0.2,1) both; }
            `}</style>

            {/* Custom crosshair cursor */}
            <div className="ln-cursor" id="ln-cursor-el">
                <CrossMark className="h-7 w-7" />
            </div>
            <CursorTracker />

            <div className="ln-root">
                <div className="ln-grain" />

                {/* Side rails */}
                <div className="ln-rail left-0 hidden md:flex">
                    <span className="ln-rail-text">{photographer.toUpperCase()} — ROLL 01 / {pad(navSections.length)}</span>
                </div>
                <div className="ln-rail right-0 hidden md:flex">
                    <span className="ln-rail-text">{clock} — REC ? — {alias ? alias.toUpperCase() : 'STUDIO'}</span>
                </div>

                {/* Top floating nav */}
                <header
                    className="fixed inset-x-0 top-0 z-[100] border-b border-[#1d1a16] px-6 md:px-16"
                    style={{
                        background: 'rgba(10,9,8,0.78)',
                        backdropFilter: 'blur(14px)',
                        WebkitBackdropFilter: 'blur(14px)',
                        opacity: navVisible ? 1 : 0,
                        transform: navVisible ? 'translateY(0)' : 'translateY(-100%)',
                        transition: 'opacity 0.35s ease, transform 0.35s ease',
                    }}
                >
                    <div className="mx-auto flex h-14 max-w-[1480px] items-center justify-between gap-6">
                        <button
                            onClick={() => scrollToSection('hero')}
                            className="flex items-center gap-3 font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#ede8df]"
                        >
                            <span className="ln-blink text-[#e85d3a]">?</span>
                            <span>{initials}</span>
                            <span className="text-[#7a756c]">/</span>
                            <span className="text-[#7a756c]">{photographer.toUpperCase()}</span>
                        </button>
                        <nav className="hidden items-center gap-7 md:flex">
                            {navSections.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => scrollToSection(s.id)}
                                    className="group flex items-center gap-2 font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.28em] text-[#7a756c] transition hover:text-[#ede8df]"
                                >
                                    <span className="text-[#e85d3a]">{s.code}</span>
                                    <span>{s.label}</span>
                                </button>
                            ))}
                        </nav>
                        <button
                            onClick={() => setShowShare(true)}
                            className="group flex items-center gap-2 border border-[#e85d3a]/60 px-4 py-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.28em] text-[#e85d3a] transition hover:bg-[#e85d3a] hover:text-[#0a0908]"
                        >
                            ? Share Roll
                        </button>
                    </div>
                </header>

                <main className="md:px-14">
                    {/* HERO */}
                    <section
                        id="hero"
                        className="relative flex min-h-screen flex-col justify-end overflow-hidden px-6 pb-16 pt-28 md:pb-24 md:pt-24"
                    >
                        {heroImage && (
                            <img
                                src={heroImage}
                                alt={photographer}
                                className="absolute inset-0 h-full w-full object-cover"
                                style={{
                                    transform: `scale(1.08) translateY(${scrollY * 0.18}px)`,
                                    filter: 'grayscale(35%) contrast(1.1) brightness(0.7)',
                                }}
                            />
                        )}
                        <div className="ln-leak" />

                        {/* Top corner timecode + aperture */}
                        <div className="absolute left-6 top-6 z-10 flex items-center gap-3 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.28em] text-[#ede8df] md:left-16 md:top-8">
                            <span className="ln-blink text-[#e85d3a]">? REC</span>
                            <span className="text-[#7a756c]">|</span>
                            <span>{clock}</span>
                            <span className="text-[#7a756c]">|</span>
                            <span>ISO 400 · F/1.4</span>
                        </div>
                        <div className="absolute right-6 top-6 z-10 hidden items-center gap-4 md:right-16 md:top-8 md:flex">
                            <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#ede8df]">
                                ROLL 01 / TAKE 01
                            </span>
                            <span className="ln-spin-slow text-[#e85d3a]">
                                <ApertureMark size={36} />
                            </span>
                        </div>

                        {/* Editorial metadata strip */}
                        <div className="relative z-10 mb-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.28em] text-[#ede8df]/80">
                            <span className="text-[#e85d3a]">[ 01 ]</span>
                            <span>{content.eyebrow || 'Photographer Portfolio'}</span>
                            {content.location && (
                                <>
                                    <span className="text-[#7a756c]">/</span>
                                    <span>{content.location.toUpperCase()}</span>
                                </>
                            )}
                            {displayDate && (
                                <>
                                    <span className="text-[#7a756c]">/</span>
                                    <span>{displayDate}</span>
                                </>
                            )}
                        </div>

                        {/* Massive name */}
                        <div className="relative z-10 ln-rise">
                            <h1 className="ln-hero-name ln-wrap text-[clamp(64px,16vw,220px)] text-[#ede8df]">
                                <span className="block">
                                    {photographer}
                                </span>
                                {alias && (
                                    <span className="ln-anton block pt-3 text-[clamp(20px,3.6vw,46px)] not-italic text-[#e85d3a]">
                                        ({alias.toUpperCase()})
                                    </span>
                                )}
                            </h1>
                        </div>

                        {/* Subtitle row */}
                        <div className="relative z-10 mt-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                            <p className="max-w-md font-['Bodoni_Moda'] text-base italic leading-7 text-[#ede8df]/85 md:text-lg">
                                — {content.subtitle || 'A study in shadow, skin, and silver halide.'}
                            </p>
                            <button
                                onClick={() => scrollToSection(navSections[0]?.id || 'works')}
                                className="group flex items-center gap-3 self-start font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.28em] text-[#ede8df] transition hover:text-[#e85d3a] md:self-end"
                            >
                                <span className="h-px w-12 bg-[#ede8df] transition group-hover:w-20 group-hover:bg-[#e85d3a]" />
                                Open Portfolio
                            </button>
                        </div>

                        {/* Bottom marquee */}
                        <div className="absolute bottom-0 left-0 right-0 z-10 overflow-hidden border-y border-[#e85d3a]/40 bg-[#0a0908]/60 py-3">
                            <div className="ln-marquee font-['Anton'] text-[18px] tracking-[0.06em] text-[#ede8df]">
                                <span className="px-8">{marqueeText}</span>
                                <span className="px-8">{marqueeText}</span>
                            </div>
                        </div>
                    </section>

                    {/* ABOUT */}
                    {storyParagraphs.length > 0 && (
                        <section id="about" className="relative mx-auto max-w-[1480px] px-6 py-32 md:px-14">
                            <div className="grid gap-16 md:grid-cols-12">
                                <div className="md:col-span-2">
                                    <div className="sticky top-28 flex flex-col gap-3">
                                        <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.32em] text-[#e85d3a]">
                                            01 — About
                                        </span>
                                        <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.28em] text-[#7a756c]">
                                            Portrait of the Lens
                                        </span>
                                    </div>
                                </div>
                                <div className="md:col-span-6">
                                    <h2 className="ln-anton mb-10 text-[clamp(38px,5vw,70px)] uppercase leading-[0.95] text-[#ede8df]">
                                        Behind the<br />
                                        <span className="text-[#e85d3a]">viewfinder.</span>
                                    </h2>
                                    {storyParagraphs.map((p, i) => (
                                        <p
                                            key={i}
                                            className="mb-6 font-['Bodoni_Moda'] text-[17px] leading-[1.85] text-[#c4beb3] md:text-[19px]"
                                        >
                                            <span className="mr-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#7a756c]">
                                                ¶ {pad(i + 1)}
                                            </span>
                                            {p}
                                        </p>
                                    ))}
                                </div>
                                <div className="md:col-span-4">
                                    {aboutImage && (
                                        <div className="relative">
                                            <div className="absolute -left-3 -top-3 h-6 w-6 border-l border-t border-[#e85d3a]" />
                                            <div className="absolute -bottom-3 -right-3 h-6 w-6 border-b border-r border-[#e85d3a]" />
                                            <img
                                                src={aboutImage}
                                                alt={photographer}
                                                className="ln-frame-img block aspect-[3/4] w-full object-cover"
                                            />
                                            <div className="mt-3 flex items-center justify-between font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.28em] text-[#7a756c]">
                                                <span>Frame 01 / Self</span>
                                                <span>{displayDate || 'undated'}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* WORKS / MILESTONES */}
                    {content.milestones.length > 0 && (
                        <section id="works" className="relative border-y border-[#1d1a16] bg-[#070605] py-32">
                            <div className="mx-auto max-w-[1480px] px-6 md:px-14">
                                <div className="mb-20 grid gap-6 md:grid-cols-12 md:items-end">
                                    <div className="md:col-span-2">
                                        <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.32em] text-[#e85d3a]">
                                            02 — Works
                                        </span>
                                    </div>
                                    <div className="md:col-span-7">
                                        <h2 className="ln-anton text-[clamp(40px,6vw,82px)] uppercase leading-[0.92] text-[#ede8df]">
                                            Selected<br />
                                            <span className="italic text-[#e85d3a]">campaigns &amp; editorials.</span>
                                        </h2>
                                    </div>
                                    <div className="md:col-span-3">
                                        <p className="font-['Bodoni_Moda'] text-[14px] italic leading-7 text-[#7a756c]">
                                            — A reel of the moments worth printing twice.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-24">
                                    {content.milestones.map((m, idx) => {
                                        const isOdd = idx % 2 === 1;
                                        return (
                                            <article
                                                key={m.key}
                                                className="ln-frame-card grid gap-8 md:grid-cols-12 md:items-center"
                                            >
                                                <div className={`md:col-span-1 ${isOdd ? 'md:order-3' : ''}`}>
                                                    <div className="font-['Bodoni_Moda'] text-[64px] italic leading-none text-[#e85d3a] md:text-[88px]">
                                                        {pad(idx + 1)}
                                                    </div>
                                                </div>

                                                <div
                                                    className={`relative md:col-span-6 ${
                                                        isOdd ? 'md:order-2' : ''
                                                    }`}
                                                >
                                                    {m.imageUrl ? (
                                                        <>
                                                            {/* Sprocket strip */}
                                                            <div className="ln-sprocket h-3 w-full opacity-80" style={{ background: '#1d1a16' }} />
                                                            <div className="relative">
                                                                <img
                                                                    src={m.imageUrl}
                                                                    alt={m.title}
                                                                    className="ln-frame-img block aspect-[16/10] w-full object-cover"
                                                                />
                                                                <div className="absolute left-3 top-3 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.28em] text-[#ede8df]/90">
                                                                    {pad(idx + 1)} / {pad(content.milestones.length)}
                                                                </div>
                                                                <div className="absolute right-3 top-3 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.28em] text-[#e85d3a]">
                                                                    ? {formatMilestoneDate(m.date) || '—'}
                                                                </div>
                                                            </div>
                                                            <div className="ln-sprocket h-3 w-full opacity-80" style={{ background: '#1d1a16' }} />
                                                        </>
                                                    ) : (
                                                        <div className="aspect-[16/10] w-full border border-dashed border-[#2a2723]" />
                                                    )}
                                                </div>

                                                <div
                                                    className={`md:col-span-5 ${
                                                        isOdd ? 'md:order-1 md:pr-8' : 'md:pl-2'
                                                    }`}
                                                >
                                                    <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#7a756c]">
                                                        {formatMilestoneDate(m.date) || `Chapter ${idx + 1}`}
                                                    </span>
                                                    <h3 className="ln-anton mt-4 text-[clamp(28px,3.4vw,48px)] uppercase leading-[1.02] text-[#ede8df]">
                                                        {m.title}
                                                    </h3>
                                                    {m.description && (
                                                        <p className="mt-5 font-['Bodoni_Moda'] text-[17px] leading-[1.8] text-[#c4beb3]">
                                                            {m.description}
                                                        </p>
                                                    )}
                                                    <div className="mt-6 flex items-center gap-3 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.28em] text-[#7a756c]">
                                                        <span className="h-px w-10 bg-[#e85d3a]" />
                                                        ISO 400 · F/2.0 · 50mm
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* GALLERY */}
                    {galleryImages.length > 0 && (
                        <section id="gallery" className="relative py-32">
                            <div className="mx-auto max-w-[1480px] px-6 md:px-14">
                                <div className="mb-16 grid gap-6 md:grid-cols-12 md:items-end">
                                    <div className="md:col-span-2">
                                        <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.32em] text-[#e85d3a]">
                                            03 — Gallery
                                        </span>
                                    </div>
                                    <div className="md:col-span-7">
                                        <h2 className="ln-anton text-[clamp(40px,6vw,80px)] uppercase leading-[0.92] text-[#ede8df]">
                                            Contact<br />
                                            <span className="italic text-[#e85d3a]">sheet.</span>
                                        </h2>
                                    </div>
                                    <div className="md:col-span-3 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.28em] text-[#7a756c]">
                                        {pad(galleryImages.length)} frames · negatives archived
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 gap-3">
                                    {galleryImages.map((img, idx) => {
                                        // Asymmetric editorial layout
                                        const layouts = [
                                            'col-span-12 md:col-span-7 aspect-[4/5]',
                                            'col-span-12 md:col-span-5 aspect-[4/5]',
                                            'col-span-6 md:col-span-4 aspect-[3/4]',
                                            'col-span-6 md:col-span-8 aspect-[16/10]',
                                            'col-span-12 md:col-span-6 aspect-[4/5]',
                                            'col-span-12 md:col-span-6 aspect-[4/5]',
                                        ];
                                        const cls = layouts[idx % layouts.length];
                                        return (
                                            <figure
                                                key={img.key || img.src || idx}
                                                className={`ln-gallery-tile ${cls}`}
                                            >
                                                <img
                                                    src={img.src}
                                                    alt={img.alt || `Frame ${idx + 1}`}
                                                    className="block h-full w-full object-cover"
                                                />
                                                <figcaption className="ln-gallery-meta font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.28em] text-[#ede8df]">
                                                    <span>{img.caption || img.alt || `Frame ${pad(idx + 1)}`}</span>
                                                    <span className="text-[#e85d3a]">
                                                        {pad(idx + 1)} / {pad(galleryImages.length)}
                                                    </span>
                                                </figcaption>
                                            </figure>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* CLOSING FRAME */}
                    <section
                        id="closing"
                        className="relative overflow-hidden border-t border-[#1d1a16] bg-[#070605] py-32"
                    >
                        {closingImage && (
                            <img
                                src={closingImage}
                                alt="closing"
                                className="absolute inset-0 h-full w-full object-cover opacity-25"
                                style={{ filter: 'grayscale(100%) contrast(1.2) brightness(0.55)' }}
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-[#070605] via-[#070605]/40 to-[#070605]" />

                        <div className="relative mx-auto max-w-[1180px] px-6 text-center md:px-14">
                            <div className="flex items-center justify-center gap-4">
                                <span className="h-px w-16 bg-[#e85d3a]" />
                                <span className="ln-spin-slow text-[#e85d3a]">
                                    <ApertureMark size={48} />
                                </span>
                                <span className="h-px w-16 bg-[#e85d3a]" />
                            </div>
                            <p className="mt-10 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.32em] text-[#7a756c]">
                                04 — Closing Frame
                            </p>
                            <blockquote className="mx-auto mt-6 max-w-3xl font-['Bodoni_Moda'] text-[clamp(28px,3.6vw,52px)] italic leading-[1.18] text-[#ede8df]">
                                <span className="text-[#e85d3a]">“</span>
                                {content.finalMessage ||
                                    'I do not photograph people, I photograph the light that briefly chooses them.'}
                                <span className="text-[#e85d3a]">”</span>
                            </blockquote>
                            <p className="mt-10 ln-anton text-[clamp(22px,3vw,36px)] uppercase tracking-[0.04em] text-[#e85d3a]">
                                — {photographer}
                                {alias && <span className="text-[#ede8df]"> ({alias})</span>}
                            </p>
                        </div>
                    </section>
                </main>

                {/* FOOTER / COLOPHON */}
                <footer className="border-t border-[#1d1a16] bg-[#0a0908] px-6 py-16 md:px-14">
                    <div className="mx-auto grid max-w-[1480px] gap-10 md:grid-cols-12">
                        <div className="md:col-span-5">
                            <p className="ln-anton text-[40px] uppercase leading-none text-[#ede8df]">
                                {displayName}
                            </p>
                            {content.location && (
                                <p className="mt-3 font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#7a756c]">
                                    Based in {content.location}
                                </p>
                            )}
                        </div>
                        <div className="md:col-span-3">
                            <p className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#e85d3a]">
                                Colophon
                            </p>
                            <ul className="mt-3 space-y-1 font-['JetBrains_Mono'] text-[11px] text-[#7a756c]">
                                <li>Set in Bodoni Moda &amp; Anton</li>
                                <li>Mono: JetBrains Mono</li>
                                <li>Negatives archived since {displayDate || '—'}</li>
                            </ul>
                        </div>
                        <div className="md:col-span-4">
                            <p className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#e85d3a]">
                                Index
                            </p>
                            <ul className="mt-3 grid grid-cols-2 gap-1 font-['JetBrains_Mono'] text-[11px] text-[#ede8df]">
                                {navSections.map((s) => (
                                    <li key={s.id}>
                                        <button
                                            onClick={() => scrollToSection(s.id)}
                                            className="transition hover:text-[#e85d3a]"
                                        >
                                            {s.code} — {s.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="mx-auto mt-12 flex max-w-[1480px] items-center justify-between border-t border-[#1d1a16] pt-6 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#7a756c]">
                        <span>© {new Date().getFullYear()} {photographer}</span>
                        <span className="ln-blink text-[#e85d3a]">? END OF ROLL</span>
                    </div>
                </footer>

                {/* Floating share dial */}
                <button
                    aria-label="Share portfolio"
                    onClick={() => setShowShare(true)}
                    className="group fixed bottom-6 right-6 z-[110] flex h-16 w-16 items-center justify-center border border-[#e85d3a]/60 bg-[#0a0908]/90 text-[#e85d3a] backdrop-blur transition hover:bg-[#e85d3a] hover:text-[#0a0908]"
                >
                    <span className="ln-spin-slow group-hover:[animation-duration:6s]">
                        <ApertureMark size={36} />
                    </span>
                </button>

                {showShare && <ShareModal onClose={() => setShowShare(false)} title={displayName} />}
            </div>
        </>
    );
}

/* Tracks the mouse and moves the custom crosshair cursor element */
function CursorTracker() {
    useEffect(() => {
        const el = document.getElementById('ln-cursor-el');
        if (!el) return undefined;
        const onMove = (e) => {
            el.style.left = `${e.clientX}px`;
            el.style.top = `${e.clientY}px`;
        };
        const onDown = () => {
            el.style.transform = 'translate(-50%, -50%) scale(0.7)';
        };
        const onUp = () => {
            el.style.transform = 'translate(-50%, -50%) scale(1)';
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mousedown', onDown);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mousedown', onDown);
            window.removeEventListener('mouseup', onUp);
        };
    }, []);
    return null;
}





