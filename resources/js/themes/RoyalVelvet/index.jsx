import React, { useEffect, useMemo, useRef, useState } from 'react';
import { formatDisplayDate, formatMilestoneDate, getThemeStoryContent } from '../shared';

/* ------------------------------------------------------------------ */
/*  Share Modal                                                        */
/* ------------------------------------------------------------------ */
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
            <div className="absolute inset-0 bg-[#06170f]/85 backdrop-blur-md" onClick={onClose} />
            <div className="rv-modal-card relative w-full max-w-md p-8 text-center">
                <div className="rv-seal mx-auto mb-5">RV</div>
                <h3 className="mb-2 font-['Cinzel'] text-[26px] tracking-[0.12em] text-[#f5e8c8]">SHARE THIS STORY</h3>
                <p className="mb-6 font-['Cormorant_Garamond'] text-[16px] italic leading-7 text-[#d4a942]/90">
                    A royal invitation to share {title || 'this celebration'}.
                </p>
                <div className="flex gap-2">
                    <input
                        readOnly
                        value={url}
                        className="min-w-0 flex-1 border border-[#d4a942]/40 bg-[#06170f]/70 px-4 py-3 text-sm text-[#f5e8c8] outline-none"
                    />
                    <button
                        onClick={handleCopy}
                        className="whitespace-nowrap bg-gradient-to-b from-[#e8c66a] via-[#d4a942] to-[#a07c1e] px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#0d2818] transition hover:brightness-110"
                    >
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="mt-5 text-xs uppercase tracking-[0.22em] text-[#b89548] transition hover:text-[#d4a942]"
                >
                    Close
                </button>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
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
        hasStory ? { id: 'our-story', label: 'Our Story' } : null,
        hasMilestones ? { id: 'events', label: 'Royal Affairs' } : null,
        hasGallery ? { id: 'gallery', label: 'Gallery' } : null,
        { id: 'blessing', label: 'Decree' },
    ].filter(Boolean);
}

