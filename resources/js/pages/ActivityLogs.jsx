import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchActivityLogs } from '../store/slices/activityLogsSlice';

const ACTION_COLORS = {
    login:   'bg-tertiary-fixed/20 text-tertiary dark:text-tertiary-fixed',
    logout:  'bg-surface-container dark:bg-stone-800 text-on-surface-variant',
    create:  'bg-primary/10 text-primary dark:text-red-400',
    update:  'bg-secondary/10 text-secondary dark:text-red-300',
    delete:  'bg-error-container/40 text-error dark:text-red-400',
};

function ActivityBadge({ activity }) {
    const key = activity?.split('_')[0]?.toLowerCase();
    const cls = ACTION_COLORS[key] || ACTION_COLORS.logout;
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold font-label ${cls}`}>
            {activity || '—'}
        </span>
    );
}

function formatDate(dt) {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
}

export default function ActivityLogs() {
    const dispatch = useDispatch();
    const { items, pagination, loading, error } = useSelector(s => s.activityLogs);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        dispatch(fetchActivityLogs({ search, page, per_page: 20 }));
    }, [dispatch, page]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        dispatch(fetchActivityLogs({ search, page: 1, per_page: 20 }));
    };

    return (
        <div className="p-6 md:p-8 lg:px-12 max-w-7xl mx-auto w-full">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-5">
                <div>
                    <h1 className="font-headline text-4xl font-extrabold text-on-surface dark:text-white tracking-tighter mb-3">
                        Activity Logs
                    </h1>
                    <p className="text-on-surface-variant dark:text-stone-400 text-base leading-relaxed font-body">
                        A full audit trail of actions performed across the platform.
                    </p>
                </div>
                {pagination && (
                    <div className="shrink-0 py-2 px-4 rounded-full bg-surface-container dark:bg-stone-800 text-on-surface-variant dark:text-stone-400 text-sm font-semibold font-body">
                        {pagination.total} total
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 bg-error-container/30 border border-error/20 rounded-2xl px-4 py-3 text-sm text-error dark:text-red-400 mb-5">
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>error</span>
                    {error}
                </div>
            )}

            {/* Search */}
            <form onSubmit={handleSearch} className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-surface-container-lowest dark:bg-stone-900 border border-outline-variant/20 dark:border-stone-700/50 rounded-full px-4 py-2.5">
                    <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '1rem' }}>search</span>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search activity, module, user…"
                        className="flex-1 bg-transparent text-sm text-on-surface dark:text-white placeholder-on-surface-variant/50 outline-none font-body"
                    />
                </div>
                <button
                    type="submit"
                    className="py-2.5 px-5 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary text-sm font-bold font-headline hover:scale-[1.02] active:scale-98 transition-all"
                >
                    Search
                </button>
            </form>

            {/* Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <span className="w-10 h-10 rounded-full animate-spin" style={{ borderWidth: '3px', border: '3px solid rgba(183,16,42,0.15)', borderTopColor: '#b7102a' }} />
                    <p className="text-on-surface-variant font-body text-sm">Loading activity logs…</p>
                </div>
            ) : (
                <div className="bg-surface-container-lowest dark:bg-stone-900 rounded-[2rem] p-6 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.04)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] border border-outline-variant/10 dark:border-stone-700/30">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-on-surface-variant dark:text-stone-400 font-headline text-xs uppercase tracking-wider border-b border-outline-variant/20 dark:border-stone-700">
                                    <th className="pb-4 font-semibold w-12 px-3">ID</th>
                                    <th className="pb-4 font-semibold px-3">Performed By</th>
                                    <th className="pb-4 font-semibold px-3">Activity</th>
                                    <th className="pb-4 font-semibold px-3 hidden md:table-cell">Module</th>
                                    <th className="pb-4 font-semibold px-3 hidden lg:table-cell">Note</th>
                                    <th className="pb-4 font-semibold px-3 text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody className="text-on-surface dark:text-white font-body divide-y divide-outline-variant/10 dark:divide-stone-700/50">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-on-surface-variant dark:text-stone-400 text-sm">
                                            No activity logs found
                                        </td>
                                    </tr>
                                ) : items.map((log, idx) => (
                                    <tr key={log.id} className="group hover:bg-surface-container-low/50 dark:hover:bg-stone-800/50 transition-colors duration-300">
                                        <td className="py-4 px-3 text-sm text-on-surface-variant dark:text-stone-500">
                                            {String(idx + 1 + (page - 1) * 20).padStart(2, '0')}
                                        </td>
                                        <td className="py-4 px-3">
                                            <div>
                                                <p className="font-headline font-semibold text-sm text-on-surface dark:text-white leading-none">
                                                    {log.performed_by_name || `User #${log.performed_by}`}
                                                </p>
                                                <p className="text-xs text-on-surface-variant dark:text-stone-500 mt-0.5 capitalize">
                                                    {log.performed_by_role || '—'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-3">
                                            <ActivityBadge activity={log.activity} />
                                        </td>
                                        <td className="py-4 px-3 hidden md:table-cell text-sm text-on-surface-variant dark:text-stone-400">
                                            <span className="capitalize">{log.module || '—'}</span>
                                            {log.table_name && log.table_name !== log.module && (
                                                <span className="ml-1 text-xs text-on-surface-variant/50 dark:text-stone-600">({log.table_name})</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-3 hidden lg:table-cell text-sm text-on-surface-variant dark:text-stone-400 truncate max-w-xs">
                                            {log.log_note || <span className="italic text-on-surface-variant/40 dark:text-stone-600">—</span>}
                                        </td>
                                        <td className="py-4 px-3 text-sm text-on-surface-variant dark:text-stone-400 text-right whitespace-nowrap">
                                            {formatDate(log.created_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.last_page > 1 && (
                        <div className="mt-5 flex items-center justify-between border-t border-outline-variant/15 dark:border-stone-700/50 pt-5">
                            <span className="text-sm text-on-surface-variant dark:text-stone-400 font-body">
                                Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className="px-4 py-2 rounded-full text-sm font-medium text-on-surface-variant dark:text-stone-400 hover:bg-surface-variant dark:hover:bg-stone-800 hover:text-on-surface dark:hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-label"
                                >
                                    Previous
                                </button>
                                {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                                    const p = i + 1;
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors font-label ${
                                                page === p
                                                    ? 'bg-primary-container text-on-primary-container dark:bg-primary dark:text-on-primary'
                                                    : 'text-on-surface-variant dark:text-stone-400 hover:bg-surface-variant dark:hover:bg-stone-800 hover:text-on-surface dark:hover:text-white'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                                <button
                                    disabled={page >= pagination.last_page}
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-4 py-2 rounded-full text-sm font-medium text-on-surface-variant dark:text-stone-400 hover:bg-surface-variant dark:hover:bg-stone-800 hover:text-on-surface dark:hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-label"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
