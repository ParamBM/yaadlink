import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
    fetchOccasionTypes,
    createOccasionType,
    updateOccasionType,
    deleteOccasionType,
    clearError,
} from '../store/slices/occasionTypesSlice';

// ─── Icon options ──────────────────────────────────────────────────────────────
const ICON_OPTIONS = [
    'celebration', 'cake', 'favorite', 'redeem', 'auto_stories',
    'volunteer_activism', 'handshake', 'family_restroom', 'school',
    'church', 'nightlife', 'star', 'auto_awesome', 'emoji_events', 'card_giftcard',
    'event', 'local_activity', 'flight_takeoff', 'home', 'business_center',
];

function reorderOccasionTypes(list, sourceId, targetId) {
    const sourceIndex = list.findIndex((item) => String(item?.id) === String(sourceId));
    const targetIndex = list.findIndex((item) => String(item?.id) === String(targetId));

    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
        return list;
    }

    const next = [...list];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);

    return next.map((item, index) => ({
        ...item,
        sort_order: index,
    }));
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ active }) {
    return active ? (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-tertiary-fixed text-on-tertiary-fixed dark:bg-tertiary-fixed/20 dark:text-tertiary-fixed">
            Active
        </span>
    ) : (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-surface-variant dark:bg-stone-700 text-on-surface-variant dark:text-stone-300">
            Inactive
        </span>
    );
}

