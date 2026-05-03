import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAnalytics } from '../store/slices/analyticsSlice';

const CHART_COLORS = ['#b7102a', '#00666c', '#db313f', '#d6a340', '#8f6f6e', '#ff665d', '#6fd6de', '#5b403f'];

const ACTION_STYLES = {
    login: 'bg-tertiary-fixed/20 text-tertiary dark:text-tertiary-fixed',
    logout: 'bg-surface-container text-on-surface-variant dark:bg-stone-800 dark:text-stone-300',
    create: 'bg-primary/10 text-primary dark:bg-red-400/15 dark:text-red-300',
    update: 'bg-secondary/10 text-secondary dark:bg-red-400/10 dark:text-red-300',
    delete: 'bg-error-container/40 text-error dark:bg-red-950/50 dark:text-red-300',
};

function numberFormat(value, options = {}) {
    const number = Number(value ?? 0);

    return new Intl.NumberFormat('en-IN', options).format(Number.isFinite(number) ? number : 0);
}

function compactNumber(value) {
    return numberFormat(value, {
        notation: Number(value ?? 0) >= 10000 ? 'compact' : 'standard',
        maximumFractionDigits: 1,
    });
}

function percent(part, total) {
    if (!total) {
        return '0%';
    }

    return `${Math.round((Number(part || 0) / total) * 100)}%`;
}

function formatDateTime(value) {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    }).format(new Date(value));
}

