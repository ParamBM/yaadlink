import React, { useEffect, useMemo, useState } from 'react';
import { formatDisplayDate, formatMilestoneDate, getThemeStoryContent } from '../shared';

const FALLBACK_GALLERY_IMAGES = [
    '/images/themes/sacred-wedding/img-1.jpg',
    '/images/themes/sacred-wedding/img-2.jpg',
    '/images/themes/sacred-wedding/img-3.jpg',
    '/images/themes/sacred-wedding/img-4.jpg',
    '/images/themes/sacred-wedding/img-5.jpg',
    '/images/themes/sacred-wedding/img-6.jpg',
    '/images/themes/sacred-wedding/img-7.jpg',
    '/images/themes/sacred-wedding/img-8.jpg',
];

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
            <div className="absolute inset-0 bg-[#120303]/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-md rounded-sm border border-[#c9a227]/25 bg-[#220909]/95 p-8 text-center shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
                <span
                    className="material-symbols-outlined mb-3 block text-4xl text-[#c9a227]"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                >
                    share
                </span>
                <h3 className="mb-2 font-['Playfair_Display'] text-[28px] text-[#f5e6c8]">Share This Story</h3>
                <p className="mb-6 text-sm leading-7 text-[#d9c4a2]/80">
                    Copy the link to share {title || 'this celebration'}.
                </p>
                <div className="flex gap-2">
                    <input
                        readOnly
                        value={url}
                        className="min-w-0 flex-1 rounded-none border border-[#c9a227]/20 bg-[#120303]/70 px-4 py-3 text-sm text-[#f5e6c8] outline-none"
                    />
                    <button
                        onClick={handleCopy}
                        className="whitespace-nowrap bg-[#c9a227] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#1a0505] transition hover:brightness-110"
                    >
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="mt-5 text-xs uppercase tracking-[0.16em] text-[#b8966a] transition hover:text-[#c9a227]"
                >
                    Close
                </button>
            </div>
        </div>
    );
}

function buildGalleryImages(content) {
    const seen = new Set();
    const merged = [...content.images, ...FALLBACK_GALLERY_IMAGES.map((src, index) => ({
        src,
        alt: `Wedding gallery image ${index + 1}`,
        caption: '',
        key: `fallback-${index}`,
    }))];

    return merged
        .filter((image) => image?.src)
        .filter((image) => {
            if (seen.has(image.src)) return false;
            seen.add(image.src);
            return true;
        })
        .slice(0, 8);
}

function buildNavSections(hasStory, hasMilestones, hasGallery) {
    return [
        hasStory ? { id: 'our-story', label: 'Our Story' } : null,
        hasMilestones ? { id: 'events', label: 'Events' } : null,
        hasGallery ? { id: 'gallery', label: 'Gallery' } : null,
        { id: 'blessing', label: 'Blessing' },
    ].filter(Boolean);
}