// ─── Icon Circle ───────────────────────────────────────────────────────────────
function IconCircle({ icon, active }) {
    return (
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
            active
                ? 'bg-secondary-fixed dark:bg-primary/20 text-on-secondary-fixed dark:text-primary'
                : 'bg-surface-variant dark:bg-stone-700 text-on-surface-variant dark:text-stone-300'
        }`}>
            <span
                className="material-symbols-outlined"
                style={{ fontSize: '1.1rem', fontVariationSettings: "'FILL' 1" }}
            >
                {icon || 'event_note'}
            </span>
        </div>
    );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onAdd }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '2rem' }}>event_note</span>
            </div>
            <p className="font-headline font-semibold text-on-surface text-lg mb-1">No occasion types yet</p>
            <p className="text-on-surface-variant font-body text-sm mb-6">Create your first one to get started</p>
            <button
                onClick={onAdd}
                className="flex items-center gap-2 py-3 px-7 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-sm shadow-[0_10px_30px_-10px_rgba(183,16,42,0.3)] hover:scale-[1.02] active:scale-98 transition-all"
            >
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>add</span>
                Add Occasion Type
            </button>
        </div>
    );
}

// ─── Create/Edit Modal ────────────────────────────────────────────────────────
function OccasionModal({ initialData, onClose, onSubmit, submitting, serverError }) {
    const isEdit = !!initialData;
    const [isVisible, setIsVisible] = useState(false);
    const [form, setForm] = useState({
        name: initialData?.name ?? '',
        description: initialData?.description ?? '',
        icon: initialData?.icon ?? 'celebration',
        is_active: initialData?.is_active ?? true,
        sort_order: initialData?.sort_order ?? 0,
    });

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    useEffect(() => {
        setIsVisible(true);
    }, []);

    useEffect(() => {
        setForm({
            name: initialData?.name ?? '',
            description: initialData?.description ?? '',
            icon: initialData?.icon ?? 'celebration',
            is_active: initialData?.is_active ?? true,
            sort_order: initialData?.sort_order ?? 0,
        });
    }, [initialData]);

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit({
            name: String(form.name || '').trim(),
            description: String(form.description || '').trim(),
            icon: form.icon || 'celebration',
            is_active: !!form.is_active,
            sort_order: Number(form.sort_order) || 0,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            <div className={`relative w-full max-w-md bg-surface-container-lowest dark:bg-stone-900 rounded-[2rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] border border-outline-variant/20 dark:border-stone-700/50 overflow-hidden transition-all duration-300 transform ${isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-95 opacity-0'}`}>

                {/* Header */}
                <div className="flex items-center justify-between px-7 py-5 border-b border-outline-variant/15 dark:border-stone-700/50">
                    <h2 className="font-headline font-bold text-on-surface dark:text-white text-base">
                        {isEdit ? 'Edit Occasion Type' : 'New Occasion Type'}
                    </h2>
                    <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container dark:hover:bg-stone-800 p-2 rounded-full transition-colors">
                        <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>close</span>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="px-7 py-6 flex flex-col gap-4">
                    {serverError && (
                        <div className="flex items-start gap-2 bg-error-container/30 dark:bg-error-container/20 border border-error/20 rounded-2xl px-4 py-3 text-xs text-error dark:text-red-400">
                            <span className="material-symbols-outlined flex-shrink-0 mt-0.5" style={{ fontSize: '1rem' }}>error</span>
                            <span>{typeof serverError === 'object' ? JSON.stringify(serverError) : serverError}</span>
                        </div>
                    )}

                    {/* Name */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-label">Name *</label>
                        <input
                            required
                            value={form.name}
                            onChange={e => set('name', e.target.value)}
                            placeholder="e.g. Birthday"
                            className="w-full bg-surface-container dark:bg-stone-800 border border-outline-variant/30 dark:border-stone-700 rounded-2xl px-4 py-2.5 text-sm text-on-surface dark:text-white placeholder-on-surface-variant/40 outline-none focus:border-primary/50 dark:focus:border-red-400/50 transition-all font-body"
                        />
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-label">Description</label>
                        <textarea
                            rows={2}
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            placeholder="Short description…"
                            className="w-full bg-surface-container dark:bg-stone-800 border border-outline-variant/30 dark:border-stone-700 rounded-2xl px-4 py-2.5 text-sm text-on-surface dark:text-white placeholder-on-surface-variant/40 outline-none focus:border-primary/50 dark:focus:border-red-400/50 transition-all resize-none font-body"
                        />
                    </div>

                    {/* Icon picker */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-label">Icon</label>
                        <div className="grid grid-cols-10 gap-1.5">
                            {ICON_OPTIONS.map(icon => (
                                <button
                                    key={icon}
                                    type="button"
                                    title={icon}
                                    onClick={() => set('icon', icon)}
                                    className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                                        form.icon === icon
                                            ? 'bg-primary/10 dark:bg-primary/20 border border-primary/40 text-primary dark:text-red-400'
                                            : 'bg-surface-container dark:bg-stone-800 border border-outline-variant/20 dark:border-stone-700 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high dark:hover:bg-stone-700'
                                    }`}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{icon}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sort order + Active */}
                    <div className="flex items-end gap-4">
                        <div className="flex flex-col gap-1.5 flex-1">
                            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-label">Sort Order</label>
                            <input
                                type="number"
                                min="0"
                                value={form.sort_order}
                                onChange={e => set('sort_order', parseInt(e.target.value) || 0)}
                                className="w-full bg-surface-container dark:bg-stone-800 border border-outline-variant/30 dark:border-stone-700 rounded-2xl px-4 py-2.5 text-sm text-on-surface dark:text-white outline-none focus:border-primary/50 dark:focus:border-red-400/50 transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-label">Status</label>
                            <button
                                type="button"
                                onClick={() => set('is_active', !form.is_active)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-semibold transition-all font-label ${
                                    form.is_active
                                        ? 'bg-tertiary-fixed/20 dark:bg-tertiary/10 border-tertiary-fixed/40 dark:border-tertiary/30 text-tertiary dark:text-tertiary-fixed'
                                        : 'bg-surface-container dark:bg-stone-800 border-outline-variant/30 dark:border-stone-700 text-on-surface-variant'
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${form.is_active ? 'bg-tertiary dark:bg-tertiary-fixed' : 'bg-on-surface-variant/40'}`} />
                                {form.is_active ? 'Active' : 'Inactive'}
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-full border border-outline-variant/30 dark:border-stone-700 text-on-surface-variant hover:text-on-surface hover:bg-surface-container dark:hover:bg-stone-800 text-sm font-bold transition-all font-headline"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-3 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_10px_30px_-10px_rgba(183,16,42,0.4)] hover:scale-[1.02] active:scale-98 font-headline"
                        >
                            {submitting ? (
                                <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{isEdit ? 'save' : 'add'}</span>
                                    {isEdit ? 'Save Changes' : 'Create'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Delete Dialog ─────────────────────────────────────────────────────────────
function DeleteDialog({ item, onClose, onConfirm, submitting }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />
            <div className={`relative w-full max-w-sm bg-surface-container-lowest dark:bg-stone-900 border border-outline-variant/20 dark:border-stone-700/50 rounded-[2rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] p-7 text-center transition-all duration-300 transform ${isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-95 opacity-0'}`}>
                <div className="w-14 h-14 rounded-full bg-error-container/30 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-error dark:text-red-400" style={{ fontSize: '1.5rem' }}>delete</span>
                </div>
                <h3 className="font-headline font-bold text-on-surface dark:text-white text-base mb-2">Delete "{item.name}"?</h3>
                <p className="text-on-surface-variant dark:text-stone-400 text-sm font-body mb-6">This soft-deletes the record. It cannot be undone from the UI.</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-full border border-outline-variant/30 dark:border-stone-700 text-on-surface-variant hover:text-on-surface hover:bg-surface-container dark:hover:bg-stone-800 text-sm font-bold transition-all font-headline">Cancel</button>
                    <button
                        onClick={onConfirm}
                        disabled={submitting}
                        className="flex-1 py-3 rounded-full bg-error text-on-error text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98 font-headline"
                    >
                        {submitting ? <span className="w-4 h-4 border-2 border-on-error/30 border-t-on-error rounded-full animate-spin" /> : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function OccasionActionsMenu({ item, busy, onEdit, onDelete }) {
    const buttonRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const updatePosition = () => {
            const rect = buttonRef.current?.getBoundingClientRect();
            if (!rect) {
                return;
            }

            const width = 190;
            const height = 112;
            const left = Math.min(window.innerWidth - width - 12, Math.max(12, rect.right - width));
            const top = rect.bottom + height > window.innerHeight
                ? Math.max(12, rect.top - height - 8)
                : rect.bottom + 8;

            setPosition({ top, left });
        };

        const closeOnEscape = (event) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('keydown', closeOnEscape);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('keydown', closeOnEscape);
        };
    }, [open]);

    const menu = open && typeof document !== 'undefined'
        ? createPortal(
            <>
                <button
                    type="button"
                    aria-label="Close occasion menu"
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 z-50 bg-transparent"
                />
                <div
                    className="fixed z-[60] w-[190px] rounded-[1rem] border border-outline-variant/20 bg-surface-container-lowest p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.16)] dark:border-stone-700/60 dark:bg-stone-900"
                    style={{ top: `${position.top}px`, left: `${position.left}px` }}
                >
                    <button
                        type="button"
                        onClick={() => {
                            setOpen(false);
                            onEdit(item);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-[0.85rem] px-3 py-2.5 text-left text-sm font-medium text-on-surface transition-colors hover:bg-surface-container dark:text-white dark:hover:bg-stone-800"
                    >
                        <span className="material-symbols-outlined text-[18px] text-primary">edit</span>
                        Edit occasion
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setOpen(false);
                            onDelete(item);
                        }}
                        disabled={busy}
                        className="flex w-full items-center gap-2.5 rounded-[0.85rem] px-3 py-2.5 text-left text-sm font-medium text-error transition-colors hover:bg-error-container/40 disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-950/40"
                    >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        Delete occasion
                    </button>
                </div>
            </>,
            document.body
        )
        : null;

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((current) => !current)}
                disabled={busy}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface disabled:opacity-60 dark:border-stone-700/60 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 dark:hover:text-white"
            >
                {busy ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/25 border-t-current" />
                ) : (
                    <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                )}
            </button>
            {menu}
        </>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function OccasionTypes() {
    const dispatch = useDispatch();
    const { items, loading, submitting, error } = useSelector(s => s.occasionTypes);

    const [orderedItems, setOrderedItems] = useState([]);
    const [modal, setModal] = useState(null);       // null | 'create' | item object
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [pendingId, setPendingId] = useState(null);
    const [draggedId, setDraggedId] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);
    const [isReordering, setIsReordering] = useState(false);
    const [search, setSearch] = useState('');
    const [filterActive, setFilterActive] = useState('all');

    useEffect(() => { dispatch(fetchOccasionTypes()); }, [dispatch]);

    useEffect(() => {
        if (!isReordering) {
            setOrderedItems(items);
        }
    }, [items, isReordering]);

    const filtered = orderedItems
        .filter(Boolean)
        .filter((it) => filterActive === 'all' ? true : filterActive === 'active' ? !!it?.is_active : !it?.is_active)
        .filter((it) => String(it?.name || '').toLowerCase().includes(search.toLowerCase()));

    const openCreate = () => { dispatch(clearError()); setModal('create'); };
    const openEdit = (item) => { dispatch(clearError()); setModal(item); };

    const handleCreate = async (data) => {
        setPendingId('create');
        const res = await dispatch(createOccasionType(data));
        setPendingId(null);
        if (!res.error) setModal(null);
    };
    const handleUpdate = async (data) => {
        if (!modal || modal === 'create') {
            return;
        }

        setPendingId(modal.id);
        const res = await dispatch(updateOccasionType({ id: modal.id, payload: data }));
        setPendingId(null);
        if (!res.error) setModal(null);
    };
    const handleDelete = async () => {
        if (!deleteTarget) {
            return;
        }

        setPendingId(deleteTarget.id);
        const res = await dispatch(deleteOccasionType(deleteTarget.id));
        setPendingId(null);
        if (!res.error) setDeleteTarget(null);
    };

    const handleDragStart = (event, itemId) => {
        setDraggedId(itemId);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(itemId));
    };

    const handleDragOver = (event, itemId) => {
        if (!draggedId || String(draggedId) === String(itemId)) {
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setDragOverId(itemId);
    };

    const handleDragEnd = () => {
        setDraggedId(null);
        setDragOverId(null);
    };

    const handleDrop = async (event, targetId) => {
        event.preventDefault();

        const sourceId = draggedId || event.dataTransfer.getData('text/plain');
        if (!sourceId || String(sourceId) === String(targetId)) {
            handleDragEnd();
            return;
        }

        const nextItems = reorderOccasionTypes(orderedItems, sourceId, targetId);
        if (nextItems === orderedItems) {
            handleDragEnd();
            return;
        }

        const changedItems = nextItems.filter((item) => {
            const previous = orderedItems.find((current) => String(current?.id) === String(item?.id));
            return Number(previous?.sort_order ?? 0) !== Number(item?.sort_order ?? 0);
        });

        setOrderedItems(nextItems);
        handleDragEnd();
        setIsReordering(true);
        setPendingId('sort');

        for (const item of changedItems) {
            const result = await dispatch(updateOccasionType({
                id: item.id,
                payload: { sort_order: Number(item.sort_order) || 0 },
            }));

            if (updateOccasionType.rejected.match(result)) {
                break;
            }
        }

        await dispatch(fetchOccasionTypes());
        setPendingId(null);
        setIsReordering(false);
    };

    return (
        <div className="p-6 md:p-8 lg:px-12 max-w-7xl mx-auto w-full">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-5">
                <div className="max-w-2xl text-center md:text-left">
                    <h1 className="font-headline text-4xl font-extrabold text-on-surface dark:text-white tracking-tighter mb-3">
                        Occasion Types
                    </h1>
                    <p className="text-on-surface-variant dark:text-stone-400 text-base leading-relaxed font-body">
                        Manage the foundational event types that structure our modern heirloom experiences. These categories guide the themes and stories available to users.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="hidden md:flex shrink-0 py-3 px-7 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-sm shadow-[0_20px_40px_-15px_rgba(183,16,42,0.3)] hover:scale-[1.02] active:scale-98 transition-all items-center gap-2 font-headline"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>add</span>
                    Add New Occasion
                </button>
            </div>

            {/* Global error banner */}
            {error && typeof error === 'string' && (
                <div className="flex items-center gap-2 bg-error-container/30 border border-error/20 rounded-2xl px-4 py-3 text-sm text-error dark:text-red-400 mb-5">
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>error</span>
                    {error}
                    <button onClick={() => dispatch(clearError())} className="ml-auto">
                        <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>close</span>
                    </button>
                </div>
            )}

            {/* Mobile Action Row */}
            <div className="flex md:hidden items-center justify-between gap-3 mb-6">
                <div className="flex gap-1 bg-surface-container dark:bg-stone-800 rounded-full p-1">
                    {['all', 'active', 'inactive'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilterActive(tab)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold capitalize transition-all font-label ${
                                filterActive === tab
                                    ? 'bg-surface-container-lowest dark:bg-stone-700 text-on-surface dark:text-white shadow-sm'
                                    : 'text-on-surface-variant dark:text-stone-400'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <button
                    onClick={openCreate}
                    className="h-9 w-9 flex items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-lg active:scale-95 transition-transform"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>add</span>
                </button>
            </div>

            {/* Search + Filter bar */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-surface-container-lowest dark:bg-stone-900 border border-outline-variant/20 dark:border-stone-700/50 rounded-full px-4 py-2.5">
                    <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '1rem' }}>search</span>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search occasion types…"
                        className="flex-1 bg-transparent text-sm text-on-surface dark:text-white placeholder-on-surface-variant/50 outline-none font-body"
                    />
                </div>
                <div className="hidden md:flex gap-1 bg-surface-container dark:bg-stone-800 rounded-full p-1">
                    {['all', 'active', 'inactive'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilterActive(tab)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all font-label ${
                                filterActive === tab
                                    ? 'bg-surface-container-lowest dark:bg-stone-700 text-on-surface dark:text-white shadow-sm'
                                    : 'text-on-surface-variant dark:text-stone-400 hover:text-on-surface dark:hover:text-white'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table Container */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <span className="w-10 h-10 border-3 border-outline-variant/30 border-t-primary rounded-full animate-spin" style={{ borderWidth: '3px' }} />
                    <p className="text-on-surface-variant font-body text-sm">Loading occasion types…</p>
                </div>
            ) : filtered.length === 0 && !search && filterActive === 'all' ? (
                <EmptyState onAdd={openCreate} />
            ) : (
                <div className="bg-surface-container-lowest dark:bg-stone-900 rounded-[2rem] p-6 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.04)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] border border-outline-variant/10 dark:border-stone-700/30">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-on-surface-variant dark:text-stone-400 font-headline text-xs uppercase tracking-wider border-b border-outline-variant/20 dark:border-stone-700">
                                    <th className="pb-4 font-semibold w-12 px-3">ID</th>
                                    <th className="pb-4 font-semibold px-3">Name</th>
                                    <th className="pb-4 font-semibold px-3">Slug</th>
                                    <th className="pb-4 font-semibold px-3">Description</th>
                                    <th className="pb-4 font-semibold px-3 text-center w-28">Status</th>
                                    <th className="pb-4 font-semibold px-3 text-right w-20">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-on-surface dark:text-white font-body divide-y divide-outline-variant/10 dark:divide-stone-700/50">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-on-surface-variant dark:text-stone-400 text-sm">
                                            No results found
                                        </td>
                                    </tr>
                                ) : filtered.map((item, idx) => (
                                    <tr
                                        key={item.id}
                                        onDragOver={(event) => handleDragOver(event, item.id)}
                                        onDrop={(event) => handleDrop(event, item.id)}
                                        className={`group transition-colors duration-300 ${
                                            dragOverId === item.id
                                                ? 'bg-surface-container-low dark:bg-stone-800/60'
                                                : 'hover:bg-surface-container-low/50 dark:hover:bg-stone-800/50'
                                        }`}
                                    >
                                        <td className="py-4 px-3 text-sm text-on-surface-variant dark:text-stone-500">
                                            {String(idx + 1).padStart(2, '0')}
                                        </td>
                                        <td className="py-4 px-3">
                                            <div className="flex items-center gap-3">
                                                <IconCircle icon={item.icon} active={item.is_active} />
                                                <span className="font-headline font-semibold text-base text-on-surface dark:text-white">
                                                    {item.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-3 text-sm text-on-surface-variant dark:text-stone-400">
                                            {item.slug}
                                        </td>
                                        <td className="py-4 px-3 text-sm text-on-surface-variant dark:text-stone-400 max-w-[14rem] sm:max-w-xs truncate">
                                            {item.description || <span className="italic text-on-surface-variant/40 dark:text-stone-600">—</span>}
                                        </td>
                                        <td className="py-4 px-3 text-center">
                                            <StatusBadge active={item.is_active} />
                                        </td>
                                        <td className="py-4 px-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    draggable
                                                    onDragStart={(event) => handleDragStart(event, item.id)}
                                                    onDragEnd={handleDragEnd}
                                                    disabled={pendingId === 'sort'}
                                                    title="Drag to reorder"
                                                    className="inline-flex h-9 w-9 cursor-grab items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface active:cursor-grabbing disabled:opacity-40 dark:border-stone-700/60 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 dark:hover:text-white"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
                                                </button>
                                                <OccasionActionsMenu
                                                    item={item}
                                                    busy={pendingId === item.id || pendingId === 'sort'}
                                                    onEdit={openEdit}
                                                    onDelete={setDeleteTarget}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="mt-5 flex items-center justify-between border-t border-outline-variant/15 dark:border-stone-700/50 pt-5">
                        <span className="text-sm text-on-surface-variant dark:text-stone-400 font-body">
                            Showing {filtered.length} of {orderedItems.length} entries
                        </span>
                    </div>
                </div>
            )}

            {/* Modals */}
            {modal === 'create' && (
                <OccasionModal onClose={() => setModal(null)} onSubmit={handleCreate} submitting={submitting && pendingId === 'create'} serverError={error} />
            )}
            {modal && modal !== 'create' && (
                <OccasionModal initialData={modal} onClose={() => setModal(null)} onSubmit={handleUpdate} submitting={submitting && pendingId === modal.id} serverError={error} />
            )}
            {deleteTarget && (
                <DeleteDialog item={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} submitting={submitting && pendingId === deleteTarget.id} />
            )}
        </div>
    );
}
