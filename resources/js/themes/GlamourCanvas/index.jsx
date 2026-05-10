import React, { useEffect, useMemo, useRef, useState } from 'react';
import { formatDisplayDate, formatMilestoneDate, getThemeStoryContent } from '../shared';

function clamp(value, min = 0, max = 1) {
    return Math.min(max, Math.max(min, value));
}

/* ─── Share Modal ─── */
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
            <div
                className="absolute inset-0"
                style={{ background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(12px)' }}
                onClick={onClose}
            />
            <div
                className="relative w-full max-w-md p-8 text-center"
                style={{
                    background: 'rgba(17,17,17,0.97)',
                    border: '1px solid rgba(212,175,55,0.25)',
                    boxShadow: '0 20px 80px rgba(0,0,0,0.6)',
                }}
            >
                <span
                    className="material-symbols-outlined mb-3 block text-4xl"
                    style={{ color: '#D4AF37', fontVariationSettings: '"FILL" 1' }}
                >
                    share
                </span>
                <h3
                    className="mb-2 text-[28px]"
                    style={{ fontFamily: "'Playfair Display', serif", color: '#F4F4F0' }}
                >
                    Share This Portfolio
                </h3>
                <p className="mb-6 text-sm leading-7" style={{ color: 'rgba(244,244,240,0.6)' }}>
                    Copy the link to share {title || 'this portfolio'}.
                </p>
                <div className="flex gap-2">
                    <input
                        readOnly
                        value={url}
                        className="min-w-0 flex-1 rounded-none px-4 py-3 text-sm outline-none"
                        style={{
                            background: 'rgba(5,5,5,0.7)',
                            border: '1px solid rgba(212,175,55,0.2)',
                            color: '#F4F4F0',
                        }}
                    />
                    <button
                        onClick={handleCopy}
                        className="whitespace-nowrap rounded-none px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition hover:brightness-110"
                        style={{ background: '#D4AF37', color: '#050505' }}
                    >
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="mt-5 text-xs uppercase tracking-[0.16em] transition"
                    style={{ color: 'rgba(244,244,240,0.5)' }}
                >
                    Close
                </button>
            </div>
        </div>
    );
}

