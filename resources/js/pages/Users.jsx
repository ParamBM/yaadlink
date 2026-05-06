import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    clearError,
    createUser,
    deleteUser,
    fetchUsers,
    forceDeleteUser,
    updateUser,
    updateUserStatus,
} from '../store/slices/usersSlice';

const ROLE_OPTIONS = [
    'admin',
    'user',
];

const ROLE_COLORS = {
    admin: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-red-300',
    user: 'bg-surface-container-high text-on-surface-variant dark:bg-stone-800 dark:text-stone-400',
};

function normalizeRoleValue(role) {
    const normalized = String(role || 'user').trim().toLowerCase();
    return ROLE_OPTIONS.includes(normalized) ? normalized : 'user';
}

function humanize(value) {
    return String(value || 'user')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function isActiveStatus(status) {
    if (status == null || status === '') {
        return true;
    }

    if (typeof status === 'boolean') {
        return status;
    }

    if (typeof status === 'number') {
        return status === 1;
    }

    return ['1', 'true', 'active', 'enabled'].includes(String(status).trim().toLowerCase());
}

function normalizeStatus(user) {
    return isActiveStatus(user?.status ?? user?.is_active) ? 'active' : 'inactive';
}

function formatErrorMessage(error) {
    if (!error) {
        return '';
    }

    if (typeof error === 'string') {
        return error;
    }

    if (typeof error?.error === 'string') {
        return error.error;
    }

    if (typeof error?.message === 'string') {
        return error.message;
    }

    if (error?.errors && typeof error.errors === 'object') {
        return Object.entries(error.errors)
            .map(([field, messages]) => {
                const messageList = Array.isArray(messages) ? messages : [messages];
                return `${humanize(field)}: ${messageList.join(', ')}`;
            })
            .join(' ');
    }

    return 'Something went wrong.';
}

function RoleBadge({ role }) {
    const normalizedRole = normalizeRoleValue(role);
    const classes = ROLE_COLORS[normalizedRole] || ROLE_COLORS.user;

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}>
            {humanize(normalizedRole)}
        </span>
    );
}

