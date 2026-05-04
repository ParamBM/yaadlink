import { lazy } from 'react';

export const THEMES = {
    'rose-gold': lazy(() => import('./RoseGold')),
    'midnight-blue': lazy(() => import('./MidnightBlue')),
    'sacred-wedding': lazy(() => import('./SacredWedding')),
};

export const DEFAULT_THEME_SLUG = 'rose-gold';

export function hasThemeComponent(slug) {
    return !!THEMES[String(slug || '').trim()];
}

export function getThemeComponent(slug) {
    return THEMES[String(slug || '').trim()] || THEMES[DEFAULT_THEME_SLUG];
}
