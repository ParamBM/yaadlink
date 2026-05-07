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
            <div className="absolute inset-0 bg-[#05030f]/80 backdrop-blur-md" onClick={onClose} />
            <div className="cd-modal-card relative w-full max-w-md rounded-2xl p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#c8a2ff] via-[#88d6ff] to-[#ffd1e8] shadow-[0_0_30px_rgba(200,162,255,0.6)]">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a0820" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                </div>
                <h3 className="mb-2 font-['Italiana'] text-[28px] tracking-wide text-[#f5ecff]">Share This Story</h3>
                <p className="mb-6 text-sm leading-7 text-[#cdb8ff]/80">
                    Copy the link to share {title || 'this celebration'} with the cosmos.
                </p>
                <div className="flex gap-2">
                    <input
                        readOnly
                        value={url}
                        className="min-w-0 flex-1 rounded-lg border border-[#7a5cff]/30 bg-[#0a0820]/70 px-4 py-3 text-sm text-[#f5ecff] outline-none"
                    />
                    <button
                        onClick={handleCopy}
                        className="whitespace-nowrap rounded-lg bg-gradient-to-r from-[#c8a2ff] to-[#88d6ff] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#0a0820] transition hover:brightness-110"
                    >
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="mt-5 text-xs uppercase tracking-[0.16em] text-[#9d86d6] transition hover:text-[#c8a2ff]"
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
        hasMilestones ? { id: 'events', label: 'Constellations' } : null,
        hasGallery ? { id: 'gallery', label: 'Gallery' } : null,
        { id: 'blessing', label: 'Vow' },
    ].filter(Boolean);
}

function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ------------------------------------------------------------------ */
/*  Animated Starfield (canvas)                                        */
/* ------------------------------------------------------------------ */
function Starfield() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let raf;
        let stars = [];
        let shooting = [];
        let w = 0;
        let h = 0;
        let dpr = Math.min(window.devicePixelRatio || 1, 2);

        const resize = () => {
            w = canvas.clientWidth;
            h = canvas.clientHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const count = Math.min(220, Math.floor((w * h) / 9000));
            stars = Array.from({ length: count }, () => ({
                x: Math.random() * w,
                y: Math.random() * h,
                r: Math.random() * 1.4 + 0.2,
                a: Math.random() * 0.7 + 0.2,
                t: Math.random() * Math.PI * 2,
                s: Math.random() * 0.02 + 0.005,
                hue: Math.random() < 0.15 ? 'hsl(280 100% 85%)' : Math.random() < 0.3 ? 'hsl(200 100% 90%)' : 'hsl(60 80% 96%)',
            }));
        };

        const spawnShooting = () => {
            if (Math.random() < 0.012 && shooting.length < 2) {
                const fromLeft = Math.random() < 0.5;
                shooting.push({
                    x: fromLeft ? -50 : w + 50,
                    y: Math.random() * h * 0.6,
                    vx: (fromLeft ? 1 : -1) * (6 + Math.random() * 4),
                    vy: 1.2 + Math.random() * 1.5,
                    life: 1,
                });
            }
        };

        const tick = () => {
            ctx.clearRect(0, 0, w, h);
            // stars
            for (const s of stars) {
                s.t += s.s;
                const tw = (Math.sin(s.t) + 1) / 2;
                ctx.beginPath();
                ctx.fillStyle = s.hue;
                ctx.globalAlpha = s.a * (0.4 + tw * 0.6);
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            // shooting stars
            spawnShooting();
            shooting = shooting.filter((sh) => {
                sh.x += sh.vx;
                sh.y += sh.vy;
                sh.life -= 0.012;
                const grad = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * 12, sh.y - sh.vy * 12);
                grad.addColorStop(0, `rgba(255,255,255,${0.9 * sh.life})`);
                grad.addColorStop(1, 'rgba(200,162,255,0)');
                ctx.strokeStyle = grad;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(sh.x, sh.y);
                ctx.lineTo(sh.x - sh.vx * 12, sh.y - sh.vy * 12);
                ctx.stroke();
                return sh.life > 0 && sh.x > -100 && sh.x < w + 100 && sh.y < h + 100;
            });

            raf = requestAnimationFrame(tick);
        };

        resize();
        tick();
        window.addEventListener('resize', resize);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />;
}

