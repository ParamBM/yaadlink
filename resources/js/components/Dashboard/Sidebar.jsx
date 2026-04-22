import React from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router';

export default function Sidebar() {
    const { user } = useSelector((state) => state.auth);
    const location = useLocation();

    const navLinks = [
        { label: 'Occasion Types', icon: 'event_note', href: '/dashboard/occasion-types' },
        { label: 'Themes', icon: 'palette', href: '/dashboard/themes' },
        { label: 'Stories', icon: 'auto_stories', href: '/dashboard/stories' },
    ];

    return (
        <aside className="hidden md:flex flex-col h-screen w-72 rounded-r-[2rem] sticky left-0 top-0 bg-surface-container-low dark:bg-stone-900 shadow-[30px_0_60px_-15px_rgba(183,16,42,0.05)] z-50 border-r border-outline-variant/10 transition-colors duration-300">
            <div className="flex flex-col h-full p-6 gap-8">
                {/* Profile Section */}
                <div className="flex items-center gap-4 px-2">
                    <img
                        alt={user?.name || 'User Avatar'}
                        className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                        src={user?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuAb3vK8HNc10TGZxbFqmo164MW-SNdIECOJuFJEIhnj7wlcfQbC0goFaD0IiKZgPeybuTv0qW8_HJTmIPce-2z4ekK4fgfsRG8OedsBI1GqgD6X-b9I-yWXbiXK54EoBpPKL6qrediU61euf1hdeUVAceJa1o0fjRaVV_IgQJRMbQhUM5m5GAKQvMatpROS5Dv7wc5DgOC1xLFX1GhCkT3tG9LLVC5u7jgPxVGNd1xv455mPiuuovguGbRWupMILd4aX22jAPIzeb6K"}
                    />
                    <div>
                        <h2 className="text-primary dark:text-red-400 font-headline font-bold text-lg leading-tight tracking-tight">
                            Yaad Link
                        </h2>
                        <p className="text-on-surface-variant dark:text-stone-400 text-sm truncate max-w-[140px] font-body">
                            {user?.name || 'Loading profile...'}
                        </p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 flex flex-col gap-2 font-headline">
                    {navLinks.map((link) => {
                        const isActive = location.pathname === link.href;
                        return (
                            <Link
                                key={link.label}
                                to={link.href}
                                className={`flex items-center gap-4 px-6 py-4 rounded-full transition-all duration-300 active:scale-95 ${
                                    isActive
                                        ? 'bg-surface dark:bg-stone-800 text-primary dark:text-red-400 font-bold shadow-sm'
                                        : 'text-on-surface-variant dark:text-stone-400 hover:bg-surface/50 dark:hover:bg-stone-800/50 hover:scale-[1.02] hover:text-on-surface dark:hover:text-white'
                                }`}
                            >
                                <span className={`material-symbols-outlined ${isActive ? 'fill-1' : ''}`}>
                                    {link.icon}
                                </span>
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Action Button */}
                <button className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold shadow-[0_10px_30px_-10px_rgba(183,16,42,0.4)] hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2 font-headline">
                    <span className="material-symbols-outlined">add</span>
                    New Occasion
                </button>
            </div>
        </aside>
    );
}