function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ------------------------------------------------------------------ */
/*  Reveal on scroll                                                   */
/* ------------------------------------------------------------------ */
function Reveal({ children, delay = 0, className = '', from = 'up' }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        setVisible(true);
                        io.unobserve(el);
                    }
                });
            },
            { threshold: 0.15 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);
    const initial = from === 'left' ? 'translateX(-40px)' : from === 'right' ? 'translateX(40px)' : 'translateY(40px)';
    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translate(0,0)' : initial,
                transition: `opacity 1s ease ${delay}ms, transform 1s ease ${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Decorative Ornaments                                               */
/* ------------------------------------------------------------------ */
const FleurOrnament = ({ className = '' }) => (
    <svg viewBox="0 0 120 30" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 15 H45" stroke="currentColor" strokeWidth="1" />
        <path d="M75 15 H118" stroke="currentColor" strokeWidth="1" />
        <path
            d="M60 4 C56 9, 50 11, 50 15 C50 19, 56 21, 60 26 C64 21, 70 19, 70 15 C70 11, 64 9, 60 4 Z"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
        />
        <circle cx="60" cy="15" r="1.5" fill="currentColor" />
        <circle cx="48" cy="15" r="1" fill="currentColor" />
        <circle cx="72" cy="15" r="1" fill="currentColor" />
    </svg>
);

const CrownOrnament = ({ className = '' }) => (
    <svg viewBox="0 0 100 60" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M10 50 L20 20 L35 38 L50 12 L65 38 L80 20 L90 50 Z"
            stroke="currentColor"
            strokeWidth="1.4"
            fill="none"
        />
        <path d="M10 50 H90" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="20" cy="20" r="2.5" fill="currentColor" />
        <circle cx="50" cy="12" r="3" fill="currentColor" />
        <circle cx="80" cy="20" r="2.5" fill="currentColor" />
        <circle cx="35" cy="38" r="1.5" fill="currentColor" />
        <circle cx="65" cy="38" r="1.5" fill="currentColor" />
    </svg>
);

const CornerOrnament = ({ className = '', flip = false }) => (
    <svg
        viewBox="0 0 80 80"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: flip ? 'scaleX(-1)' : 'none' }}
    >
        <path d="M2 2 C20 2, 35 10, 40 30 C42 38, 38 48, 30 50 C22 52, 14 46, 14 38 C14 30, 22 26, 28 30" stroke="currentColor" strokeWidth="1" fill="none" />
        <circle cx="40" cy="30" r="2" fill="currentColor" />
        <path d="M2 2 L2 20 M2 2 L20 2" stroke="currentColor" strokeWidth="1" />
    </svg>
);

/* ------------------------------------------------------------------ */
/*  Main Theme                                                         */
/* ------------------------------------------------------------------ */
export default function RoyalVelvet({ data }) {
    const content = getThemeStoryContent(data);
    const [showShare, setShowShare] = useState(false);
    const [navVisible, setNavVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            const trigger = window.innerHeight * 0.72;
            setNavVisible(window.scrollY > trigger);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const displayDate = formatDisplayDate(content.rawDate) || content.dateLabel;
    const heroMeta = [displayDate, content.location].filter(Boolean).join(' · ');
    const storyParagraphs = (content.summary || '')
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean);
    const galleryImages = useMemo(() => buildGalleryImages(content), [content]);
    const storyImage = content.coverImageUrl || galleryImages[0]?.src;
    const blessingImage = galleryImages[4]?.src || galleryImages[1]?.src;
    const initials =
        content.initials ||
        content.people.map((n) => n.charAt(0).toUpperCase()).join(' & ') ||
        'A & R';
    const navSections = buildNavSections(
        storyParagraphs.length > 0,
        content.milestones.length > 0,
        galleryImages.length > 0
    );

    return (
        <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link
                href="https://fonts.googleapis.com/css2?family=Allura&family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&family=Inter:wght@300;400;500;600&display=swap"
                rel="stylesheet"
            />

            <style>{`
                .rv-root {
                    background: #06170f;
                    color: #f5e8c8;
                    font-family: 'Inter', sans-serif;
                    min-height: 100vh;
                    overflow-x: hidden;
                    position: relative;
                }
                .rv-root ::selection { background: rgba(212,169,66,0.35); color: #fff; }

                /* Velvet damask background */
                .rv-velvet {
                    position: fixed; inset: 0; z-index: 0;
                    background:
                      radial-gradient(ellipse at 20% 10%, rgba(34,82,55,0.55), transparent 50%),
                      radial-gradient(ellipse at 80% 90%, rgba(74,32,22,0.4), transparent 55%),
                      radial-gradient(circle at 50% 50%, rgba(212,169,66,0.06), transparent 60%),
                      linear-gradient(180deg, #0d2818 0%, #06170f 60%, #0a1f15 100%);
                }
                .rv-damask {
                    position: fixed; inset: 0; z-index: 0;
                    pointer-events: none;
                    opacity: 0.07;
                    background-image:
                      radial-gradient(circle at 25% 25%, #d4a942 0 1px, transparent 2px),
                      radial-gradient(circle at 75% 75%, #d4a942 0 1px, transparent 2px),
                      linear-gradient(45deg, transparent 48%, rgba(212,169,66,0.4) 49%, rgba(212,169,66,0.4) 51%, transparent 52%);
                    background-size: 80px 80px, 80px 80px, 60px 60px;
                    animation: rv-shimmer 18s linear infinite;
                }
                @keyframes rv-shimmer {
                    0% { background-position: 0 0, 40px 40px, 0 0; }
                    100% { background-position: 80px 80px, 120px 120px, 60px 60px; }
                }

                /* Gold leaf shimmer overlay (subtle) */
                .rv-leaf {
                    position: fixed; inset: 0; z-index: 0;
                    pointer-events: none;
                    background:
                      radial-gradient(ellipse 600px 300px at 30% 20%, rgba(212,169,66,0.10), transparent 70%),
                      radial-gradient(ellipse 500px 250px at 70% 80%, rgba(212,169,66,0.08), transparent 70%);
                    mix-blend-mode: screen;
                    animation: rv-glow 12s ease-in-out infinite alternate;
                }
                @keyframes rv-glow {
                    0% { opacity: .6; transform: translate3d(-1%,-1%,0); }
                    100% { opacity: 1; transform: translate3d(2%,1%,0); }
                }

                .rv-section { position: relative; z-index: 2; }

                /* Animated chandelier */
                .rv-chandelier {
                    position: relative;
                    width: 280px;
                    height: 280px;
                    margin: 0 auto;
                    animation: rv-sway 6s ease-in-out infinite;
                    transform-origin: top center;
                }
                @keyframes rv-sway {
                    0%,100% { transform: rotate(-2deg); }
                    50%     { transform: rotate(2deg); }
                }
                .rv-chand-rope {
                    position: absolute; left: 50%; top: 0;
                    width: 1px; height: 80px;
                    background: linear-gradient(to bottom, transparent, #d4a942);
                    transform: translateX(-50%);
                }
                .rv-chand-disc {
                    position: absolute; left: 50%; top: 80px;
                    width: 200px; height: 100px;
                    transform: translateX(-50%);
                    border-radius: 50%;
                    border: 2px solid #d4a942;
                    background: radial-gradient(ellipse at center top, rgba(212,169,66,0.25), transparent 70%);
                    box-shadow: 0 0 40px rgba(212,169,66,0.4), inset 0 0 30px rgba(212,169,66,0.15);
                }
                .rv-chand-candle {
                    position: absolute;
                    width: 6px; height: 18px;
                    background: linear-gradient(to bottom, #f5e8c8, #d4a942);
                    border-radius: 2px;
                }
                .rv-chand-flame {
                    position: absolute;
                    width: 8px; height: 14px;
                    border-radius: 50% 50% 35% 35% / 60% 60% 40% 40%;
                    background: radial-gradient(ellipse at center bottom, #ffd97a 0%, #ff9a3c 50%, transparent 80%);
                    transform: translateX(-1px);
                    animation: rv-flicker 1.2s ease-in-out infinite alternate;
                    filter: drop-shadow(0 0 8px #ffaa3c);
                }
                @keyframes rv-flicker {
                    0%   { transform: translateX(-1px) scale(1) skewX(-2deg); opacity:.9; }
                    50%  { transform: translateX(0)    scale(1.1) skewX(2deg);  opacity:1;  }
                    100% { transform: translateX(-2px) scale(.95) skewX(-1deg); opacity:.85;}
                }

                /* Velvet card */
                .rv-card {
                    position: relative;
                    background:
                      linear-gradient(135deg, rgba(13,40,24,0.85), rgba(6,23,15,0.95));
                    border: 1px solid rgba(212,169,66,0.35);
                    box-shadow:
                      0 30px 80px rgba(0,0,0,0.55),
                      inset 0 0 0 1px rgba(212,169,66,0.08);
                }
                .rv-card::before, .rv-card::after {
                    content: '';
                    position: absolute;
                    width: 40px; height: 40px;
                    border: 1px solid #d4a942;
                    pointer-events: none;
                }
                .rv-card::before { top: 10px; left: 10px; border-right: none; border-bottom: none; }
                .rv-card::after { bottom: 10px; right: 10px; border-left: none; border-top: none; }

                /* Frame for images */
                .rv-frame {
                    position: relative; padding: 10px;
                    background: linear-gradient(135deg, #d4a942, #8a6a1a, #d4a942);
                    box-shadow: 0 30px 80px rgba(0,0,0,0.6);
                }
                .rv-frame::before {
                    content:'';
                    position:absolute; inset: 4px;
                    border: 1px solid rgba(245,232,200,0.3);
                    pointer-events:none;
                }
                .rv-frame img { display: block; width: 100%; height: 100%; object-fit: cover; }

                /* Wax seal */
                .rv-seal {
                    width: 70px; height: 70px;
                    border-radius: 50%;
                    background: radial-gradient(circle at 35% 30%, #c4324a 0%, #7a1424 60%, #4a0a14 100%);
                    color: #f5e8c8;
                    display: flex; align-items: center; justify-content: center;
                    font-family: 'Cinzel', serif; font-weight: 700; font-size: 20px;
                    letter-spacing: 0.05em;
                    box-shadow:
                      0 8px 20px rgba(0,0,0,0.5),
                      inset 0 -4px 8px rgba(0,0,0,0.4),
                      inset 0 4px 6px rgba(255,255,255,0.15);
                    position: relative;
                }
                .rv-seal::before {
                    content:'';
                    position: absolute; inset: 4px;
                    border-radius: 50%;
                    border: 1px dashed rgba(245,232,200,0.4);
                }

                .rv-divider { display:flex; align-items:center; justify-content:center; gap:14px; }
                .rv-divider .line { height:1px; flex:1; max-width:140px; background: linear-gradient(90deg, transparent, #d4a942, transparent); }

                .rv-nav-link:hover { color: #d4a942; }

                /* Gallery */
                .rv-gallery-item {
                    position: relative; overflow: hidden;
                    transition: transform .6s ease, box-shadow .6s ease;
                    background: linear-gradient(135deg, #d4a942, #8a6a1a);
                    padding: 6px;
                }
                .rv-gallery-item .inner { position: relative; overflow: hidden; }
                .rv-gallery-item img { transition: transform .8s ease, filter .8s ease; filter: saturate(1) brightness(0.95); display:block; width:100%; height:100%; object-fit:cover; }
                .rv-gallery-item:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(212,169,66,0.25); }
                .rv-gallery-item:hover img { transform: scale(1.06); filter: saturate(1.1) brightness(1.05); }

                .rv-caption {
                    position: absolute; left: 6px; right: 6px; bottom: 6px;
                    padding: 24px 14px 14px;
                    background: linear-gradient(to top, rgba(6,23,15,0.95), rgba(6,23,15,0.5) 60%, transparent);
                    transform: translateY(100%); opacity: 0;
                    transition: transform .5s ease, opacity .5s ease;
                }
                .rv-gallery-item:hover .rv-caption { transform: translateY(0); opacity: 1; }
                .rv-caption p {
                    font-family: 'Cormorant Garamond', serif;
                    font-style: italic; font-size: 14px;
                    text-align: center; color: #f5e8c8; margin: 0;
                }
                @media (max-width: 639px) {
                    .rv-caption { position: static; transform:none; opacity:1; padding: 8px 8px 4px; background: transparent; }
                    .rv-caption p { color: #b89548; font-size: 11px; }
                }

                /* Modal */
                .rv-modal-card {
                    background: linear-gradient(180deg, #0d2818, #06170f);
                    border: 1px solid rgba(212,169,66,0.35);
                    box-shadow: 0 40px 100px rgba(0,0,0,0.7), 0 0 60px rgba(212,169,66,0.12);
                }
                .rv-modal-card::before, .rv-modal-card::after {
                    content:''; position: absolute; width: 50px; height: 50px;
                    border: 1px solid #d4a942; pointer-events: none;
                }
                .rv-modal-card::before { top: 12px; left: 12px; border-right: none; border-bottom: none; }
                .rv-modal-card::after  { bottom: 12px; right: 12px; border-left: none; border-top: none; }

                /* Scroll dot */
                .rv-scroll-dot { animation: rv-bounce 2s ease-in-out infinite; }
                @keyframes rv-bounce {
                    0%,100% { transform: translateY(0); opacity:.7; }
                    50%     { transform: translateY(28px); opacity:1; }
                }

                /* Timeline node */
                .rv-node {
                    position: absolute;
                    width: 22px; height: 22px;
                    border-radius: 50%;
                    background: radial-gradient(circle, #f5e8c8 0%, #d4a942 60%, #8a6a1a 100%);
                    box-shadow: 0 0 20px rgba(212,169,66,0.65), 0 0 0 3px rgba(13,40,24,1), 0 0 0 4px rgba(212,169,66,0.5);
                }

                .rv-floating-share:hover { transform: translateY(-3px) scale(1.04); }

                .rv-gold-text {
                    background: linear-gradient(180deg, #f5e8c8 0%, #d4a942 50%, #8a6a1a 100%);
                    -webkit-background-clip: text; background-clip: text;
                    color: transparent;
                    text-shadow: 0 1px 0 rgba(0,0,0,0.2);
                }
            `}</style>

            <div className="rv-root">
                <div className="rv-velvet" />
                <div className="rv-damask" />
                <div className="rv-leaf" />

                {/* Header */}
                <header
                    className="fixed inset-x-0 top-0 z-50 border-b border-[#d4a942]/20 px-5 md:px-10"
                    style={{
                        background: 'rgba(6,23,15,0.86)',
                        backdropFilter: 'blur(14px)',
                        WebkitBackdropFilter: 'blur(14px)',
                        opacity: navVisible ? 1 : 0,
                        transform: navVisible ? 'translateY(0)' : 'translateY(-100%)',
                        transition: 'opacity 0.4s ease, transform 0.4s ease',
                    }}
                >
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6">
                        <button
                            onClick={() => scrollToSection('hero')}
                            className="font-['Allura'] text-[36px] leading-none rv-gold-text"
                        >
                            {initials}
                        </button>
                        <nav className="hidden items-center gap-8 md:flex">
                            {navSections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className="rv-nav-link font-['Cinzel'] text-[11px] uppercase tracking-[0.24em] text-[#b89548] transition"
                                >
                                    {section.label}
                                </button>
                            ))}
                        </nav>
                        <button
                            onClick={() => setShowShare(true)}
                            className="border border-[#d4a942]/60 px-4 py-2 font-['Cinzel'] text-[11px] uppercase tracking-[0.2em] text-[#d4a942] transition hover:bg-[#d4a942]/10"
                        >
                            Share Story
                        </button>
                    </div>
                </header>

                <main className="rv-section">
                    {/* HERO */}
                    <section
                        id="hero"
                        className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pb-40 pt-28 text-center"
                    >
                        {content.coverImageUrl && (
                            <img
                                src={content.coverImageUrl}
                                alt={content.title}
                                className="absolute inset-0 h-full w-full object-cover opacity-15 mix-blend-luminosity"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#06170f]/60 to-[#06170f]" />

                        <div className="relative z-10 mx-auto max-w-5xl">
                            <Reveal>
                                <CrownOrnament className="mx-auto mb-8 h-12 w-20 text-[#d4a942]" />
                                <p className="mb-5 font-['Cinzel'] text-[11px] font-medium uppercase tracking-[0.4em] text-[#b89548]">
                                    {content.eyebrow || 'A Royal Union'}
                                </p>
                            </Reveal>

                            <Reveal delay={150}>
                                <h1 className="font-['Allura'] text-[clamp(70px,13vw,170px)] leading-[0.9] rv-gold-text">
                                    {content.title}
                                </h1>
                            </Reveal>

                            <Reveal delay={250}>
                                <FleurOrnament className="mx-auto my-6 h-6 w-48 text-[#d4a942]" />
                                <p className="mx-auto max-w-2xl font-['Cormorant_Garamond'] text-lg italic text-[#e8d8a8] md:text-xl">
                                    {content.subtitle || 'request the honour of your presence'}
                                </p>
                                {heroMeta && (
                                    <div className="mt-7 inline-block border-y border-[#d4a942]/50 px-8 py-3">
                                        <p className="font-['Cinzel'] text-xs tracking-[0.32em] text-[#f5e8c8] md:text-sm">
                                            {heroMeta}
                                        </p>
                                    </div>
                                )}
                            </Reveal>
                        </div>

                        <div className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center">
                            <p className="mb-3 font-['Cinzel'] text-[10px] uppercase tracking-[0.36em] text-[#b89548]">Enter</p>
                            <div className="relative h-12 w-px overflow-hidden bg-[#d4a942]/50">
                                <div className="rv-scroll-dot absolute left-1/2 top-0 h-[6px] w-[6px] -translate-x-1/2 rounded-full bg-[#d4a942] shadow-[0_0_10px_#d4a942]" />
                            </div>
                        </div>
                    </section>

                    {/* OUR STORY */}
                    {storyParagraphs.length > 0 && (
                        <section id="our-story" className="rv-section mx-auto max-w-6xl px-6 py-28 md:px-10">
                            <Reveal>
                                <div className="mb-14 text-center">
                                    <FleurOrnament className="mx-auto mb-6 h-6 w-56 text-[#d4a942]" />
                                    <p className="font-['Cinzel'] text-[11px] font-medium uppercase tracking-[0.36em] text-[#b89548]">
                                        Our Story
                                    </p>
                                    <h2 className="mt-4 font-['Cormorant_Garamond'] text-[clamp(36px,5.5vw,58px)] font-light italic leading-tight rv-gold-text">
                                        Where the Tale Began
                                    </h2>
                                </div>
                            </Reveal>

                            <div className="grid items-center gap-14 md:grid-cols-[55%_45%]">
                                <Reveal from="left">
                                    <div className="rv-card p-10 md:p-12">
                                        {storyParagraphs.map((paragraph, index) => (
                                            <p
                                                key={index}
                                                className="mb-5 font-['Cormorant_Garamond'] text-[18px] leading-9 text-[#f5e8c8]/90 md:text-[19px]"
                                            >
                                                {index === 0 && (
                                                    <span className="float-left mr-3 font-['Cinzel'] text-[60px] leading-none text-[#d4a942]">
                                                        {paragraph.charAt(0)}
                                                    </span>
                                                )}
                                                {index === 0 ? paragraph.slice(1) : paragraph}
                                            </p>
                                        ))}

                                        <div className="mt-8 border-l-2 border-[#d4a942]/70 pl-6">
                                            <p className="font-['Cormorant_Garamond'] text-xl italic leading-9 text-[#e8d8a8]">
                                                {content.finalMessage
                                                    ? `“${content.finalMessage}”`
                                                    : '“Two hearts, one crown — bound by love eternal.”'}
                                            </p>
                                        </div>
                                    </div>
                                </Reveal>

                                <Reveal from="right" delay={150}>
                                    {storyImage && (
                                        <div className="rv-frame aspect-[3/4] w-full">
                                            <img src={storyImage} alt={content.title} />
                                        </div>
                                    )}
                                </Reveal>
                            </div>
                        </section>
                    )}

                    {/* MILESTONES — ROYAL AFFAIRS */}
                    {content.milestones.length > 0 && (
                        <section id="events" className="rv-section relative px-6 py-28 md:px-10">
                            <div className="mx-auto max-w-5xl">
                                <Reveal>
                                    <div className="mb-20 text-center">
                                        <CrownOrnament className="mx-auto mb-6 h-12 w-20 text-[#d4a942]" />
                                        <p className="font-['Cinzel'] text-[11px] font-medium uppercase tracking-[0.36em] text-[#b89548]">
                                            The Affairs
                                        </p>
                                        <h2 className="mt-4 font-['Cormorant_Garamond'] text-[clamp(36px,5.5vw,58px)] font-light italic leading-tight rv-gold-text">
                                            Chapters of Our Reign
                                        </h2>
                                    </div>
                                </Reveal>

                                <div className="relative pl-10 md:pl-0">
                                    <div className="absolute bottom-0 left-5 top-0 w-px bg-gradient-to-b from-transparent via-[#d4a942]/60 to-transparent md:left-1/2" />
                                    <div className="flex flex-col gap-16">
                                        {content.milestones.map((milestone, index) => {
                                            const isLeft = index % 2 === 0;
                                            return (
                                                <Reveal key={milestone.key} delay={index * 80} from={isLeft ? 'left' : 'right'}>
                                                    <div className={`relative md:grid md:grid-cols-2 md:gap-12 ${isLeft ? '' : 'md:[&>*:first-child]:order-2'}`}>
                                                        <span className="rv-node left-[-21px] top-5 md:left-[calc(50%-11px)]" />
                                                        <div className={isLeft ? 'md:pr-10 md:text-right' : 'md:pl-10'}>
                                                            <div className="rv-card p-8 md:p-10">
                                                                <span className="mb-4 inline-block bg-gradient-to-b from-[#e8c66a] to-[#a07c1e] px-5 py-1.5 font-['Cinzel'] text-[10px] font-bold uppercase tracking-[0.2em] text-[#0d2818]">
                                                                    {formatMilestoneDate(milestone.date) || `Chapter ${index + 1}`}
                                                                </span>
                                                                <h3 className="mb-3 font-['Cormorant_Garamond'] text-[28px] italic font-light text-[#f5e8c8]">
                                                                    {milestone.title}
                                                                </h3>
                                                                {milestone.description && (
                                                                    <p className="mb-4 font-['Cormorant_Garamond'] text-[16px] leading-8 text-[#e8d8a8]/85">
                                                                        {milestone.description}
                                                                    </p>
                                                                )}
                                                                {milestone.imageUrl && (
                                                                    <div className="rv-frame mt-4 aspect-[16/10] w-full">
                                                                        <img src={milestone.imageUrl} alt={milestone.title} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div />
                                                    </div>
                                                </Reveal>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* DECREE / BLESSING */}
                    <section id="blessing" className="rv-section relative overflow-hidden px-6 py-32 text-center md:px-10">
                        <Reveal>
                            <div className="relative mx-auto max-w-4xl">
                                {/* Chandelier */}
                                <div className="rv-chandelier mb-12">
                                    <div className="rv-chand-rope" />
                                    <div className="rv-chand-disc" />
                                    {Array.from({ length: 8 }).map((_, i) => {
                                        const angle = (i / 8) * Math.PI * 2;
                                        const r = 90;
                                        const cx = 140;
                                        const cy = 130;
                                        const x = cx + r * Math.cos(angle);
                                        const y = cy + r * Math.sin(angle) * 0.45;
                                        return (
                                            <React.Fragment key={i}>
                                                <span
                                                    className="rv-chand-candle"
                                                    style={{ left: `${x - 3}px`, top: `${y}px` }}
                                                />
                                                <span
                                                    className="rv-chand-flame"
                                                    style={{
                                                        left: `${x - 3}px`,
                                                        top: `${y - 14}px`,
                                                        animationDelay: `${i * 0.15}s`,
                                                    }}
                                                />
                                            </React.Fragment>
                                        );
                                    })}
                                </div>

                                <div className="rv-divider mb-6">
                                    <span className="line" />
                                    <span className="text-[#d4a942]">❖</span>
                                    <span className="line" />
                                </div>
                                <h2 className="font-['Cormorant_Garamond'] text-[clamp(34px,5.5vw,54px)] font-light italic rv-gold-text">
                                    By Royal Decree, Forever Bound
                                </h2>
                                <p className="mx-auto mt-7 max-w-2xl font-['Cormorant_Garamond'] text-[22px] italic leading-10 text-[#e8d8a8]">
                                    {content.finalMessage
                                        ? `“${content.finalMessage}”`
                                        : '“Sealed in gold, crowned with love — a love befitting royalty.”'}
                                </p>
                                <div className="rv-divider mt-10">
                                    <span className="line" />
                                    <span className="text-[#d4a942]">❖</span>
                                    <span className="line" />
                                </div>

                                {blessingImage && (
                                    <div className="rv-frame mx-auto mt-12 max-w-2xl">
                                        <img
                                            src={blessingImage}
                                            alt="Decree"
                                            className="h-[320px]"
                                        />
                                    </div>
                                )}
                            </div>
                        </Reveal>
                    </section>

                    {/* GALLERY */}
                    {galleryImages.length > 0 && (
                        <section id="gallery" className="rv-section py-28">
                            <Reveal>
                                <div className="mb-14 px-6 text-center md:px-10">
                                    <FleurOrnament className="mx-auto mb-6 h-6 w-56 text-[#d4a942]" />
                                    <p className="mb-3 font-['Cinzel'] text-[11px] font-medium uppercase tracking-[0.36em] text-[#b89548]">
                                        The Royal Album
                                    </p>
                                    <h2 className="font-['Cormorant_Garamond'] text-[clamp(34px,5vw,52px)] italic font-light rv-gold-text">
                                        Treasured Moments
                                    </h2>
                                </div>
                            </Reveal>

                            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-5 px-4 md:grid-cols-3 lg:grid-cols-4">
                                {galleryImages.map((image, index) => (
                                    <Reveal key={image.key || image.src || index} delay={(index % 4) * 80}>
                                        <div className="rv-gallery-item">
                                            <div className="inner aspect-[4/5] w-full">
                                                <img
                                                    src={image.src}
                                                    alt={image.alt || `Gallery image ${index + 1}`}
                                                />
                                                {image.caption && (
                                                    <div className="rv-caption">
                                                        <p>{image.caption}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Reveal>
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                <footer className="rv-section relative border-t border-[#d4a942]/20 px-6 py-16 text-center md:px-10">
                    <div className="flex justify-center gap-2 mb-6 opacity-50">
                        <CornerOrnament className="h-12 w-12 text-[#d4a942]" />
                        <CornerOrnament className="h-12 w-12 text-[#d4a942]" flip />
                    </div>
                    <p className="font-['Allura'] text-[48px] leading-none rv-gold-text">
                        {content.title}
                    </p>
                    {heroMeta && (
                        <p className="mt-3 font-['Cinzel'] text-xs tracking-[0.3em] text-[#b89548] md:text-sm">
                            {heroMeta}
                        </p>
                    )}
                    <div className="rv-divider my-7">
                        <span className="line" />
                        <span className="text-[#d4a942]">❖</span>
                        <span className="line" />
                    </div>
                    <p className="font-['Cormorant_Garamond'] text-sm italic text-[#b89548]/80">
                        Crafted in gold and emerald, for a love most royal
                    </p>
                </footer>

                {/* Floating share — wax seal style */}
                <button
                    aria-label="Share this story"
                    onClick={() => setShowShare(true)}
                    className="rv-floating-share fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-gradient-to-b from-[#e8c66a] via-[#d4a942] to-[#a07c1e] px-6 py-4 font-['Cinzel'] text-xs font-bold uppercase tracking-[0.2em] text-[#0d2818] shadow-[0_10px_40px_rgba(212,169,66,0.4)] transition"
                    style={{ borderRadius: '2px' }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d2818" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                    Share Story
                </button>

                {showShare && <ShareModal onClose={() => setShowShare(false)} title={content.title} />}
            </div>
        </>
    );
}