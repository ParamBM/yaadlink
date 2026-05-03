import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { DEFAULT_CONSENT, getStoredConsent, saveConsent } from '../utils/consent';

function ConsentToggle({ checked, disabled = false, onChange }) {
    return (
        <button
            aria-pressed={checked}
            className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${checked ? 'border-primary bg-primary' : 'border-outline-variant/40 bg-surface-container-highest'} ${disabled ? 'cursor-not-allowed opacity-90' : 'hover:border-primary/60'}`}
            disabled={disabled}
            type="button"
            onClick={() => onChange?.(!checked)}
        >
            <span className={`absolute left-1 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );
}

function PreferenceRow({ title, description, checked, required = false, onChange }) {
    return (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3">
            <div className="min-w-0">
                <p className="font-label text-sm font-bold text-on-surface">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-on-surface-variant">{description}</p>
            </div>
            <div className="flex w-[6.75rem] shrink-0 items-center justify-end gap-2">
                <span className="w-12 text-right text-xs font-bold text-on-surface-variant">{required ? 'Required' : checked ? 'On' : 'Off'}</span>
                <ConsentToggle checked={checked} disabled={required} onChange={onChange} />
            </div>
        </div>
    );
}

export default function CookieConsentBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [preferences, setPreferences] = useState(DEFAULT_CONSENT);

    useEffect(() => {
        const storedConsent = getStoredConsent();
        if (storedConsent) {
            return;
        }

        const timer = window.setTimeout(() => setIsVisible(true), 500);
        return () => window.clearTimeout(timer);
    }, []);

    if (!isVisible) {
        return null;
    }

    const closeWithConsent = (nextPreferences) => {
        saveConsent(nextPreferences);
        setIsVisible(false);
    };

    const rejectOptional = () => closeWithConsent({ analytics: false, marketing: false });
    const acceptAll = () => closeWithConsent({ analytics: true, marketing: true });
    const savePreferences = () => closeWithConsent(preferences);

    return (
        <div className="fixed inset-x-0 bottom-0 z-[130] px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="ml-auto w-full max-w-[29rem] overflow-hidden rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest shadow-[0_28px_90px_rgba(27,28,28,0.22)]">
                <div className="bg-[radial-gradient(circle_at_top_left,rgba(183,16,42,0.13),transparent_38%),linear-gradient(135deg,var(--surface-container-lowest),var(--surface-container-low))] p-5 sm:p-6">
                    <div className="mb-3 flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                            <span className="material-symbols-outlined rounded-full bg-primary/10 p-2 text-[1.25rem] text-primary">cookie</span>
                            <h2 className="font-headline text-xl font-extrabold tracking-tight text-on-surface">Cookie settings</h2>
                        </div>
                        <button
                            aria-label="Close cookie settings"
                            className="rounded-full p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                            type="button"
                            onClick={rejectOptional}
                        >
                            <span className="material-symbols-outlined text-[1.15rem]">close</span>
                        </button>
                    </div>

                    {!showSettings ? (
                        <>
                            <p className="text-sm leading-relaxed text-on-surface-variant">
                                We use necessary storage to run YaadLink and optional analytics to understand story page views. You can accept, reject, or customize your preferences.
                                {' '}
                                <Link className="font-bold text-primary underline-offset-4 hover:underline" to="/legal">Read our policy</Link>.
                            </p>

                            <div className="mt-5 grid gap-2 sm:grid-cols-2">
                                <button
                                    className="rounded-full border border-outline-variant/35 px-4 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container"
                                    type="button"
                                    onClick={() => setShowSettings(true)}
                                >
                                    Customize
                                </button>
                                <button
                                    className="rounded-full border border-outline-variant/35 px-4 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container"
                                    type="button"
                                    onClick={rejectOptional}
                                >
                                    Reject optional
                                </button>
                                <button
                                    className="rounded-full bg-gradient-to-r from-primary to-primary-container px-4 py-3 text-sm font-bold text-on-primary shadow-[0_14px_36px_-18px_rgba(183,16,42,0.8)] transition-transform hover:scale-[0.99] sm:col-span-2"
                                    type="button"
                                    onClick={acceptAll}
                                >
                                    Accept all
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-sm leading-relaxed text-on-surface-variant">
                                Choose which optional storage YaadLink can use. Necessary storage stays on for security and basic functionality.
                            </p>

                            <div className="mt-5 space-y-2.5">
                                <PreferenceRow
                                    title="Necessary"
                                    description="Enables security, login, publishing, and saved drafts."
                                    checked
                                    required
                                />
                                <PreferenceRow
                                    title="Analytics"
                                    description="Helps count story views and improve site performance."
                                    checked={preferences.analytics}
                                    onChange={(analytics) => setPreferences((current) => ({ ...current, analytics }))}
                                />
                                <PreferenceRow
                                    title="Marketing"
                                    description="Reserved for personalization or campaigns. Not currently used."
                                    checked={preferences.marketing}
                                    onChange={(marketing) => setPreferences((current) => ({ ...current, marketing }))}
                                />
                            </div>

                            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                                <button
                                    className="rounded-full border border-outline-variant/35 px-4 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container sm:flex-1"
                                    type="button"
                                    onClick={() => setShowSettings(false)}
                                >
                                    Back
                                </button>
                                <button
                                    className="rounded-full bg-gradient-to-r from-primary to-primary-container px-4 py-3 text-sm font-bold text-on-primary shadow-[0_14px_36px_-18px_rgba(183,16,42,0.8)] transition-transform hover:scale-[0.99] sm:flex-[2]"
                                    type="button"
                                    onClick={savePreferences}
                                >
                                    Save preferences
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
