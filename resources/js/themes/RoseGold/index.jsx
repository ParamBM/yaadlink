import React, { useState, useEffect, useRef } from 'react';
import { getThemeStoryContent, formatDisplayDate, formatMilestoneDate } from '../shared';

/* ─── Milestone icons cycling list ────────────────────────────────────────── */
const MILESTONE_ICONS = [
    'favorite',
    'local_cafe',
    'flight_takeoff',
    'diamond',
    'celebration',
    'auto_awesome',
];

function getMilestoneIcon(index) {
    return MILESTONE_ICONS[index % MILESTONE_ICONS.length];
}

/* ─── Gallery item ─────────────────────────────────────────────────────────── */
function GalleryItem({ image, index }) {
    if (!image?.src) return null;

    return (
        <div className="break-inside-avoid relative group rounded-xl overflow-hidden bg-[#fbeae9]">
            <img
                alt={image.alt}
                src={image.src}
                className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
            />
            {image.caption && (
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-[16px] leading-[1.6] font-normal text-white">{image.caption}</p>
                </div>
            )}
        </div>
    );
}

/* ─── Fallback gallery placeholder ────────────────────────────────────────── */
function GalleryPlaceholder({ label }) {
    return (
        <div className="break-inside-avoid relative rounded-xl overflow-hidden bg-[#fbeae9] min-h-[200px] flex items-center justify-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#7d562d]/60">{label}</p>
        </div>
    );
}

/* ─── Share modal ──────────────────────────────────────────────────────────── */
function ShareModal({ onClose, title }) {
    const [copied, setCopied] = useState(false);
    const url = typeof window !== 'undefined' ? window.location.href : '';

    const handleCopy = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white/90 backdrop-blur-[24px] border border-white/20 rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.2)] p-8 max-w-sm w-full text-center">
                <span
                    className="material-symbols-outlined text-[#d4a373] mb-4 block text-4xl"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                >
                    share
                </span>
                <h3 className="font-['Epilogue'] text-[24px] font-semibold leading-[1.3] text-[#221a1a] mb-2">
                    Share This Story
                </h3>
                <p className="text-[16px] leading-[1.6] text-[#50453b] mb-6">
                    Copy the link below to share {title || 'this story'}.
                </p>
                <div className="flex gap-2">
                    <input
                        readOnly
                        value={url}
                        className="flex-1 rounded-full border border-[#d4c4b7] bg-[#fff0f0] px-4 py-2 text-sm text-[#221a1a] outline-none truncate"
                    />
                    <button
                        onClick={handleCopy}
                        className="rounded-full bg-[#7d562d] px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-[#623f18] active:scale-95"
                    >
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="mt-5 text-sm text-[#82756a] hover:text-[#7d562d] transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    );
}

