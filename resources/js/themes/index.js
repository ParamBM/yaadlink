import { lazy } from 'react';

export const THEMES = {
    'rose-gold': lazy(() => import('./RoseGold')),
    'midnight-blue': lazy(() => import('./MidnightBlue')),
    'sacred-wedding': lazy(() => import('./SacredWedding')),
    'royal-velvet': lazy(() => import('./RoyalVelvet')),
    'celestial-dreams': lazy(() => import('./CelestialDreams')),
    'model-portfolio': lazy(() => import('./ModelPortfolio')),
    'couture-press': lazy(() => import('./CouturePress')),
    'glamour-canvas': lazy(() => import('./GlamourCanvas')),
    'aperture': lazy(() => import('./Aperture')),
};

export const DEFAULT_THEME_SLUG = 'rose-gold';

export function hasThemeComponent(slug) {
    return !!THEMES[String(slug || '').trim()];
}

export function getThemeComponent(slug) {
    return THEMES[String(slug || '').trim()] || THEMES[DEFAULT_THEME_SLUG];
}
