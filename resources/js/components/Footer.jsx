import { Link } from 'react-router';
import { footerLinks, logoPath, siteName } from '@/lib/site';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-surface-container-low py-12">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 text-center md:flex-row md:px-12 md:text-left">
                <Link className="flex items-center" to="/" aria-label={siteName}>
                    <img className="h-10 w-auto object-contain" src={logoPath} alt={siteName} />
                </Link>

                <div className="flex flex-wrap justify-center gap-6 font-body text-sm tracking-wide text-on-surface-variant">
                    {footerLinks.map((link) => (
                        <a
                            key={link.label}
                            className="transition-colors duration-300 hover:text-primary focus-visible:text-primary"
                            href={link.href}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                <p className="font-body text-sm tracking-wide text-secondary">
                    &copy; {currentYear} {siteName}. Crafted with love for modern heirlooms.
                </p>
            </div>
        </footer>
    );
}