function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function SacredWedding({ data }) {
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
    const heroMeta = [displayDate, content.location].filter(Boolean).join(' • ');
    const storyParagraphs = (content.summary || '')
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
    const galleryImages = useMemo(() => buildGalleryImages(content), [content]);
    const storyImage = content.coverImageUrl || galleryImages[0]?.src || FALLBACK_GALLERY_IMAGES[0];
    const blessingImage = galleryImages[4]?.src || galleryImages[1]?.src || FALLBACK_GALLERY_IMAGES[4];
    const initials = content.initials || content.people.map((name) => name.charAt(0).toUpperCase()).join(' & ') || 'A & R';
    const navSections = buildNavSections(storyParagraphs.length > 0, content.milestones.length > 0, galleryImages.length > 0);

    return (
        <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link
                href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Lato:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Tangerine:wght@400;700&display=swap"
                rel="stylesheet"
            />
            <link
                href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
                rel="stylesheet"
            />

            <style>{`
                .sw-root {
                    background: #1a0505;
                    color: #f5e6c8;
                    font-family: 'Lato', sans-serif;
                    min-height: 100vh;
                    overflow-x: hidden;
                }
                .sw-root ::selection {
                    background: rgba(201, 162, 39, 0.35);
                    color: #fff7e8;
                }
                .sw-smoke {
                    position: absolute;
                    inset: 0;
                    background:
                        radial-gradient(circle at 20% 20%, rgba(201, 162, 39, 0.16), transparent 28%),
                        radial-gradient(circle at 80% 30%, rgba(132, 28, 28, 0.32), transparent 30%),
                        radial-gradient(circle at 50% 65%, rgba(255, 180, 88, 0.14), transparent 32%),
                        radial-gradient(circle at 50% 50%, rgba(54, 8, 8, 0.96), rgba(14, 3, 3, 1));
                    filter: saturate(110%);
                }
                .sw-smoke::before,
                .sw-smoke::after {
                    content: '';
                    position: absolute;
                    inset: -10%;
                    background:
                        radial-gradient(circle at 30% 40%, rgba(120, 24, 24, 0.18), transparent 18%),
                        radial-gradient(circle at 65% 55%, rgba(201, 162, 39, 0.12), transparent 20%),
                        radial-gradient(circle at 50% 70%, rgba(244, 166, 94, 0.08), transparent 18%);
                    animation: sw-float 16s linear infinite alternate;
                    mix-blend-mode: screen;
                }
                .sw-smoke::after {
                    animation-duration: 22s;
                    animation-direction: alternate-reverse;
                    opacity: 0.6;
                }
                .sw-veil {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to bottom, rgba(26,5,5,0.1), rgba(26,5,5,0.3) 45%, rgba(26,5,5,0.85));
                }
                .sw-frame::before,
                .sw-frame::after {
                    content: '';
                    position: absolute;
                    inset: -12px;
                    border: 1px solid rgba(201, 162, 39, 0.34);
                    pointer-events: none;
                }
                .sw-frame::after {
                    inset: -5px;
                }
                .sw-gallery-item:hover img {
                    transform: scale(1.05);
                }
                .sw-gallery-item:hover .sw-gallery-overlay,
                .sw-gallery-item:hover .sw-gallery-border {
                    opacity: 1;
                }
                .sw-nav-link:hover {
                    color: #c9a227;
                }
                .sw-lotus {
                    position: relative;
                    width: min(72vw, 420px);
                    aspect-ratio: 1;
                    margin: 0 auto;
                    border-radius: 9999px;
                    background:
                        radial-gradient(circle, rgba(201, 162, 39, 0.32) 0, rgba(201, 162, 39, 0.12) 18%, transparent 20%),
                        radial-gradient(circle, rgba(245, 230, 200, 0.08) 0, transparent 62%);
                    box-shadow:
                        0 0 0 1px rgba(201, 162, 39, 0.18),
                        0 0 80px rgba(201, 162, 39, 0.08);
                }
                .sw-lotus::before,
                .sw-lotus::after {
                    content: '';
                    position: absolute;
                    inset: 14%;
                    border-radius: 9999px;
                    border: 1px solid rgba(201, 162, 39, 0.24);
                }
                .sw-lotus::after {
                    inset: 28%;
                    border-color: rgba(245, 230, 200, 0.18);
                }
                .sw-petal {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: 24%;
                    height: 42%;
                    border-radius: 999px 999px 35% 35%;
                    transform-origin: center 85%;
                    background: linear-gradient(180deg, rgba(245, 230, 200, 0.85), rgba(201, 162, 39, 0.18));
                    border: 1px solid rgba(201, 162, 39, 0.22);
                    opacity: 0.72;
                    filter: drop-shadow(0 0 18px rgba(201, 162, 39, 0.12));
                }
                .sw-scroll-dot {
                    animation: sw-bounce 2s ease-in-out infinite;
                }
                @keyframes sw-float {
                    0% { transform: translate3d(-2%, -1%, 0) scale(1); }
                    100% { transform: translate3d(2%, 2%, 0) scale(1.08); }
                }
                @keyframes sw-bounce {
                    0%, 100% { transform: translateY(0); opacity: 0.8; }
                    50% { transform: translateY(28px); opacity: 1; }
                }
                @media (min-width: 1024px) {
                    .sw-gallery-grid .sw-gallery-item:nth-child(2) { margin-top: 40px; }
                    .sw-gallery-grid .sw-gallery-item:nth-child(5) { margin-top: -20px; }
                    .sw-gallery-grid .sw-gallery-item:nth-child(8) { margin-top: 20px; }
                }
            `}</style>

            <div className="sw-root">
                <header
                    className="fixed inset-x-0 top-0 z-50 border-b border-[#c9a227]/10 px-5 md:px-10"
                    style={{
                        background: 'rgba(26, 5, 5, 0.86)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        opacity: navVisible ? 1 : 0,
                        transform: navVisible ? 'translateY(0)' : 'translateY(-100%)',
                        transition: 'opacity 0.4s ease, transform 0.4s ease',
                    }}
                >
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6">
                        <button
                            onClick={() => scrollToSection('hero')}
                            className="font-['Tangerine'] text-[32px] text-[#c9a227]"
                        >
                            {initials}
                        </button>
                        <nav className="hidden items-center gap-8 md:flex">
                            {navSections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className="sw-nav-link text-[11px] uppercase tracking-[0.2em] text-[#b8966a] transition"
                                >
                                    {section.label}
                                </button>
                            ))}
                        </nav>
                        <button
                            onClick={() => setShowShare(true)}
                            className="border border-[#c9a227]/60 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-[#c9a227] transition hover:bg-[#c9a227]/10"
                        >
                            Share Story
                        </button>
                    </div>
                </header>

                <main>
                    <section
                        id="hero"
                        className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 text-center"
                    >
                        <div className="sw-smoke" />
                        {content.coverImageUrl && (
                            <img
                                src={content.coverImageUrl}
                                alt={content.title}
                                className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-screen"
                            />
                        )}
                        <div className="sw-veil" />

                        <div className="relative z-10 mx-auto max-w-4xl">
                            <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.32em] text-[#b8966a]">
                                {content.eyebrow || 'Two Souls, One Journey'}
                            </p>
                            <h1 className="font-['Tangerine'] text-[clamp(56px,11vw,128px)] leading-none text-[#f5e6c8] [text-shadow:0_2px_40px_rgba(201,162,39,0.28)]">
                                {content.title}
                            </h1>
                            <p className="mx-auto mt-4 max-w-2xl text-base italic text-[#d8c39d] md:text-lg">
                                {content.subtitle || 'invite you to celebrate their union'}
                            </p>
                            {heroMeta && (
                                <p className="mt-6 font-['Cinzel_Decorative'] text-xs tracking-[0.08em] text-[#c9a227] md:text-sm">
                                    {heroMeta}
                                </p>
                            )}
                        </div>

                        <div className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center">
                            <div className="relative h-10 w-px overflow-hidden bg-[#c9a227]/45">
                                <div className="sw-scroll-dot absolute left-1/2 top-0 h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-[#c9a227]" />
                            </div>
                        </div>
                    </section>

                    {storyParagraphs.length > 0 && (
                        <section id="our-story" className="mx-auto max-w-6xl px-6 py-24 md:px-10">
                            <div className="grid items-center gap-16 md:grid-cols-[45%_55%]">
                                <div className="order-2 md:order-1">
                                    <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-[#b8966a]">
                                        Our Story
                                    </p>
                                    <h2 className="mb-8 font-['Playfair_Display'] text-[clamp(30px,4vw,42px)] leading-tight text-[#f5e6c8]">
                                        Where It All Began
                                    </h2>
                                    {storyParagraphs.map((paragraph, index) => (
                                        <p
                                            key={index}
                                            className="mb-6 text-[15px] leading-8 text-[#f5e6c8]/85 md:text-base"
                                        >
                                            {paragraph}
                                        </p>
                                    ))}

                                    <div className="relative mt-10 border-l-2 border-[#c9a227] pl-6">
                                        <span className="absolute left-2 top-[-34px] font-['Tangerine'] text-[92px] leading-none text-[#c9a227]/20">
                                            "
                                        </span>
                                        <p className="relative z-10 font-['Playfair_Display'] text-xl italic leading-8 text-[#f5e6c8]">
                                            {content.finalMessage
                                                ? `"${content.finalMessage}"`
                                                : '"In your light, I learned how to love. In your beauty, how to make poems."'}
                                        </p>
                                    </div>
                                </div>

                                <div className="order-1 md:order-2">
                                    <div className="sw-frame relative">
                                        <img
                                            src={storyImage}
                                            alt={content.title}
                                            className="block aspect-[3/4] w-full rounded-[4px] object-cover shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {content.milestones.length > 0 && (
                        <section id="events" className="bg-[#2d0808] px-6 py-24 md:px-10">
                            <div className="mx-auto max-w-5xl">
                                <div className="mb-20 text-center">
                                    <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#b8966a]">
                                        The Celebration
                                    </p>
                                    <h2 className="mt-3 font-['Cinzel_Decorative'] text-[clamp(30px,5vw,44px)] leading-tight text-[#c9a227]">
                                        Chapters of Our Journey
                                    </h2>
                                </div>

                                <div className="relative pl-10 md:pl-0">
                                    <div className="absolute bottom-0 left-5 top-0 w-px bg-gradient-to-b from-transparent via-[#c9a227]/50 to-transparent md:left-0" />
                                    <div className="flex flex-col gap-14">
                                        {content.milestones.map((milestone, index) => (
                                            <div key={milestone.key} className="relative">
                                                <div className="absolute left-[-12px] top-5 h-2 w-2 rounded-full bg-[#c9a227] shadow-[0_0_12px_rgba(201,162,39,0.55)] md:left-[-4px]" />
                                                <div className="border-l-2 border-[#c9a227] bg-[#f5e6c8]/[0.03] p-8">
                                                    <span className="mb-4 inline-block bg-[#c9a227] px-4 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#1a0505]">
                                                        {formatMilestoneDate(milestone.date) || `Moment ${index + 1}`}
                                                    </span>
                                                    <h3 className="mb-3 font-['Playfair_Display'] text-[28px] text-[#f5e6c8]">
                                                        {milestone.title}
                                                    </h3>
                                                    {milestone.description && (
                                                        <p className="mb-5 text-[15px] leading-7 text-[#f5e6c8]/70">
                                                            {milestone.description}
                                                        </p>
                                                    )}
                                                    {milestone.imageUrl && (
                                                        <img
                                                            src={milestone.imageUrl}
                                                            alt={milestone.title}
                                                            className="mt-4 max-h-[340px] w-full object-cover"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    <section id="blessing" className="relative overflow-hidden bg-[#1a0505] px-6 py-28 text-center md:px-10">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,162,39,0.09),transparent_42%)]" />
                        <div className="relative mx-auto max-w-4xl">
                            <div className="sw-lotus mb-12">
                                {Array.from({ length: 8 }).map((_, index) => (
                                    <span
                                        key={index}
                                        className="sw-petal"
                                        style={{
                                            transform: `translate(-50%, -85%) rotate(${index * 45}deg)`,
                                        }}
                                    />
                                ))}
                            </div>
                            <h2 className="font-['Cinzel_Decorative'] text-[clamp(28px,5vw,40px)] text-[#c9a227]">
                                Blessed by Fire, Bound by Love
                            </h2>
                            <p className="mx-auto mt-6 max-w-2xl font-['Playfair_Display'] text-xl italic leading-9 text-[#f5e6c8]">
                                {content.finalMessage
                                    ? `"${content.finalMessage}"`
                                    : '"Forever entwined, with every vow becoming a light for the road ahead."'}
                            </p>
                            <div className="mx-auto mt-10 flex max-w-md items-center justify-center gap-3">
                                <span className="text-[8px] text-[#c9a227]">◆</span>
                                <div className="h-px flex-1 bg-[#c9a227]/30" />
                                <span className="text-[8px] text-[#c9a227]">◆</span>
                            </div>
                            <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-[4px] border border-[#c9a227]/15">
                                <img
                                    src={blessingImage}
                                    alt="Wedding blessing"
                                    className="h-[280px] w-full object-cover opacity-80"
                                />
                            </div>
                        </div>
                    </section>

                    {galleryImages.length > 0 && (
                        <section id="gallery" className="bg-[#1a0505] py-24">
                            <div className="mb-14 px-6 text-center md:px-10">
                                <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-[#b8966a]">
                                    Moments
                                </p>
                                <h2 className="font-['Cinzel_Decorative'] text-[clamp(28px,4vw,38px)] text-[#c9a227]">
                                    Captured in Love
                                </h2>
                            </div>

                            <div className="sw-gallery-grid grid grid-cols-1 gap-3 px-3 sm:grid-cols-2 lg:grid-cols-3">
                                {galleryImages.map((image, index) => (
                                    <div key={image.key || image.src || index} className="sw-gallery-item relative overflow-hidden rounded-[2px]">
                                        <img
                                            src={image.src}
                                            alt={image.alt || `Gallery image ${index + 1}`}
                                            className="block w-full transition duration-700"
                                        />
                                        <div className="sw-gallery-overlay absolute inset-0 bg-[#c9a227]/10 opacity-0 transition duration-700" />
                                        <div className="sw-gallery-border absolute inset-0 rounded-[2px] border border-[#c9a227] opacity-0 transition duration-700" />
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                <footer className="border-t border-[#c9a227]/15 bg-[#1a0505] px-6 py-16 text-center md:px-10">
                    <p className="font-['Tangerine'] text-[40px] text-[#c9a227]">{content.title}</p>
                    {heroMeta && (
                        <p className="mt-1 font-['Cinzel_Decorative'] text-xs text-[#b8966a] md:text-sm">
                            {heroMeta}
                        </p>
                    )}
                    <div className="my-6 flex items-center justify-center gap-3">
                        <span className="text-[8px] text-[#c9a227]">◆</span>
                        <div className="h-px w-16 bg-[#c9a227]/30" />
                        <span className="text-[8px] text-[#c9a227]">◆</span>
                    </div>
                    <p className="text-xs text-[#b8966a]/60">Crafted with love for your special day</p>
                </footer>

                <button
                    aria-label="Share this story"
                    onClick={() => setShowShare(true)}
                    className="fixed bottom-8 right-8 z-50 flex items-center gap-2 bg-[linear-gradient(135deg,#c9a227,#a08020)] px-5 py-4 text-xs font-bold uppercase tracking-[0.14em] text-[#1a0505] shadow-[0_8px_30px_rgba(201,162,39,0.3)] transition hover:scale-[1.03]"
                >
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: '"FILL" 1' }}>
                        share
                    </span>
                    Share Story
                </button>

                {showShare && <ShareModal onClose={() => setShowShare(false)} title={content.title} />}
            </div>
        </>
    );
}