/* ------------------------------------------------------------------ */
/*  Reveal-on-scroll wrapper                                           */
/* ------------------------------------------------------------------ */
function Reveal({ children, delay = 0, className = '' }) {
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
    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(40px)',
                transition: `opacity 1s ease ${delay}ms, transform 1s ease ${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Main Theme                                                         */
/* ------------------------------------------------------------------ */
export default function CelestialDreams({ data }) {
    const content = getThemeStoryContent(data);
    const [showShare, setShowShare] = useState(false);
    const [navVisible, setNavVisible] = useState(false);
    const [mouse, setMouse] = useState({ x: 50, y: 50 });

    useEffect(() => {
        const onScroll = () => {
            const trigger = window.innerHeight * 0.72;
            setNavVisible(window.scrollY > trigger);
        };
        const onMove = (e) => {
            setMouse({
                x: (e.clientX / window.innerWidth) * 100,
                y: (e.clientY / window.innerHeight) * 100,
            });
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('mousemove', onMove);
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('mousemove', onMove);
        };
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
                href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&family=Great+Vibes&family=Italiana&family=Inter:wght@300;400;500;600&display=swap"
                rel="stylesheet"
            />

            <style>{`
                .cd-root {
                    background: #05030f;
                    color: #f5ecff;
                    font-family: 'Inter', sans-serif;
                    min-height: 100vh;
                    overflow-x: hidden;
                    position: relative;
                }
                .cd-root ::selection { background: rgba(200,162,255,0.4); color: #fff; }

                /* Parallax cosmic backdrop */
                .cd-cosmos {
                    position: fixed;
                    inset: 0;
                    z-index: 0;
                    background:
                      radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(200,162,255,0.10), transparent 35%),
                      radial-gradient(ellipse at 20% 10%, rgba(122,92,255,0.32), transparent 45%),
                      radial-gradient(ellipse at 85% 30%, rgba(255,140,200,0.18), transparent 40%),
                      radial-gradient(ellipse at 50% 90%, rgba(80,210,255,0.16), transparent 50%),
                      linear-gradient(180deg, #05030f 0%, #0a0628 50%, #0d0420 100%);
                    transition: background 0.6s ease;
                }
                .cd-nebula {
                    position: fixed; inset: 0; z-index: 0;
                    pointer-events: none;
                    background:
                      radial-gradient(circle at 30% 40%, rgba(200,162,255,0.18), transparent 22%),
                      radial-gradient(circle at 70% 60%, rgba(255,180,220,0.14), transparent 24%),
                      radial-gradient(circle at 50% 80%, rgba(120,210,255,0.12), transparent 26%);
                    mix-blend-mode: screen;
                    animation: cd-drift 24s linear infinite alternate;
                    filter: blur(40px);
                }
                @keyframes cd-drift {
                    0%   { transform: translate3d(-3%, -2%, 0) scale(1); }
                    100% { transform: translate3d(3%, 3%, 0) scale(1.08); }
                }

                .cd-section { position: relative; z-index: 2; }

                /* Hero moon orbit */
                .cd-moon-wrap {
                    position: relative;
                    width: min(80vw, 460px);
                    aspect-ratio: 1;
                    margin: 0 auto;
                }
                .cd-orbit {
                    position: absolute; inset: 0;
                    border-radius: 9999px;
                    border: 1px dashed rgba(200,162,255,0.35);
                    animation: cd-spin 40s linear infinite;
                }
                .cd-orbit.b { inset: 8%; border-color: rgba(255,180,220,0.28); animation-duration: 60s; animation-direction: reverse; }
                .cd-orbit.c { inset: 16%; border-color: rgba(120,210,255,0.25); animation-duration: 80s; }
                @keyframes cd-spin { to { transform: rotate(360deg); } }

                .cd-orbit-dot {
                    position: absolute;
                    top: -4px; left: 50%;
                    width: 8px; height: 8px;
                    border-radius: 9999px;
                    background: linear-gradient(135deg,#fff,#c8a2ff);
                    box-shadow: 0 0 16px #c8a2ff, 0 0 28px #c8a2ff;
                    transform: translateX(-50%);
                }
                .cd-moon {
                    position: absolute;
                    inset: 24%;
                    border-radius: 9999px;
                    background:
                      radial-gradient(circle at 35% 35%, #fff5e6 0%, #ffe1c2 25%, #c8a2ff 60%, #5a3da3 100%);
                    box-shadow:
                      0 0 60px rgba(200,162,255,0.55),
                      0 0 120px rgba(200,162,255,0.35),
                      inset -20px -30px 60px rgba(0,0,0,0.5);
                    animation: cd-pulse 6s ease-in-out infinite;
                }
                @keyframes cd-pulse {
                    0%,100% { box-shadow: 0 0 60px rgba(200,162,255,0.55), 0 0 120px rgba(200,162,255,0.35), inset -20px -30px 60px rgba(0,0,0,0.5); }
                    50%     { box-shadow: 0 0 80px rgba(255,200,230,0.65), 0 0 160px rgba(200,162,255,0.45), inset -20px -30px 60px rgba(0,0,0,0.5); }
                }

                /* Aurora glass card */
                .cd-glass {
                    position: relative;
                    background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
                    border: 1px solid rgba(200,162,255,0.18);
                    backdrop-filter: blur(14px);
                    -webkit-backdrop-filter: blur(14px);
                    border-radius: 18px;
                }
                .cd-glass::before {
                    content: '';
                    position: absolute; inset: -1px;
                    border-radius: 18px;
                    padding: 1px;
                    background: linear-gradient(135deg, rgba(200,162,255,0.6), rgba(120,210,255,0.4) 40%, rgba(255,180,220,0.5) 80%);
                    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
                    -webkit-mask-composite: xor; mask-composite: exclude;
                    pointer-events: none;
                    opacity: 0.7;
                }

                .cd-divider {
                    display: flex; align-items: center; justify-content: center; gap: 14px;
                }
                .cd-divider .line {
                    height: 1px; flex: 1; max-width: 120px;
                    background: linear-gradient(90deg, transparent, rgba(200,162,255,0.55), transparent);
                }

                .cd-nav-link:hover { color: #c8a2ff; }

                .cd-twinkle {
                    display: inline-block;
                    color: #c8a2ff;
                    animation: cd-tw 2.4s ease-in-out infinite;
                    text-shadow: 0 0 12px #c8a2ff;
                }
                @keyframes cd-tw { 0%,100% { opacity:.4; transform: scale(.9);} 50% { opacity:1; transform: scale(1.15);} }

                .cd-frame {
                    position: relative; border-radius: 14px; overflow: hidden;
                    box-shadow: 0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(200,162,255,0.18);
                }
                .cd-frame::after {
                    content: '';
                    position: absolute; inset: 0;
                    background: linear-gradient(180deg, transparent 60%, rgba(10,8,32,0.55));
                    pointer-events: none;
                }

                .cd-gallery-item {
                    position: relative; overflow: hidden; border-radius: 14px;
                    transform: translateZ(0);
                    transition: transform .6s ease, box-shadow .6s ease;
                }
                .cd-gallery-item::after {
                    content:'';
                    position:absolute; inset:0;
                    border-radius:14px;
                    border:1px solid rgba(200,162,255,0);
                    transition: border-color .6s ease, box-shadow .6s ease;
                    pointer-events:none;
                }
                .cd-gallery-item img { transition: transform .8s ease, filter .8s ease; filter: saturate(0.9) brightness(0.95); }
                .cd-gallery-item:hover { transform: translateY(-6px); }
                .cd-gallery-item:hover img { transform: scale(1.07); filter: saturate(1.05) brightness(1.05); }
                .cd-gallery-item:hover::after { border-color: rgba(200,162,255,0.7); box-shadow: 0 0 30px rgba(200,162,255,0.35); }

                .cd-caption {
                    position: absolute; left: 0; right: 0; bottom: 0;
                    padding: 28px 14px 14px;
                    background: linear-gradient(to top, rgba(5,3,15,0.92), rgba(5,3,15,0.55) 60%, transparent);
                    transform: translateY(100%); opacity: 0;
                    transition: transform .5s ease, opacity .5s ease;
                }
                .cd-gallery-item:hover .cd-caption { transform: translateY(0); opacity: 1; }
                .cd-caption p {
                    font-family: 'Cormorant Garamond', serif;
                    font-style: italic; font-size: 14px;
                    text-align: center; color: #f5ecff; margin: 0;
                }
                @media (max-width: 639px) {
                    .cd-caption { position: static; transform:none; opacity:1; padding: 6px 8px 4px; background: transparent; }
                    .cd-caption p { color: #9d86d6; font-size: 11px; }
                }

                .cd-scroll-dot { animation: cd-bounce 2s ease-in-out infinite; }
                @keyframes cd-bounce {
                    0%,100% { transform: translateY(0); opacity:.7; }
                    50%     { transform: translateY(28px); opacity:1; }
                }

                .cd-modal-card {
                    background: linear-gradient(180deg, #120930, #0a0628);
                    border: 1px solid rgba(200,162,255,0.25);
                    box-shadow: 0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(200,162,255,0.15);
                }

                /* Constellation node */
                .cd-node {
                    position: absolute;
                    width: 14px; height: 14px;
                    border-radius: 9999px;
                    background: radial-gradient(circle, #fff 0%, #c8a2ff 60%, transparent 100%);
                    box-shadow: 0 0 18px #c8a2ff, 0 0 36px rgba(200,162,255,0.6);
                    animation: cd-tw 2.6s ease-in-out infinite;
                }

                .cd-floating-share:hover { transform: translateY(-3px) scale(1.04); }
            `}</style>

            <div
                className="cd-root"
                style={{ ['--mx']: `${mouse.x}%`, ['--my']: `${mouse.y}%` }}
            >
                <div className="cd-cosmos" />
                <div className="cd-nebula" />
                <Starfield />

                {/* Header */}
                <header
                    className="fixed inset-x-0 top-0 z-50 border-b border-[#c8a2ff]/10 px-5 md:px-10"
                    style={{
                        background: 'rgba(5,3,15,0.78)',
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
                            className="font-['Great_Vibes'] text-[34px] leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#c8a2ff] via-[#88d6ff] to-[#ffd1e8]"
                        >
                            {initials}
                        </button>
                        <nav className="hidden items-center gap-8 md:flex">
                            {navSections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className="cd-nav-link text-[11px] uppercase tracking-[0.22em] text-[#9d86d6] transition"
                                >
                                    {section.label}
                                </button>
                            ))}
                        </nav>
                        <button
                            onClick={() => setShowShare(true)}
                            className="rounded-full border border-[#c8a2ff]/50 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-[#c8a2ff] transition hover:bg-[#c8a2ff]/10"
                        >
                            Share Story
                        </button>
                    </div>
                </header>

                <main className="cd-section">
                    {/* HERO */}
                    <section
                        id="hero"
                        className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-24 md:pt-0 text-center"
                    >
                        <div className="relative z-10 mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center md:text-left">
                            <Reveal>
                                <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.36em] text-[#9d86d6]">
                                    <span className="cd-twinkle mr-2">✦</span>
                                    {content.eyebrow || 'Written in the Stars'}
                                    <span className="cd-twinkle ml-2">✦</span>
                                </p>
                                <h1 className="font-['Great_Vibes'] text-[clamp(64px,12vw,148px)] leading-[0.95] text-transparent bg-clip-text bg-gradient-to-br from-[#fff] via-[#c8a2ff] to-[#88d6ff] [text-shadow:0_2px_60px_rgba(200,162,255,0.35)]">
                                    {content.title}
                                </h1>
                                <p className="mx-auto mt-5 max-w-xl font-['Cormorant_Garamond'] text-lg italic text-[#cdb8ff] md:mx-0 md:text-xl">
                                    {content.subtitle || 'two souls, one universe'}
                                </p>
                                {heroMeta && (
                                    <div className="mt-7 inline-flex items-center gap-3 rounded-full border border-[#c8a2ff]/30 bg-[#0a0628]/40 px-5 py-2.5 backdrop-blur">
                                        <span className="cd-twinkle text-[10px]">✦</span>
                                        <p className="font-['Italiana'] text-xs tracking-[0.18em] text-[#f5ecff] md:text-sm">
                                            {heroMeta}
                                        </p>
                                        <span className="cd-twinkle text-[10px]">✦</span>
                                    </div>
                                )}
                            </Reveal>

                            <Reveal delay={200}>
                                <div className="cd-moon-wrap">
                                    <div className="cd-orbit">
                                        <span className="cd-orbit-dot" />
                                    </div>
                                    <div className="cd-orbit b">
                                        <span className="cd-orbit-dot" style={{ background: 'linear-gradient(135deg,#fff,#ffd1e8)', boxShadow: '0 0 16px #ffd1e8' }} />
                                    </div>
                                    <div className="cd-orbit c">
                                        <span className="cd-orbit-dot" style={{ background: 'linear-gradient(135deg,#fff,#88d6ff)', boxShadow: '0 0 16px #88d6ff' }} />
                                    </div>
                                    <div className="cd-moon" />
                                    {content.coverImageUrl && (
                                        <div className="absolute inset-[24%] overflow-hidden rounded-full opacity-90 mix-blend-screen">
                                            <img
                                                src={content.coverImageUrl}
                                                alt={content.title}
                                                className="h-full w-full object-cover opacity-50"
                                            />
                                        </div>
                                    )}
                                </div>
                            </Reveal>
                        </div>

                        <div className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center">
                            <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-[#9d86d6]">Scroll</p>
                            <div className="relative h-12 w-px overflow-hidden bg-[#c8a2ff]/40">
                                <div className="cd-scroll-dot absolute left-1/2 top-0 h-[6px] w-[6px] -translate-x-1/2 rounded-full bg-[#c8a2ff] shadow-[0_0_10px_#c8a2ff]" />
                            </div>
                        </div>
                    </section>

                    {/* OUR STORY */}
                    {storyParagraphs.length > 0 && (
                        <section id="our-story" className="cd-section mx-auto max-w-6xl px-6 py-28 md:px-10">
                            <Reveal>
                                <div className="mb-14 text-center">
                                    <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#9d86d6]">
                                        <span className="cd-twinkle mr-2">✧</span> Our Story <span className="cd-twinkle ml-2">✧</span>
                                    </p>
                                    <h2 className="mt-4 font-['Italiana'] text-[clamp(34px,5vw,52px)] leading-tight text-[#f5ecff]">
                                        Where Two Stars Aligned
                                    </h2>
                                </div>
                            </Reveal>

                            <div className="grid items-center gap-14 md:grid-cols-[55%_45%]">
                                <Reveal>
                                    <div className="cd-glass p-8 md:p-10">
                                        {storyParagraphs.map((paragraph, index) => (
                                            <p
                                                key={index}
                                                className="mb-5 font-['Cormorant_Garamond'] text-[17px] leading-9 text-[#f5ecff]/90 md:text-[18px]"
                                            >
                                                {paragraph}
                                            </p>
                                        ))}

                                        <div className="mt-8 border-l-2 border-[#c8a2ff]/60 pl-6">
                                            <p className="font-['Cormorant_Garamond'] text-xl italic leading-9 text-[#cdb8ff]">
                                                {content.finalMessage
                                                    ? `“${content.finalMessage}”`
                                                    : '“In a sky full of stars, I always look for you.”'}
                                            </p>
                                        </div>
                                    </div>
                                </Reveal>

                                <Reveal delay={150}>
                                    {storyImage && (
                                        <div className="cd-frame aspect-[3/4] w-full">
                                            <img
                                                src={storyImage}
                                                alt={content.title}
                                                className="block h-full w-full object-cover"
                                            />
                                        </div>
                                    )}
                                </Reveal>
                            </div>
                        </section>
                    )}

                    {/* MILESTONES — CONSTELLATION */}
                    {content.milestones.length > 0 && (
                        <section id="events" className="cd-section px-6 py-28 md:px-10">
                            <div className="mx-auto max-w-5xl">
                                <Reveal>
                                    <div className="mb-20 text-center">
                                        <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#9d86d6]">
                                            The Constellation
                                        </p>
                                        <h2 className="mt-4 font-['Italiana'] text-[clamp(34px,5vw,52px)] leading-tight text-transparent bg-clip-text bg-gradient-to-r from-[#c8a2ff] via-[#fff] to-[#88d6ff]">
                                            Chapters Among the Stars
                                        </h2>
                                    </div>
                                </Reveal>

                                <div className="relative pl-10 md:pl-0">
                                    <div className="absolute bottom-0 left-5 top-0 w-px bg-gradient-to-b from-transparent via-[#c8a2ff]/60 to-transparent md:left-1/2" />
                                    <div className="flex flex-col gap-16">
                                        {content.milestones.map((milestone, index) => {
                                            const isLeft = index % 2 === 0;
                                            return (
                                                <Reveal key={milestone.key} delay={index * 80}>
                                                    <div className={`relative md:grid md:grid-cols-2 md:gap-12 ${isLeft ? '' : 'md:[&>*:first-child]:order-2'}`}>
                                                        <span className="cd-node left-[-19px] top-6 md:left-[calc(50%-7px)]" />
                                                        <div className={isLeft ? 'md:pr-8 md:text-right' : 'md:pl-8'}>
                                                            <div className="cd-glass p-7">
                                                                <span className="mb-4 inline-block rounded-full bg-gradient-to-r from-[#c8a2ff] to-[#88d6ff] px-4 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#0a0628]">
                                                                    {formatMilestoneDate(milestone.date) || `Moment ${index + 1}`}
                                                                </span>
                                                                <h3 className="mb-3 font-['Italiana'] text-[26px] text-[#f5ecff]">
                                                                    {milestone.title}
                                                                </h3>
                                                                {milestone.description && (
                                                                    <p className="mb-4 font-['Cormorant_Garamond'] text-[16px] leading-8 text-[#cdb8ff]">
                                                                        {milestone.description}
                                                                    </p>
                                                                )}
                                                                {milestone.imageUrl && (
                                                                    <div className="cd-frame mt-4 aspect-[16/10] w-full">
                                                                        <img
                                                                            src={milestone.imageUrl}
                                                                            alt={milestone.title}
                                                                            className="h-full w-full object-cover"
                                                                        />
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

                    {/* BLESSING / VOW */}
                    <section id="blessing" className="cd-section relative overflow-hidden px-6 py-32 text-center md:px-10">
                        <Reveal>
                            <div className="relative mx-auto max-w-4xl">
                                <div className="cd-moon-wrap mb-10" style={{ width: 'min(60vw, 320px)' }}>
                                    <div className="cd-orbit" />
                                    <div className="cd-orbit b" />
                                    <div className="cd-moon" style={{ inset: '30%' }} />
                                </div>
                                <div className="cd-divider mb-6">
                                    <span className="line" />
                                    <span className="cd-twinkle">✦</span>
                                    <span className="line" />
                                </div>
                                <h2 className="font-['Italiana'] text-[clamp(30px,5vw,46px)] text-[#f5ecff]">
                                    Bound by Light, Guided by Love
                                </h2>
                                <p className="mx-auto mt-7 max-w-2xl font-['Cormorant_Garamond'] text-[22px] italic leading-10 text-[#cdb8ff]">
                                    {content.finalMessage
                                        ? `“${content.finalMessage}”`
                                        : '“In every galaxy, in every lifetime — I would still find you.”'}
                                </p>
                                <div className="cd-divider mt-10">
                                    <span className="line" />
                                    <span className="cd-twinkle">✦</span>
                                    <span className="line" />
                                </div>
                                {blessingImage && (
                                    <div className="cd-frame mx-auto mt-12 max-w-2xl">
                                        <img
                                            src={blessingImage}
                                            alt="Vow"
                                            className="h-[320px] w-full object-cover opacity-90"
                                        />
                                    </div>
                                )}
                            </div>
                        </Reveal>
                    </section>

                    {/* GALLERY */}
                    {galleryImages.length > 0 && (
                        <section id="gallery" className="cd-section py-28">
                            <Reveal>
                                <div className="mb-14 px-6 text-center md:px-10">
                                    <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.32em] text-[#9d86d6]">
                                        Stardust Memories
                                    </p>
                                    <h2 className="font-['Italiana'] text-[clamp(30px,5vw,46px)] text-[#f5ecff]">
                                        Captured in Light
                                    </h2>
                                </div>
                            </Reveal>

                            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 md:grid-cols-3 lg:grid-cols-4">
                                {galleryImages.map((image, index) => (
                                    <Reveal key={image.key || image.src || index} delay={(index % 4) * 80}>
                                        <div className="cd-gallery-item">
                                            <div className="aspect-[4/5] w-full">
                                                <img
                                                    src={image.src}
                                                    alt={image.alt || `Gallery image ${index + 1}`}
                                                    className="block h-full w-full object-cover"
                                                />
                                            </div>
                                            {image.caption && (
                                                <div className="cd-caption">
                                                    <p>{image.caption}</p>
                                                </div>
                                            )}
                                        </div>
                                    </Reveal>
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                <footer className="cd-section relative border-t border-[#c8a2ff]/15 px-6 py-16 text-center md:px-10">
                    <p className="font-['Great_Vibes'] text-[44px] leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#c8a2ff] via-[#fff] to-[#88d6ff]">
                        {content.title}
                    </p>
                    {heroMeta && (
                        <p className="mt-2 font-['Italiana'] text-xs tracking-[0.2em] text-[#9d86d6] md:text-sm">
                            {heroMeta}
                        </p>
                    )}
                    <div className="cd-divider my-7">
                        <span className="line" />
                        <span className="cd-twinkle">✦</span>
                        <span className="line" />
                    </div>
                    <p className="text-xs text-[#9d86d6]/70">Written across galaxies — for your forever</p>
                </footer>

                {/* Floating share */}
                <button
                    aria-label="Share this story"
                    onClick={() => setShowShare(true)}
                    className="cd-floating-share fixed bottom-8 right-8 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-[#c8a2ff] via-[#88d6ff] to-[#ffd1e8] px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-[#0a0628] shadow-[0_10px_40px_rgba(200,162,255,0.45)] transition"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0a0628" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
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

