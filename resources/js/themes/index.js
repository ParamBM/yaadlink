import MidnightBlue from './MidnightBlue';
import RoseGold from './RoseGold';
import SacredWedding from './SacredWedding';

export const THEMES = {
    'rose-gold': RoseGold,
    'midnight-blue': MidnightBlue,
    'sacred-wedding': SacredWedding,
};

export const DEFAULT_THEME_SLUG = 'rose-gold';

export function hasThemeComponent(slug) {
    return !!THEMES[String(slug || '').trim()];
}

export function getThemeComponent(slug) {
    return THEMES[String(slug || '').trim()] || THEMES[DEFAULT_THEME_SLUG];
}
