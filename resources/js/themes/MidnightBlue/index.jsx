import React, { useState, useEffect, useRef } from 'react';
import { getThemeStoryContent, formatDisplayDate, formatMilestoneDate } from '../shared';

/* ── Share Modal ─────────────────────────────────────────────────────────── */
function ShareModal({ onClose, title }) {
    const [copied, setCopied] = useState(false);
    const url = typeof window !== 'undefined' ? window.location.href : '';

    const copy = () => {
        navigator.clipboard?.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div style={{
                position: 'relative',
                background: 'rgba(28,37,65,0.95)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(91,192,190,0.2)',
                borderRadius: '1.5rem',
                padding: '2.5rem',
                maxWidth: '26rem',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 0 40px rgba(91,192,190,0.15)',
            }}>
                <span className="material-symbols-outlined" style={{ color: '#5BC0BE', fontSize: '2.5rem', display: 'block', marginBottom: '1rem', fontVariationSettings: '"FILL" 1' }}>share</span>
                <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '24px', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>Share This Story</h3>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '16px', color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem' }}>Copy the link to share {title || 'this story'}.</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input readOnly value={url} style={{ flex: 1, borderRadius: '9999px', border: '1px solid rgba(91,192,190,0.2)', background: 'rgba(11,19,43,0.8)', padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#fff', outline: 'none', minWidth: 0 }} />
                    <button onClick={copy} style={{ borderRadius: '9999px', background: '#5BC0BE', color: '#0B132B', padding: '0.5rem 1.25rem', fontWeight: 600, fontSize: '0.875rem', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
                <button onClick={onClose} style={{ marginTop: '1.25rem', fontSize: '0.875rem', color: 'rgba(91,192,190,0.6)', background: 'none', border: 'none', cursor: 'pointer' }}>Close</button>
            </div>
        </div>
    );
}

/* ── Milestone Item — alternating layout ─────────────────────────────────── */
function MilestoneItem({ milestone, index }) {
    const isEven = index % 2 === 0;
    const dateLabel = formatMilestoneDate(milestone.date) || milestone.date;

    const textBlock = (
        <div style={{ flex: 1, textAlign: isEven ? 'right' : 'left', padding: isEven ? '0 2rem 0 0' : '0 0 0 2rem' }}
            className={isEven ? 'hidden md:block' : 'hidden md:block'}>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', letterSpacing: '0.05em', fontWeight: 600, color: '#5BC0BE', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                {dateLabel || `Milestone ${index + 1}`}
            </div>
            <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '24px', fontWeight: 600, lineHeight: 1.4, color: '#fff' }}>{milestone.title}</h3>
            {milestone.description && (
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '16px', color: 'rgba(255,255,255,0.7)', marginTop: '0.75rem', lineHeight: 1.6 }}>{milestone.description}</p>
            )}
        </div>
    );

    const mediaBlock = (
        <div style={{ flex: 1, padding: isEven ? '0 0 0 2rem' : '0 2rem 0 0' }}>
            {/* Mobile text */}
            <div className="md:hidden" style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', letterSpacing: '0.05em', fontWeight: 600, color: '#5BC0BE', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    {dateLabel || `Milestone ${index + 1}`}
                </div>
                <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '24px', fontWeight: 600, color: '#fff' }}>{milestone.title}</h3>
                {milestone.description && <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '16px', color: 'rgba(255,255,255,0.7)', marginTop: '0.5rem', lineHeight: 1.6 }}>{milestone.description}</p>}
            </div>
            {(milestone.imageUrl || true) && (
                <div style={{ height: '12rem', borderRadius: '0.75rem', overflow: 'hidden', background: 'rgba(28,37,65,0.6)', border: '1px solid rgba(91,192,190,0.2)' }}>
                    {milestone.imageUrl ? (
                        <img src={milestone.imageUrl} alt={milestone.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, mixBlendMode: 'luminosity', transition: 'all 0.5s' }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.mixBlendMode = 'normal'; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = 0.8; e.currentTarget.style.mixBlendMode = 'luminosity'; }}
                        />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ color: '#5BC0BE', fontSize: '2rem', opacity: 0.4 }}>photo</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '3rem' }}
            className="md:flex-row group">
            {isEven ? textBlock : mediaBlock}
            {/* Dot */}
            <div style={{
                position: 'absolute', left: '2rem', top: 0,
                width: '1rem', height: '1rem',
                background: '#5BC0BE', borderRadius: '9999px',
                border: '4px solid #0B132B',
                boxShadow: '0 0 15px rgba(91,192,190,0.8)',
                transform: 'translateX(-50%)',
                zIndex: 10, transition: 'transform 0.3s',
            }} className="md:static md:translate-x-0 md:mx-0 md:flex-shrink-0" />
            {isEven ? mediaBlock : textBlock}
        </div>
    );
}

