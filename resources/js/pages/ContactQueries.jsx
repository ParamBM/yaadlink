import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    deleteContactQuery,
    fetchContactQueries,
    updateContactQuery,
} from '../store/slices/contactQueriesSlice';

const STATUS_OPTIONS = ['new', 'read', 'resolved', 'archived'];

const STATUS_STYLES = {
    new: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-red-300',
    read: 'bg-secondary-fixed/35 text-on-secondary-fixed dark:bg-secondary/15 dark:text-secondary-fixed',
    resolved: 'bg-tertiary-fixed/35 text-on-tertiary-fixed dark:bg-tertiary/15 dark:text-tertiary-fixed',
    archived: 'bg-surface-container-high text-on-surface-variant dark:bg-stone-800 dark:text-stone-300',
};

function humanize(value) {
    return String(value || '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value) {
    if (!value) {
        return 'Not set';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function formatError(error) {
    if (!error) {
        return '';
    }

    if (typeof error === 'string') {
        return error;
    }

    if (typeof error?.error === 'string') {
        return error.error;
    }

    return Object.entries(error)
        .map(([field, messages]) => `${humanize(field)}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
        .join(' ');
}

function StatusBadge({ status }) {
    const normalized = String(status || 'new').toLowerCase();
    const classes = STATUS_STYLES[normalized] || STATUS_STYLES.archived;

    return (
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>
            {humanize(normalized)}
        </span>
    );
}

function QueryDetail({ query, updating, onClose, onSave, onDelete }) {
    const [status, setStatus] = useState(query?.status || 'new');
    const [adminNote, setAdminNote] = useState(query?.admin_note || '');

    useEffect(() => {
        setStatus(query?.status || 'new');
        setAdminNote(query?.admin_note || '');
    }, [query]);

    if (!query) {
        return (
            <aside className="hidden min-h-[30rem] rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-lowest p-6 dark:border-stone-800 dark:bg-stone-900 lg:block">
                <div className="flex h-full flex-col items-center justify-center text-center text-on-surface-variant dark:text-stone-400">
                    <span className="material-symbols-outlined text-4xl">contact_mail</span>
                    <p className="mt-3 text-sm font-semibold">Select a query to review it.</p>
                </div>
            </aside>
        );
    }

    return (
        <aside className="rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-lowest p-5 dark:border-stone-800 dark:bg-stone-900 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant dark:text-stone-400">
                        Query Details
                    </p>
                    <h2 className="mt-2 truncate font-headline text-xl font-black text-on-surface dark:text-white">
                        {query.subject || 'No subject'}
                    </h2>
                </div>
                <button onClick={onClose} className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container dark:hover:bg-stone-800 lg:hidden" aria-label="Close details">
                    <span className="material-symbols-outlined text-[1.1rem]">close</span>
                </button>
            </div>

            <div className="mt-5 grid gap-3 text-sm">
                <div className="rounded-2xl bg-surface-container px-4 py-3 dark:bg-stone-800">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant dark:text-stone-400">Name</p>
                    <p className="mt-1 font-semibold text-on-surface dark:text-white">{query.name || 'Not provided'}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <a className="rounded-2xl bg-surface-container px-4 py-3 transition-colors hover:bg-surface-container-high dark:bg-stone-800 dark:hover:bg-stone-700" href={`tel:${query.phone}`}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant dark:text-stone-400">Phone</p>
                        <p className="mt-1 font-semibold text-primary dark:text-red-300">{query.phone}</p>
                    </a>
                    <a className="rounded-2xl bg-surface-container px-4 py-3 transition-colors hover:bg-surface-container-high dark:bg-stone-800 dark:hover:bg-stone-700" href={query.email ? `mailto:${query.email}` : undefined}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant dark:text-stone-400">Email</p>
                        <p className="mt-1 truncate font-semibold text-on-surface dark:text-white">{query.email || 'Not provided'}</p>
                    </a>
                </div>
                <div className="rounded-2xl bg-surface-container px-4 py-3 dark:bg-stone-800">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant dark:text-stone-400">Message</p>
                    <p className="mt-2 whitespace-pre-wrap text-on-surface-variant dark:text-stone-300">{query.message || 'No message provided.'}</p>
                </div>
                <div className="rounded-2xl bg-surface-container px-4 py-3 dark:bg-stone-800">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant dark:text-stone-400">Submitted</p>
                    <p className="mt-1 font-semibold text-on-surface dark:text-white">{formatDate(query.created_at)}</p>
                </div>
            </div>

            <div className="mt-5 grid gap-4">
                <label className="flex flex-col gap-2">
                    <span className="font-label text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant dark:text-stone-400">Status</span>
                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        className="w-full rounded-2xl border border-outline-variant/25 bg-surface-container px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/45 dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                    >
                        {STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>{humanize(option)}</option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-2">
                    <span className="font-label text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant dark:text-stone-400">Admin Note</span>
                    <textarea
                        value={adminNote}
                        onChange={(event) => setAdminNote(event.target.value)}
                        rows={4}
                        className="w-full resize-none rounded-2xl border border-outline-variant/25 bg-surface-container px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/45 dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                        placeholder="Internal note"
                    />
                </label>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => onSave({ status, admin_note: adminNote.trim() || null })}
                        disabled={updating}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-container px-4 py-3 text-sm font-bold text-on-primary transition-all disabled:opacity-60"
                    >
                        {updating ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary" /> : <span className="material-symbols-outlined text-[1.1rem]">save</span>}
                        Save
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="rounded-full border border-error/25 px-4 py-3 text-sm font-bold text-error transition-colors hover:bg-error-container/25 dark:text-red-300"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </aside>
    );
}

export default function ContactQueries() {
    const dispatch = useDispatch();
    const { items, loading, updating, error, pagination } = useSelector((state) => state.contactQueries);

    const [filters, setFilters] = useState({ status: '', search: '' });
    const [selectedId, setSelectedId] = useState(null);

    const selected = useMemo(
        () => items.find((item) => String(item.id) === String(selectedId)) || null,
        [items, selectedId]
    );

    const counts = useMemo(() => ({
        total: pagination?.total ?? items.length,
        new: items.filter((item) => item.status === 'new').length,
        resolved: items.filter((item) => item.status === 'resolved').length,
    }), [items, pagination]);

    useEffect(() => {
        dispatch(fetchContactQueries({ ...filters, page: 1, per_page: 30 }));
    }, [dispatch, filters]);

    useEffect(() => {
        if (!selectedId && items.length > 0) {
            setSelectedId(items[0].id);
        }
    }, [items, selectedId]);

    const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

    const handleSave = async (payload) => {
        if (!selected) {
            return;
        }

        await dispatch(updateContactQuery({ id: selected.id, payload })).unwrap();
        dispatch(fetchContactQueries({ ...filters, page: 1, per_page: 30 }));
    };

    const handleDelete = async () => {
        if (!selected || !window.confirm('Delete this contact query?')) {
            return;
        }

        await dispatch(deleteContactQuery(selected.id)).unwrap();
        setSelectedId(null);
        dispatch(fetchContactQueries({ ...filters, page: 1, per_page: 30 }));
    };

    return (
        <div className="flex-1 px-5 py-6 md:px-8 lg:px-10">
            <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="font-label text-xs font-bold uppercase tracking-[0.22em] text-primary dark:text-red-400">
                        Dashboard
                    </p>
                    <h1 className="mt-2 font-headline text-3xl font-black text-on-surface dark:text-white">
                        Contact Queries
                    </h1>
                    <p className="mt-2 text-sm text-on-surface-variant dark:text-stone-400">
                        Review submitted phone and email queries from the public contact form.
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    {[
                        ['Total', counts.total, 'contact_mail'],
                        ['New', counts.new, 'mark_email_unread'],
                        ['Resolved', counts.resolved, 'task_alt'],
                    ].map(([label, value, icon]) => (
                        <div key={label} className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 dark:border-stone-800 dark:bg-stone-900">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary dark:text-red-400">{icon}</span>
                                <div>
                                    <p className="text-xs font-semibold text-on-surface-variant dark:text-stone-400">{label}</p>
                                    <p className="font-headline text-xl font-black text-on-surface dark:text-white">{value}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-[1fr_14rem]">
                <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-on-surface-variant dark:text-stone-500">
                        <span className="material-symbols-outlined text-[1.1rem]">search</span>
                    </span>
                    <input
                        value={filters.search}
                        onChange={(event) => setFilter('search', event.target.value)}
                        placeholder="Search name, phone, email, subject"
                        className="w-full rounded-full border border-outline-variant/25 bg-surface-container-lowest py-3 pl-11 pr-4 text-sm outline-none focus:border-primary/45 dark:border-stone-800 dark:bg-stone-900 dark:text-white"
                    />
                </div>
                <select
                    value={filters.status}
                    onChange={(event) => setFilter('status', event.target.value)}
                    className="w-full rounded-full border border-outline-variant/25 bg-surface-container-lowest px-4 py-3 text-sm outline-none focus:border-primary/45 dark:border-stone-800 dark:bg-stone-900 dark:text-white"
                >
                    <option value="">All statuses</option>
                    {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{humanize(status)}</option>
                    ))}
                </select>
            </div>

            {error && (
                <div className="mb-5 rounded-2xl border border-error/25 bg-error-container/25 px-4 py-3 text-sm font-medium text-error dark:text-red-300">
                    {formatError(error)}
                </div>
            )}

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
                <div className="overflow-hidden rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-lowest dark:border-stone-800 dark:bg-stone-900">
                    {loading ? (
                        <div className="flex h-72 items-center justify-center gap-3 text-sm font-medium text-on-surface-variant dark:text-stone-400">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/25 border-t-current" />
                            Loading contact queries...
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex h-72 flex-col items-center justify-center text-center text-on-surface-variant dark:text-stone-400">
                            <span className="material-symbols-outlined text-4xl">inbox</span>
                            <p className="mt-3 text-sm font-semibold">No contact queries found.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-outline-variant/15 dark:divide-stone-800">
                            {items.map((query) => {
                                const isSelected = String(query.id) === String(selectedId);

                                return (
                                    <button
                                        key={query.id}
                                        type="button"
                                        onClick={() => setSelectedId(query.id)}
                                        className={`grid w-full gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-container dark:hover:bg-stone-800 md:grid-cols-[1fr_auto] ${
                                            isSelected ? 'bg-primary/5 dark:bg-red-950/20' : ''
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="truncate font-headline text-base font-bold text-on-surface dark:text-white">
                                                    {query.subject || query.name || 'Untitled query'}
                                                </p>
                                                <StatusBadge status={query.status} />
                                            </div>
                                            <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant dark:text-stone-400">
                                                {query.message || 'No message provided.'}
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-on-surface-variant dark:text-stone-500">
                                                <span>{query.phone}</span>
                                                <span>{query.email || 'No email'}</span>
                                                <span>{formatDate(query.created_at)}</span>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined self-center text-on-surface-variant dark:text-stone-500">chevron_right</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <QueryDetail
                    query={selected}
                    updating={updating}
                    onClose={() => setSelectedId(null)}
                    onSave={handleSave}
                    onDelete={handleDelete}
                />
            </div>
        </div>
    );
}