function StatusBadge({ status }) {
    const active = isActiveStatus(status);

    return (
        <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                active
                    ? 'bg-tertiary-fixed text-on-tertiary-fixed dark:bg-tertiary-fixed/20 dark:text-tertiary-fixed'
                    : 'bg-surface-variant text-on-surface-variant dark:bg-stone-700 dark:text-stone-300'
            }`}
        >
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

function Field({ label, children }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="ml-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant dark:text-stone-400">
                {label}
            </span>
            {children}
        </label>
    );
}

function TextInput({ icon, ...props }) {
    return (
        <div className="relative">
            {icon && (
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-on-surface-variant dark:text-stone-500">
                    <span className="material-symbols-outlined text-[17px]">{icon}</span>
                </span>
            )}
            <input
                {...props}
                className={`w-full rounded-[1rem] border border-outline-variant/25 bg-surface-container px-3.5 py-2.5 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/50 focus:border-primary/35 focus:bg-surface-container-lowest dark:border-stone-700/60 dark:bg-stone-800 dark:text-white ${
                    icon ? 'pl-10' : ''
                } ${props.className || ''}`}
            />
        </div>
    );
}

function SelectInput({ icon, children, ...props }) {
    return (
        <div className="relative">
            {icon && (
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-on-surface-variant dark:text-stone-500">
                    <span className="material-symbols-outlined text-[17px]">{icon}</span>
                </span>
            )}
            <select
                {...props}
                className={`w-full appearance-none rounded-[1rem] border border-outline-variant/25 bg-surface-container px-3.5 py-2.5 text-sm text-on-surface outline-none transition-all focus:border-primary/35 focus:bg-surface-container-lowest dark:border-stone-700/60 dark:bg-stone-800 dark:text-white ${
                    icon ? 'pl-10 pr-10' : 'pr-10'
                } ${props.className || ''}`}
            >
                {children}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-on-surface-variant dark:text-stone-500">
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </span>
        </div>
    );
}

function UserModal({ mode, user, submitting, error, onClose, onSubmit }) {
    const isEdit = mode === 'edit';
    const [form, setForm] = useState({
        name: user?.name ?? '',
        email: user?.email ?? '',
        password: '',
        role: normalizeRoleValue(user?.role),
        status: normalizeStatus(user),
    });

    useEffect(() => {
        setForm({
            name: user?.name ?? '',
            email: user?.email ?? '',
            password: '',
            role: normalizeRoleValue(user?.role),
            status: normalizeStatus(user),
        });
    }, [mode, user]);

    const availableRoles = ROLE_OPTIONS;

    const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

    const handleSubmit = (event) => {
        event.preventDefault();

        const payload = {
            name: form.name.trim(),
            email: form.email.trim(),
            role: form.role,
            status: form.status,
        };

        if (!isEdit || form.password.trim()) {
            payload.password = form.password;
        }

        onSubmit(payload);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                onClick={onClose}
                className="absolute inset-0 bg-black/45 backdrop-blur-sm animate-in fade-in duration-300"
                aria-label="Close user modal"
            />

            <div className="relative w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest shadow-[0_30px_70px_rgba(0,0,0,0.14)] dark:border-stone-700/50 dark:bg-stone-900 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between border-b border-outline-variant/15 px-5 py-4 dark:border-stone-700/50">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary dark:text-primary">
                            {isEdit ? 'Edit User' : 'Add User'}
                        </p>
                        <h2 className="mt-1 font-headline text-xl font-bold text-on-surface dark:text-white">
                            {isEdit ? 'Update account details' : 'Create a new account'}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface dark:hover:bg-stone-800 dark:hover:text-white"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
                    {error && (
                        <div className="rounded-[1rem] border border-error/20 bg-error-container/35 px-4 py-3 text-sm text-error dark:bg-red-950/40 dark:text-red-300">
                            {formatErrorMessage(error)}
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Full Name">
                            <TextInput
                                icon="person"
                                value={form.name}
                                onChange={(event) => setField('name', event.target.value)}
                                placeholder="Enter full name"
                                required
                            />
                        </Field>

                        <Field label="Email">
                            <TextInput
                                icon="mail"
                                type="email"
                                value={form.email}
                                onChange={(event) => setField('email', event.target.value)}
                                placeholder="name@example.com"
                                required
                            />
                        </Field>

                        <Field label="Role">
                            <SelectInput
                                icon="badge"
                                value={form.role}
                                onChange={(event) => setField('role', event.target.value)}
                            >
                                {availableRoles.map((role) => (
                                    <option key={role} value={role}>
                                        {humanize(role)}
                                    </option>
                                ))}
                            </SelectInput>
                        </Field>

                        <Field label="Status">
                            <SelectInput
                                icon="toggle_on"
                                value={form.status}
                                onChange={(event) => setField('status', event.target.value)}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </SelectInput>
                        </Field>
                    </div>

                    <Field label={isEdit ? 'Password (Optional)' : 'Password'}>
                        <TextInput
                            icon="lock"
                            type="password"
                            value={form.password}
                            onChange={(event) => setField('password', event.target.value)}
                            placeholder={isEdit ? 'Leave blank to keep current password' : 'Enter a secure password'}
                            required={!isEdit}
                        />
                    </Field>

                    <div className="flex gap-3 border-t border-outline-variant/15 pt-4 dark:border-stone-700/50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-full border border-outline-variant/30 px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 rounded-full bg-gradient-to-r from-primary to-primary-container px-4 py-2.5 text-sm font-semibold text-on-primary transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ConfirmStatusModal({ state, submitting, onClose, onConfirm }) {
    if (!state.isOpen || !state.user) {
        return null;
    }

    const active = state.newStatus === 'active';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                onClick={onClose}
                className="absolute inset-0 cursor-default bg-black/45 backdrop-blur-sm animate-in fade-in duration-300"
                aria-label="Close status confirmation"
            />

            <div className="relative w-full max-w-sm rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-[0_30px_70px_rgba(0,0,0,0.14)] dark:border-stone-700/50 dark:bg-stone-900 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
                    active
                        ? 'bg-tertiary-fixed/30 text-tertiary dark:bg-tertiary/15 dark:text-tertiary-fixed'
                        : 'bg-error-container text-error dark:bg-red-950/60 dark:text-red-300'
                }`}>
                    <span className="material-symbols-outlined text-[26px]">
                        {active ? 'how_to_reg' : 'person_off'}
                    </span>
                </div>

                <h2 className="text-center font-headline text-xl font-bold text-on-surface dark:text-white">
                    {active ? 'Activate user?' : 'Deactivate user?'}
                </h2>
                <p className="mt-2 text-center text-sm leading-relaxed text-on-surface-variant dark:text-stone-400">
                    {state.user.name} will {active ? 'regain' : 'lose'} access to the dashboard.
                </p>

                <div className="mt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-full border border-outline-variant/30 px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={submitting}
                        className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                            active
                                ? 'bg-tertiary text-white dark:bg-tertiary-fixed dark:text-on-tertiary-fixed'
                                : 'bg-error text-on-error dark:bg-red-500'
                        }`}
                    >
                        {submitting ? 'Saving...' : active ? 'Activate' : 'Deactivate'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ConfirmDeleteModal({ state, submitting, onClose, onConfirm }) {
    if (!state.isOpen || !state.user) {
        return null;
    }

    const permanent = state.mode === 'force';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                onClick={onClose}
                className="absolute inset-0 cursor-default bg-black/45 backdrop-blur-sm animate-in fade-in duration-300"
                aria-label="Close delete confirmation"
            />

            <div className="relative w-full max-w-sm rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-[0_30px_70px_rgba(0,0,0,0.14)] dark:border-stone-700/50 dark:bg-stone-900 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error-container text-error dark:bg-red-950/60 dark:text-red-300">
                    <span className="material-symbols-outlined text-[26px]">{permanent ? 'delete_forever' : 'delete'}</span>
                </div>

                <h2 className="text-center font-headline text-xl font-bold text-on-surface dark:text-white">
                    {permanent ? 'Delete forever?' : 'Move to trash?'}
                </h2>
                <p className="mt-2 text-center text-sm leading-relaxed text-on-surface-variant dark:text-stone-400">
                    {permanent
                        ? `${state.user.name} will be permanently removed and cannot be recovered.`
                        : `${state.user.name} will be moved to trash and hidden from the active users list.`}
                </p>

                <div className="mt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-full border border-outline-variant/30 px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={submitting}
                        className="flex-1 rounded-full bg-error px-4 py-2.5 text-sm font-semibold text-on-error transition-colors disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-500"
                    >
                        {submitting ? 'Deleting...' : permanent ? 'Delete Forever' : 'Move to Trash'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function UserActionsMenu({ user, busy, inTrash, onEdit, onToggleStatus, onRecover, onDelete, onForceDelete }) {
    const buttonRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState(null);
    const active = normalizeStatus(user) === 'active';

    useEffect(() => {
        if (!open) {
            setPosition(null);
            return undefined;
        }

        const updatePosition = () => {
            const rect = buttonRef.current?.getBoundingClientRect();
            if (!rect) {
                return;
            }

            const width = 190;
            const height = 152;
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

    const menu = open && position && typeof document !== 'undefined'
        ? createPortal(
            <>
                <button
                    type="button"
                    aria-label="Close user menu"
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 z-50 cursor-default bg-transparent"
                />
                <div
                    className="fixed z-[60] w-[190px] rounded-[1rem] border border-outline-variant/20 bg-surface-container-lowest p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.16)] dark:border-stone-700/60 dark:bg-stone-900 animate-in fade-in zoom-in-95 duration-200"
                    style={{ top: `${position.top}px`, left: `${position.left}px` }}
                >
                    <button
                        type="button"
                        onClick={() => {
                            setOpen(false);
                            onEdit(user);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-[0.85rem] px-3 py-2.5 text-left text-sm font-medium text-on-surface transition-colors hover:bg-surface-container dark:text-white dark:hover:bg-stone-800"
                    >
                        <span className="material-symbols-outlined text-[18px] text-primary">edit</span>
                        Edit user
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setOpen(false);
                            onToggleStatus(user);
                        }}
                        hidden={inTrash}
                        disabled={busy}
                        className="flex w-full items-center gap-2.5 rounded-[0.85rem] px-3 py-2.5 text-left text-sm font-medium text-on-surface transition-colors hover:bg-surface-container disabled:opacity-60 dark:text-white dark:hover:bg-stone-800"
                    >
                        <span className={`material-symbols-outlined text-[18px] ${active ? 'text-error dark:text-red-300' : 'text-tertiary dark:text-tertiary-fixed'}`}>
                            {active ? 'person_off' : 'how_to_reg'}
                        </span>
                        {active ? 'Deactivate user' : 'Activate user'}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setOpen(false);
                            onRecover(user);
                        }}
                        hidden={!inTrash}
                        disabled={busy}
                        className="flex w-full items-center gap-2.5 rounded-[0.85rem] px-3 py-2.5 text-left text-sm font-medium text-tertiary transition-colors hover:bg-tertiary-fixed/20 disabled:opacity-60 dark:text-tertiary-fixed dark:hover:bg-teal-950/30"
                    >
                        <span className="material-symbols-outlined text-[18px]">restore_from_trash</span>
                        Recover user
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setOpen(false);
                            if (inTrash) {
                                onForceDelete(user);
                            } else {
                                onDelete(user);
                            }
                        }}
                        disabled={busy}
                        className="flex w-full items-center gap-2.5 rounded-[0.85rem] px-3 py-2.5 text-left text-sm font-medium text-error transition-colors hover:bg-error-container/40 disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-950/40"
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            {inTrash ? 'delete_forever' : 'delete'}
                        </span>
                        {inTrash ? 'Delete forever' : 'Move to trash'}
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

export default function Users() {
    const dispatch = useDispatch();
    const { items, loading, error } = useSelector((state) => state.users);

    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [activeTab, setActiveTab] = useState('active');
    const [pendingUserId, setPendingUserId] = useState(null);
    const [modalState, setModalState] = useState({ open: false, mode: 'create', user: null });
    const [modalError, setModalError] = useState(null);
    const [confirmState, setConfirmState] = useState({ isOpen: false, user: null, newStatus: '' });
    const [deleteState, setDeleteState] = useState({ isOpen: false, user: null, mode: 'soft' });

    useEffect(() => {
        dispatch(fetchUsers(activeTab === 'trash' ? { trash: true } : {}));
    }, [activeTab, dispatch]);

    const filteredUsers = useMemo(() => {
        const term = search.trim().toLowerCase();

        return items.filter((user) => {
            const matchesSearch = !term
                || user.name?.toLowerCase().includes(term)
                || user.email?.toLowerCase().includes(term);
            const matchesRole = !roleFilter || normalizeRoleValue(user.role) === roleFilter;

            return matchesSearch && matchesRole;
        });
    }, [items, roleFilter, search]);

    const filterRoles = useMemo(
        () => [...new Set(items.map((user) => normalizeRoleValue(user.role)).filter(Boolean))]
            .sort((left, right) => left.localeCompare(right)),
        [items]
    );
    const pageError = !modalState.open && !confirmState.isOpen ? error : null;

    const closeModal = () => {
        setModalState({ open: false, mode: 'create', user: null });
        setModalError(null);
        dispatch(clearError());
    };

    const closeConfirm = () => {
        setConfirmState({ isOpen: false, user: null, newStatus: '' });
        dispatch(clearError());
    };

    const closeDeleteConfirm = () => {
        setDeleteState({ isOpen: false, user: null, mode: 'soft' });
        dispatch(clearError());
    };

    const openCreateModal = () => {
        setModalError(null);
        dispatch(clearError());
        setModalState({ open: true, mode: 'create', user: null });
    };

    const openEditModal = (user) => {
        setModalError(null);
        dispatch(clearError());
        setModalState({ open: true, mode: 'edit', user });
    };

    const openStatusConfirm = (user) => {
        dispatch(clearError());
        setConfirmState({
            isOpen: true,
            user,
            newStatus: normalizeStatus(user) === 'active' ? 'inactive' : 'active',
        });
    };

    const openDeleteConfirm = (user) => {
        dispatch(clearError());
        setDeleteState({ isOpen: true, user, mode: 'soft' });
    };

    const openForceDeleteConfirm = (user) => {
        dispatch(clearError());
        setDeleteState({ isOpen: true, user, mode: 'force' });
    };

    const handleModalSubmit = async (payload) => {
        setModalError(null);

        if (modalState.mode === 'create') {
            setPendingUserId('create');
            const result = await dispatch(createUser(payload));
            setPendingUserId(null);

            if (createUser.fulfilled.match(result)) {
                closeModal();
                return;
            }

            setModalError(result.payload || 'Failed to create user');
            return;
        }

        if (!modalState.user) {
            return;
        }

        setPendingUserId(modalState.user.id);
        const result = await dispatch(updateUser({
            uuid: modalState.user.uuid,
            id: modalState.user.id,
            payload,
        }));
        setPendingUserId(null);

        if (updateUser.fulfilled.match(result)) {
            closeModal();
            return;
        }

        setModalError(result.payload || 'Failed to update user');
    };

    const handleStatusUpdate = async () => {
        if (!confirmState.user) {
            return;
        }

        const { user, newStatus } = confirmState;
        setPendingUserId(user.id);
        closeConfirm();

        const result = await dispatch(updateUserStatus({
            uuid: user.uuid,
            id: user.id,
            status: newStatus,
        }));

        setPendingUserId(null);

        if (updateUserStatus.rejected.match(result)) {
            setConfirmState({ isOpen: true, user, newStatus });
        }
    };

    const handleDelete = async () => {
        if (!deleteState.user) {
            return;
        }

        const { user, mode } = deleteState;
        setPendingUserId(user.id);
        closeDeleteConfirm();

        const action = mode === 'force' ? forceDeleteUser : deleteUser;
        const result = await dispatch(action({
            uuid: user.uuid,
            id: user.id,
        }));

        setPendingUserId(null);

        if (action.rejected.match(result)) {
            setDeleteState({ isOpen: true, user, mode });
            return;
        }

        dispatch(fetchUsers(activeTab === 'trash' ? { trash: true } : {}));
    };

    const handleRecover = async (user) => {
        if (!user) {
            return;
        }

        setPendingUserId(user.id);
        const result = await dispatch(updateUserStatus({
            uuid: user.uuid,
            id: user.id,
            status: 'active',
        }));
        setPendingUserId(null);

        if (!updateUserStatus.rejected.match(result)) {
            dispatch(fetchUsers(activeTab === 'trash' ? { trash: true } : {}));
        }
    };

    const visibleCountLabel = activeTab === 'trash' ? 'trashed' : 'total';

    return (
        <div className="mx-auto w-full max-w-7xl p-6 md:p-8 lg:px-12">
            <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div className="text-center md:text-left">
                    <h1 className="mb-2 font-headline text-4xl font-extrabold tracking-tighter text-on-surface dark:text-white">
                        Users
                    </h1>
                    <p className="mx-auto md:mx-0 max-w-2xl text-sm leading-relaxed text-on-surface-variant dark:text-stone-400">
                        Manage registered accounts, roles, and access states from one place.
                    </p>
                </div>

                <div className="hidden md:flex items-center gap-3">
                    <div className="rounded-full bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface-variant dark:bg-stone-800 dark:text-stone-400">
                        {items.length} {visibleCountLabel}
                    </div>
                    {activeTab !== 'trash' && (
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-container px-5 py-2.5 text-sm font-semibold text-on-primary shadow-[0_14px_32px_-18px_rgba(183,16,42,0.55)] transition-all hover:scale-[1.01]"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            Add User
                        </button>
                    )}
                </div>
            </div>

            <div className="mb-6 flex md:hidden items-center justify-between gap-3">
                <div className="inline-flex rounded-full border border-outline-variant/20 bg-surface-container-lowest p-1 dark:border-stone-700/50 dark:bg-stone-900">
                    <button
                        type="button"
                        onClick={() => setActiveTab('active')}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                            activeTab === 'active'
                                ? 'bg-primary text-on-primary'
                                : 'text-on-surface-variant hover:text-on-surface dark:text-stone-400 dark:hover:text-white'
                        }`}
                    >
                        Users
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('trash')}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                            activeTab === 'trash'
                                ? 'bg-primary text-on-primary'
                                : 'text-on-surface-variant hover:text-on-surface dark:text-stone-400 dark:hover:text-white'
                        }`}
                    >
                        Trash
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="rounded-full bg-surface-container px-3 py-1.5 text-xs font-semibold text-on-surface-variant dark:bg-stone-800 dark:text-stone-400">
                        {items.length} {visibleCountLabel}
                    </div>
                    {activeTab !== 'trash' && (
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-[0_14px_32px_-18px_rgba(183,16,42,0.55)] transition-all hover:scale-[1.01]"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                        </button>
                    )}
                </div>
            </div>


            {pageError && (
                <div className="mb-5 flex items-center gap-2 rounded-[1rem] border border-error/20 bg-error-container/30 px-4 py-3 text-sm text-error dark:text-red-400">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    {formatErrorMessage(pageError)}
                </div>
            )}

            <div className="mb-5 flex flex-wrap items-center gap-3">
                <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest px-4 py-2.5 dark:border-stone-700/50 dark:bg-stone-900">
                    <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by name or email..."
                        className="flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50 dark:text-white"
                    />
                </div>

                <div className="hidden md:flex gap-1 rounded-full border border-outline-variant/20 bg-surface-container-lowest p-1 dark:border-stone-700/50 dark:bg-stone-900">
                    <button
                        type="button"
                        onClick={() => setActiveTab('active')}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                            activeTab === 'active'
                                ? 'bg-primary text-on-primary'
                                : 'text-on-surface-variant hover:text-on-surface dark:text-stone-400 dark:hover:text-white'
                        }`}
                    >
                        Users
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('trash')}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                            activeTab === 'trash'
                                ? 'bg-primary text-on-primary'
                                : 'text-on-surface-variant hover:text-on-surface dark:text-stone-400 dark:hover:text-white'
                        }`}
                    >
                        Trash
                    </button>
                </div>

                <select
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value)}
                    className="rounded-full border border-outline-variant/20 bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface outline-none dark:border-stone-700/50 dark:bg-stone-900 dark:text-white"
                >
                    <option value="">All Roles</option>
                    {filterRoles.map((role) => (
                        <option key={role} value={role}>
                            {humanize(role)}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-20">
                    <span className="h-10 w-10 animate-spin rounded-full border-t-primary" style={{ borderWidth: '3px', borderColor: 'rgba(183,16,42,0.2)', borderTopColor: '#b7102a' }} />
                    <p className="text-sm text-on-surface-variant">Loading users...</p>
                </div>
            ) : (
                <div className="rounded-[1.75rem] border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-[0_32px_70px_-30px_rgba(0,0,0,0.18)] dark:border-stone-700/30 dark:bg-stone-900">
                    <div className="overflow-x-auto">
                        <table className="min-w-[860px] w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-outline-variant/20 text-xs uppercase tracking-[0.16em] text-on-surface-variant dark:border-stone-700 dark:text-stone-400">
                                    <th className="w-12 px-3 pb-4 font-semibold">ID</th>
                                    <th className="px-3 pb-4 font-semibold">User</th>
                                    <th className="px-3 pb-4 font-semibold">Email</th>
                                    <th className="px-3 pb-4 font-semibold">Role</th>
                                    <th className="w-28 px-3 pb-4 text-center font-semibold">Status</th>
                                    <th className="px-3 pb-4 text-right font-semibold">Joined</th>
                                    <th className="w-20 px-3 pb-4 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10 text-on-surface dark:divide-stone-700/50 dark:text-white">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-sm text-on-surface-variant dark:text-stone-400">
                                            {search || roleFilter ? 'No users match your filters' : 'No users found'}
                                        </td>
                                    </tr>
                                ) : filteredUsers.map((user, index) => (
                                    <tr key={user.id} className="transition-colors hover:bg-surface-container-low/55 dark:hover:bg-stone-800/50">
                                        <td className="px-3 py-4 text-sm text-on-surface-variant dark:text-stone-500">
                                            {String(index + 1).padStart(2, '0')}
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=b7102a&color=fff&size=64`}
                                                    alt={user.name || 'User avatar'}
                                                    className="h-9 w-9 rounded-full border border-outline-variant/20 object-cover dark:border-stone-700"
                                                />
                                                <div>
                                                    <p className="font-headline text-sm font-semibold text-on-surface dark:text-white">
                                                        {user.name}
                                                    </p>
                                                    <p className="text-xs text-on-surface-variant dark:text-stone-500">
                                                        #{user.id}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-sm text-on-surface-variant dark:text-stone-400">
                                            {user.email}
                                        </td>
                                        <td className="px-3 py-4">
                                            <RoleBadge role={user.role} />
                                        </td>
                                        <td className="px-3 py-4 text-center">
                                            <StatusBadge status={user.status ?? user.is_active} />
                                        </td>
                                        <td className="px-3 py-4 text-right text-sm whitespace-nowrap text-on-surface-variant dark:text-stone-400">
                                            {user.created_at
                                                ? new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                                : '-'}
                                        </td>
                                        <td className="px-3 py-4 text-right">
                                            <UserActionsMenu
                                                user={user}
                                                busy={pendingUserId === user.id}
                                                inTrash={activeTab === 'trash'}
                                                onEdit={openEditModal}
                                                onToggleStatus={openStatusConfirm}
                                                onRecover={handleRecover}
                                                onDelete={openDeleteConfirm}
                                                onForceDelete={openForceDeleteConfirm}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-5 border-t border-outline-variant/15 pt-4 dark:border-stone-700/50">
                        <span className="text-sm text-on-surface-variant dark:text-stone-400">
                            Showing {filteredUsers.length} of {items.length} users
                        </span>
                    </div>
                </div>
            )}

            {modalState.open && (
                <UserModal
                    mode={modalState.mode}
                    user={modalState.user}
                    submitting={
                        modalState.mode === 'create'
                            ? pendingUserId === 'create'
                            : !!modalState.user && pendingUserId === modalState.user.id
                    }
                    error={modalError}
                    onClose={closeModal}
                    onSubmit={handleModalSubmit}
                />
            )}

            <ConfirmStatusModal
                state={confirmState}
                submitting={confirmState.user ? pendingUserId === confirmState.user.id : false}
                onClose={closeConfirm}
                onConfirm={handleStatusUpdate}
            />

            <ConfirmDeleteModal
                state={deleteState}
                submitting={deleteState.user ? pendingUserId === deleteState.user.id : false}
                onClose={closeDeleteConfirm}
                onConfirm={handleDelete}
            />
        </div>
    );
}
