import React, { useEffect, useMemo, useState } from 'react';
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
            <div className="absolute inset-0 bg-[#1a1a1a]/55 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md border-2 border-[#111111] bg-[#f3ede1] p-10 text-left shadow-[12px_12px_0_#c8200e]">
                <p className="cp-mono mb-3 text-[10px] uppercase tracking-[0.4em] text-[#c8200e]">
                    № 01 — Press
                </p>
                <h3 className="cp-serif mb-2 text-4xl text-[#111111]">
                    Send the comp card.
                </h3>
                <p className="cp-sans mb-7 text-sm leading-7 text-[#111111]/65">
                    One link with everything an agency or casting director needs to know about {title || 'this model'}.
                </p>
                <div className="flex border-2 border-[#111111]">
                    <input
                        readOnly
                        value={url}
                        className="cp-mono min-w-0 flex-1 bg-[#f3ede1] px-4 py-3 text-xs text-[#111111] outline-none"
                    />
                    <button
                        onClick={handleCopy}
                        className="whitespace-nowrap border-l-2 border-[#111111] bg-[#111111] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#f3ede1] transition hover:bg-[#c8200e]"
                    >
                        {copied ? 'Copied ✓' : 'Copy Link'}
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="cp-mono mt-6 text-[10px] uppercase tracking-[0.32em] text-[#111111]/50 transition hover:text-[#c8200e]"
                >
                    ← Close
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
        { id: 'cp-cover', label: 'Cover' },
        hasStory ? { id: 'cp-subject', label: 'Subject' } : null,
        hasMilestones ? { id: 'cp-index', label: 'Index' } : null,
        hasGallery ? { id: 'cp-contact', label: 'Sheet' } : null,
        { id: 'cp-card', label: 'Comp Card' },
    ].filter(Boolean);
}

function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function useReveal() {
    useEffect(() => {
        const els = document.querySelectorAll('[data-cp-reveal]');
        if (!els.length) return undefined;
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        e.target.classList.add('cp-in');
                        io.unobserve(e.target);
                    }
                });
            },
            { threshold: 0.14, rootMargin: '0px 0px -60px 0px' },
        );
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, []);
}

