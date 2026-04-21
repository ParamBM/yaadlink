const envAppName = import.meta.env.VITE_APP_NAME;
export const siteName = (envAppName && envAppName !== '${APP_NAME}') ? envAppName : 'YaadLink';
export const logoPath = '/branding/logo.webp';

export const headerLinks = [
    { label: 'Our Story', href: '#' },
    { label: 'Milestones', href: '#' },
    { label: 'Gallery', href: '#' },
    { label: 'RSVP', href: '#' },
];

export const footerLinks = [
    { label: 'Privacy', href: '#' },
    { label: 'Terms', href: '#' },
    { label: 'Support', href: '#' },
    { label: 'Our Heritage', href: '#' },
];
