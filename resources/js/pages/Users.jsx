import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers, updateUserStatus } from '../store/slices/usersSlice';

const ROLE_COLORS = {
    admin:     'bg-primary/10 text-primary dark:bg-primary/20 dark:text-red-400',
    director:  'bg-tertiary/10 text-tertiary dark:bg-tertiary/20 dark:text-tertiary-fixed',
    faculty:   'bg-secondary/10 text-secondary dark:bg-secondary/20 dark:text-red-300',
    student:   'bg-surface-container-high dark:bg-stone-800 text-on-surface-variant dark:text-stone-400',
};

function RoleBadge({ role }) {
    const cls = ROLE_COLORS[role?.toLowerCase()] || ROLE_COLORS.student;
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${cls}`}>
            {role || 'user'}
        </span>
    );
}

function StatusDot({ status }) {
    const active = status === 'active' || status == null;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            active
                ? 'bg-tertiary-fixed text-on-tertiary-fixed dark:bg-tertiary-fixed/20 dark:text-tertiary-fixed'
                : 'bg-surface-variant dark:bg-stone-700 text-on-surface-variant dark:text-stone-300'
        }`}>
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

export default function Users() {
    const dispatch = useDispatch();
    const { items, loading, error } = useSelector(s => s.users);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [updatingId, setUpdatingId] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, user: null, newStatus: '' });

    const handleUpdateStatus = async () => {
        if (!confirmModal.user) return;
        setUpdatingId(confirmModal.user.id);
        const { user, newStatus } = confirmModal;
        setConfirmModal({ isOpen: false, user: null, newStatus: '' });
        
        await dispatch(updateUserStatus({ uuid: user.uuid, id: user.id, status: newStatus }));
        setUpdatingId(null);
    };

    useEffect(() => {
        dispatch(fetchUsers());
    }, [dispatch]);

    const filtered = items.filter(u => {
        const matchSearch = !search ||
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase());
        const matchRole = !roleFilter || u.role?.toLowerCase() === roleFilter;
        return matchSearch && matchRole;
    });

    const roles = [...new Set(items.map(u => u.role).filter(Boolean))];

    return (
        <div className="p-6 md:p-8 lg:px-12 max-w-7xl mx-auto w-full">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-5">
                <div>
                    <h1 className="font-headline text-4xl font-extrabold text-on-surface dark:text-white tracking-tighter mb-3">
                        Users
                    </h1>
                    <p className="text-on-surface-variant dark:text-stone-400 text-base leading-relaxed font-body">
                        All registered users including Google-authenticated accounts.
                    </p>
                </div>
                <div className="shrink-0 py-2 px-4 rounded-full bg-surface-container dark:bg-stone-800 text-on-surface-variant dark:text-stone-400 text-sm font-semibold font-body">
                    {items.length} total
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 bg-error-container/30 border border-error/20 rounded-2xl px-4 py-3 text-sm text-error dark:text-red-400 mb-5">
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>error</span>
                    {error}
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-surface-container-lowest dark:bg-stone-900 border border-outline-variant/20 dark:border-stone-700/50 rounded-full px-4 py-2.5">
                    <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '1rem' }}>search</span>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or email…"
                        className="flex-1 bg-transparent text-sm text-on-surface dark:text-white placeholder-on-surface-variant/50 outline-none font-body"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="bg-surface-container-lowest dark:bg-stone-900 border border-outline-variant/20 dark:border-stone-700/50 rounded-full px-4 py-2.5 text-sm text-on-surface dark:text-white outline-none font-body"
                >
                    <option value="">All Roles</option>
                    {roles.map(r => <option key={r} value={r.toLowerCase()}>{r}</option>)}
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <span className="w-10 h-10 border-t-primary rounded-full animate-spin" style={{ borderWidth: '3px', borderColor: 'rgba(183,16,42,0.2)', borderTopColor: '#b7102a' }} />
                    <p className="text-on-surface-variant font-body text-sm">Loading users…</p>
                </div>
            ) : (
                <div className="bg-surface-container-lowest dark:bg-stone-900 rounded-[2rem] p-6 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.04)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] border border-outline-variant/10 dark:border-stone-700/30">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-on-surface-variant dark:text-stone-400 font-headline text-xs uppercase tracking-wider border-b border-outline-variant/20 dark:border-stone-700">
                                    <th className="pb-4 font-semibold w-12 px-3">ID</th>
                                    <th className="pb-4 font-semibold px-3">User</th>
                                    <th className="pb-4 font-semibold px-3 hidden sm:table-cell">Email</th>
                                    <th className="pb-4 font-semibold px-3 hidden md:table-cell">Role</th>
                                    <th className="pb-4 font-semibold px-3 text-center w-28">Status</th>
                                    <th className="pb-4 font-semibold px-3 hidden lg:table-cell text-right">Joined</th>
                                    <th className="pb-4 font-semibold px-3 text-right w-20">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-on-surface dark:text-white font-body divide-y divide-outline-variant/10 dark:divide-stone-700/50">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-on-surface-variant dark:text-stone-400 text-sm">
                                            {search || roleFilter ? 'No users match your filters' : 'No users found'}
                                        </td>
                                    </tr>
                                ) : filtered.map((user, idx) => (
                                    <tr key={user.id} className="group hover:bg-surface-container-low/50 dark:hover:bg-stone-800/50 transition-colors duration-300">
                                        <td className="py-4 px-3 text-sm text-on-surface-variant dark:text-stone-500">
                                            {String(idx + 1).padStart(2, '0')}
                                        </td>
                                        <td className="py-4 px-3">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=b7102a&color=fff&size=64`}
                                                    alt={user.name}
                                                    className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-outline-variant/20 dark:border-stone-700"
                                                />
                                                <span className="font-headline font-semibold text-base text-on-surface dark:text-white">
                                                    {user.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-3 hidden sm:table-cell text-sm text-on-surface-variant dark:text-stone-400">
                                            {user.email}
                                        </td>
                                        <td className="py-4 px-3 hidden md:table-cell">
                                            <RoleBadge role={user.role} />
                                        </td>
                                        <td className="py-4 px-3 text-center">
                                            <StatusDot status={user.status} />
                                        </td>
                                        <td className="py-4 px-3 hidden lg:table-cell text-sm text-on-surface-variant dark:text-stone-400 text-right">
                                            {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                        </td>
                                        <td className="py-4 px-3 text-right">
                                            <div className="flex items-center justify-end">
                                                <button
                                                    onClick={() => setConfirmModal({ isOpen: true, user, newStatus: user.status === 'active' || user.status == null ? 'inactive' : 'active' })}
                                                    disabled={updatingId === user.id}
                                                    title={user.status === 'active' || user.status == null ? 'Deactivate User' : 'Activate User'}
                                                    className={`p-2 rounded-full transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
                                                        user.status === 'active' || user.status == null
                                                            ? 'bg-surface-container dark:bg-stone-800 hover:bg-error-container dark:hover:bg-red-900/30 text-on-surface-variant dark:text-stone-400 hover:text-error dark:hover:text-red-400'
                                                            : 'bg-surface-container dark:bg-stone-800 hover:bg-tertiary-container dark:hover:bg-tertiary/20 text-on-surface-variant dark:text-stone-400 hover:text-tertiary dark:hover:text-tertiary-fixed'
                                                    }`}
                                                >
                                                    {updatingId === user.id ? (
                                                        <span className="w-5 h-5 border-2 border-t-transparent border-current rounded-full animate-spin"></span>
                                                    ) : (
                                                        <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                                                            {user.status === 'active' || user.status == null ? 'person_off' : 'how_to_reg'}
                                                        </span>
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-5 border-t border-outline-variant/15 dark:border-stone-700/50 pt-5">
                        <span className="text-sm text-on-surface-variant dark:text-stone-400 font-body">
                            Showing {filtered.length} of {items.length} users
                        </span>
                    </div>
                </div>
            )}
            {/* Confirmation Modal */}
            {confirmModal.isOpen && confirmModal.user && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-surface dark:bg-stone-900 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-outline-variant/20 dark:border-stone-700 animate-in fade-in zoom-in-95 duration-200">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto ${
                            confirmModal.newStatus === 'active' 
                                ? 'bg-tertiary-container dark:bg-tertiary/20 text-tertiary dark:text-tertiary-fixed'
                                : 'bg-error-container dark:bg-red-900/30 text-error dark:text-red-400'
                        }`}>
                            <span className="material-symbols-outlined text-3xl">
                                {confirmModal.newStatus === 'active' ? 'how_to_reg' : 'warning'}
                            </span>
                        </div>
                        <h2 className="font-headline text-xl font-bold text-center text-on-surface dark:text-white mb-2">
                            {confirmModal.newStatus === 'active' ? 'Activate User?' : 'Deactivate User?'}
                        </h2>
                        <p className="text-on-surface-variant dark:text-stone-400 text-center text-sm font-body mb-8">
                            Are you sure you want to {confirmModal.newStatus} <strong>{confirmModal.user.name}</strong>? 
                            {confirmModal.newStatus === 'inactive' && " They will no longer be able to access the platform."}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmModal({ isOpen: false, user: null, newStatus: '' })}
                                className="flex-1 py-3 px-4 rounded-full border border-outline-variant dark:border-stone-700 text-on-surface-variant dark:text-stone-300 font-bold text-sm hover:bg-surface-variant dark:hover:bg-stone-800 transition-colors font-headline"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateStatus}
                                className={`flex-1 py-3 px-4 rounded-full font-bold text-sm text-white transition-colors font-headline ${
                                    confirmModal.newStatus === 'active' 
                                        ? 'bg-tertiary hover:bg-tertiary/90 dark:bg-tertiary-fixed dark:text-tertiary dark:hover:bg-tertiary-fixed/90' 
                                        : 'bg-error hover:bg-error/90 dark:bg-red-500 dark:hover:bg-red-400'
                                }`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
