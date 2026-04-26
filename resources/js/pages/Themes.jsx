import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOccasionTypes } from '../store/slices/occasionTypesSlice';
import {
    clearError,
    createTheme,
    deleteTheme,
    fetchThemes,
    updateTheme,
} from '../store/slices/themesSlice';
import { getThemeComponent, hasThemeComponent } from '../themes';
import ImageUploader from '../components/ImageUploader';

const SOURCE_OPTIONS = [
    { value: 'internal', label: 'Internal' },
    { value: 'community', label: 'Community' },
];

const PREVIEW_THEME_DATA = {
    people: [{ name: 'Aarav' }, { name: 'Mira' }],
    eventDate: '14 February 2027',
    location: 'Kolkata',
    summary: 'A reusable story payload powering handcrafted React themes across the product.',
    milestones: [
        { title: 'First Conversation', date: '2019', description: 'The spark that started everything.' },
        { title: 'The Proposal', date: '2025', description: 'A promise wrapped in intention and joy.' },
        { title: 'The Celebration', date: '2027', description: 'Family, laughter, and a room full of memories.' },
    ],
};

const THEME_PREVIEW_FRAME_HTML = `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
        html, body, #theme-preview-root {
            margin: 0;
            min-height: 100%;
            width: 100%;
            background: transparent;
        }

        body {
            overflow: auto;
        }
    </style>
</head>
<body>
    <div id="theme-preview-root"></div>
</body>
</html>`;

