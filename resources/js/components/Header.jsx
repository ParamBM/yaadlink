import { Button } from '@/components/ui/button';
import { headerLinks, logoPath, siteName } from '@/lib/site';

export default function Header() {
    return (
        <header className="fixed inset-x-0 top-0 z-50">
            <nav className="bg-surface/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(183,16,42,0.05)]" aria-label="Primary">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 md:px-8">
                    <a className="flex items-center" href="/" aria-label={siteName}>
                        <img className="h-11 w-auto object-contain" src={logoPath} alt={siteName} />
                    </a>

                    <div className="hidden items-center gap-8 font-headline text-sm font-semibold tracking-tight md:flex">
                        {headerLinks.map((link) => (
                            <a
                                key={link.label}
                                className="text-on-surface-variant transition-colors duration-300 hover:text-primary"
                                href={link.href}
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    <Button
                        className="cursor-pointer rounded-full bg-gradient-to-r from-primary to-primary-container px-6 py-2.5 font-label font-medium text-on-primary shadow-[0_20px_40px_rgba(183,16,42,0.15)] transition-transform duration-200 hover:scale-[0.98]"
                        type="button"
                    >
                        Create Site
                    </Button>
                </div>
            </nav>
        </header>
    );
}