/* ── Bento Gallery ───────────────────────────────────────────────────────── */
function BentoGallery({ images, finalMessage }) {
    const glassStyle = {
        background: 'rgba(28,37,65,0.6)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(91,192,190,0.2)',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        position: 'relative',
    };

    const imgStyle = {
        width: '100%', height: '100%', objectFit: 'cover',
        opacity: 0.7, mixBlendMode: 'luminosity', transition: 'opacity 0.7s, mix-blend-mode 0.7s',
    };

    const hoverIn = e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.mixBlendMode = 'normal'; };
    const hoverOut = e => { e.currentTarget.style.opacity = 0.7; e.currentTarget.style.mixBlendMode = 'luminosity'; };

    // Build cells: up to 4 images + a quote cell
    const cells = [];

    // Feature (large, col-span-2, row-span-2) — image[0]
    if (images[0]) {
        cells.push(
            <div key="feat" style={{ ...glassStyle, gridColumn: 'span 2', gridRow: 'span 2' }}>
                <img src={images[0].src} alt={images[0].alt} style={imgStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0B132B, transparent)', opacity: 0.8 }} />
            </div>
        );
    }

    // Small cells: image[1], quote, image[2], image[3]
    if (images[1]) {
        cells.push(
            <div key="sm1" style={glassStyle}>
                <img src={images[1].src} alt={images[1].alt} style={{ ...imgStyle, opacity: 0.6 }} onMouseEnter={hoverIn} onMouseLeave={hoverOut} />
            </div>
        );
    }

    // Quote cell
    cells.push(
        <div key="quote" style={{ ...glassStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: '#5BC0BE', fontSize: '1.75rem', display: 'block', marginBottom: '0.75rem', fontVariationSettings: '"FILL" 0' }}>auto_awesome</span>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '16px', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
                    {finalMessage ? `"${finalMessage}"` : '"In all the universe, I found you."'}
                </p>
            </div>
        </div>
    );

    // Wide panoramic cell — image[2] or image[3]
    const wideImg = images[2] || images[3];
    if (wideImg) {
        cells.push(
            <div key="wide" style={{ ...glassStyle, gridColumn: 'span 3', height: '200px' }}>
                <img src={wideImg.src} alt={wideImg.alt} style={{ ...imgStyle, opacity: 0.6 }} onMouseEnter={hoverIn} onMouseLeave={hoverOut} />
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', gridAutoRows: '200px' }}>
            {cells}
        </div>
    );
}

