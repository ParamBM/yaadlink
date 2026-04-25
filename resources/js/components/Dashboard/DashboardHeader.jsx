import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

export default function DashboardHeader() {
    const { user } = useSelector((state) => state.auth);
    const [isDark, setIsDark] = useState(
        localStorage.getItem('theme') === 'dark' || 
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const toggleDarkMode = () => setIsDark(!isDark);

    return (
        <header className="w-full h-20 shrink-0 sticky top-0 z-40 bg-surface/80 dark:bg-stone-950/80 backdrop-blur-md flex items-center justify-between px-12 border-b border-outline-variant/10 transition-colors duration-300">
            <h1 className="font-headline font-medium text-primary dark:text-red-400 text-xl tracking-tight hidden md:block">
                Yaad Link
            </h1>
            
            <div className="flex items-center justify-between w-full md:w-auto md:gap-8">
                {/* Mobile Menu Button */}
                <button className="md:hidden text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-container transition-colors">
                    <span className="material-symbols-outlined">menu</span>
                </button>
                
                <h1 className="md:hidden font-headline font-bold text-primary dark:text-red-400 text-xl">Dashboard</h1>

                <div className="flex items-center gap-4">
                    {/* Dark Mode Toggle */}
                    <button 
                        onClick={toggleDarkMode}
                        className="text-on-surface-variant dark:text-stone-400 hover:text-primary dark:hover:text-red-400 hover:bg-surface-container dark:hover:bg-stone-800 rounded-full p-2.5 transition-all active:scale-95"
                        aria-label="Toggle Dark Mode"
                    >
                        <span className="material-symbols-outlined">
                            {isDark ? 'light_mode' : 'dark_mode'}
                        </span>
                    </button>

                    {/* User Avatar (Mobile) */}
                    <img
                        alt="User Avatar"
                        className="w-10 h-10 rounded-full object-cover ml-2 md:hidden border border-primary/20"
                        src={user?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuAskYzLxXmsGP48eT7UsKzEYqsSh9kbj4wEskTD4AJwL70QFeHhnbwhfSz3fXzAWBwRsm6w5P-8AoRDCBGgukr3-h5gwNwlWR0IwAYJ1_N5J4SKycvlQW6ORCL3rrPOORnxK6syVRb7uJHdeePHayoii6VOlnpczUX_Bu4NAc3Evv-ATis-fbW3thvykNE8t947k5yk25mMC5wvl5yv-yoSSQMgH7GlUiGBd5E9VG2opIY8CTOayn7HQszaZrFiBVcL0s2FFKd0aaUD"}
                    />
                </div>
            </div>
        </header>
    );
}
