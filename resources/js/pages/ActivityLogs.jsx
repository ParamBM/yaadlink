import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchActivityLogs } from '../store/slices/activityLogsSlice';

const ACTION_COLORS = {
    login: 'bg-tertiary-fixed/20 text-tertiary dark:text-tertiary-fixed',
    logout: 'bg-surface-container dark:bg-stone-800 text-on-surface-variant',
    create: 'bg-primary/10 text-primary dark:bg-red-400',
    update: 'bg-secondary/10 text-secondary dark:bg-red-300',
    delete: 'bg-error-container/40 text-error dark:text-red-400',
};

function ActivityBadge({ activity }) {
    const key = activity?.split('_')[0]?.toLowerCase();
    const cls = ACTION_COLORS[key] || ACTION_COLORS.logout;

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold font-label ${cls}`}>
            {activity || '-'}
        </span>
    );
}

function formatDate(value) {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

export default function ActivityLogs() {
    const dispatch = useDispatch();
    const { items, pagination, loading, error } = useSelector((state) => state.activityLogs);
    const [search, setSearch] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        dispatch(fetchActivityLogs({ search: appliedSearch, page, per_page: 20 }));
    }, [appliedSearch, dispatch, page]);

    const handleSearch = (event) => {
        event.preventDefault();
        setPage(1);
        setAppliedSearch(search);
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-6 md:p-8 lg:px-12">
            <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                <div className="text-center md:text-left">
                    <h1 className="mb-3 font-headline text-4xl font-extrabold tracking-tighter text-on-surface dark:text-white">
                        Activity Logs
                    </h1>
                    <p className="font-body text-base leading-relaxed text-on-surface-variant dark:text-stone-400">
                        A full audit trail of actions performed across the platform.
                    </p>
                </div>
                {pagination && (
                    <div className="shrink-0 rounded-full bg-surface-container px-4 py-2 text-sm font-semibold font-body text-on-surface-variant dark:bg-stone-800 dark:text-stone-400">
                        {pagination.total} total
                    </div>
                )}
            </div>

            {error && (
                <div className="mb-5 flex items-center gap-2 rounded-2xl border border-error/20 bg-error-container/30 px-4 py-3 text-sm text-error dark:text-red-400">
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>error</span>
                    {error}
                </div>
            )}

            <form onSubmit={handleSearch} className="mb-5 flex items-center gap-3">
                <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest px-4 py-2.5 dark:border-stone-700/50 dark:bg-stone-900">
                    <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '1rem' }}>search</span>
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search activity, module, user..."
                        className="flex-1 bg-transparent text-sm font-body text-on-surface outline-none placeholder-on-surface-variant/50 dark:text-white"
                    />
                </div>
                <button
                    type="submit"
                    className="rounded-full bg-gradient-to-r from-primary to-primary-container px-5 py-2.5 text-sm font-bold font-headline text-on-primary transition-all hover:scale-[1.02] active:scale-95"
                >
                    Search
                </button>
            </form>

            {loading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-20">
                    <span className="h-10 w-10 animate-spin rounded-full" style={{ borderWidth: '3px', border: '3px solid rgba(183,16,42,0.15)', borderTopColor: '#b7102a' }} />
                    <p className="text-sm font-body text-on-surface-variant">Loading activity logs...</p>
                </div>
            ) : (
                <div className="rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.04)] dark:border-stone-700/30 dark:bg-stone-900 dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]">
                    <div className="overflow-x-auto">
                        <table className="min-w-[860px] w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-outline-variant/20 text-xs uppercase tracking-wider text-on-surface-variant dark:border-stone-700 dark:text-stone-400">
                                    <th className="w-12 px-3 pb-4 font-semibold">ID</th>
                                    <th className="px-3 pb-4 font-semibold">Performed By</th>
                                    <th className="px-3 pb-4 font-semibold">Activity</th>
                                    <th className="px-3 pb-4 font-semibold">Module</th>
                                    <th className="px-3 pb-4 font-semibold">Note</th>
                                    <th className="px-3 pb-4 text-right font-semibold">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10 font-body text-on-surface dark:divide-stone-700/50 dark:text-white">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-sm text-on-surface-variant dark:text-stone-400">
                                            No activity logs found
                                        </td>
                                    </tr>
                                ) : items.map((log, index) => (
                                    <tr key={log.id} className="group transition-colors duration-300 hover:bg-surface-container-low/50 dark:hover:bg-stone-800/50">
                                        <td className="px-3 py-4 text-sm text-on-surface-variant dark:text-stone-500">
                                            {String(index + 1 + (page - 1) * 20).padStart(2, '0')}
                                        </td>
                                        <td className="px-3 py-4">
                                            <div>
                                                <p className="text-sm font-semibold font-headline leading-none text-on-surface dark:text-white">
                                                    {log.performed_by_name || `User #${log.performed_by}`}
                                                </p>
                                                <p className="mt-0.5 text-xs capitalize text-on-surface-variant dark:text-stone-500">
                                                    {log.performed_by_role || '-'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4">
                                            <ActivityBadge activity={log.activity} />
                                        </td>
                                        <td className="px-3 py-4 text-sm text-on-surface-variant dark:text-stone-400">
                                            <span className="whitespace-nowrap capitalize">{log.module || '-'}</span>
                                            {log.table_name && log.table_name !== log.module && (
                                                <span className="ml-1 text-xs text-on-surface-variant/50 dark:text-stone-600">({log.table_name})</span>
                                            )}
                                        </td>
                                        <td className="min-w-[17rem] max-w-[22rem] px-3 py-4 text-sm text-on-surface-variant dark:text-stone-400">
                                            <div className="truncate">
                                                {log.log_note || <span className="italic text-on-surface-variant/40 dark:text-stone-600">-</span>}
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-on-surface-variant dark:text-stone-400">
                                            {formatDate(log.created_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {pagination && pagination.last_page > 1 && (
                        <div className="mt-5 flex items-center justify-between border-t border-outline-variant/15 pt-5 dark:border-stone-700/50">
                            <span className="text-sm font-body text-on-surface-variant dark:text-stone-400">
                                Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, pagination.total)} of {pagination.total}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={page <= 1}
                                    onClick={() => setPage((current) => current - 1)}
                                    className="rounded-full px-4 py-2 text-sm font-medium font-label text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-40 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white"
                                >
                                    Previous
                                </button>
                                {Array.from({ length: Math.min(5, pagination.last_page) }, (_, index) => {
                                    const currentPage = index + 1;

                                    return (
                                        <button
                                            key={currentPage}
                                            onClick={() => setPage(currentPage)}
                                            className={`rounded-full px-4 py-2 text-sm font-medium font-label transition-colors ${
                                                page === currentPage
                                                    ? 'bg-primary-container text-on-primary-container dark:bg-primary dark:text-on-primary'
                                                    : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white'
                                            }`}
                                        >
                                            {currentPage}
                                        </button>
                                    );
                                })}
                                <button
                                    disabled={page >= pagination.last_page}
                                    onClick={() => setPage((current) => current + 1)}
                                    className="rounded-full px-4 py-2 text-sm font-medium font-label text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-40 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white"
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