/* ── Main Component ──────────────────────────────────────────────────────── */
export default function MidnightBlue({ data }) {
    const content = getThemeStoryContent(data);
    const [showShare, setShowShare] = useState(false);
    const [headerVisible, setHeaderVisible] = useState(true);
    const lastY = useRef(0);

    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY;
            setHeaderVisible(y < 80 || y < lastY.current);
            lastY.current = y;
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const displayDate = formatDisplayDate(content.rawDate) || content.dateLabel;
    const storyParagraphs = (content.summary || '').split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
    const initials = content.initials || content.people.map(n => n.charAt(0).toUpperCase()).join(' & ') || 'R & S';

    return (
        <>
            {/* Fonts */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;600;700&display=swap" rel="stylesheet" />
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

            <style>{`
                .mb-root { background-color: #0B132B; color: #fff; font-family: 'Manrope', sans-serif; min-height: 100vh; overflow-x: hidden; }
                .mb-root ::selection { background: rgba(91,192,190,0.3); color: #fff; }
                .mb-bg { background-image:
                    radial-gradient(circle at 50% 50%, rgba(91,192,190,0.05) 0%, transparent 50%),
                    radial-gradient(circle at 10% 20%, rgba(255,255,255,0.03) 1px, transparent 1px),
                    radial-gradient(circle at 90% 80%, rgba(255,255,255,0.03) 1px, transparent 1px),
                    radial-gradient(circle at 30% 90%, rgba(255,255,255,0.03) 1px, transparent 1px),
                    radial-gradient(circle at 80% 30%, rgba(255,255,255,0.03) 1px, transparent 1px);
                    background-attachment: fixed;
                }
                .mb-glass {
                    background: rgba(28,37,65,0.6);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: 1px solid rgba(91,192,190,0.2);
                }
                .mb-glow-text { text-shadow: 0 0 10px rgba(91,192,190,0.5); }
                .mb-glow-box { box-shadow: 0 0 20px rgba(91,192,190,0.15); }
                .mb-timeline-line {
                    position: absolute; left: 2rem; top: 0; bottom: 0;
                    width: 1px; background: rgba(91,192,190,0.2);
                    transform: translateX(-50%);
                }
                @media (min-width: 768px) {
                    .mb-timeline-line { left: 50%; }
                    .mb-milestone-row { flex-direction: row !important; align-items: center !important; }
                    .mb-dot { position: absolute !important; left: 50% !important; transform: translateX(-50%) !important; }
                }
            `}</style>

            <div className="mb-root mb-bg">
                {/* ── NAV ── */}
                <nav style={{
                    position: 'fixed', top: 0, width: '100%', zIndex: 50,
                    background: 'rgba(11,19,43,0.60)',
                    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                    borderBottom: '1px solid rgba(91,192,190,0.2)',
                    transform: headerVisible ? 'translateY(0)' : 'translateY(-100%)',
                    transition: 'transform 0.3s ease',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '800px', margin: '0 auto', padding: '1.5rem 2rem' }}>
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.5rem', fontWeight: 300, letterSpacing: '0.4em', color: '#5BC0BE', textShadow: '0 0 10px rgba(91,192,190,0.3)' }}>
                            YaadLink
                        </div>
                        <button
                            id="mb-share-nav"
                            onClick={() => setShowShare(true)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 1.5rem', borderRadius: '9999px', border: '1.5px solid #5BC0BE', color: '#5BC0BE', background: 'transparent', cursor: 'pointer', fontFamily: 'Manrope', fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', transition: 'background 0.3s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(91,192,190,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            Share Story
                        </button>
                    </div>
                </nav>

                <main style={{ maxWidth: '800px', margin: '0 auto', padding: '8rem 1.5rem 5rem' }}>

                    {/* ── HERO ── */}
                    <section style={{ minHeight: '716px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', marginBottom: '5rem', position: 'relative' }}>
                        <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '9999px', background: 'radial-gradient(circle, rgba(91,192,190,0.05), transparent)', filter: 'blur(100px)', top: '5rem', left: '50%', transform: 'translateX(-50%)', zIndex: -1 }} />
                        <h1 className="mb-glow-text" style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(40px, 8vw, 64px)', lineHeight: 1.1, letterSpacing: '-0.02em', fontWeight: 600, color: '#5BC0BE', marginBottom: '0.75rem' }}>
                            {content.title}
                        </h1>
                        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '18px', lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '3rem' }}>
                            {content.eyebrow || content.subtitle}
                        </p>
                        {displayDate && (
                            <div style={{ marginBottom: '1.5rem', fontFamily: 'Manrope', fontSize: '14px', letterSpacing: '0.2em', fontWeight: 600, textTransform: 'uppercase', color: '#5BC0BE', opacity: 0.8 }}>
                                {displayDate}
                            </div>
                        )}
                        <div style={{ width: '1px', height: '6rem', background: 'linear-gradient(to bottom, rgba(91,192,190,0.5), transparent)', marginTop: '0.5rem' }} />
                    </section>

                    {/* ── OUR STORY ── */}
                    {storyParagraphs.length > 0 && (
                        <section style={{ marginBottom: '5rem' }}>
                            <div className="mb-glass" style={{ borderRadius: '1.5rem', padding: '3rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, rgba(91,192,190,0.3), transparent)' }} />
                                <span className="material-symbols-outlined" style={{ color: '#5BC0BE', fontSize: '2.5rem', display: 'block', marginBottom: '1.5rem', fontVariationSettings: '"FILL" 1' }}>favorite</span>
                                <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '32px', fontWeight: 600, lineHeight: 1.3, color: '#fff', marginBottom: '1.5rem' }}>
                                    Our Celestial Beginning
                                </h2>
                                {storyParagraphs.map((para, i) => (
                                    <p key={i} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '18px', lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', maxWidth: '36rem', margin: '0 auto', marginBottom: i < storyParagraphs.length - 1 ? '1rem' : 0 }}>
                                        {para}
                                    </p>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ── MILESTONES ── */}
                    {content.milestones.length > 0 && (
                        <section style={{ marginBottom: '5rem' }}>
                            <h2 className="mb-glow-text" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '32px', fontWeight: 600, textAlign: 'center', color: '#5BC0BE', marginBottom: '3rem' }}>
                                Constellations of Us
                            </h2>
                            <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                                {/* Vertical line */}
                                <div className="mb-timeline-line" />
                                {content.milestones.map((milestone, index) => (
                                    <MilestoneItem key={milestone.key} milestone={milestone} index={index} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ── GALLERY ── */}
                    {content.images.length > 0 && (
                        <section style={{ marginBottom: '5rem' }}>
                            <h2 className="mb-glow-text" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '32px', fontWeight: 600, textAlign: 'center', color: '#5BC0BE', marginBottom: '3rem' }}>
                                Stardust Memories
                            </h2>
                            <BentoGallery images={content.images} finalMessage={content.finalMessage} />
                        </section>
                    )}

                    {/* ── FINAL MESSAGE ── */}
                    <section style={{ textAlign: 'center', marginBottom: '5rem', padding: '3rem 0' }}>
                        <div style={{ width: '4rem', height: '1px', background: 'rgba(91,192,190,0.3)', margin: '0 auto 3rem' }} />
                        <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.02em', color: '#fff', marginBottom: '1rem', opacity: 0.9 }}>
                            {content.finalMessage
                                ? `"${content.finalMessage}"`
                                : '"Our orbit has just begun."'}
                        </h3>
                        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#5BC0BE', fontWeight: 600 }}>
                            {initials} — The unending journey
                        </p>
                        <div style={{ width: '4rem', height: '1px', background: 'rgba(91,192,190,0.3)', margin: '3rem auto 0' }} />
                    </section>
                </main>

                {/* ── FOOTER ── */}
                <footer style={{ width: '100%', padding: '5rem 0', borderTop: '1px solid rgba(91,192,190,0.1)', background: 'transparent' }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '0 2rem' }}>
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                            {['Privacy', 'Terms', 'Starlight Protocol'].map(label => (
                                <a key={label} href="#" style={{ fontFamily: 'Manrope', fontWeight: 300, fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(91,192,190,0.4)', textDecoration: 'none', transition: 'color 0.3s' }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#5BC0BE'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(91,192,190,0.4)'}>
                                    {label}
                                </a>
                            ))}
                        </div>
                        <p style={{ fontFamily: 'Manrope', fontWeight: 300, fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(91,192,190,0.4)' }}>
                            © {new Date().getFullYear()} Yaad Link. Ethereal Presence.
                        </p>
                    </div>
                </footer>

                {/* ── FAB ── */}
                <button
                    id="mb-share-fab"
                    aria-label="Share the magic"
                    onClick={() => setShowShare(true)}
                    className="mb-glow-box"
                    style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 50, background: '#5BC0BE', color: '#0B132B', padding: '1rem 1.5rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', fontFamily: 'Manrope', fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'transform 0.3s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', fontVariationSettings: '"FILL" 1' }}>share</span>
                    ✦ Share the magic
                </button>

                {showShare && <ShareModal onClose={() => setShowShare(false)} title={content.title} />}
            </div>
        </>
    );
}
