export const CONSENT_STORAGE_KEY = 'yl_cookie_consent';

export const DEFAULT_CONSENT = {
    necessary: true,
    analytics: false,
    marketing: false,
    decidedAt: null,
};

export function getStoredConsent() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return null;
    }

    try {
        const storedConsent = window.localStorage.getItem(CONSENT_STORAGE_KEY);
        return storedConsent ? { ...DEFAULT_CONSENT, ...JSON.parse(storedConsent) } : null;
    } catch {
        return null;
    }
}

export function saveConsent(preferences) {
    if (typeof window === 'undefined' || !window.localStorage) {
        return DEFAULT_CONSENT;
    }

    const consent = {
        ...DEFAULT_CONSENT,
        ...preferences,
        necessary: true,
        decidedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
    window.dispatchEvent(new CustomEvent('yaadlink:consent-changed', { detail: consent }));

    return consent;
}

export function hasAnalyticsConsent() {
    return getStoredConsent()?.analytics === true;
}