export default function CouturePress({ data }) {
    const content = getThemeStoryContent(data);
    const [showShare, setShowShare] = useState(false);
    const [navVisible, setNavVisible] = useState(false);
    const [hoverIdx, setHoverIdx] = useState(null);
    const [cursor, setCursor] = useState({ x: -100, y: -100, active: false });

    useEffect(() => {
        const onScroll = () => {
            setNavVisible(window.scrollY > window.innerHeight * 0.7);
        };
        const onMove = (e) => setCursor((c) => ({ ...c, x: e.clientX, y: e.clientY }));
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('mousemove', onMove);
        onScroll();
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('mousemove', onMove);
        };
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
    const subjectImage = galleryImages[1]?.src || galleryImages[0]?.src || heroImage;
    const editorImage = galleryImages[2]?.src || galleryImages[0]?.src || heroImage;

    const modelName = content.people?.length > 1
        ? `${content.people[0]} (${content.people[1]})`
        : content.title || content.people?.[0] || 'Untitled Model';
    const heroNameLines = content.people?.length > 1 ? [content.people[0], `(${content.people[1]})`] : [modelName];
    const initials = content.initials || modelName.split(' ').map((n) => n.charAt(0).toUpperCase()).join('').slice(0, 2) || 'CP';
    const navSections = buildNavSections(storyParagraphs.length > 0, content.milestones.length > 0, galleryImages.length > 0);
    const issueNo = String((yearLabel.toString().slice(-2) || '01')).padStart(2, '0');

    return (
        <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link
                href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..900,0..100;1,9..144,300..900,0..100&family=Familjen+Grotesk:ital,wght@0,400..700;1,400..700&family=IBM+Plex+Mono:wght@300;400;500;600&display=swap"
                rel="stylesheet"
            />

            <style>{`
                .cp-root {
                    background: #f3ede1;
                    color: #111111;
                    font-family: 'Familjen Grotesk', sans-serif;
                    min-height: 100vh;
                    overflow-x: hidden;
                    cursor: none;
                }
                .cp-root ::selection { background: #c8200e; color: #f3ede1; }
                @media (max-width: 900px) { .cp-root { cursor: auto; } .cp-cursor { display: none; } }

                .cp-serif { font-family: 'Fraunces', serif; font-variation-settings: 'opsz' 144, 'SOFT' 50; letter-spacing: -0.025em; }
                .cp-serif-italic { font-family: 'Fraunces', serif; font-style: italic; font-variation-settings: 'opsz' 144, 'SOFT' 80; }
                .cp-sans { font-family: 'Familjen Grotesk', sans-serif; }
                .cp-mono { font-family: 'IBM Plex Mono', monospace; }
                .cp-wrap { overflow-wrap: anywhere; word-break: normal; }

                /* paper texture */
                .cp-paper::before {
                    content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 1;
                    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/></svg>");
                    opacity: 0.18; mix-blend-mode: multiply;
                }

                /* custom cursor */
                .cp-cursor {
                    position: fixed; top: 0; left: 0; width: 14px; height: 14px;
                    border-radius: 50%; background: #c8200e;
                    pointer-events: none; z-index: 200;
                    transform: translate(-50%, -50%);
                    transition: width .25s, height .25s, background .25s;
                    mix-blend-mode: difference;
                }
                .cp-cursor.cp-active { width: 56px; height: 56px; background: #111111; }

                /* progress dots in side rail */
                .cp-rail {
                    position: fixed; right: 28px; top: 50%; transform: translateY(-50%);
                    z-index: 40; display: flex; flex-direction: column; gap: 14px;
                }
                .cp-rail span {
                    width: 6px; height: 6px; border-radius: 50%;
                    background: transparent; border: 1.5px solid #111111;
                    transition: all .3s;
                }
                .cp-rail span.cp-active { background: #c8200e; border-color: #c8200e; transform: scale(1.4); }
                @media (max-width: 900px) { .cp-rail { display: none; } }

                /* big number outline */
                .cp-num-outline {
                    -webkit-text-stroke: 1.5px #111111;
                    color: transparent;
                    font-family: 'Fraunces', serif;
                    font-style: italic;
                    font-weight: 700;
                }

                /* polaroid gallery */
                .cp-poly {
                    position: relative; background: #fff; padding: 14px 14px 50px;
                    box-shadow: 0 12px 30px rgba(17,17,17,0.12), 0 2px 6px rgba(17,17,17,0.08);
                    transition: transform .55s cubic-bezier(.2,.8,.2,1), box-shadow .55s, z-index 0s .55s;
                }
                .cp-poly:hover {
                    transform: translateY(-10px) rotate(0deg) scale(1.04) !important;
                    box-shadow: 0 22px 50px rgba(17,17,17,0.22);
                    z-index: 5;
                    transition: transform .55s cubic-bezier(.2,.8,.2,1), box-shadow .55s, z-index 0s 0s;
                }
                .cp-poly img {
                    display: block; width: 100%; height: 100%;
                    object-fit: cover;
                    filter: contrast(1.05) saturate(0.95);
                }
                .cp-poly-cap {
                    position: absolute; bottom: 14px; left: 14px; right: 14px;
                    text-align: center;
                    font-family: 'Fraunces', serif; font-style: italic;
                    font-size: 14px; color: #111111;
                }

                /* index hover preview */
                .cp-index-row {
                    position: relative; transition: padding .4s, color .4s;
                }
                .cp-index-row:hover { padding-left: 24px; color: #c8200e; }
                .cp-index-row:hover .cp-index-pre { opacity: 1; transform: translate(-50%, -50%) rotate(-4deg) scale(1); }
                .cp-index-pre {
                    position: fixed; left: 50%; top: 50%;
                    transform: translate(-50%, -50%) rotate(-8deg) scale(0.85);
                    width: 280px; height: 360px; pointer-events: none;
                    opacity: 0; z-index: 30;
                    box-shadow: 0 28px 60px rgba(17,17,17,0.32);
                    transition: opacity .35s, transform .55s cubic-bezier(.2,.8,.2,1);
                }
                .cp-index-pre img { width:100%; height:100%; object-fit:cover; }

                /* reveals */
                [data-cp-reveal] {
                    opacity: 0; transform: translateY(28px);
                    transition: opacity .85s cubic-bezier(.2,.8,.2,1), transform .85s cubic-bezier(.2,.8,.2,1);
                }
                [data-cp-reveal].cp-in { opacity: 1; transform: translateY(0); }
                [data-cp-reveal-d="1"] { transition-delay: .08s; }
                [data-cp-reveal-d="2"] { transition-delay: .18s; }
                [data-cp-reveal-d="3"] { transition-delay: .28s; }
                [data-cp-reveal-d="4"] { transition-delay: .38s; }

                /* clip reveal for hero image */
                .cp-clip {
                    clip-path: inset(0 100% 0 0);
                    animation: cp-clip 1.2s cubic-bezier(.7,.05,.2,1) .25s forwards;
                }
                @keyframes cp-clip { to { clip-path: inset(0 0 0 0); } }

                /* marquee tape */
                .cp-tape {
                    background: #c8200e; color: #f3ede1;
                    transform: rotate(-1.6deg);
                    box-shadow: 0 6px 0 #111111;
                }
                .cp-tape-inner {
                    display: flex; gap: 3rem;
                    animation: cp-scroll 30s linear infinite;
                    white-space: nowrap;
                }
                @keyframes cp-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }

                /* split letter reveal */
                .cp-letter {
                    display: inline-block; opacity: 0;
                    transform: translateY(70%) skewY(6deg);
                    animation: cp-letter 1s cubic-bezier(.2,.8,.2,1) forwards;
                }
                @keyframes cp-letter { to { opacity: 1; transform: translateY(0) skewY(0); } }

                /* drop cap */
                .cp-dropcap::first-letter {
                    font-family: 'Fraunces', serif;
                    font-style: italic;
                    font-size: 5.2em;
                    line-height: 0.85;
                    float: left;
                    padding: 6px 14px 0 0;
                    color: #c8200e;
                    font-weight: 600;
                }

                /* link underline */
                .cp-link { background-image: linear-gradient(#111111,#111111); background-size: 100% 1px; background-repeat: no-repeat; background-position: 0 100%; transition: background-size .4s; }
                .cp-link:hover { background-size: 0 1px; background-position: 100% 100%; }

                /* corner ticks */
                .cp-ticks::before, .cp-ticks::after {
                    content: ''; position: absolute; width: 18px; height: 18px;
                    border: 1.5px solid #111111;
                }
                .cp-ticks::before { top: -3px; left: -3px; border-right: none; border-bottom: none; }
                .cp-ticks::after { bottom: -3px; right: -3px; border-left: none; border-top: none; }
            `}</style>

            <div className="cp-root cp-paper">
                {/* custom cursor */}
                <div
                    className={`cp-cursor ${cursor.active ? 'cp-active' : ''}`}
                    style={{ transform: `translate(${cursor.x}px, ${cursor.y}px) translate(-50%, -50%)` }}
                />

                {/* fixed corner mark */}
                <div className="pointer-events-none fixed left-5 top-5 z-40 md:left-8 md:top-8">
                    <div className="cp-mono text-[10px] uppercase tracking-[0.4em] text-[#111111]">
                        ✶ {initials} / {issueNo}
                    </div>
                </div>
                <div className="pointer-events-none fixed right-5 top-5 z-40 hidden text-right md:right-8 md:top-8 md:block">
                    <div className="cp-mono text-[10px] uppercase tracking-[0.4em] text-[#111111]">
                        Issue / {yearLabel}
                    </div>
                </div>

                {/* side rail dots */}
                <div className="cp-rail">
                    {navSections.map((s, i) => (
                        <span
                            key={s.id}
                            className={i === 0 ? 'cp-active' : ''}
                            onMouseEnter={() => setCursor((c) => ({ ...c, active: true }))}
                            onMouseLeave={() => setCursor((c) => ({ ...c, active: false }))}
                        />
                    ))}
                </div>

                {/* nav */}
                <header
                    className="fixed inset-x-0 top-0 z-50 border-b border-[#111111]/15 px-6 md:px-10"
                    style={{
                        background: 'rgba(243,237,225,0.92)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        opacity: navVisible ? 1 : 0,
                        transform: navVisible ? 'translateY(0)' : 'translateY(-100%)',
                        transition: 'opacity .45s ease, transform .45s ease',
                    }}
                >
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6">
                        <button
                            onClick={() => scrollToSection('cp-cover')}
                            className="cp-serif-italic text-2xl text-[#111111]"
                            onMouseEnter={() => setCursor((c) => ({ ...c, active: true }))}
                            onMouseLeave={() => setCursor((c) => ({ ...c, active: false }))}
                        >
                            {modelName.split(' ')[0] || initials}.
                        </button>
                        <nav className="hidden items-center gap-8 md:flex">
                            {navSections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className="cp-mono cp-link text-[10px] uppercase tracking-[0.3em] text-[#111111]"
                                    onMouseEnter={() => setCursor((c) => ({ ...c, active: true }))}
                                    onMouseLeave={() => setCursor((c) => ({ ...c, active: false }))}
                                >
                                    {section.label}
                                </button>
                            ))}
                        </nav>
                        <button
                            onClick={() => setShowShare(true)}
                            className="cp-mono border-2 border-[#111111] bg-[#111111] px-5 py-2.5 text-[10px] uppercase tracking-[0.28em] text-[#f3ede1] transition hover:bg-[#c8200e] hover:border-[#c8200e]"
                            onMouseEnter={() => setCursor((c) => ({ ...c, active: true }))}
                            onMouseLeave={() => setCursor((c) => ({ ...c, active: false }))}
                        >
                            Send Card →
                        </button>
                    </div>
                </header>

                <main className="relative z-[2]">
                    {/* ── COVER : SWISS GRID ───────────────────────────────── */}
                    <section
                        id="cp-cover"
                        className="relative min-h-[100svh] px-6 pb-20 pt-24 md:px-12 md:pb-24 md:pt-28"
                    >
                        {/* masthead */}
                        <div className="mx-auto max-w-7xl border-y-2 border-[#111111] py-3">
                            <div className="cp-mono flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.32em] text-[#111111]">
                                <span>Couture Press</span>
                                <span className="hidden md:inline">{(content.eyebrow || 'Portfolio Edition').toUpperCase()}</span>
                                <span>Vol. {issueNo} / {yearLabel}</span>
                            </div>
                        </div>

                        <div className="mx-auto mt-12 grid max-w-7xl gap-8 md:grid-cols-12 md:gap-10">
                            {/* image left */}
                            <div className="relative md:col-span-5">
                                {heroImage && (
                                    <div className="cp-ticks relative">
                                        <div className="aspect-[3/4] w-full overflow-hidden bg-[#e7dfd0]">
                                            <img
                                                src={heroImage}
                                                alt={modelName}
                                                className="cp-clip h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="cp-mono mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-[0.3em] text-[#111111]">
                                            <span>Plate № 01</span>
                                            <span className="cp-wrap min-w-0 text-right">{content.location || 'Studio'}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* name + meta right */}
                            <div className="md:col-span-7 md:pl-4">
                                <p
                                    className="cp-mono cp-wrap mb-6 text-[10px] uppercase tracking-[0.4em] text-[#c8200e]"
                                    data-cp-reveal
                                >
                                    ✶ {(content.subtitle || 'Editorial · Runway · Campaign').toUpperCase()}
                                </p>
                                <h1 className="cp-serif cp-wrap text-[clamp(56px,11vw,180px)] leading-[0.86] text-[#111111]">
                                    {heroNameLines.map((line, li) => (
                                        <span key={line} className="block">
                                            {line.split(' ').map((word, wi) => (
                                                <span key={wi} className="mr-[0.12em] inline">
                                                    {word.split('').map((ch, ci) => (
                                                        <span
                                                            key={ci}
                                                            className="cp-letter"
                                                            style={{ animationDelay: `${(li * 8 + wi * 6 + ci) * 0.045 + 0.1}s` }}
                                                        >
                                                            {ch}
                                                        </span>
                                                    ))}
                                                </span>
                                            ))}
                                        </span>
                                    ))}
                                </h1>
                                <p
                                    className="cp-serif-italic mt-4 text-2xl text-[#c8200e] md:text-3xl"
                                    data-cp-reveal
                                    data-cp-reveal-d="2"
                                >
                                    — the {yearLabel} portfolio.
                                </p>

                                {/* spec cards */}
                                <div
                                    className="mt-10 grid grid-cols-2 gap-px bg-[#111111] md:grid-cols-4"
                                    data-cp-reveal
                                    data-cp-reveal-d="3"
                                >
                                    {[
                                        { k: 'Status', v: 'Now Booking' },
                                        { k: 'Based', v: content.location || 'Worldwide' },
                                        { k: 'Active', v: displayDate ? displayDate.split(',')[0] : '—' },
                                        { k: 'Edition', v: `№ ${issueNo}` },
                                    ].map((s) => (
                                        <div key={s.k} className="bg-[#f3ede1] p-5">
                                            <p className="cp-mono mb-2 text-[9px] uppercase tracking-[0.32em] text-[#111111]/55">
                                                {s.k}
                                            </p>
                                            <p className="cp-serif cp-wrap text-xl text-[#111111]">{s.v}</p>
                                        </div>
                                    ))}
                                </div>

                                <p
                                    className="cp-mono mt-10 text-[10px] uppercase tracking-[0.32em] text-[#111111]/55"
                                    data-cp-reveal
                                    data-cp-reveal-d="4"
                                >
                                    Scroll ↓ for the full press book
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* ── RED TAPE MARQUEE ──────────────────────────────────── */}
                    <section aria-hidden className="relative my-6 overflow-hidden">
                        <div className="cp-tape py-4">
                            <div className="cp-tape-inner cp-serif text-[clamp(28px,5vw,52px)] italic">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <span key={i} className="shrink-0">
                                        Now Booking ✶ {modelName} ✶ {(content.location || 'Worldwide')} ✶ Vol. {issueNo} / {yearLabel} ✶&nbsp;
                                    </span>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ── THE SUBJECT (biography) ───────────────────────────── */}
                    {storyParagraphs.length > 0 && (
                        <section
                            id="cp-subject"
                            className="relative px-6 py-24 md:px-12 md:py-32"
                        >
                            <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-12">
                                <div className="md:col-span-3">
                                    <div className="sticky top-28">
                                        <p
                                            className="cp-num-outline text-[clamp(80px,12vw,180px)] leading-none"
                                            data-cp-reveal
                                        >
                                            01
                                        </p>
                                        <p
                                            className="cp-mono mt-4 text-[10px] uppercase tracking-[0.4em] text-[#c8200e]"
                                            data-cp-reveal
                                            data-cp-reveal-d="1"
                                        >
                                            The Subject
                                        </p>
                                    </div>
                                </div>

                                <div className="md:col-span-6">
                                    <h2
                                        className="cp-serif mb-10 text-[clamp(36px,5vw,68px)] leading-[0.95] text-[#111111]"
                                        data-cp-reveal
                                    >
                                        Not just a face.<br />
                                        <span className="cp-serif-italic text-[#c8200e]">
                                            A point of view.
                                        </span>
                                    </h2>
                                    {storyParagraphs.map((paragraph, idx) => (
                                        <p
                                            key={idx}
                                            className={`mb-6 text-[16px] leading-[1.85] text-[#111111]/85 md:text-[17px] ${idx === 0 ? 'cp-dropcap' : ''}`}
                                            data-cp-reveal
                                            data-cp-reveal-d={String(Math.min(idx + 1, 4))}
                                        >
                                            {paragraph}
                                        </p>
                                    ))}
                                    <div
                                        className="mt-10 flex items-center gap-4"
                                        data-cp-reveal
                                        data-cp-reveal-d="4"
                                    >
                                        <span className="cp-serif-italic text-3xl text-[#c8200e]">— {modelName.split(' ')[0]}</span>
                                        <div className="h-px flex-1 bg-[#111111]/30" />
                                    </div>
                                </div>

                                <div className="md:col-span-3">
                                    {subjectImage && (
                                        <div className="cp-poly mt-8" style={{ transform: 'rotate(3.5deg)' }} data-cp-reveal data-cp-reveal-d="2">
                                            <div className="aspect-[3/4]">
                                                <img src={subjectImage} alt={modelName} />
                                            </div>
                                            <p className="cp-poly-cap">{modelName}, Studio</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ── INDEX OF WORK (table style) ───────────────────────── */}
                    {content.milestones.length > 0 && (
                        <section
                            id="cp-index"
                            className="relative border-y-2 border-[#111111] bg-[#ece4d3] px-6 py-24 md:px-12 md:py-32"
                        >
                            <div className="mx-auto max-w-7xl">
                                <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
                                    <div data-cp-reveal>
                                        <p className="cp-mono mb-4 text-[10px] uppercase tracking-[0.4em] text-[#c8200e]">
                                            ✶ 02 — Index of Work
                                        </p>
                                        <h2 className="cp-serif text-[clamp(40px,6vw,84px)] leading-[0.92] text-[#111111]">
                                            Selected <span className="cp-serif-italic text-[#c8200e]">Tearsheets.</span>
                                        </h2>
                                    </div>
                                    <p
                                        className="cp-mono max-w-xs text-[11px] uppercase tracking-[0.22em] text-[#111111]/55"
                                        data-cp-reveal
                                        data-cp-reveal-d="1"
                                    >
                                        A printed record of campaigns, runways, and editorial commissions.
                                    </p>
                                </div>

                                <div className="border-t-2 border-[#111111]">
                                    {content.milestones.map((m, i) => (
                                        <div
                                            key={m.key}
                                            className="cp-index-row grid grid-cols-12 items-baseline gap-4 border-b border-[#111111]/30 py-7 md:py-9"
                                            onMouseEnter={() => {
                                                setHoverIdx(i);
                                                setCursor((c) => ({ ...c, active: true }));
                                            }}
                                            onMouseLeave={() => {
                                                setHoverIdx((cur) => (cur === i ? null : cur));
                                                setCursor((c) => ({ ...c, active: false }));
                                            }}
                                            data-cp-reveal
                                            data-cp-reveal-d={String(Math.min(i + 1, 4))}
                                        >
                                            <span className="cp-mono col-span-2 text-[10px] uppercase tracking-[0.32em] md:col-span-1">
                                                № {String(i + 1).padStart(2, '0')}
                                            </span>
                                            <h3 className="cp-serif cp-wrap col-span-10 min-w-0 text-2xl leading-tight md:col-span-6 md:text-4xl">
                                                {m.title}
                                            </h3>
                                            <p className="cp-sans cp-wrap col-span-8 min-w-0 text-sm leading-7 text-[#111111]/65 md:col-span-3 md:text-[15px]">
                                                {m.description || '—'}
                                            </p>
                                            <span className="cp-mono cp-wrap col-span-4 min-w-0 text-right text-[11px] uppercase tracking-[0.22em] md:col-span-2">
                                                {formatMilestoneDate(m.date) || '—'}
                                            </span>

                                            {m.imageUrl && (
                                                <div
                                                    className="cp-index-pre"
                                                    style={{ opacity: hoverIdx === i ? 1 : 0, transform: `translate(-50%, -50%) rotate(${hoverIdx === i ? -4 : -8}deg) scale(${hoverIdx === i ? 1 : 0.85})` }}
                                                >
                                                    <img src={m.imageUrl} alt={m.title} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ── CONTACT SHEET (polaroid gallery) ──────────────────── */}
                    {galleryImages.length > 0 && (
                        <section
                            id="cp-contact"
                            className="relative px-6 py-24 md:px-12 md:py-32"
                        >
                            <div className="mx-auto mb-16 max-w-7xl">
                                <div className="flex items-end justify-between gap-6">
                                    <div data-cp-reveal>
                                        <p className="cp-mono mb-4 text-[10px] uppercase tracking-[0.4em] text-[#c8200e]">
                                            ✶ 03 — Contact Sheet
                                        </p>
                                        <h2 className="cp-serif text-[clamp(40px,6vw,80px)] leading-[0.95] text-[#111111]">
                                            From the <span className="cp-serif-italic text-[#c8200e]">archive.</span>
                                        </h2>
                                    </div>
                                    <span
                                        className="cp-mono hidden text-[10px] uppercase tracking-[0.32em] text-[#111111]/55 md:block"
                                        data-cp-reveal
                                        data-cp-reveal-d="1"
                                    >
                                        {galleryImages.length} Frames · Printed at home studio
                                    </span>
                                </div>
                            </div>

                            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 md:grid-cols-3 md:gap-10 lg:grid-cols-4">
                                {galleryImages.map((image, i) => {
                                    const tilts = [-5, 4, -2.5, 6, -3.5, 2.5, 5, -4];
                                    const offsets = ['md:mt-0', 'md:mt-12', 'md:mt-4', 'md:mt-16', 'md:mt-2', 'md:mt-10'];
                                    return (
                                        <figure
                                            key={image.key || image.src || i}
                                            className={`cp-poly ${offsets[i % offsets.length]}`}
                                            style={{ transform: `rotate(${tilts[i % tilts.length]}deg)` }}
                                            data-cp-reveal
                                            data-cp-reveal-d={String((i % 4) + 1)}
                                            onMouseEnter={() => setCursor((c) => ({ ...c, active: true }))}
                                            onMouseLeave={() => setCursor((c) => ({ ...c, active: false }))}
                                        >
                                            <div className="aspect-[3/4]">
                                                <img
                                                    src={image.src}
                                                    alt={image.alt || `Frame ${i + 1}`}
                                                />
                                            </div>
                                            <figcaption className="cp-poly-cap cp-wrap">
                                                {image.caption || `Fr. ${String(i + 1).padStart(2, '0')} — ${modelName.split(' ')[0]}`}
                                            </figcaption>
                                        </figure>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* ── EDITOR'S NOTE (final message) ─────────────────────── */}
                    <section className="relative overflow-hidden bg-[#111111] px-6 py-28 text-[#f3ede1] md:px-12 md:py-36">
                        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-12 md:items-center">
                            <div className="md:col-span-5">
                                {editorImage && (
                                    <div className="cp-poly bg-[#f3ede1]" style={{ transform: 'rotate(-3deg)' }} data-cp-reveal>
                                        <div className="aspect-[3/4]">
                                            <img src={editorImage} alt="Editor's note" />
                                        </div>
                                        <p className="cp-poly-cap">From the editor</p>
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-7">
                                <p
                                    className="cp-mono mb-6 text-[10px] uppercase tracking-[0.4em] text-[#c8200e]"
                                    data-cp-reveal
                                    data-cp-reveal-d="1"
                                >
                                    ✶ 04 — Editor&apos;s Note
                                </p>
                                <p
                                    className="cp-serif-italic text-[clamp(28px,4.4vw,52px)] leading-[1.18]"
                                    data-cp-reveal
                                    data-cp-reveal-d="2"
                                >
                                    “{content.finalMessage ||
                                        'Style is the only thing you can\'t buy. It\'s not in a shopping bag, a label, or a price tag.'}”
                                </p>
                                <div
                                    className="mt-8 flex items-center gap-4"
                                    data-cp-reveal
                                    data-cp-reveal-d="3"
                                >
                                    <div className="h-px w-12 bg-[#c8200e]" />
                                    <span className="cp-mono cp-wrap min-w-0 text-[10px] uppercase tracking-[0.4em] text-[#f3ede1]/80">
                                        — {modelName}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── COMP CARD (booking) ───────────────────────────────── */}
                    <section
                        id="cp-card"
                        className="relative px-6 py-24 md:px-12 md:py-32"
                    >
                        <div className="mx-auto max-w-5xl">
                            <p
                                className="cp-mono mb-4 text-[10px] uppercase tracking-[0.4em] text-[#c8200e]"
                                data-cp-reveal
                            >
                                ✶ 05 — The Comp Card
                            </p>
                            <h2
                                className="cp-serif mb-12 text-[clamp(40px,6vw,84px)] leading-[0.92] text-[#111111]"
                                data-cp-reveal
                                data-cp-reveal-d="1"
                            >
                                One link. <span className="cp-serif-italic text-[#c8200e]">Every agency.</span>
                            </h2>

                            <div
                                className="relative grid border-2 border-[#111111] bg-[#f3ede1] md:grid-cols-[42%_58%]"
                                data-cp-reveal
                                data-cp-reveal-d="2"
                                style={{ boxShadow: '14px 14px 0 #c8200e' }}
                            >
                                {/* card image */}
                                <div className="relative border-b-2 border-[#111111] md:border-b-0 md:border-r-2">
                                    {heroImage && (
                                        <img
                                            src={heroImage}
                                            alt={modelName}
                                            className="aspect-[3/4] w-full object-cover"
                                        />
                                    )}
                                    <div className="absolute left-4 top-4 border border-[#f3ede1] bg-[#111111] px-3 py-1.5">
                                        <span className="cp-mono text-[9px] uppercase tracking-[0.3em] text-[#f3ede1]">
                                            ● Now Booking
                                        </span>
                                    </div>
                                </div>

                                {/* card details */}
                                <div className="p-8 md:p-10">
                                    <p className="cp-mono text-[10px] uppercase tracking-[0.4em] text-[#111111]/55">
                                        Model Comp Card / № {issueNo}
                                    </p>
                                    <h3 className="cp-serif cp-wrap mt-2 text-4xl leading-tight text-[#111111] md:text-5xl">
                                        {modelName}
                                    </h3>
                                    <p className="cp-serif-italic cp-wrap mt-1 text-xl text-[#c8200e]">
                                        {content.subtitle || 'Editorial · Runway · Campaign'}
                                    </p>

                                    <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5">
                                        {[
                                            ['Based In', content.location || 'Worldwide'],
                                            ['Active Since', displayDate || '—'],
                                            ['Specialty', content.subtitle || 'Editorial'],
                                            ['Edition', `Vol. ${issueNo} / ${yearLabel}`],
                                        ].map(([k, v]) => (
                                            <div key={k}>
                                                <dt className="cp-mono text-[9px] uppercase tracking-[0.32em] text-[#111111]/55">
                                                    {k}
                                                </dt>
                                                <dd className="cp-serif cp-wrap mt-1 text-lg text-[#111111]">{v}</dd>
                                            </div>
                                        ))}
                                    </dl>

                                    <button
                                        onClick={() => setShowShare(true)}
                                        className="cp-mono mt-10 flex w-full items-center justify-center gap-3 border-2 border-[#111111] bg-[#111111] py-4 text-[11px] uppercase tracking-[0.32em] text-[#f3ede1] transition hover:bg-[#c8200e] hover:border-[#c8200e]"
                                        onMouseEnter={() => setCursor((c) => ({ ...c, active: true }))}
                                        onMouseLeave={() => setCursor((c) => ({ ...c, active: false }))}
                                    >
                                        Send Comp Card →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                {/* ── FOOTER ────────────────────────────────────────────────── */}
                <footer className="relative z-[2] border-t-2 border-[#111111] bg-[#111111] px-6 py-14 text-[#f3ede1] md:px-12">
                    <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-end">
                        <div>
                            <p className="cp-serif-italic cp-wrap text-5xl md:text-6xl">{modelName}.</p>
                            <p className="cp-mono cp-wrap mt-3 text-[10px] uppercase tracking-[0.4em] text-[#c8200e]">
                                Couture Press / Vol. {issueNo} · {yearLabel}
                            </p>
                        </div>
                        <div className="text-left md:text-right">
                            <p className="cp-mono text-[10px] uppercase tracking-[0.32em] text-[#f3ede1]/60">
                                © {yearLabel} · All rights reserved
                            </p>
                            <p className="cp-mono mt-2 text-[10px] uppercase tracking-[0.32em] text-[#f3ede1]/40">
                                Bound as a printed press book
                            </p>
                        </div>
                    </div>
                </footer>

                {/* floating CTA */}
                <button
                    aria-label="Send comp card"
                    onClick={() => setShowShare(true)}
                    className="cp-mono fixed bottom-6 right-6 z-50 flex items-center gap-2 border-2 border-[#111111] bg-[#c8200e] px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-[#f3ede1] transition hover:bg-[#111111] md:bottom-8 md:right-8"
                    onMouseEnter={() => setCursor((c) => ({ ...c, active: true }))}
                    onMouseLeave={() => setCursor((c) => ({ ...c, active: false }))}
                    style={{ boxShadow: '4px 4px 0 #111111' }}
                >
                    ✶ Send Card
                </button>

                {showShare && <ShareModal onClose={() => setShowShare(false)} title={modelName} />}
            </div>
        </>
    );
}