function titleCase(value) {
    return String(value || 'Unknown')
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function StatCard({ icon, label, value, subtext, tone = 'primary' }) {
    const tones = {
        primary: 'from-primary/15 to-primary-container/10 text-primary dark:from-red-400/15 dark:to-red-900/20 dark:text-red-300',
        teal: 'from-tertiary/15 to-tertiary-fixed/10 text-tertiary dark:from-cyan-400/15 dark:to-cyan-950/20 dark:text-tertiary-fixed',
        amber: 'from-[#d6a340]/20 to-[#f7d18b]/10 text-[#8a5a00] dark:from-amber-300/15 dark:to-amber-950/20 dark:text-amber-200',
        neutral: 'from-surface-container to-surface-container-high text-on-surface-variant dark:from-stone-800 dark:to-stone-800/60 dark:text-stone-300',
    };

    return (
        <div className="group relative overflow-hidden rounded-[1.75rem] border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-[0_18px_55px_-28px_rgba(0,0,0,0.24)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_25px_70px_-35px_rgba(183,16,42,0.35)] dark:border-stone-700/30 dark:bg-stone-900">
            <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-primary/5 blur-2xl transition-transform duration-500 group-hover:scale-125 dark:bg-red-400/10" />
            <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${tones[tone] || tones.primary}`}>
                <span className="material-symbols-outlined text-[1.25rem]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {icon}
                </span>
            </div>
            <p className="font-headline text-3xl font-extrabold tracking-tight text-on-surface dark:text-white">{value}</p>
            <p className="mt-1 text-sm font-semibold text-on-surface-variant dark:text-stone-400">{label}</p>
            {subtext && <p className="mt-3 text-xs leading-relaxed text-on-surface-variant/75 dark:text-stone-500">{subtext}</p>}
        </div>
    );
}

function Panel({ title, subtitle, icon, children, action }) {
    return (
        <section className="rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.28)] dark:border-stone-700/30 dark:bg-stone-900">
            <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    {icon && (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary dark:bg-stone-800 dark:text-red-300">
                            <span className="material-symbols-outlined text-[1.1rem]">{icon}</span>
                        </div>
                    )}
                    <div>
                        <h2 className="font-headline text-lg font-extrabold tracking-tight text-on-surface dark:text-white">{title}</h2>
                        {subtitle && <p className="mt-1 text-sm text-on-surface-variant dark:text-stone-400">{subtitle}</p>}
                    </div>
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

function DonutChart({ title, items = [], totalLabel = 'Total' }) {
    const [hoveredSegment, setHoveredSegment] = useState(null);
    const normalized = items.filter((item) => Number(item?.value || 0) > 0);
    const total = normalized.reduce((sum, item) => sum + Number(item.value || 0), 0);
    const radius = 42;
    const circumference = 2 * Math.PI * radius;

    let cursor = 0;
    const segments = normalized.map((item, index) => {
        const start = cursor;
        const next = cursor + (Number(item.value || 0) / total) * 100;
        cursor = next;

        return {
            ...item,
            color: CHART_COLORS[index % CHART_COLORS.length],
            start,
            end: next,
            mid: (start + next) / 2,
            dashLength: ((next - start) / 100) * circumference,
            dashOffset: -(start / 100) * circumference,
        };
    });

    return (
        <div className="rounded-[1.5rem] bg-surface-container-low p-4 dark:bg-stone-950/40">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-headline text-sm font-bold text-on-surface dark:text-white">{title}</h3>
                <span className="rounded-full bg-surface-container-lowest px-3 py-1 text-xs font-bold text-on-surface-variant dark:bg-stone-800 dark:text-stone-300">
                    {compactNumber(total)}
                </span>
            </div>
            <div className="flex flex-col items-center gap-4">
                <div className="relative mx-auto h-44 w-44 rounded-full shadow-inner">
                    <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" role="img" aria-label={`${title} donut chart`}>
                        <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            stroke="var(--surface-container-high)"
                            strokeWidth="10"
                            className="dark:stroke-stone-800"
                        />
                        {segments.map((segment, index) => (
                            <circle
                                key={`${segment.label}-${index}`}
                                cx="50"
                                cy="50"
                                r={radius}
                                fill="none"
                                stroke={segment.color}
                                strokeWidth={hoveredSegment?.label === segment.label ? '13' : '10'}
                                strokeDasharray={`${segment.dashLength} ${circumference - segment.dashLength}`}
                                strokeDashoffset={segment.dashOffset}
                                strokeLinecap="butt"
                                className="origin-center -rotate-90 cursor-pointer transition-all duration-200 focus:outline-none"
                                tabIndex={0}
                                onMouseEnter={() => setHoveredSegment(segment)}
                                onMouseLeave={() => setHoveredSegment(null)}
                                onFocus={() => setHoveredSegment(segment)}
                                onBlur={() => setHoveredSegment(null)}
                                aria-label={`${segment.label}: ${numberFormat(segment.value)} ${totalLabel}, ${percent(segment.value, total)}`}
                            />
                        ))}
                    </svg>

                    {hoveredSegment && (() => {
                        const segment = hoveredSegment;
                        const angle = segment.mid * 3.6 - 90;
                        const radians = (angle * Math.PI) / 180;
                        const x = 50 + Math.cos(radians) * 44;
                        const y = 50 + Math.sin(radians) * 44;

                        return (
                            <div
                                className="pointer-events-none absolute z-50 w-max max-w-[9rem] -translate-x-1/2 rounded-2xl bg-inverse-surface px-3 py-2 text-left text-xs font-bold text-inverse-on-surface shadow-2xl"
                                style={{
                                    left: `${x}%`,
                                    top: `${y}%`,
                                    transform: `translate(-50%, ${y > 50 ? '-115%' : '18%'})`,
                                }}
                            >
                                <span className="block truncate text-[0.7rem] uppercase tracking-wide opacity-70">{segment.label}</span>
                                <span className="block text-sm">{numberFormat(segment.value)} {totalLabel}</span>
                                <span className="block text-[0.7rem] opacity-70">{percent(segment.value, total)} of total</span>
                            </div>
                        );
                    })()}

                    <div className="pointer-events-none absolute inset-5 z-10 flex flex-col items-center justify-center rounded-full bg-surface-container-lowest text-center dark:bg-stone-900">
                        <span className="font-headline text-2xl font-extrabold text-on-surface dark:text-white">{compactNumber(total)}</span>
                        <span className="text-xs font-semibold text-on-surface-variant dark:text-stone-500">{totalLabel}</span>
                    </div>
                </div>
                <div className="flex w-full flex-wrap justify-center gap-2">
                    {(segments.length ? segments : [{ label: 'No data yet', value: 0, color: CHART_COLORS[0] }]).map((item, index) => (
                        <span
                            key={`${item.label}-${index}`}
                            className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-surface-container-lowest px-2.5 py-1 text-[0.7rem] font-bold text-on-surface-variant dark:bg-stone-800 dark:text-stone-300"
                            title={`${item.label}: ${numberFormat(item.value)} (${percent(item.value, total)})`}
                        >
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="max-w-[7.5rem] truncate">{item.label}</span>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

function TrendBars({ title, items = [], tone = '#b7102a' }) {
    const max = Math.max(1, ...items.map((item) => Number(item.value || 0)));
    const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0);
    const shown = items.slice(-14);

    return (
        <div className="rounded-[1.5rem] bg-surface-container-low p-4 dark:bg-stone-950/40">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="font-headline text-sm font-bold text-on-surface dark:text-white">{title}</h3>
                <span className="text-xs font-bold text-on-surface-variant dark:text-stone-400">{compactNumber(total)} total</span>
            </div>
            <div className="flex h-36 items-end gap-1.5">
                {shown.map((item) => (
                    <div key={item.date} className="group relative flex flex-1 flex-col items-center justify-end">
                        <div
                            className="w-full rounded-t-full opacity-85 transition-all duration-300 group-hover:opacity-100"
                            style={{
                                height: `${Math.max(8, (Number(item.value || 0) / max) * 100)}%`,
                                background: `linear-gradient(180deg, ${tone}, color-mix(in srgb, ${tone} 35%, transparent))`,
                            }}
                        />
                        <div className="pointer-events-none absolute bottom-full mb-2 hidden rounded-xl bg-inverse-surface px-2 py-1 text-xs font-bold text-inverse-on-surface shadow-lg group-hover:block">
                            {item.label}: {numberFormat(item.value)}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-3 flex justify-between text-[0.7rem] font-semibold text-on-surface-variant/70 dark:text-stone-600">
                <span>{shown[0]?.label || '-'}</span>
                <span>{shown.at(-1)?.label || '-'}</span>
            </div>
        </div>
    );
}

function HorizontalBreakdown({ items = [], valueKey = 'value' }) {
    const max = Math.max(1, ...items.map((item) => Number(item[valueKey] || 0)));

    if (!items.length) {
        return <EmptyInline message="No breakdown data yet" />;
    }

    return (
        <div className="space-y-3">
            {items.map((item, index) => (
                <div key={`${item.label}-${index}`}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                        <span className="truncate font-semibold text-on-surface dark:text-white">{item.label}</span>
                        <span className="font-bold text-on-surface-variant dark:text-stone-400">{compactNumber(item[valueKey])}</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-container dark:bg-stone-800">
                        <div
                            className="h-2 rounded-full"
                            style={{
                                width: `${Math.max(3, (Number(item[valueKey] || 0) / max) * 100)}%`,
                                backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                            }}
                        />
                    </div>
                    {item.story_count !== undefined && (
                        <p className="mt-1 text-xs text-on-surface-variant/70 dark:text-stone-500">{numberFormat(item.story_count)} stories</p>
                    )}
                </div>
            ))}
        </div>
    );
}

function TopPages({ items = [] }) {
    if (!items.length) {
        return <EmptyInline message="No story views yet" />;
    }

    const max = Math.max(1, ...items.map((item) => Number(item.view_count || 0)));

    return (
        /* FIX: added w-full to ensure the container never exceeds its parent grid cell on mobile */
        <div className="min-w-0 w-full space-y-3 overflow-hidden">
            {items.map((item, index) => (
                <div key={item.id} className="max-w-full overflow-hidden rounded-[1.35rem] border border-outline-variant/10 bg-surface-container-low p-3 dark:border-stone-700/40 dark:bg-stone-950/40">
                    <div className="flex min-w-0 items-start gap-3 sm:items-center">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] bg-[linear-gradient(135deg,rgba(183,16,42,0.12),rgba(0,102,108,0.14))] text-primary dark:text-red-300">
                            {item.cover_image_url ? (
                                <img src={item.cover_image_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <span className="material-symbols-outlined text-[1.2rem]">auto_stories</span>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                                <span className="shrink-0 text-xs font-black text-primary dark:text-red-300">#{index + 1}</span>
                                <Link to={`/story/${item.slug}`} className="block min-w-0 flex-1 truncate font-headline text-sm font-bold text-on-surface transition-colors hover:text-primary dark:text-white dark:hover:text-red-300">
                                    {item.title}
                                </Link>
                            </div>
                            <p className="max-w-full truncate text-xs text-on-surface-variant dark:text-stone-500">
                                {item.creator_name || 'Unknown creator'} - {item.occasion_name || 'No occasion'} - {item.theme_name || 'No theme'}
                            </p>
                            {Number(item.period_views || 0) > 0 && (
                                <p className="mt-0.5 text-[0.7rem] font-bold text-tertiary dark:text-tertiary-fixed">
                                    {compactNumber(item.period_views)} hits in selected period
                                </p>
                            )}
                            <div className="mt-2 flex items-baseline gap-1 sm:hidden">
                                <p className="font-headline text-lg font-extrabold text-on-surface dark:text-white">{compactNumber(item.view_count)}</p>
                                <p className="text-[0.68rem] font-bold uppercase tracking-wide text-on-surface-variant/70 dark:text-stone-500">views</p>
                            </div>
                        </div>
                        <div className="hidden shrink-0 text-right sm:block">
                            <p className="font-headline text-lg font-extrabold text-on-surface dark:text-white">{compactNumber(item.view_count)}</p>
                            <p className="text-[0.68rem] font-bold uppercase tracking-wide text-on-surface-variant/70 dark:text-stone-500">views</p>
                        </div>
                    </div>
                    <div className="mt-3 h-2 max-w-full overflow-hidden rounded-full bg-surface-container-high dark:bg-stone-800">
                        <div
                            className="h-2 rounded-full bg-gradient-to-r from-primary to-tertiary"
                            style={{ width: `${Math.max(4, (Number(item.view_count || 0) / max) * 100)}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

function TopUsers({ items = [] }) {
    if (!items.length) {
        return <EmptyInline message="No creator view data yet" />;
    }

    const max = Math.max(1, ...items.map((item) => Number(item.total_views || 0)));

    return (
        /* FIX: added overflow-hidden w-full so flex children can't push the container wider than its grid cell on mobile */
        <div className="space-y-3 overflow-hidden w-full">
            {items.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3 rounded-[1.35rem] bg-surface-container-low p-3 dark:bg-stone-950/40">
                    <img
                        src={item.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'U')}&background=b7102a&color=fff&size=96`}
                        alt=""
                        className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/10 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-headline text-sm font-bold text-on-surface dark:text-white">{item.name}</p>
                                <p className="truncate text-xs text-on-surface-variant dark:text-stone-500">{titleCase(item.role)} - {numberFormat(item.story_count)} stories</p>
                            </div>
                            <p className="shrink-0 font-headline text-lg font-extrabold text-on-surface dark:text-white">{compactNumber(item.total_views)}</p>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-surface-container-high dark:bg-stone-800">
                            <div
                                className="h-1.5 rounded-full"
                                style={{
                                    width: `${Math.max(4, (Number(item.total_views || 0) / max) * 100)}%`,
                                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                                }}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ActivityTimeline({ items = [] }) {
    if (!items.length) {
        return <EmptyInline message="No recent activity yet" />;
    }

    return (
        <div className="space-y-3">
            {items.map((item) => {
                const key = String(item.activity || '').split('_')[0].toLowerCase();
                const style = ACTION_STYLES[key] || ACTION_STYLES.logout;

                return (
                    <div key={item.id} className="flex gap-3 rounded-[1.35rem] bg-surface-container-low p-3 dark:bg-stone-950/40">
                        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest text-primary dark:bg-stone-800 dark:text-red-300">
                            <span className="material-symbols-outlined text-[1rem]">history</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${style}`}>{item.activity || 'activity'}</span>
                                <span className="text-xs font-semibold text-on-surface-variant dark:text-stone-500">{formatDateTime(item.created_at)}</span>
                            </div>
                            <p className="text-sm font-semibold text-on-surface dark:text-white">{item.performed_by_name || 'Guest'}</p>
                            <p className="truncate text-xs text-on-surface-variant dark:text-stone-500">
                                {item.module || 'system'} {item.table_name ? `- ${item.table_name}` : ''} {item.log_note ? `- ${item.log_note}` : ''}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function EmptyInline({ message }) {
    return (
        <div className="flex min-h-32 flex-col items-center justify-center rounded-[1.5rem] bg-surface-container-low p-6 text-center dark:bg-stone-950/40">
            <span className="material-symbols-outlined mb-2 text-on-surface-variant/60">insights</span>
            <p className="text-sm font-semibold text-on-surface-variant dark:text-stone-400">{message}</p>
        </div>
    );
}

function LoadingShell() {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-40 animate-pulse rounded-[1.75rem] bg-surface-container dark:bg-stone-900" />
            ))}
        </div>
    );
}

