import React, { useEffect, useState } from 'react';

const PHASES = [
    { icon: 'lock_open',       text: 'Verifying your identity…',      sub: 'Securing your account safely.'           },
    { icon: 'auto_stories',    text: 'Weaving your story…',            sub: 'Crafting every detail with care.'         },
    { icon: 'palette',         text: 'Applying your chosen theme…',   sub: 'Making it look absolutely beautiful.'     },
    { icon: 'photo_library',   text: 'Uploading your memories…',      sub: 'Preserving every precious moment.'        },
    { icon: 'celebration',     text: 'Almost there…',                 sub: 'Your heirloom page is nearly ready.'      },
    { icon: 'favorite',        text: 'Finishing with love…',          sub: 'Adding the final touches just for you.'   },
];

/**
 * Fullscreen publishing / login loader.
 *
 * Props:
 *  - isVisible  {boolean}  — show/hide the overlay
 *  - phase      {'login' | 'publishing'}  — selects the label set
 */
export default function PublishingLoader({ isVisible = false, phase = 'publishing' }) {
    const [mounted, setMounted] = useState(false);
    const [opacity, setOpacity]   = useState(false);   // controls CSS fade-in
    const [phaseIdx, setPhaseIdx] = useState(0);
    const [msgVisible, setMsgVisible] = useState(true);

    /* Mount → slight tick delay → fade in */
    useEffect(() => {
        if (isVisible) {
            setMounted(true);
            setPhaseIdx(0);
            requestAnimationFrame(() =>
                requestAnimationFrame(() => setOpacity(true))
            );
        } else {
            setOpacity(false);
            const t = setTimeout(() => setMounted(false), 400);
            return () => clearTimeout(t);
        }
    }, [isVisible]);

    /* Cycle through status messages */
    useEffect(() => {
        if (!isVisible) return;
        const interval = setInterval(() => {
            setMsgVisible(false);
            setTimeout(() => {
                setPhaseIdx((i) => (i + 1) % PHASES.length);
                setMsgVisible(true);
            }, 350);
        }, 2400);
        return () => clearInterval(interval);
    }, [isVisible]);

    if (!mounted) return null;

    const current = PHASES[phase === 'login' ? 0 : phaseIdx];

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(251,249,248,0.60)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                transition: 'opacity 0.4s ease',
                opacity: opacity ? 1 : 0,
                pointerEvents: isVisible ? 'all' : 'none',
            }}
        >
            {/* ── decorative blobs ── */}
            <div style={blobStyle('#b7102a', '18%', '-8%',  260, 0.13, '18s')} />
            <div style={blobStyle('#db313f', '72%',  '80%', 200, 0.10, '22s')} />
            <div style={blobStyle('#ff665d', '85%',  '5%',  150, 0.08, '26s')} />

            {/* ── card ── */}
            <div style={{
                position: 'relative',
                background: 'rgba(255,255,255,0.72)',
                border: '1px solid rgba(183,16,42,0.12)',
                borderRadius: 32,
                padding: '52px 48px 44px',
                maxWidth: 420,
                width: '90vw',
                boxShadow: '0 40px 80px rgba(183,16,42,0.10), 0 0 0 1px rgba(183,16,42,0.06)',
                textAlign: 'center',
                overflow: 'hidden',
            }}>
                {/* top shimmer bar */}
                <div style={shimmerBarStyle} />

                {/* ── ring spinner ── */}
                <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 32px' }}>
                    {/* outer rotating ring */}
                    <svg
                        width="96" height="96"
                        viewBox="0 0 96 96"
                        style={{ position: 'absolute', inset: 0, animation: 'yaad-spin 1.8s linear infinite' }}
                    >
                        <circle cx="48" cy="48" r="44" fill="none" stroke="rgba(183,16,42,0.08)" strokeWidth="4" />
                        <circle
                            cx="48" cy="48" r="44"
                            fill="none"
                            stroke="url(#loaderGrad)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray="276"
                            strokeDashoffset="210"
                        />
                        <defs>
                            <linearGradient id="loaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#b7102a" />
                                <stop offset="100%" stopColor="#ff665d" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* inner counter-rotating ring */}
                    <svg
                        width="72" height="72"
                        viewBox="0 0 72 72"
                        style={{
                            position: 'absolute', inset: 12,
                            animation: 'yaad-spin-reverse 2.6s linear infinite',
                        }}
                    >
                        <circle cx="36" cy="36" r="32" fill="none" stroke="rgba(183,16,42,0.05)" strokeWidth="3" />
                        <circle
                            cx="36" cy="36" r="32"
                            fill="none"
                            stroke="#db313f"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray="201"
                            strokeDashoffset="165"
                            opacity="0.5"
                        />
                    </svg>

                    {/* center icon */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <div style={{
                            width: 48, height: 48,
                            background: 'linear-gradient(135deg, #b7102a 0%, #db313f 100%)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 20px rgba(183,16,42,0.30)',
                            animation: 'yaad-pulse 2s ease-in-out infinite',
                        }}>
                            <span
                                className="material-symbols-outlined"
                                style={{
                                    color: '#fff', fontSize: 22,
                                    fontVariationSettings: "'FILL' 1",
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                {current.icon}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── dots row ── */}
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
                    {PHASES.map((_, i) => (
                        <div
                            key={i}
                            style={{
                                height: 4,
                                width: i === phaseIdx ? 24 : 6,
                                borderRadius: 999,
                                background: i === phaseIdx
                                    ? 'linear-gradient(90deg,#b7102a,#db313f)'
                                    : 'rgba(183,16,42,0.15)',
                                transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                            }}
                        />
                    ))}
                </div>

                {/* ── message ── */}
                <div style={{
                    transition: 'opacity 0.35s ease, transform 0.35s ease',
                    opacity: msgVisible ? 1 : 0,
                    transform: msgVisible ? 'translateY(0)' : 'translateY(6px)',
                }}>
                    <p style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#1b1c1c',
                        marginBottom: 8,
                        letterSpacing: '-0.3px',
                    }}>
                        {current.text}
                    </p>
                    <p style={{
                        fontFamily: "'Be Vietnam Pro', sans-serif",
                        fontSize: 13,
                        color: '#5b403f',
                        lineHeight: 1.6,
                    }}>
                        {current.sub}
                    </p>
                </div>

                {/* ── brand footer ── */}
                <div style={{
                    marginTop: 36,
                    paddingTop: 20,
                    borderTop: '1px solid rgba(183,16,42,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                }}>
                    <img src="/branding/logo.webp" alt="Yaad Link" style={{ height: 22, objectFit: 'contain', opacity: 0.75 }} />
                    <span style={{
                        fontFamily: "'Be Vietnam Pro', sans-serif",
                        fontSize: 11,
                        color: 'rgba(91,64,63,0.55)',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                    }}>
                        Crafting your heirloom
                    </span>
                </div>
            </div>

            {/* ── keyframes injected inline ── */}
            <style>{`
                @keyframes yaad-spin {
                    from { transform: rotate(0deg);   }
                    to   { transform: rotate(360deg);  }
                }
                @keyframes yaad-spin-reverse {
                    from { transform: rotate(0deg);    }
                    to   { transform: rotate(-360deg); }
                }
                @keyframes yaad-pulse {
                    0%, 100% { transform: scale(1);    box-shadow: 0 8px 20px rgba(183,16,42,0.30); }
                    50%       { transform: scale(1.08); box-shadow: 0 12px 28px rgba(183,16,42,0.45); }
                }
                @keyframes yaad-blob {
                    0%, 100% { transform: translate(0, 0)   scale(1);    }
                    33%       { transform: translate(30px, -20px) scale(1.08); }
                    66%       { transform: translate(-20px, 15px) scale(0.95); }
                }
                @keyframes yaad-shimmer {
                    0%   { transform: translateX(-100%); }
                    100% { transform: translateX(200%);  }
                }
            `}</style>
        </div>
    );
}

/* ── helpers ── */
function blobStyle(color, top, left, size, alpha, duration) {
    return {
        position: 'fixed',
        top, left,
        width: size, height: size,
        borderRadius: '50%',
        background: color,
        opacity: alpha,
        filter: `blur(${size * 0.55}px)`,
        pointerEvents: 'none',
        animation: `yaad-blob ${duration} ease-in-out infinite`,
    };
}

const shimmerBarStyle = {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 3,
    background: 'linear-gradient(90deg, transparent 0%, #b7102a 40%, #ff665d 60%, transparent 100%)',
    backgroundSize: '200% 100%',
    animation: 'yaad-shimmer 2.4s ease-in-out infinite',
    borderRadius: '32px 32px 0 0',
    overflow: 'hidden',
};