/* ─── Main theme component ─────────────────────────────────────────────────── */
export default function RoseGold({ data }) {
    const content = getThemeStoryContent(data);
    const [showShare, setShowShare] = useState(false);
    const [headerVisible, setHeaderVisible] = useState(true);
    const lastScrollY = useRef(0);

    /* Subtle header hide-on-scroll-down behaviour */
    useEffect(() => {
        const onScroll = () => {
            const current = window.scrollY;
            setHeaderVisible(current < 80 || current < lastScrollY.current);
            lastScrollY.current = current;
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const displayDate = formatDisplayDate(content.rawDate) || content.dateLabel;

    /* Story paragraphs — split on double-newline if the user wrote them that way */
    const storyParagraphs = (content.summary || '')
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean);

    /* Initials fallback */
    const initials = content.initials || content.people.map((n) => n.charAt(0).toUpperCase()).join(' & ') || 'Y & L';

    return (
        <>
            {/* ── Google Fonts + Material Symbols ── */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link
                href="https://fonts.googleapis.com/css2?family=Epilogue:ital,wght@0,100..900;1,100..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap"
                rel="stylesheet"
            />
            <link
                href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
                rel="stylesheet"
            />

            {/* ── Scoped base styles injected inline ── */}
            <style>{`
                .rg-root {
                    background: #fff8f7;
                    color: #221a1a;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    -webkit-font-smoothing: antialiased;
                    min-height: 100vh;
                }
                .rg-root ::selection {
                    background: #ffdcbd;
                    color: #5b3912;
                }
                .rg-hero-card {
                    background: rgba(255,255,255,0.70);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: 1px solid rgba(255,255,255,0.20);
                    box-shadow: 0 4px 20px -1px rgba(212,163,115,0.04);
                }
                .rg-glass {
                    background: rgba(255,255,255,0.70);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: 1px solid rgba(255,255,255,0.20);
                    box-shadow: 0 4px 20px -1px rgba(212,163,115,0.04);
                }
                .rg-milestone-card {
                    background: rgba(255,255,255,0.70);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: 1px solid rgba(255,255,255,0.20);
                    box-shadow: 0 4px 20px -1px rgba(212,163,115,0.04);
                    border-radius: 0.75rem;
                    padding: 2rem;
                    transition: background 0.3s;
                }
                .rg-milestone-card:hover {
                    background: rgba(255,255,255,0.80);
                }
                .rg-milestone-dot {
                    position: absolute;
                    left: -41px;
                    background: #ffffff;
                    border: 2px solid #d4a373;
                    border-radius: 9999px;
                    width: 3rem;
                    height: 3rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 10px -1px rgba(212,163,115,0.2);
                }
            `}</style>

            <div className="rg-root">
                {/* ════════════════════════════════════════
                    HEADER
                ════════════════════════════════════════ */}
                <header
                    className="fixed top-0 w-full z-50 border-b border-white/20"
                    style={{
                        background: 'rgba(255,255,255,0.70)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        boxShadow: '0 4px 20px -1px rgba(212,163,115,0.04)',
                        transform: headerVisible ? 'translateY(0)' : 'translateY(-100%)',
                        transition: 'transform 0.3s ease',
                    }}
                >
                    <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
                        <div
                            className="text-xl font-light italic text-stone-800"
                            style={{ fontFamily: 'Epilogue, serif', letterSpacing: '-0.01em' }}
                        >
                            Yaad Link
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                id="rg-share-header"
                                aria-label="Share this story"
                                onClick={() => setShowShare(true)}
                                className="text-[#d4a373] transition-all duration-300 rounded-full p-2 active:scale-95 flex items-center justify-center hover:bg-white/80"
                            >
                                <span
                                    className="material-symbols-outlined"
                                    style={{ fontVariationSettings: '"FILL" 0' }}
                                >
                                    share
                                </span>
                            </button>
                        </div>
                    </div>
                </header>

                <main style={{ paddingTop: '6rem', paddingBottom: '7.5rem' }}>
                    {/* ════════════════════════════════════════
                        HERO SECTION
                    ════════════════════════════════════════ */}
                    <section
                        className="relative flex items-center justify-center overflow-hidden rounded-xl"
                        style={{
                            minHeight: '870px',
                            margin: '0 2.5rem',
                            marginTop: '2rem',
                            background: '#f5e4e4',
                        }}
                    >
                        {/* Cover image */}
                        {content.coverImageUrl ? (
                            <img
                                alt="Hero cover"
                                src={content.coverImageUrl}
                                className="absolute inset-0 w-full h-full object-cover"
                                style={{ opacity: 0.80, mixBlendMode: 'multiply' }}
                            />
                        ) : (
                            /* Fallback gradient when no cover image */
                            <div
                                className="absolute inset-0"
                                style={{
                                    background: 'linear-gradient(135deg, #ffdcbd 0%, #f5d4c4 40%, #e8c4b8 100%)',
                                }}
                            />
                        )}

                        {/* Bottom fade */}
                        <div
                            className="absolute inset-0"
                            style={{ background: 'linear-gradient(to top, #fff8f7 0%, transparent 60%)' }}
                        />

                        {/* Hero card */}
                        <div className="relative z-10 rg-hero-card rounded-xl text-center max-w-2xl mx-auto m-8" style={{ padding: '40px' }}>
                            <h1
                                style={{
                                    fontFamily: 'Epilogue, serif',
                                    fontSize: '48px',
                                    lineHeight: '1.1',
                                    letterSpacing: '-0.02em',
                                    fontWeight: '600',
                                    color: '#221a1a',
                                    marginBottom: '1rem',
                                }}
                            >
                                {content.title}
                            </h1>
                            {content.eyebrow && (
                                <p
                                    style={{
                                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                                        fontSize: '18px',
                                        lineHeight: '1.6',
                                        color: '#50453b',
                                        marginBottom: '1.5rem',
                                    }}
                                >
                                    {content.eyebrow}
                                </p>
                            )}
                            {displayDate && (
                                <div
                                    className="inline-flex items-center justify-center rounded-full border"
                                    style={{
                                        background: 'rgba(212,163,115,0.20)',
                                        borderColor: 'rgba(212,163,115,0.30)',
                                        padding: '0.5rem 1.5rem',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: 'Epilogue, serif',
                                            fontSize: '12px',
                                            lineHeight: '1',
                                            letterSpacing: '0.1em',
                                            fontWeight: '600',
                                            color: '#7d562d',
                                        }}
                                    >
                                        {displayDate}
                                    </span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ════════════════════════════════════════
                        OUR STORY
                    ════════════════════════════════════════ */}
                    {storyParagraphs.length > 0 && (
                        <section className="max-w-3xl mx-auto text-center" style={{ padding: '0 2.5rem', marginTop: '7.5rem' }}>
                            <span
                                className="material-symbols-outlined block mb-6"
                                style={{
                                    fontVariationSettings: '"FILL" 1',
                                    color: '#d4a373',
                                    fontSize: '2.5rem',
                                }}
                            >
                                favorite
                            </span>
                            <h2
                                style={{
                                    fontFamily: 'Epilogue, serif',
                                    fontSize: '32px',
                                    lineHeight: '1.2',
                                    letterSpacing: '-0.01em',
                                    fontWeight: '600',
                                    color: '#221a1a',
                                    marginBottom: '2rem',
                                }}
                            >
                                Our Story
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {storyParagraphs.map((para, i) => (
                                    <p
                                        key={i}
                                        style={{
                                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                                            fontSize: '18px',
                                            lineHeight: '1.6',
                                            color: '#50453b',
                                        }}
                                    >
                                        {para}
                                    </p>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ════════════════════════════════════════
                        MILESTONES
                    ════════════════════════════════════════ */}
                    {content.milestones.length > 0 && (
                        <section className="max-w-4xl mx-auto" style={{ padding: '0 2.5rem', marginTop: '7.5rem' }}>
                            <h2
                                className="text-center"
                                style={{
                                    fontFamily: 'Epilogue, serif',
                                    fontSize: '32px',
                                    lineHeight: '1.2',
                                    letterSpacing: '-0.01em',
                                    fontWeight: '600',
                                    color: '#221a1a',
                                    marginBottom: '4rem',
                                }}
                            >
                                Milestones
                            </h2>

                            {/* Timeline */}
                            <div
                                style={{
                                    position: 'relative',
                                    borderLeft: '2px solid rgba(212,196,183,0.30)',
                                    paddingLeft: '2rem',
                                    marginLeft: '1.25rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4rem',
                                }}
                            >
                                {content.milestones.map((milestone, index) => (
                                    <div key={milestone.key} style={{ position: 'relative' }}>
                                        {/* Dot */}
                                        <div className="rg-milestone-dot">
                                            <span
                                                className="material-symbols-outlined"
                                                style={{
                                                    fontVariationSettings: '"FILL" 0',
                                                    color: '#d4a373',
                                                    fontSize: '1.25rem',
                                                }}
                                            >
                                                {getMilestoneIcon(index)}
                                            </span>
                                        </div>

                                        {/* Card */}
                                        <div className="rg-milestone-card">
                                            {milestone.date && (
                                                <span
                                                    className="block mb-2"
                                                    style={{
                                                        fontFamily: 'Epilogue, serif',
                                                        fontSize: '12px',
                                                        lineHeight: '1',
                                                        letterSpacing: '0.1em',
                                                        fontWeight: '600',
                                                        color: '#7d562d',
                                                    }}
                                                >
                                                    {formatMilestoneDate(milestone.date) || milestone.date}
                                                </span>
                                            )}
                                            <h3
                                                style={{
                                                    fontFamily: 'Epilogue, serif',
                                                    fontSize: '24px',
                                                    lineHeight: '1.3',
                                                    fontWeight: '600',
                                                    color: '#221a1a',
                                                    marginBottom: '0.5rem',
                                                }}
                                            >
                                                {milestone.title}
                                            </h3>
                                            {milestone.description && (
                                                <p
                                                    style={{
                                                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                                                        fontSize: '16px',
                                                        lineHeight: '1.6',
                                                        color: '#50453b',
                                                    }}
                                                >
                                                    {milestone.description}
                                                </p>
                                            )}
                                            {/* Milestone image (optional) */}
                                            {milestone.imageUrl && (
                                                <img
                                                    src={milestone.imageUrl}
                                                    alt={milestone.title}
                                                    className="mt-4 w-full rounded-xl object-cover"
                                                    style={{ maxHeight: '260px' }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ════════════════════════════════════════
                        GALLERY
                    ════════════════════════════════════════ */}
                    {content.images.length > 0 && (
                        <section style={{ maxWidth: '1400px', margin: '7.5rem auto 0', padding: '0 2.5rem' }}>
                            <h2
                                className="text-center"
                                style={{
                                    fontFamily: 'Epilogue, serif',
                                    fontSize: '32px',
                                    lineHeight: '1.2',
                                    letterSpacing: '-0.01em',
                                    fontWeight: '600',
                                    color: '#221a1a',
                                    marginBottom: '4rem',
                                }}
                            >
                                Moments Captured
                            </h2>

                            <div
                                style={{
                                    columns: content.images.length === 1 ? 1 : content.images.length === 2 ? 2 : 3,
                                    columnGap: '2rem',
                                    gap: '2rem',
                                }}
                            >
                                {content.images.map((image, index) => (
                                    <GalleryItem key={image.key} image={image} index={index} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ════════════════════════════════════════
                        FINAL MESSAGE
                    ════════════════════════════════════════ */}
                    <section className="text-center" style={{ maxWidth: '42rem', margin: '7.5rem auto 0', padding: '0 2.5rem' }}>
                        <div className="rg-glass rounded-xl" style={{ padding: '40px' }}>
                            <span
                                className="material-symbols-outlined block mb-4"
                                style={{
                                    fontVariationSettings: '"FILL" 1',
                                    color: '#d4a373',
                                    fontSize: '2rem',
                                }}
                            >
                                auto_awesome
                            </span>
                            <p
                                style={{
                                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                                    fontSize: '18px',
                                    lineHeight: '1.6',
                                    color: '#221a1a',
                                    fontStyle: 'italic',
                                    marginBottom: '1.5rem',
                                }}
                            >
                                {content.finalMessage
                                    ? `"${content.finalMessage}"`
                                    : '"Thank you for being part of our journey. Our story is written in the moments we share, and we can\'t wait for the chapters yet to come."'}
                            </p>
                            <div
                                style={{
                                    fontFamily: 'Epilogue, serif',
                                    fontSize: '24px',
                                    lineHeight: '1.3',
                                    fontWeight: '600',
                                    color: '#7d562d',
                                }}
                            >
                                {initials}
                            </div>
                        </div>
                    </section>
                </main>

                {/* ════════════════════════════════════════
                    FOOTER
                ════════════════════════════════════════ */}
                <footer
                    className="w-full"
                    style={{
                        borderTop: '1px solid rgba(212,163,115,0.20)',
                        padding: '3rem 2rem',
                    }}
                >
                    <div
                        className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center px-8"
                        style={{ gap: '1rem' }}
                    >
                        <div
                            style={{
                                fontFamily: 'Epilogue, serif',
                                fontSize: '0.875rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.15em',
                                fontWeight: '500',
                                color: '#a8a29e',
                            }}
                        >
                            © {new Date().getFullYear()} Yaad Link. A Story Told with Care.
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                            <a
                                href="#"
                                style={{
                                    fontFamily: 'Epilogue, serif',
                                    fontSize: '0.875rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.15em',
                                    color: '#a8a29e',
                                    textDecoration: 'none',
                                    transition: 'color 0.2s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#d4a373'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = '#a8a29e'; }}
                            >
                                Privacy
                            </a>
                            <a
                                href="#"
                                style={{
                                    fontFamily: 'Epilogue, serif',
                                    fontSize: '0.875rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.15em',
                                    color: '#a8a29e',
                                    textDecoration: 'none',
                                    transition: 'color 0.2s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#d4a373'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = '#a8a29e'; }}
                            >
                                Contact
                            </a>
                        </div>
                    </div>
                </footer>

                {/* ════════════════════════════════════════
                    FLOATING SHARE BUTTON
                ════════════════════════════════════════ */}
                <button
                    id="rg-share-fab"
                    aria-label="Share our story"
                    onClick={() => setShowShare(true)}
                    className="fixed bottom-8 right-8 z-50 flex items-center gap-2 rounded-full"
                    style={{
                        background: 'linear-gradient(to right, #d4a373, #e8c19d)',
                        color: '#5b3912',
                        padding: '0.75rem 1.5rem',
                        boxShadow: '0 8px 30px rgba(212,163,115,0.3)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'box-shadow 0.3s, transform 0.3s',
                        fontFamily: 'Epilogue, serif',
                        fontSize: '12px',
                        lineHeight: '1',
                        letterSpacing: '0.1em',
                        fontWeight: '600',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(212,163,115,0.5)';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(212,163,115,0.3)';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                >
                    ✦ Share our story
                </button>

                {/* ════════════════════════════════════════
                    SHARE MODAL
                ════════════════════════════════════════ */}
                {showShare && (
                    <ShareModal onClose={() => setShowShare(false)} title={content.title} />
                )}
            </div>
        </>
    );
}