/* ─── Glass Refraction Canvas Hero ─── */
function GlassRefractionCanvas() {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: 0.5, y: 0.5 });
    const rafRef = useRef(null);
    const timeRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let w, h;

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio, 2);
            w = canvas.width = canvas.offsetWidth * dpr;
            h = canvas.height = canvas.offsetHeight * dpr;
            ctx.scale(dpr, dpr);
        };

        const handleMouse = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current.x = (e.clientX - rect.left) / rect.width;
            mouseRef.current.y = (e.clientY - rect.top) / rect.height;
        };

        const draw = () => {
            const cssW = canvas.offsetWidth;
            const cssH = canvas.offsetHeight;
            timeRef.current += 0.008;
            const t = timeRef.current;
            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, w, h);
            const dpr = Math.min(window.devicePixelRatio, 2);
            ctx.scale(dpr, dpr);

            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, cssW, cssH);

            const shards = 14;
            for (let i = 0; i < shards; i++) {
                const angle = (i / shards) * Math.PI * 2 + t * 0.3;
                const dist = 0.2 + 0.06 * Math.sin(t * 0.7 + i * 1.3);
                const cx = (0.5 + Math.cos(angle) * dist + (mx - 0.5) * 0.06) * cssW;
                const cy = (0.5 + Math.sin(angle) * dist * 0.7 + (my - 0.5) * 0.06) * cssH;
                const size = Math.min(cssW, cssH) * (0.1 + 0.03 * Math.sin(t + i * 2));
                const rot = angle + t * 0.15 + i * 0.7;

                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(rot);

                const grad = ctx.createLinearGradient(-size, -size * 0.3, size, size * 0.3);
                grad.addColorStop(0, 'rgba(212,175,55,0.0)');
                grad.addColorStop(0.25, 'rgba(212,175,55,0.06)');
                grad.addColorStop(0.5, 'rgba(244,244,240,0.1)');
                grad.addColorStop(0.75, 'rgba(212,175,55,0.06)');
                grad.addColorStop(1, 'rgba(212,175,55,0.0)');

                ctx.beginPath();
                ctx.moveTo(-size * 0.5, -size * 0.85);
                ctx.lineTo(size * 0.35, -size * 0.65);
                ctx.lineTo(size * 0.65, size * 0.15);
                ctx.lineTo(size * 0.1, size * 0.95);
                ctx.lineTo(-size * 0.75, size * 0.35);
                ctx.closePath();
                ctx.fillStyle = grad;
                ctx.fill();

                ctx.strokeStyle = `rgba(212,175,55,${0.12 + 0.08 * Math.sin(t + i)})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(-size * 0.25, -size * 0.5);
                ctx.lineTo(size * 0.15, -size * 0.3);
                ctx.strokeStyle = `rgba(255,255,255,${0.08 + 0.06 * Math.sin(t * 1.5 + i)})`;
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.restore();
            }

            const glowGrad = ctx.createRadialGradient(
                (0.5 + (mx - 0.5) * 0.04) * cssW,
                (0.5 + (my - 0.5) * 0.04) * cssH,
                0,
                (0.5 + (mx - 0.5) * 0.04) * cssW,
                (0.5 + (my - 0.5) * 0.04) * cssH,
                Math.min(cssW, cssH) * 0.45
            );
            glowGrad.addColorStop(0, 'rgba(212,175,55,0.05)');
            glowGrad.addColorStop(0.5, 'rgba(212,175,55,0.02)');
            glowGrad.addColorStop(1, 'rgba(5,5,5,0)');
            ctx.fillStyle = glowGrad;
            ctx.fillRect(0, 0, cssW, cssH);

            const orbX = mx * cssW;
            const orbY = my * cssH;
            const orbGrad = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, Math.min(cssW, cssH) * 0.22);
            orbGrad.addColorStop(0, 'rgba(244,244,240,0.03)');
            orbGrad.addColorStop(0.4, 'rgba(212,175,55,0.025)');
            orbGrad.addColorStop(1, 'rgba(5,5,5,0)');
            ctx.fillStyle = orbGrad;
            ctx.fillRect(0, 0, cssW, cssH);

            rafRef.current = requestAnimationFrame(draw);
        };

        resize();
        window.addEventListener('resize', resize);
        canvas.addEventListener('mousemove', handleMouse);
        canvas.addEventListener('touchmove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const t = e.touches[0];
            mouseRef.current.x = (t.clientX - rect.left) / rect.width;
            mouseRef.current.y = (t.clientY - rect.top) / rect.height;
        }, { passive: true });

        rafRef.current = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener('resize', resize);
            canvas.removeEventListener('mousemove', handleMouse);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
        />
    );
}

/* ─── Floating Word ─── */
function FloatingWord({ text, delay }) {
    return (
        <div
            className="gc-floating-word my-8 select-none text-center uppercase"
            style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(40px, 8vw, 100px)',
                fontWeight: 400,
                fontStyle: 'italic',
                color: 'rgba(244,244,240,0.08)',
                letterSpacing: '0.15em',
                lineHeight: 1.1,
                cursor: 'default',
                transition: 'color 0.6s ease, text-shadow 0.6s ease',
                animationDelay: `${delay}s`,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.color = 'rgba(244,244,240,0.9)';
                e.currentTarget.style.textShadow = '0 0 60px rgba(212,175,55,0.25), 0 0 120px rgba(212,175,55,0.1)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(244,244,240,0.08)';
                e.currentTarget.style.textShadow = 'none';
            }}
        >
            {text}
        </div>
    );
}

/* ─── Light Sweep Text ─── */
function LightSweepText({ children }) {
    return (
        <span
            className="gc-light-sweep block text-center"
            style={{
                background: 'linear-gradient(90deg, #050505 0%, #F4F4F0 50%, #050505 100%)',
                backgroundRepeat: 'no-repeat',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'rgba(244,244,240,0.06)',
                backgroundClip: 'text',
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(24px, 4.5vw, 56px)',
                fontWeight: 400,
                fontStyle: 'italic',
                lineHeight: 1.2,
            }}
        >
            {children}
        </span>
    );
}

/* ─── Carousel Item ─── */
function CarouselItem({ image, index, total, scrollProgress }) {
    const itemRef = useRef(null);
    const stateRef = useRef({ x: 0, z: 0, scale: 1, opacity: 1 });

    useEffect(() => {
        const el = itemRef.current;
        if (!el) return;
        const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
        const radius = 500;
        let rafId;

        const ticker = () => {
            const progress = scrollProgress.current || 0;
            const currentAngle = angle + progress * Math.PI * 2;
            const x = Math.cos(currentAngle) * radius;
            const z = Math.sin(currentAngle) * radius;
            const scale = (z + radius) / (radius * 2) * 0.6 + 0.4;
            const opacity = Math.max(0.15, (z + radius) / (radius * 2) * 0.85 + 0.15);

            stateRef.current = { x, z, scale, opacity };
            el.style.transform = `translate3d(${x}px, -50%, ${z}px) scale(${scale})`;
            el.style.opacity = opacity;
            el.style.zIndex = Math.round(z + 1000);
            rafId = requestAnimationFrame(ticker);
        };

        rafId = requestAnimationFrame(ticker);
        return () => cancelAnimationFrame(rafId);
    }, [index, total, scrollProgress]);

    return (
        <div
            ref={itemRef}
            className="absolute"
            style={{
                width: '300px', height: '420px', left: '50%', top: '50%',
                transformStyle: 'preserve-3d', backfaceVisibility: 'hidden',
                willChange: 'transform, opacity',
            }}
        >
            <img
                src={image.src}
                alt={image.alt || `Portfolio ${index + 1}`}
                className="h-full w-full object-cover"
                style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
                loading="lazy"
            />
            <div className="absolute inset-0 pointer-events-none" style={{ border: '1px solid rgba(212,175,55,0.12)' }} />
            {image.alt && (
                <div
                    className="absolute bottom-0 left-0 right-0 p-4"
                    style={{
                        background: 'linear-gradient(to top, rgba(5,5,5,0.85) 0%, transparent 100%)',
                    }}
                >
                    <p className="text-center text-[11px] uppercase tracking-[0.15em]" style={{ color: 'rgba(244,244,240,0.6)' }}>
                        {image.alt}
                    </p>
                </div>
            )}
        </div>
    );
}

/* ─── Main GlamourCanvas Component ─── */
export default function GlamourCanvas({ data }) {
    const content = getThemeStoryContent(data);
    const [showShare, setShowShare] = useState(false);
    const [navVisible, setNavVisible] = useState(false);
    const carouselScrollRef = useRef(null);
    const scrollProgressRef = useRef(0);

    const storyParagraphs = (content.summary || '')
        .split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

    const galleryImages = useMemo(() => {
        const seen = new Set();
        return (content.images || []).filter((img) => img?.src).filter((img) => {
            if (seen.has(img.src)) return false;
            seen.add(img.src);
            return true;
        });
    }, [content]);

    const portfolioImages = useMemo(() => {
        const fallback = [
            { src: '/images/beauty-1.jpg', alt: 'Ethereal Glow', key: 'f1' },
            { src: '/images/beauty-2.jpg', alt: 'Dramatic Sculpt', key: 'f2' },
            { src: '/images/beauty-3.jpg', alt: 'Golden Bronze', key: 'f3' },
            { src: '/images/beauty-4.jpg', alt: 'Classic Glamour', key: 'f4' },
            { src: '/images/beauty-5.jpg', alt: 'Avant Garde', key: 'f5' },
            { src: '/images/beauty-6.jpg', alt: 'Romantic Rose', key: 'f6' },
        ];
        if (galleryImages.length >= 4) return galleryImages;
        return [...galleryImages, ...fallback].slice(0, 6);
    }, [galleryImages]);

    const avatarSrc = content.coverImageUrl || portfolioImages[0]?.src || '/images/avatar.jpg';
    const displayName = content.people.length > 1
        ? `${content.people[0]} (${content.people[1]})`
        : content.people[0] || content.title || 'Aura Artistry';

    useEffect(() => {
        const onScroll = () => setNavVisible(window.scrollY > window.innerHeight * 0.5);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const revealTargets = document.querySelectorAll([
            '.gc-floating-word',
            '.gc-light-sweep',
            '.gc-story-text',
            '.gc-story-image',
            '.gc-milestone-item',
            '.gc-gallery-header',
            '.gc-blessing-content',
            '.gc-footer-avatar',
        ].join(','));

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('gc-in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -15% 0px', threshold: 0.12 });

        revealTargets.forEach((target) => observer.observe(target));

        const updateGalleryProgress = () => {
            const scroller = carouselScrollRef.current;
            if (!scroller) return;
            const scrollable = Math.max(1, scroller.scrollWidth - scroller.clientWidth);
            scrollProgressRef.current = clamp(scroller.scrollLeft / scrollable);
        };

        updateGalleryProgress();
        const scroller = carouselScrollRef.current;
        scroller?.addEventListener('scroll', updateGalleryProgress, { passive: true });
        window.addEventListener('resize', updateGalleryProgress);

        return () => {
            observer.disconnect();
            scroller?.removeEventListener('scroll', updateGalleryProgress);
            window.removeEventListener('resize', updateGalleryProgress);
        };
    }, [portfolioImages.length]);

    const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const handleCarouselWheel = (event) => {
        const scroller = carouselScrollRef.current;
        if (!scroller) return;
        const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        if (!delta) return;
        scroller.scrollLeft += delta;
        event.preventDefault();
    };

    return (
        <>
            <style>{`
                .gc-root { background: #050505; color: #F4F4F0; font-family: 'Inter', sans-serif; min-height: 100vh; overflow-x: hidden; }
                .gc-root ::selection { background: rgba(212, 175, 55, 0.3); color: #F4F4F0; }
                .gc-nav-link { position: relative; }
                .gc-nav-link::after { content: ''; position: absolute; bottom: -4px; left: 0; width: 0; height: 1px; background: #D4AF37; transition: width 0.4s ease; }
                .gc-nav-link:hover::after { width: 100%; }
                .gc-cta-btn { position: relative; overflow: hidden; transition: all 0.4s ease; }
                .gc-cta-btn::before { content: ''; position: absolute; inset: 0; background: #D4AF37; transform: translateX(-101%); transition: transform 0.5s cubic-bezier(0.23, 1, 0.32, 1); }
                .gc-cta-btn:hover::before { transform: translateX(0); }
                .gc-cta-btn:hover { color: #050505; }
                .gc-cta-btn span { position: relative; z-index: 1; }
                .gc-hero-eyebrow, .gc-hero-title, .gc-hero-subtitle, .gc-hero-scroll {
                    opacity: 0;
                    animation: gc-rise-in 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }
                .gc-hero-eyebrow { transform: translateY(30px); animation-delay: 0.3s; }
                .gc-hero-title { transform: translateY(60px); animation-delay: 0.5s; }
                .gc-hero-subtitle { transform: translateY(30px); animation-delay: 0.8s; }
                .gc-hero-scroll { animation-delay: 1.5s; }
                @keyframes gc-rise-in {
                    to { opacity: 1; transform: translateY(0); }
                }
                .gc-floating-word,
                .gc-light-sweep,
                .gc-story-text,
                .gc-story-image,
                .gc-milestone-item,
                .gc-gallery-header,
                .gc-blessing-content,
                .gc-footer-avatar {
                    opacity: 0;
                    transition: opacity 0.9s ease, transform 0.9s cubic-bezier(0.22, 1, 0.36, 1), background-size 1.2s ease, letter-spacing 0.9s ease;
                }
                .gc-floating-word { transform: translateY(60px); letter-spacing: 0.3em !important; }
                .gc-floating-word.gc-in-view { letter-spacing: 0.15em !important; }
                .gc-light-sweep { background-size: 0% 100%; }
                .gc-light-sweep.gc-in-view { background-size: 100% 100%; }
                .gc-story-text, .gc-milestone-item:nth-child(odd) { transform: translateX(-40px); }
                .gc-story-image, .gc-milestone-item:nth-child(even) { transform: translateX(40px) scale(0.95); }
                .gc-gallery-header { transform: translateY(30px); }
                .gc-blessing-content { transform: translateY(50px); }
                .gc-footer-avatar { transform: scale(0.8); }
                .gc-in-view {
                    opacity: 1;
                    transform: none;
                }
                @keyframes gc-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                .gc-float-anim { animation: gc-float 4s ease-in-out infinite; }
                @keyframes gc-scroll-line { 0% { transform: translateY(-100%); } 100% { transform: translateY(200%); } }
                .gc-scroll-line-inner { animation: gc-scroll-line 2s ease-in-out infinite; }
                .gc-image-frame { position: relative; }
                .gc-image-frame::before { content: ''; position: absolute; inset: -12px; border: 1px solid rgba(212, 175, 55, 0.15); pointer-events: none; transition: all 0.5s ease; }
                .gc-image-frame:hover::before { inset: -8px; border-color: rgba(212, 175, 55, 0.35); }
                .gc-carousel-scroll {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                    touch-action: pan-x;
                }
                .gc-carousel-scroll::-webkit-scrollbar { display: none; }
                @media (max-width: 768px) {
                    .gc-gallery-section { min-height: auto !important; padding: 80px 0 !important; }
                    .gc-carousel-3d { width: 900px !important; max-width: none !important; }
                    .gc-carousel-3d > div { width: 220px !important; height: 320px !important; }
                }
            `}</style>

            <div className="gc-root">
                {/* Navigation */}
                <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 md:px-12"
                    style={{
                        height: '80px',
                        background: navVisible ? 'rgba(5,5,5,0.9)' : 'transparent',
                        backdropFilter: navVisible ? 'blur(12px)' : 'none',
                        borderBottom: navVisible ? '1px solid rgba(212,175,55,0.08)' : '1px solid transparent',
                        transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
                    }}>
                    <button onClick={() => scrollTo('hero')} className="text-[22px] font-medium tracking-[0.2em] uppercase"
                        style={{ fontFamily: "'Playfair Display', serif", color: '#D4AF37' }}>
                        {displayName}
                    </button>
                    <nav className="hidden items-center gap-10 md:flex">
                        {[
                            { id: 'portfolio', label: 'Portfolio' },
                            { id: 'process', label: 'Process' },
                            storyParagraphs.length > 0 ? { id: 'story', label: 'Story' } : null,
                            { id: 'connect', label: 'Connect' },
                        ].filter(Boolean).map((s) => (
                            <button key={s.id} onClick={() => scrollTo(s.id)}
                                className="gc-nav-link text-[11px] uppercase tracking-[0.2em] transition-colors"
                                style={{ color: 'rgba(244,244,240,0.55)' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#D4AF37'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(244,244,240,0.55)'}
                            >
                                {s.label}
                            </button>
                        ))}
                    </nav>
                    <button onClick={() => setShowShare(true)}
                        className="border px-5 py-2.5 text-[10px] font-medium uppercase tracking-[0.18em] transition hover:bg-[rgba(212,175,55,0.06)]"
                        style={{ borderColor: 'rgba(212,175,55,0.35)', color: '#D4AF37' }}>
                        Share
                    </button>
                </header>

                {/* Hero */}
                <section id="hero" className="relative flex min-h-screen items-center justify-center overflow-hidden text-center">
                    <GlassRefractionCanvas />
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 0%, rgba(5,5,5,0.3) 100%)', zIndex: 1 }} />
                    <div className="relative z-10 mx-auto max-w-4xl px-6" style={{ pointerEvents: 'none' }}>
                        <p className="gc-hero-eyebrow mb-6 text-[11px] font-medium uppercase tracking-[0.32em]" style={{ color: 'rgba(244,244,240,0.45)', fontFamily: "'Inter', sans-serif" }}>
                            {content.eyebrow || 'The Art of Enhancement'}
                        </p>
                        <h1 className="gc-hero-title leading-none" style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(42px, 6vw, 88px)', fontWeight: 400, fontStyle: 'italic', color: '#F4F4F0', textShadow: '0 2px 40px rgba(212,175,55,0.12)', letterSpacing: '-0.01em' }}>
                            {displayName || 'Reveal Your Inner Radiance'}
                        </h1>
                        <p className="gc-hero-subtitle mx-auto mt-6 max-w-xl text-base italic" style={{ color: 'rgba(244,244,240,0.5)', lineHeight: 1.7 }}>
                            {content.subtitle || 'Every face tells a story. Every brushstroke reveals the masterpiece within.'}
                        </p>
                    </div>
                    <div className="gc-hero-scroll absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center" style={{ opacity: 0 }}>
                        <span className="mb-3 text-[10px] uppercase tracking-[0.25em]" style={{ color: 'rgba(244,244,240,0.25)' }}>Scroll</span>
                        <div className="relative h-12 w-px overflow-hidden" style={{ background: 'rgba(212,175,55,0.12)' }}>
                            <div className="gc-scroll-line-inner absolute left-0 top-0 h-4 w-full" style={{ background: '#D4AF37' }} />
                        </div>
                    </div>
                </section>

                {/* Signature Looks - Floating Typography */}
                <section id="looks" className="relative overflow-hidden py-32 md:py-44">
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(212,175,55,0.025) 0%, transparent 60%)' }} />
                    <div className="relative mx-auto max-w-5xl px-6">
                        <p className="mb-16 text-center text-[11px] font-medium uppercase tracking-[0.25em]" style={{ color: '#D4AF37' }}>Signature Looks</p>
                        {['Ethereal', 'Sculpted', 'Bronzed', 'Classic'].map((word, i) => (
                            <FloatingWord key={word} text={word} delay={i * 0.15} />
                        ))}
                    </div>
                </section>

                {/* Story Section */}
                {storyParagraphs.length > 0 && (
                    <section id="story" className="relative py-32 md:py-44">
                        <div className="mx-auto max-w-6xl px-6 md:px-10">
                            <div className="grid items-center gap-16 md:grid-cols-[45%_55%]">
                                <div className="gc-story-text order-2 md:order-1">
                                    <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em]" style={{ color: '#D4AF37' }}>My Story</p>
                                    <h2 className="mb-8" style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 400, fontStyle: 'italic', color: '#F4F4F0', lineHeight: 1.15 }}>
                                        Where It All Began
                                    </h2>
                                    {storyParagraphs.map((p, i) => (
                                        <p key={i} className="mb-6 text-[15px] leading-8" style={{ color: 'rgba(244,244,240,0.7)' }}>{p}</p>
                                    ))}
                                    <div className="relative mt-10 border-l-2 pl-6" style={{ borderColor: '#D4AF37' }}>
                                        <span className="absolute left-2 top-[-30px] leading-none" style={{ fontFamily: "'Playfair Display', serif", fontSize: '80px', color: 'rgba(212,175,55,0.1)' }}>&ldquo;</span>
                                        <p className="relative z-10 text-xl italic leading-8" style={{ fontFamily: "'Playfair Display', serif", color: '#F4F4F0' }}>
                                            {content.finalMessage ? `"${content.finalMessage}"` : '"Makeup is not a mask. It is art, passion, and expression of the soul."'}
                                        </p>
                                    </div>
                                </div>
                                <div className="gc-story-image order-1 md:order-2">
                                    <div className="gc-image-frame">
                                        <img src={avatarSrc} alt={content.title || 'Artist'} className="block aspect-[3/4] w-full object-cover" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Portfolio 3D Carousel */}
                <section id="portfolio" className="gc-gallery-section relative overflow-hidden" style={{ minHeight: '100vh' }}>
                    <div className="gc-gallery-header mb-14 px-6 pt-24 text-center md:px-10">
                        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em]" style={{ color: '#D4AF37' }}>Portfolio</p>
                        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, fontStyle: 'italic', color: '#F4F4F0' }}>
                            Captured in Light
                        </h2>
                    </div>
                    <div ref={carouselScrollRef} onWheel={handleCarouselWheel} className="gc-carousel-scroll overflow-x-auto overflow-y-hidden pb-4">
                        <div className="gc-carousel-3d relative mx-auto" style={{ width: '1800px', maxWidth: '180vw', height: '480px', perspective: '900px', perspectiveOrigin: '50% 50%' }}>
                            {portfolioImages.map((img, i) => (
                                <CarouselItem key={img.key || i} image={img} index={i} total={portfolioImages.length} scrollProgress={scrollProgressRef} />
                            ))}
                        </div>
                    </div>
                    <div className="mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-4 px-6 pb-24">
                        {portfolioImages.map((img, i) => (
                            <span key={img.key || i} className="text-[10px] uppercase tracking-[0.15em]" style={{ color: 'rgba(244,244,240,0.25)' }}>
                                {img.alt || `Look ${i + 1}`}
                                {i < portfolioImages.length - 1 && <span className="ml-4" style={{ color: 'rgba(212,175,55,0.2)' }}>|</span>}
                            </span>
                        ))}
                    </div>
                </section>

                {/* Milestones */}
                {content.milestones.length > 0 && (
                    <section className="relative py-32 md:py-44" style={{ background: '#080808' }}>
                        <div className="mx-auto max-w-5xl px-6 md:px-10">
                            <div className="mb-20 text-center">
                                <p className="text-[11px] font-medium uppercase tracking-[0.22em]" style={{ color: '#D4AF37' }}>Journey</p>
                                <h2 className="mt-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(30px, 5vw, 44px)', fontWeight: 400, fontStyle: 'italic', color: '#F4F4F0', lineHeight: 1.2 }}>
                                    Chapters of My Craft
                                </h2>
                            </div>
                            <div className="relative pl-10 md:pl-0">
                                <div className="absolute bottom-0 left-5 top-0 w-px md:left-0" style={{ background: 'linear-gradient(to bottom, transparent, rgba(212,175,55,0.3), transparent)' }} />
                                <div className="flex flex-col gap-14">
                                    {content.milestones.map((m, i) => (
                                        <div key={m.key} className="gc-milestone-item relative">
                                            <div className="absolute left-[-12px] top-5 h-2.5 w-2.5 rounded-full md:left-[-4px]" style={{ background: '#D4AF37', boxShadow: '0 0 15px rgba(212,175,55,0.3)' }} />
                                            <div className="border-l-2 p-8" style={{ borderColor: 'rgba(212,175,55,0.2)', background: 'rgba(244,244,240,0.012)' }}>
                                                <span className="mb-4 inline-block px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ background: '#D4AF37', color: '#050505' }}>
                                                    {formatMilestoneDate(m.date) || `Chapter ${i + 1}`}
                                                </span>
                                                <h3 className="mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', color: '#F4F4F0', fontWeight: 400, fontStyle: 'italic' }}>{m.title}</h3>
                                                {m.description && <p className="text-[15px] leading-7" style={{ color: 'rgba(244,244,240,0.55)' }}>{m.description}</p>}
                                                {m.imageUrl && <img src={m.imageUrl} alt={m.title} className="mt-4 max-h-[340px] w-full object-cover" loading="lazy" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Process - Cinematic Light Sweep */}
                <section id="process" className="relative py-32 md:py-44">
                    <div className="mx-auto max-w-5xl px-6 md:px-10">
                        <p className="mb-16 text-center text-[11px] font-medium uppercase tracking-[0.22em]" style={{ color: '#D4AF37' }}>The Process</p>
                        <div className="flex flex-col gap-14 md:gap-20">
                            <LightSweepText>IT'S NOT ABOUT COVERING UP</LightSweepText>
                            <LightSweepText>IT'S ABOUT REVEALING THE TRUE STRUCTURE</LightSweepText>
                            <LightSweepText>LIGHT, SHADOW, AND TEXTURE</LightSweepText>
                        </div>
                    </div>
                </section>

                {/* Connect / Blessing */}
                <section id="connect" className="relative overflow-hidden py-32 text-center md:py-40">
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at center, rgba(212,175,55,0.05) 0%, transparent 45%)' }} />
                    <div className="gc-blessing-content relative mx-auto max-w-3xl px-6">
                        <div className="gc-float-anim mx-auto mb-10 h-28 w-28 overflow-hidden rounded-full" style={{ border: '2px solid rgba(212,175,55,0.25)', boxShadow: '0 0 40px rgba(212,175,55,0.08)' }}>
                            <img src={avatarSrc} alt={content.title || 'Artist'} className="h-full w-full object-cover" />
                        </div>
                        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 400, fontStyle: 'italic', color: '#D4AF37', lineHeight: 1.2 }}>
                            Beauty Is My Language
                        </h2>
                        <p className="mx-auto mt-6 max-w-xl text-xl italic leading-9" style={{ fontFamily: "'Playfair Display', serif", color: 'rgba(244,244,240,0.65)' }}>
                            {content.finalMessage ? `"${content.finalMessage}"` : '"Every face is my canvas. Every look is a work of art."'}
                        </p>
                        <div className="mx-auto mt-10 flex max-w-md items-center justify-center gap-3">
                            <span style={{ color: '#D4AF37', fontSize: '8px' }}>&#9670;</span>
                            <div className="h-px flex-1" style={{ background: 'rgba(212,175,55,0.15)' }} />
                            <span style={{ color: '#D4AF37', fontSize: '8px' }}>&#9670;</span>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="px-6 py-16 text-center md:px-10" style={{ background: '#050505', borderTop: '1px solid rgba(212,175,55,0.06)' }}>
                    <div className="gc-footer-avatar mx-auto mb-6 h-16 w-16 overflow-hidden rounded-full">
                        <img src={avatarSrc} alt={content.title || 'Artist'} className="h-full w-full object-cover" style={{ opacity: 0.8 }} />
                    </div>
                    <p className="text-[26px]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 400, fontStyle: 'italic', color: '#D4AF37' }}>
                        {displayName}
                    </p>
                    <div className="my-6 flex items-center justify-center gap-3">
                        <span style={{ color: '#D4AF37', fontSize: '8px' }}>&#9670;</span>
                        <div className="h-px w-16" style={{ background: 'rgba(212,175,55,0.15)' }} />
                        <span style={{ color: '#D4AF37', fontSize: '8px' }}>&#9670;</span>
                    </div>
                    <p style={{ color: 'rgba(244,244,240,0.25)', fontSize: '12px', letterSpacing: '0.1em' }}>
                        Designed with precision. Crafted with passion.
                    </p>
                </footer>

                {/* FAB Share */}
                <button onClick={() => setShowShare(true)}
                    className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-5 py-4 text-xs font-bold uppercase tracking-[0.14em] shadow-lg transition hover:scale-[1.03]"
                    style={{ background: 'linear-gradient(135deg, #D4AF37, #B8960B)', color: '#050505', boxShadow: '0 8px 30px rgba(212,175,55,0.2)' }}>
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: '"FILL" 1' }}>share</span>
                    Share
                </button>

                {showShare && <ShareModal onClose={() => setShowShare(false)} title={displayName} />}
            </div>
        </>
    );
}