function slugify(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function reorderThemes(list, sourceId, targetId) {
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

function getErrorText(error) {
    if (!error) {
        return '';
    }

    if (typeof error === 'string') {
        return error;
    }

    if (Array.isArray(error)) {
        return error.join(' ');
    }

    if (typeof error === 'object') {
        return Object.values(error)
            .flat()
            .map((value) => String(value))
            .join(' ');
    }

    return String(error);
}

function getOccasionName(occasionTypes, occasionTypeId) {
    if (!occasionTypeId) {
        return 'All occasions';
    }

    return occasionTypes.find((item) => String(item?.id) === String(occasionTypeId))?.name || 'Unknown occasion';
}

function buildFormState(initialData) {
    return {
        name: initialData?.name ?? '',
        slug: initialData?.slug ?? '',
        description: initialData?.description ?? '',
        preview_image: initialData?.preview_image ?? '',
        occasion_type_id: initialData?.occasion_type_id ? String(initialData.occasion_type_id) : '',
        author_name: initialData?.author_name ?? '',
        author_url: initialData?.author_url ?? '',
        version: initialData?.version ?? '1.0.0',
        source: initialData?.source ?? 'internal',
        is_active: initialData?.is_active ?? true,
        is_premium: initialData?.is_premium ?? false,
        config: initialData?.config ? JSON.stringify(initialData.config, null, 2) : '',
    };
}

function StatusBadge({ active }) {
    return active ? (
        <span className="inline-flex items-center rounded-full bg-tertiary-fixed px-3 py-1 text-xs font-semibold text-on-tertiary-fixed dark:bg-tertiary-fixed/20 dark:text-tertiary-fixed">
            Active
        </span>
    ) : (
        <span className="inline-flex items-center rounded-full bg-surface-variant px-3 py-1 text-xs font-semibold text-on-surface-variant dark:bg-stone-700 dark:text-stone-300">
            Inactive
        </span>
    );
}

function PremiumBadge({ premium }) {
    return premium ? (
        <span className="inline-flex items-center rounded-full bg-secondary-fixed px-3 py-1 text-xs font-semibold text-on-secondary-fixed dark:bg-secondary-fixed/20 dark:text-secondary-fixed">
            Premium
        </span>
    ) : (
        <span className="inline-flex items-center rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant dark:bg-stone-800 dark:text-stone-300">
            Standard
        </span>
    );
}

function RegistryBadge({ slug }) {
    const registered = hasThemeComponent(slug);

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            registered
                ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-red-300'
                : 'bg-surface-container text-on-surface-variant dark:bg-stone-800 dark:text-stone-400'
        }`}>
            <span className={`h-2 w-2 rounded-full ${registered ? 'bg-primary dark:bg-red-400' : 'bg-on-surface-variant/40 dark:bg-stone-500'}`} />
            {registered ? 'Registered' : 'Pending'}
        </span>
    );
}

function ThemeThumb({ item }) {
    if (item?.preview_image) {
        return (
            <img
                src={item.preview_image}
                alt={`${item.name} preview`}
                className="h-14 w-14 rounded-[1.2rem] object-cover shadow-sm"
            />
        );
    }

    return (
        <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-[linear-gradient(135deg,rgba(183,16,42,0.12),rgba(214,181,116,0.18))] text-primary shadow-sm dark:bg-[linear-gradient(135deg,rgba(239,68,68,0.18),rgba(59,130,246,0.18))] dark:text-red-300">
            <span className="material-symbols-outlined" style={{ fontSize: '1.35rem' }}>palette</span>
        </div>
    );
}

function EmptyState({ onAdd }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '2rem' }}>palette</span>
            </div>
            <p className="mb-1 font-headline text-lg font-semibold text-on-surface">No themes yet</p>
            <p className="mb-6 font-body text-sm text-on-surface-variant">Create your first theme configuration to get started</p>
            <button
                onClick={onAdd}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-container px-7 py-3 text-sm font-bold text-on-primary shadow-[0_10px_30px_-10px_rgba(183,16,42,0.3)] transition-all hover:scale-[1.02] active:scale-98"
            >
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>add</span>
                Add Theme
            </button>
        </div>
    );
}

function ThemeRendererPreview({ slug, data }) {
    const registered = hasThemeComponent(slug);
    const ThemeComponent = registered ? getThemeComponent(slug) : null;
    const iframeRef = useRef(null);
    const [mountNode, setMountNode] = useState(null);

    if (!registered) {
        return (
            <div className="flex min-h-[18rem] items-center justify-center rounded-[1.6rem] border border-dashed border-outline-variant/30 bg-surface-container px-6 text-center dark:border-stone-700 dark:bg-stone-800">
                <div>
                    <p className="font-headline text-base font-semibold text-on-surface dark:text-white">No local component yet</p>
                    <p className="mt-2 text-sm text-on-surface-variant dark:text-stone-400">
                        Create `resources/js/themes/{slugify(slug) || 'your-theme'}/index.jsx` and register it in `resources/js/themes/index.js`.
                    </p>
                </div>
            </div>
        );
    }

    const syncMountNode = () => {
        const doc = iframeRef.current?.contentDocument;
        const nextMountNode = doc?.getElementById('theme-preview-root');

        if (!doc || !nextMountNode) {
            return;
        }

        doc.documentElement.style.height = '100%';
        doc.body.style.height = '100%';
        doc.body.style.margin = '0';
        doc.body.style.background = 'transparent';
        nextMountNode.style.minHeight = '100%';

        setMountNode(nextMountNode);
    };

    return (
        <div className="relative overflow-hidden rounded-[1.75rem] border border-outline-variant/10 bg-surface shadow-[0_24px_60px_-35px_rgba(0,0,0,0.4)] dark:border-stone-700/60 dark:bg-stone-950">
            {!mountNode && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-container/85 text-sm font-medium text-on-surface-variant backdrop-blur-sm dark:bg-stone-900/85 dark:text-stone-300">
                    Loading live preview...
                </div>
            )}

            <iframe
                ref={iframeRef}
                title={`Theme preview for ${slugify(slug) || 'theme'}`}
                srcDoc={THEME_PREVIEW_FRAME_HTML}
                onLoad={syncMountNode}
                className="block h-[72vh] min-h-[44rem] w-full border-0 bg-white"
            />

            {mountNode ? createPortal(<ThemeComponent data={data} />, mountNode) : null}
        </div>
    );
}

function ThemeModal({ initialData, occasionTypes, onClose, onSubmit, submitting, serverError }) {
    const isEdit = !!initialData;
    const [isVisible, setIsVisible] = useState(false);
    const [jsonError, setJsonError] = useState('');
    const [isSlugManual, setIsSlugManual] = useState(!!initialData?.slug);
    const [form, setForm] = useState(buildFormState(initialData));

    useEffect(() => {
        setIsVisible(true);
    }, []);

    useEffect(() => {
        setForm(buildFormState(initialData));
        setJsonError('');
        setIsSlugManual(!!initialData?.slug);
    }, [initialData]);

    const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
    const normalizedSlug = slugify(form.slug);

    const handleNameChange = (event) => {
        const nextName = event.target.value;

        setForm((current) => ({
            ...current,
            name: nextName,
            slug: isSlugManual ? current.slug : slugify(nextName),
        }));
    };

    const handleSlugChange = (event) => {
        setIsSlugManual(true);
        set('slug', event.target.value.toLowerCase());
    };

    const handleSlugBlur = (event) => {
        set('slug', slugify(event.target.value));
    };

    const previewData = {
        ...PREVIEW_THEME_DATA,
        title: String(form.name || '').trim() || 'Aarav & Mira',
        subtitle: getOccasionName(occasionTypes, form.occasion_type_id) || 'Custom theme',
        summary: String(form.description || '').trim() || PREVIEW_THEME_DATA.summary,
        eyebrow: normalizedSlug || 'theme-preview',
    };
    const handleSubmit = (event) => {
        event.preventDefault();
        setJsonError('');

        if (!String(form.slug || '').trim()) {
            setJsonError('Slug is required so the frontend can resolve the correct theme component.');
            return;
        }

        let parsedConfig = null;
        if (String(form.config || '').trim()) {
            try {
                parsedConfig = JSON.parse(form.config);
            } catch (_) {
                setJsonError('Config must be valid JSON.');
                return;
            }
        }

        onSubmit({
            name: String(form.name || '').trim(),
            slug: normalizedSlug,
            description: String(form.description || '').trim() || null,
            preview_image: String(form.preview_image || '').trim() || null,
            occasion_type_id: form.occasion_type_id ? Number(form.occasion_type_id) : null,
            author_name: String(form.author_name || '').trim() || null,
            author_url: String(form.author_url || '').trim() || null,
            version: String(form.version || '').trim() || '1.0.0',
            source: form.source || 'internal',
            is_active: !!form.is_active,
            is_premium: !!form.is_premium,
            config: parsedConfig,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            <div className={`relative flex max-h-[94vh] w-full max-w-[88rem] flex-col overflow-hidden rounded-[2rem] border border-outline-variant/20 bg-surface-container-lowest shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] transition-all duration-300 dark:border-stone-700/50 dark:bg-stone-900 dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] ${isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-95 opacity-0'}`}>
                <div className="flex items-center justify-between border-b border-outline-variant/15 px-7 py-5 dark:border-stone-700/50">
                    <div>
                        <h2 className="font-headline text-base font-bold text-on-surface dark:text-white">
                            {isEdit ? 'Edit Theme' : 'New Theme'}
                        </h2>
                        <p className="mt-1 text-sm text-on-surface-variant dark:text-stone-400">
                            Keep the slug aligned with your local theme registry for client-side rendering.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface dark:hover:bg-stone-800"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-7 py-6">
                    {(serverError || jsonError) && (
                        <div className="mb-6 rounded-2xl border border-error/20 bg-error-container/30 px-4 py-3 text-xs text-error dark:bg-error-container/20 dark:text-red-400">
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined mt-0.5 flex-shrink-0" style={{ fontSize: '1rem' }}>error</span>
                                <span>{jsonError || getErrorText(serverError)}</span>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-6 xl:grid-cols-2">
                        <div className="space-y-5">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="flex flex-col gap-1.5 sm:col-span-2">
                                    <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                                        Theme Name *
                                    </label>
                                    <input
                                        required
                                        value={form.name}
                                        onChange={handleNameChange}
                                        placeholder="e.g. Rose Gold"
                                        className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container px-4 py-2.5 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary/50 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:focus:border-red-400/50"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                                        Slug *
                                    </label>
                                    <input
                                        required
                                        value={form.slug}
                                        onChange={handleSlugChange}
                                        onBlur={handleSlugBlur}
                                        placeholder="rose-gold"
                                        className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container px-4 py-2.5 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary/50 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:focus:border-red-400/50"
                                    />
                                    <p className="text-xs text-on-surface-variant dark:text-stone-400">
                                        Spaces convert to hyphens automatically.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-1.5 sm:col-span-2">
                                    <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                                        Description
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={form.description}
                                        onChange={(event) => set('description', event.target.value)}
                                        placeholder="What makes this theme feel distinct?"
                                        className="w-full resize-none rounded-2xl border border-outline-variant/30 bg-surface-container px-4 py-2.5 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary/50 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:focus:border-red-400/50"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                                        Occasion Type
                                    </label>
                                    <select
                                        value={form.occasion_type_id}
                                        onChange={(event) => set('occasion_type_id', event.target.value)}
                                        className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container px-4 py-2.5 text-sm text-on-surface outline-none transition-all focus:border-primary/50 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:focus:border-red-400/50"
                                    >
                                        <option value="">All occasions</option>
                                        {occasionTypes.map((occasion) => (
                                            <option key={occasion.id} value={occasion.id}>
                                                {occasion.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                                        Source
                                    </label>
                                    <select
                                        value={form.source}
                                        onChange={(event) => set('source', event.target.value)}
                                        className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container px-4 py-2.5 text-sm text-on-surface outline-none transition-all focus:border-primary/50 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:focus:border-red-400/50"
                                    >
                                        {SOURCE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                                        Version
                                    </label>
                                    <input
                                        value={form.version}
                                        onChange={(event) => set('version', event.target.value)}
                                        placeholder="1.0.0"
                                        className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container px-4 py-2.5 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary/50 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:focus:border-red-400/50"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                                        Author Name
                                    </label>
                                    <input
                                        value={form.author_name}
                                        onChange={(event) => set('author_name', event.target.value)}
                                        placeholder="Internal design team"
                                        className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container px-4 py-2.5 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary/50 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:focus:border-red-400/50"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5 sm:col-span-2">
                                    <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                                        Author URL
                                    </label>
                                    <input
                                        type="url"
                                        value={form.author_url}
                                        onChange={(event) => set('author_url', event.target.value)}
                                        placeholder="https://author.example"
                                        className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container px-4 py-2.5 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary/50 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:focus:border-red-400/50"
                                    />
                                </div>

                                <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() => set('is_active', !form.is_active)}
                                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${
                                            form.is_active
                                                ? 'border-tertiary-fixed/40 bg-tertiary-fixed/20 text-tertiary dark:border-tertiary/30 dark:bg-tertiary/10 dark:text-tertiary-fixed'
                                                : 'border-outline-variant/30 bg-surface-container text-on-surface-variant dark:border-stone-700 dark:bg-stone-800'
                                        }`}
                                    >
                                        <div>
                                            <p className="font-label text-xs font-semibold uppercase tracking-wider">Status</p>
                                            <p className="mt-1 text-sm font-semibold">{form.is_active ? 'Active' : 'Inactive'}</p>
                                        </div>
                                        <span className={`h-3 w-3 rounded-full ${form.is_active ? 'bg-tertiary dark:bg-tertiary-fixed' : 'bg-on-surface-variant/40 dark:bg-stone-500'}`} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => set('is_premium', !form.is_premium)}
                                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${
                                            form.is_premium
                                                ? 'border-secondary-fixed/40 bg-secondary-fixed/15 text-secondary dark:border-secondary/30 dark:bg-secondary/10 dark:text-secondary-fixed'
                                                : 'border-outline-variant/30 bg-surface-container text-on-surface-variant dark:border-stone-700 dark:bg-stone-800'
                                        }`}
                                    >
                                        <div>
                                            <p className="font-label text-xs font-semibold uppercase tracking-wider">Plan</p>
                                            <p className="mt-1 text-sm font-semibold">{form.is_premium ? 'Premium' : 'Standard'}</p>
                                        </div>
                                        <span className={`material-symbols-outlined ${form.is_premium ? 'text-secondary dark:text-secondary-fixed' : 'text-on-surface-variant dark:text-stone-400'}`}>
                                            diamond
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-[1.75rem] border border-outline-variant/15 bg-surface-container p-4 dark:border-stone-700/50 dark:bg-stone-800">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="font-headline text-base font-semibold text-on-surface dark:text-white">Registry Status</p>
                                        <p className="mt-1 text-sm text-on-surface-variant dark:text-stone-400">
                                            The slug should match a local component folder for client rendering.
                                        </p>
                                    </div>
                                    <RegistryBadge slug={normalizedSlug} />
                                </div>

                                <div className="mt-3 space-y-2 text-sm text-on-surface-variant dark:text-stone-400">
                                    <p>
                                        Folder: <span className="font-mono text-on-surface dark:text-stone-200">resources/js/themes/{normalizedSlug || 'theme-slug'}/index.jsx</span>
                                    </p>
                                    <p>
                                        Registry key: <span className="font-mono text-on-surface dark:text-stone-200">'{normalizedSlug || 'theme-slug'}'</span>
                                    </p>
                                </div>

                                <div className="mt-4 border-t border-outline-variant/10 pt-4 dark:border-stone-700/40">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-headline text-base font-semibold text-on-surface dark:text-white">Cover Image</p>
                                            <p className="mt-1 text-sm text-on-surface-variant dark:text-stone-400">
                                                Upload a cover image; it is stored and the URL is saved on this theme (same flow as story images).
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <ImageUploader
                                            label="Theme cover"
                                            value={String(form.preview_image || '').trim()}
                                            onUploadSuccess={(url) => set('preview_image', url)}
                                            onRemove={() => set('preview_image', '')}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[1.75rem] border border-outline-variant/15 bg-surface-container p-4 dark:border-stone-700/50 dark:bg-stone-800">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-headline text-base font-semibold text-on-surface dark:text-white">Config JSON</p>
                                    </div>
                                </div>

                                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                                        <textarea
                                            rows={7}
                                            value={form.config}
                                            onChange={(event) => set('config', event.target.value)}
                                            placeholder={'{\n  "palette": "rose-gold",\n  "layout": "hero-left"\n}'}
                                            className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container px-4 py-3 font-mono text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary/50 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:focus:border-red-400/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-headline text-base font-semibold text-on-surface dark:text-white">Live Theme Preview</p>
                                <p className="mt-1 text-sm text-on-surface-variant dark:text-stone-400">
                                    The preview now renders full-width inside its own frame so sticky headers and floating buttons stay contained.
                                </p>
                            </div>
                        </div>

                        <ThemeRendererPreview slug={normalizedSlug} data={previewData} />
                    </div>

                    <div className="mt-6 flex gap-3 border-t border-outline-variant/15 pt-6 dark:border-stone-700/50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-full border border-outline-variant/30 py-3 text-sm font-bold text-on-surface-variant transition-all hover:bg-surface-container hover:text-on-surface dark:border-stone-700 dark:hover:bg-stone-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-container py-3 text-sm font-bold text-on-primary shadow-[0_10px_30px_-10px_rgba(183,16,42,0.4)] transition-all hover:scale-[1.02] active:scale-98 disabled:opacity-50"
                        >
                            {submitting ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary" />
                            ) : (
                                <>
                                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{isEdit ? 'save' : 'add'}</span>
                                    {isEdit ? 'Save Changes' : 'Create Theme'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

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
            <div className={`relative w-full max-w-sm rounded-[2rem] border border-outline-variant/20 bg-surface-container-lowest p-7 text-center shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] transition-all duration-300 dark:border-stone-700/50 dark:bg-stone-900 ${isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-95 opacity-0'}`}>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error-container/30 dark:bg-red-900/30">
                    <span className="material-symbols-outlined text-error dark:text-red-400" style={{ fontSize: '1.5rem' }}>delete</span>
                </div>
                <h3 className="mb-2 font-headline text-base font-bold text-on-surface dark:text-white">Delete "{item.name}"?</h3>
                <p className="mb-6 font-body text-sm text-on-surface-variant dark:text-stone-400">
                    This soft-deletes the theme record. It cannot be undone from the UI.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-full border border-outline-variant/30 py-3 text-sm font-bold text-on-surface-variant transition-all hover:bg-surface-container hover:text-on-surface dark:border-stone-700 dark:hover:bg-stone-800"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={submitting}
                        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-error py-3 text-sm font-bold text-on-error transition-all hover:scale-[1.02] active:scale-98 disabled:opacity-50"
                    >
                        {submitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-error/30 border-t-on-error" /> : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ThemeActionsMenu({ item, busy, onEdit, onDelete }) {
    const buttonRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState(null);

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

    const menu = open && position && typeof document !== 'undefined'
        ? createPortal(
            <>
                <button
                    type="button"
                    aria-label="Close theme menu"
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 z-50 cursor-default bg-transparent"
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
                        Edit theme
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
                        Delete theme
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

export default function Themes() {
    const dispatch = useDispatch();
    const { items, loading, submitting, error } = useSelector((state) => state.themes);
    const { items: occasionTypes } = useSelector((state) => state.occasionTypes);

    const [orderedItems, setOrderedItems] = useState([]);
    const [modal, setModal] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [pendingId, setPendingId] = useState(null);
    const [draggedId, setDraggedId] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);
    const [isReordering, setIsReordering] = useState(false);
    const [search, setSearch] = useState('');
    const [filterActive, setFilterActive] = useState('all');

    useEffect(() => {
        dispatch(fetchThemes());
        dispatch(fetchOccasionTypes());
    }, [dispatch]);

    useEffect(() => {
        if (!isReordering) {
            setOrderedItems(items);
        }
    }, [items, isReordering]);

    const canReorder = !search && filterActive === 'all';
    const errorText = getErrorText(error);

    const filtered = orderedItems
        .filter(Boolean)
        .filter((item) => {
            if (filterActive === 'active') {
                return !!item?.is_active;
            }

            if (filterActive === 'inactive') {
                return !item?.is_active;
            }

            return true;
        })
        .filter((item) => {
            const occasionName = getOccasionName(occasionTypes, item?.occasion_type_id);
            const haystack = [
                item?.name,
                item?.slug,
                item?.description,
                item?.source,
                item?.version,
                occasionName,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(search.toLowerCase());
        });

    const openCreate = () => {
        dispatch(clearError());
        setModal('create');
    };

    const openEdit = (item) => {
        dispatch(clearError());
        setModal(item);
    };

    const handleCreate = async (data) => {
        setPendingId('create');
        const res = await dispatch(createTheme(data));
        setPendingId(null);

        if (!res.error) {
            setModal(null);
        }
    };

    const handleUpdate = async (data) => {
        if (!modal || modal === 'create') {
            return;
        }

        setPendingId(modal.id);
        const res = await dispatch(updateTheme({ id: modal.id, payload: data }));
        setPendingId(null);

        if (!res.error) {
            setModal(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) {
            return;
        }

        setPendingId(deleteTarget.id);
        const res = await dispatch(deleteTheme(deleteTarget.id));
        setPendingId(null);

        if (!res.error) {
            setDeleteTarget(null);
        }
    };

    const handleDragStart = (event, itemId) => {
        if (!canReorder) {
            return;
        }

        setDraggedId(itemId);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(itemId));
    };

    const handleDragOver = (event, itemId) => {
        if (!canReorder || !draggedId || String(draggedId) === String(itemId)) {
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

        if (!canReorder) {
            handleDragEnd();
            return;
        }

        const sourceId = draggedId || event.dataTransfer.getData('text/plain');
        if (!sourceId || String(sourceId) === String(targetId)) {
            handleDragEnd();
            return;
        }

        const nextItems = reorderThemes(orderedItems, sourceId, targetId);
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
            const result = await dispatch(updateTheme({
                id: item.id,
                payload: { sort_order: Number(item.sort_order) || 0 },
            }));

            if (updateTheme.rejected.match(result)) {
                break;
            }
        }

        await dispatch(fetchThemes());
        setPendingId(null);
        setIsReordering(false);
    };

    return (
        <div className="mx-auto w-full max-w-7xl p-6 md:p-8 lg:px-12">
            <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                <div className="max-w-2xl text-center md:text-left">
                    <h1 className="mb-3 font-headline text-4xl font-extrabold tracking-tighter text-on-surface dark:text-white">
                        Themes
                    </h1>
                    <p className="font-body text-base leading-relaxed text-on-surface-variant dark:text-stone-400">
                        Manage the design system layer that transforms a shared story payload into different presentation styles. Each record links a DB slug to a local React theme component.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="hidden md:flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-container px-7 py-3 text-sm font-bold text-on-primary shadow-[0_20px_40px_-15px_rgba(183,16,42,0.3)] transition-all hover:scale-[1.02] active:scale-98 font-headline"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>add</span>
                    Add New Theme
                </button>
            </div>

            {errorText && (
                <div className="mb-5 flex items-center gap-2 rounded-2xl border border-error/20 bg-error-container/30 px-4 py-3 text-sm text-error dark:text-red-400">
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>error</span>
                    {errorText}
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

            <div className="mb-5 flex flex-wrap items-center gap-3">
                <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest px-4 py-2.5 dark:border-stone-700/50 dark:bg-stone-900">
                    <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '1rem' }}>search</span>
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search themes..."
                        className="flex-1 bg-transparent font-body text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50 dark:text-white"
                    />
                </div>
                <div className="hidden md:flex gap-1 rounded-full bg-surface-container p-1 dark:bg-stone-800">
                    {['all', 'active', 'inactive'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilterActive(tab)}
                            className={`rounded-full px-4 py-1.5 font-label text-xs font-semibold capitalize transition-all ${
                                filterActive === tab
                                    ? 'bg-surface-container-lowest text-on-surface shadow-sm dark:bg-stone-700 dark:text-white'
                                    : 'text-on-surface-variant hover:text-on-surface dark:text-stone-400 dark:hover:text-white'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {!canReorder && (
                <div className="mb-5 rounded-2xl border border-outline-variant/15 bg-surface-container px-4 py-3 text-sm text-on-surface-variant dark:border-stone-700/50 dark:bg-stone-900 dark:text-stone-400">
                    Clear search and filters to reorder themes with drag and drop.
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-20">
                    <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-outline-variant/30 border-t-primary" />
                    <p className="font-body text-sm text-on-surface-variant">Loading themes...</p>
                </div>
            ) : filtered.length === 0 && !search && filterActive === 'all' ? (
                <EmptyState onAdd={openCreate} />
            ) : (
                <div className="rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.04)] dark:border-stone-700/30 dark:bg-stone-900 dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-outline-variant/20 font-headline text-xs uppercase tracking-wider text-on-surface-variant dark:border-stone-700 dark:text-stone-400">
                                    <th className="w-12 px-3 pb-4 font-semibold">ID</th>
                                    <th className="px-3 pb-4 font-semibold">Theme</th>
                                    <th className="px-3 pb-4 font-semibold">Slug</th>
                                    <th className="px-3 pb-4 font-semibold">Occasion</th>
                                    <th className="px-3 pb-4 font-semibold">Component</th>
                                    <th className="px-3 pb-4 text-center font-semibold">Status</th>
                                    <th className="w-20 px-3 pb-4 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10 font-body text-on-surface dark:divide-stone-700/50 dark:text-white">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-sm text-on-surface-variant dark:text-stone-400">
                                            No results found
                                        </td>
                                    </tr>
                                ) : filtered.map((item, index) => (
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
                                        <td className="px-3 py-4 text-sm text-on-surface-variant dark:text-stone-500">
                                            {String(index + 1).padStart(2, '0')}
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="flex items-center gap-3">
                                                <ThemeThumb item={item} />
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-headline text-base font-semibold text-on-surface dark:text-white">
                                                            {item.name}
                                                        </span>
                                                        <PremiumBadge premium={item.is_premium} />
                                                    </div>
                                                    <p className="mt-1 truncate text-sm text-on-surface-variant dark:text-stone-400">
                                                        {item.description || 'No description yet'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-sm text-on-surface-variant dark:text-stone-400">
                                            <code className="rounded-md bg-surface-container px-2 py-1 text-xs dark:bg-stone-800">{item.slug}</code>
                                        </td>
                                        <td className="px-3 py-4 text-sm text-on-surface-variant dark:text-stone-400">
                                            {getOccasionName(occasionTypes, item.occasion_type_id)}
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <RegistryBadge slug={item.slug} />
                                                <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant dark:bg-stone-800 dark:text-stone-300">
                                                    {item.source || 'internal'} {item.version ? `v${item.version}` : ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <StatusBadge active={item.is_active} />
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    draggable={canReorder}
                                                    onDragStart={(event) => handleDragStart(event, item.id)}
                                                    onDragEnd={handleDragEnd}
                                                    disabled={pendingId === 'sort' || !canReorder}
                                                    title={canReorder ? 'Drag to reorder' : 'Clear filters to reorder'}
                                                    className="inline-flex h-9 w-9 cursor-grab items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-700/60 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 dark:hover:text-white"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
                                                </button>
                                                <ThemeActionsMenu
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

                    <div className="mt-5 flex items-center justify-between border-t border-outline-variant/15 pt-5 dark:border-stone-700/50">
                        <span className="font-body text-sm text-on-surface-variant dark:text-stone-400">
                            Showing {filtered.length} of {orderedItems.length} entries
                        </span>
                    </div>
                </div>
            )}

            {modal === 'create' && (
                <ThemeModal
                    occasionTypes={occasionTypes}
                    onClose={() => setModal(null)}
                    onSubmit={handleCreate}
                    submitting={submitting && pendingId === 'create'}
                    serverError={error}
                />
            )}
            {modal && modal !== 'create' && (
                <ThemeModal
                    initialData={modal}
                    occasionTypes={occasionTypes}
                    onClose={() => setModal(null)}
                    onSubmit={handleUpdate}
                    submitting={submitting && pendingId === modal.id}
                    serverError={error}
                />
            )}
            {deleteTarget && (
                <DeleteDialog
                    item={deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                    submitting={submitting && pendingId === deleteTarget.id}
                />
            )}
        </div>
    );
}