export default function Analytics() {
    const dispatch = useDispatch();
    const { data, loading, error, fetchedAt } = useSelector((state) => state.analytics);
    const [days, setDays] = useState(30);

    useEffect(() => {
        dispatch(fetchAnalytics({ days }));
    }, [days, dispatch]);

    const summary = data?.summary || {};
    const topPage = data?.top?.pages?.[0];
    const topCreator = data?.top?.users_by_views?.[0];
    const updatedAt = fetchedAt ? formatDateTime(fetchedAt) : null;

    const stats = useMemo(() => ([
        {
            label: 'Total Views',
            value: compactNumber(summary.total_views),
            icon: 'visibility',
            tone: 'primary',
            subtext: `${compactNumber(summary.average_views_per_story)} average views per story`,
        },
        {
            label: 'Published Stories',
            value: numberFormat(summary.published_stories),
            icon: 'auto_stories',
            tone: 'teal',
            subtext: `${numberFormat(summary.hidden_stories)} hidden stories`,
        },
        {
            label: 'Total Users',
            value: numberFormat(summary.total_users),
            icon: 'group',
            tone: 'amber',
            subtext: `${numberFormat(summary.active_users)} active accounts`,
        },
        {
            label: 'Activity Today',
            value: numberFormat(summary.activity_today),
            icon: 'bolt',
            tone: 'neutral',
            subtext: `${numberFormat(summary.logins_last_7_days)} logins in last 7 days`,
        },
    ]), [summary]);

    const refresh = () => dispatch(fetchAnalytics({ days, force: true }));

    return (
        <div className="w-full max-w-[92rem] mx-auto p-6 md:p-8 lg:px-12">
            <div className="mb-8 overflow-hidden rounded-[2.5rem] border border-outline-variant/10 bg-[radial-gradient(circle_at_top_left,rgba(183,16,42,0.16),transparent_32%),linear-gradient(135deg,var(--surface-container-lowest),var(--surface-container-low))] p-6 shadow-[0_40px_100px_-55px_rgba(183,16,42,0.45)] dark:border-stone-700/30 dark:bg-[radial-gradient(circle_at_top_left,rgba(248,113,113,0.18),transparent_32%),linear-gradient(135deg,#1c1717,#100e0e)] md:p-8">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                    <div>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-primary dark:bg-red-400/10 dark:text-red-300">
                            <span className="material-symbols-outlined text-[1rem]">monitoring</span>
                            Live platform intelligence
                        </div>
                        <h1 className="font-headline text-4xl font-black tracking-tighter text-on-surface dark:text-white md:text-5xl">
                            Analytics Command Center
                        </h1>
                        <p className="mt-3 max-w-3xl text-base leading-relaxed text-on-surface-variant dark:text-stone-400">
                            Track page hits, top creators, story performance, user health, and operational activity from one professional dashboard.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <select
                            value={days}
                            onChange={(event) => setDays(Number(event.target.value))}
                            className="rounded-full border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface outline-none transition-colors focus:border-primary dark:border-stone-700 dark:bg-stone-900 dark:text-white"
                        >
                            <option value={7}>Last 7 days</option>
                            <option value={30}>Last 30 days</option>
                            <option value={90}>Last 90 days</option>
                        </select>
                        <button
                            onClick={refresh}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-container px-5 py-3 text-sm font-black text-on-primary shadow-[0_14px_40px_-18px_rgba(183,16,42,0.65)] transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <span className={`material-symbols-outlined text-[1rem] ${loading ? 'animate-spin' : ''}`}>sync</span>
                            Refresh
                        </button>
                    </div>
                </div>
                {updatedAt && (
                    <p className="mt-5 text-xs font-semibold text-on-surface-variant/70 dark:text-stone-500">
                        Last refreshed {updatedAt}. Data is cached briefly to keep the dashboard fast.
                    </p>
                )}
            </div>

            {error && (
                <div className="mb-6 rounded-[1.5rem] border border-error/20 bg-error-container/30 px-5 py-4 text-sm font-semibold text-error dark:bg-red-950/40 dark:text-red-300">
                    {error}
                </div>
            )}

            {loading && !data ? (
                <LoadingShell />
            ) : (
                <>
                    <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {stats.map((item) => <StatCard key={item.label} {...item} />)}
                    </div>

                    <div className="mb-8 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
                        <Panel title="Top Performing Highlights" subtitle="The quickest read on who and what is winning." icon="workspace_premium">
                            <div className="grid gap-4 lg:grid-cols-2">
                                <div className="rounded-[1.5rem] bg-surface-container-low p-5 dark:bg-stone-950/40">
                                    <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-primary dark:text-red-300">Highest viewed page</p>
                                    {topPage ? (
                                        <>
                                            <Link to={`/story/${topPage.slug}`} className="font-headline text-2xl font-black tracking-tight text-on-surface transition-colors hover:text-primary dark:text-white dark:hover:text-red-300">
                                                {topPage.title}
                                            </Link>
                                            <p className="mt-2 text-sm text-on-surface-variant dark:text-stone-400">{topPage.occasion_name || 'No occasion'} - {topPage.theme_name || 'No theme'}</p>
                                            <p className="mt-5 font-headline text-4xl font-black text-primary dark:text-red-300">{compactNumber(topPage.view_count)}</p>
                                            <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant/70 dark:text-stone-500">page hits</p>
                                        </>
                                    ) : (
                                        <EmptyInline message="No viewed page yet" />
                                    )}
                                </div>
                                <div className="rounded-[1.5rem] bg-surface-container-low p-5 dark:bg-stone-950/40">
                                    <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-tertiary dark:text-tertiary-fixed">Top creator by views</p>
                                    {topCreator ? (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={topCreator.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(topCreator.name || 'U')}&background=00666c&color=fff&size=96`}
                                                    alt=""
                                                    className="h-14 w-14 rounded-full object-cover ring-4 ring-tertiary/10"
                                                />
                                                <div className="min-w-0">
                                                    <p className="truncate font-headline text-xl font-black text-on-surface dark:text-white">{topCreator.name}</p>
                                                    <p className="text-sm text-on-surface-variant dark:text-stone-400">{numberFormat(topCreator.story_count)} stories</p>
                                                </div>
                                            </div>
                                            <p className="mt-5 font-headline text-4xl font-black text-tertiary dark:text-tertiary-fixed">{compactNumber(topCreator.total_views)}</p>
                                            <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant/70 dark:text-stone-500">total story views</p>
                                        </>
                                    ) : (
                                        <EmptyInline message="No creator views yet" />
                                    )}
                                </div>
                            </div>
                        </Panel>

                        <Panel title="Inventory Snapshot" subtitle="Content and setup coverage." icon="inventory_2">
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    ['Themes', summary.themes, 'palette'],
                                    ['Occasions', summary.occasion_types, 'event_note'],
                                    ['Logs', summary.activity_logs, 'history'],
                                    ['Recorded Hits', summary.page_views_recorded, 'ads_click'],
                                ].map(([label, value, icon]) => (
                                    <div key={label} className="rounded-[1.35rem] bg-surface-container-low p-4 dark:bg-stone-950/40">
                                        <span className="material-symbols-outlined mb-3 text-primary dark:text-red-300">{icon}</span>
                                        <p className="font-headline text-2xl font-black text-on-surface dark:text-white">{numberFormat(value)}</p>
                                        <p className="text-xs font-bold text-on-surface-variant dark:text-stone-500">{label}</p>
                                    </div>
                                ))}
                            </div>
                        </Panel>
                    </div>

                    <div className="mb-8 grid gap-4 xl:grid-cols-2">
                        <Panel title="Pie Chart Details" subtitle="Account and story composition." icon="pie_chart">
                            <div className="grid gap-4 lg:grid-cols-2">
                                <DonutChart title="User Status" items={data?.breakdowns?.users_by_status || []} totalLabel="users" />
                                <DonutChart title="Story Status" items={data?.breakdowns?.stories_by_status || []} totalLabel="stories" />
                            </div>
                        </Panel>
                        <Panel title="Role Distribution" subtitle="Who is using the platform." icon="groups">
                            <HorizontalBreakdown items={data?.breakdowns?.users_by_role || []} />
                        </Panel>
                    </div>

                    <div className="mb-8 grid gap-4 xl:grid-cols-3">
                        <Panel title="Page Hits Trend" subtitle={`Recorded counted story page hits in the last ${days} days.`} icon="show_chart">
                            <TrendBars title="Story views" items={data?.trends?.story_views || []} tone="#b7102a" />
                        </Panel>
                        <Panel title="Story Creation Trend" subtitle="New stories by day." icon="auto_graph">
                            <TrendBars title="Stories created" items={data?.trends?.stories_created || []} tone="#00666c" />
                        </Panel>
                        <Panel title="Activity Trend" subtitle="Operational activity volume." icon="query_stats">
                            <TrendBars title="Activity logs" items={data?.trends?.activity || []} tone="#d6a340" />
                        </Panel>
                    </div>

                    {/* FIX: added min-w-0 to both grid children so they respect the grid cell boundary on mobile */}
                    <div className="mb-8 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                        <div className="min-w-0">
                            <Panel title="Top Pages By Hits" subtitle="Published story pages ranked by total view count." icon="leaderboard">
                                <TopPages items={data?.top?.pages || []} />
                            </Panel>
                        </div>
                        <div className="min-w-0">
                            <Panel title="Top Users By Total Views" subtitle="Creators whose stories generated the most traffic." icon="military_tech">
                                <TopUsers items={data?.top?.users_by_views || []} />
                            </Panel>
                        </div>
                    </div>

                    <div className="mb-8 grid gap-4 xl:grid-cols-2">
                        <Panel title="Views By Theme" subtitle="Which visual styles are attracting attention." icon="palette">
                            <HorizontalBreakdown items={data?.breakdowns?.views_by_theme || []} />
                        </Panel>
                        <Panel title="Views By Occasion" subtitle="Which occasion pages are performing best." icon="celebration">
                            <HorizontalBreakdown items={data?.breakdowns?.views_by_occasion || []} />
                        </Panel>
                    </div>

                    {/* FIX: added min-w-0 to both grid children so DonutChart tooltips don't push the grid cell wider on mobile */}
                    <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
                        <div className="min-w-0">
                            <Panel title="Activity Mix" subtitle="Modules and actions during this period." icon="donut_large">
                                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                                    <DonutChart title="By Module" items={data?.breakdowns?.activity_by_module || []} totalLabel="events" />
                                    <DonutChart title="By Action" items={data?.breakdowns?.activity_by_action || []} totalLabel="events" />
                                </div>
                            </Panel>
                        </div>
                        <div className="min-w-0">
                            <Panel
                                title="Recent Activity"
                                subtitle="Latest operational events from the audit log."
                                icon="history"
                                action={<Link to="/dashboard/activity-logs" className="rounded-full bg-surface-container px-3 py-1.5 text-xs font-black text-on-surface-variant transition-colors hover:bg-primary hover:text-on-primary dark:bg-stone-800 dark:text-stone-300">View all</Link>}
                            >
                                <ActivityTimeline items={data?.recent_activity || []} />
                            </Panel>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}