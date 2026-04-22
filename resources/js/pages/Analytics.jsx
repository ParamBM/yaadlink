import React from 'react';

const stats = [
    { label: 'Total Users',        icon: 'group',       value: '—', color: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-red-400' },
    { label: 'Occasion Types',     icon: 'event_note',  value: '—', color: 'bg-tertiary/10 text-tertiary dark:bg-tertiary/20 dark:text-tertiary-fixed' },
    { label: 'Activity Logs',      icon: 'history',     value: '—', color: 'bg-secondary/10 text-secondary dark:bg-secondary/20 dark:text-red-300' },
    { label: 'Active Sessions',    icon: 'sensors',     value: '—', color: 'bg-surface-container-high dark:bg-stone-800 text-on-surface-variant dark:text-stone-400' },
];

export default function Analytics() {
    return (
        <div className="p-6 md:p-8 lg:px-12 max-w-7xl mx-auto w-full">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="font-headline text-4xl font-extrabold text-on-surface dark:text-white tracking-tighter mb-3">
                    Analytics
                </h1>
                <p className="text-on-surface-variant dark:text-stone-400 text-base leading-relaxed font-body">
                    Platform insights and usage statistics will appear here.
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map(s => (
                    <div
                        key={s.label}
                        className="bg-surface-container-lowest dark:bg-stone-900 rounded-[1.5rem] p-5 border border-outline-variant/10 dark:border-stone-700/30 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_40px_-15px_rgba(0,0,0,0.4)]"
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${s.color}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', fontVariationSettings: "'FILL' 1" }}>
                                {s.icon}
                            </span>
                        </div>
                        <p className="text-2xl font-headline font-extrabold text-on-surface dark:text-white">{s.value}</p>
                        <p className="text-sm text-on-surface-variant dark:text-stone-400 font-body mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Coming Soon Panel */}
            <div className="bg-surface-container-lowest dark:bg-stone-900 rounded-[2rem] p-10 border border-outline-variant/10 dark:border-stone-700/30 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-surface-container dark:bg-stone-800 flex items-center justify-center mb-5">
                    <span className="material-symbols-outlined text-on-surface-variant dark:text-stone-500" style={{ fontSize: '2rem', fontVariationSettings: "'FILL' 1" }}>
                        bar_chart
                    </span>
                </div>
                <h2 className="font-headline font-bold text-on-surface dark:text-white text-xl mb-2">Charts & Metrics Coming Soon</h2>
                <p className="text-on-surface-variant dark:text-stone-400 font-body text-sm max-w-md leading-relaxed">
                    This section will display graphs, usage trends, and key performance indicators once the data pipelines are connected.
                </p>
            </div>
        </div>
    );
}
