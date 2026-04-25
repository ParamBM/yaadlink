import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createPortal } from 'react-dom';
import {
    clearAiError,
    clearError,
    createStory,
    deleteStory,
    enhanceStory,
    fetchStories,
    updateStory,
} from '../store/slices/storiesSlice';
import { fetchThemes } from '../store/slices/themesSlice';
import { fetchOccasionTypes } from '../store/slices/occasionTypesSlice';
import ImageUploader from '../components/ImageUploader';
import { isPrivilegedRole } from '@/lib/auth';

function slugify(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
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

function formatDate(value) {
    if (!value) {
        return 'No date';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return String(value);
    }

    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(parsed);
}

const MAX_STORY_MILESTONES = 4;
const MAX_STORY_IMAGES = 4;

function parseOptionalId(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const parsed = Number(value);

    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function buildMilestoneState(item = {}) {
    return {
        title: String(item?.title ?? ''),
        description: String(item?.description ?? ''),
        event_date: String(item?.event_date ?? item?.date ?? ''),
        image_url: String(item?.image_url ?? ''),
    };
}

function buildImageState(item = {}) {
    return {
        url: String(item?.url ?? item?.src ?? ''),
        caption: String(item?.caption ?? ''),
    };
}

function getThemeOccasionId(theme) {
    if (!theme?.occasion_type_id) {
        return '';
    }

    return String(theme.occasion_type_id);
}

function isUniversalTheme(theme) {
    return !!theme && !getThemeOccasionId(theme);
}

function normalizeMilestonesForSubmit(items) {
    return items
        .map((item) => ({
            title: String(item?.title ?? '').trim(),
            description: String(item?.description ?? '').trim(),
            event_date: String(item?.event_date ?? '').trim(),
            image_url: String(item?.image_url ?? '').trim(),
        }))
        .filter((item) => item.title || item.description || item.event_date || item.image_url)
        .map((item) => ({
            title: item.title,
            description: item.description || null,
            event_date: item.event_date || null,
            image_url: item.image_url || null,
        }));
}

function normalizeImagesForSubmit(items) {
    return items
        .map((item) => ({
            url: String(item?.url ?? '').trim(),
            caption: String(item?.caption ?? '').trim(),
        }))
        .filter((item) => item.url || item.caption)
        .map((item) => ({
            url: item.url,
            caption: item.caption || null,
        }));
}

function buildFormState(initialData) {
    return {
        slug: initialData?.slug ?? '',
        occasion_type_id: initialData?.occasion_type_id ? String(initialData.occasion_type_id) : '',
        theme_id: initialData?.theme_id ? String(initialData.theme_id) : '',
        person_one_name: initialData?.person_one_name ?? '',
        person_two_name: initialData?.person_two_name ?? '',
        start_date: initialData?.start_date ?? '',
        tagline: initialData?.tagline ?? '',
        story: initialData?.story ?? '',
        final_message: initialData?.final_message ?? '',
        cover_image_url: initialData?.cover_image_url ?? '',
        milestones: Array.isArray(initialData?.milestones)
            ? initialData.milestones.slice(0, MAX_STORY_MILESTONES).map((item) => buildMilestoneState(item))
            : [],
        images: Array.isArray(initialData?.images)
            ? initialData.images.slice(0, MAX_STORY_IMAGES).map((item) => buildImageState(item))
            : [],
        ai_polished: initialData?.ai_polished ?? false,
        ai_model: initialData?.ai_model ?? '',
        is_branding_hidden: initialData?.is_branding_hidden ?? false,
        is_published: initialData?.is_published ?? false,
    };
}

function StoryStatusBadge({ story }) {
    if (story?.is_published) {
        return (
            <span className="inline-flex items-center rounded-full bg-tertiary-fixed px-3 py-1 text-xs font-semibold text-on-tertiary-fixed dark:bg-tertiary-fixed/20 dark:text-tertiary-fixed">
                Published
            </span>
        );
    }

    return (
        <span className="inline-flex items-center rounded-full bg-secondary-fixed/20 px-3 py-1 text-xs font-semibold text-secondary dark:bg-secondary-fixed/15 dark:text-secondary-fixed">
            Pending Approval
        </span>
    );
}

function StoryThumb({ item }) {
    if (item?.cover_image_url) {
        return (
            <img
                src={item.cover_image_url}
                alt={`${item?.title || 'Story'} cover`}
                className="h-14 w-14 rounded-[1.15rem] object-cover shadow-sm"
            />
        );
    }

    return (
        <div className="flex h-14 w-14 items-center justify-center rounded-[1.15rem] bg-[linear-gradient(135deg,rgba(183,16,42,0.12),rgba(214,181,116,0.18))] text-primary shadow-sm dark:bg-[linear-gradient(135deg,rgba(239,68,68,0.18),rgba(59,130,246,0.18))] dark:text-red-300">
            <span className="material-symbols-outlined text-[1.35rem]">auto_stories</span>
        </div>
    );
}

function EmptyState({ onAdd, isAdmin }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
                <span className="material-symbols-outlined text-on-surface-variant text-[2rem]">auto_stories</span>
            </div>
            <p className="mb-1 font-headline text-lg font-semibold text-on-surface dark:text-white">No stories yet</p>
            <p className="mb-6 max-w-md font-body text-sm text-on-surface-variant dark:text-stone-400">
                {isAdmin
                    ? 'Create the first published story or review submissions from your team here.'
                    : 'Create your first story. It will stay pending until an admin approves it.'}
            </p>
            <button
                onClick={onAdd}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-container px-7 py-3 text-sm font-bold text-on-primary shadow-[0_10px_30px_-10px_rgba(183,16,42,0.3)] transition-all hover:scale-[1.02] active:scale-98"
            >
                <span className="material-symbols-outlined text-[1.1rem]">add</span>
                Add Story
            </button>
        </div>
    );
}

function StoryModal({
    initialData,
    themes,
    occasionTypes,
    isAdmin,
    onClose,
    onSubmit,
    submitting,
    serverError,
}) {
    const dispatch = useDispatch();
    const isEdit = !!initialData;
    const [isVisible, setIsVisible] = useState(false);
    const [formError, setFormError] = useState('');
    const [isSlugManual, setIsSlugManual] = useState(!!initialData?.slug);
    const [form, setForm] = useState(buildFormState(initialData));
    // ── AI Enhancement state ───────────────────────────────────────────────────
    const [aiSuggestion, setAiSuggestion] = useState(null);   // proposed text from Gemini
    const [aiEnhancing, setAiEnhancing] = useState(false);    // local spinner
    const [aiError, setAiError] = useState('');               // inline error
    const [aiModel, setAiModel] = useState('');               // model name returned by backend
    // ──────────────────────────────────────────────────────────────────────────
    const normalizedSlug = slugify(form.slug);
    const selectedTheme = useMemo(
        () => themes.find((theme) => String(theme?.id) === String(form.theme_id)) || null,
        [themes, form.theme_id]
    );
    const filteredThemes = useMemo(() => {
        const selectedOccasionId = String(form.occasion_type_id || '');

        if (!selectedOccasionId) {
            return themes;
        }

        return themes.filter((theme) => {
            const themeOccasionId = getThemeOccasionId(theme);

            return !themeOccasionId || themeOccasionId === selectedOccasionId;
        });
    }, [themes, form.occasion_type_id]);
    const themeLockedOccasionId = getThemeOccasionId(selectedTheme);
    const isOccasionDisabled = !!themeLockedOccasionId;
    const isUniversalThemeSelected = isUniversalTheme(selectedTheme);
    const lockedOccasionName = themeLockedOccasionId
        ? occasionTypes.find((occasion) => String(occasion?.id) === themeLockedOccasionId)?.name || 'selected occasion'
        : '';

    useEffect(() => {
        setIsVisible(true);
    }, []);

    useEffect(() => {
        setForm(buildFormState(initialData));
        setFormError('');
        setIsSlugManual(!!initialData?.slug);
        // Reset AI state when editing a different story
        setAiSuggestion(null);
        setAiError('');
        setAiEnhancing(false);
    }, [initialData]);

    useEffect(() => {
        if (!selectedTheme) {
            return;
        }

        setForm((current) => {
            const nextOccasionId = getThemeOccasionId(selectedTheme);

            if (!nextOccasionId) {
                return current;
            }

            if (current.occasion_type_id === nextOccasionId) {
                return current;
            }

            return {
                ...current,
                occasion_type_id: nextOccasionId,
            };
        });
    }, [selectedTheme]);

    const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

    // ── AI Enhance handlers ────────────────────────────────────────────────────
    const handleEnhance = async () => {
        const storyText = form.story.trim();
        if (storyText.length < 10) {
            setAiError('Write at least 10 characters in the story field before enhancing.');
            return;
        }
        setAiEnhancing(true);
        setAiError('');
        setAiSuggestion(null);

        const occasionName = occasionTypes.find(
            (o) => String(o.id) === String(form.occasion_type_id)
        )?.name || '';

        const result = await dispatch(enhanceStory({
            story:           storyText,
            person_one_name: form.person_one_name || null,
            person_two_name: form.person_two_name || null,
            tagline:         form.tagline         || null,
            start_date:      form.start_date      || null,
            occasion:        occasionName         || null,
        }));

        setAiEnhancing(false);

        if (enhanceStory.fulfilled.match(result)) {
            setAiSuggestion(result.payload.enhanced_story);
            setAiModel(result.payload.ai_model || 'gemini-2.5-flash');
        } else {
            const msg = typeof result.payload === 'string'
                ? result.payload
                : 'AI enhancement failed. Please try again.';
            setAiError(msg);
        }
    };

    const handleAcceptEnhancement = () => {
        set('story', aiSuggestion);
        set('ai_polished', true);
        set('ai_model', aiModel || 'gemini-2.5-flash');
        setAiSuggestion(null);
        setAiError('');
    };

    const handleRejectEnhancement = () => {
        setAiSuggestion(null);
        setAiError('');
    };
    // ──────────────────────────────────────────────────────────────────────────

    const handlePersonOneChange = (event) => {
        const nextValue = event.target.value;

        setForm((current) => ({
            ...current,
            person_one_name: nextValue,
            slug: isSlugManual ? current.slug : slugify(`${nextValue} ${current.person_two_name || ''} love story`),
        }));
    };

    const handlePersonTwoChange = (event) => {
        const nextValue = event.target.value;

        setForm((current) => ({
            ...current,
            person_two_name: nextValue,
            slug: isSlugManual ? current.slug : slugify(`${current.person_one_name || ''} ${nextValue} love story`),
        }));
    };

    const handleSlugChange = (event) => {
        setIsSlugManual(true);
        set('slug', event.target.value.toLowerCase());
    };

    const handleSlugBlur = (event) => {
        set('slug', slugify(event.target.value));
    };

    const handleOccasionChange = (event) => {
        const nextOccasionId = event.target.value;

        setForm((current) => {
            if (!current.theme_id) {
                return {
                    ...current,
                    occasion_type_id: nextOccasionId,
                };
            }

            const currentTheme = themes.find((theme) => String(theme?.id) === String(current.theme_id));
            const themeOccasionId = getThemeOccasionId(currentTheme);

            return {
                ...current,
                occasion_type_id: nextOccasionId,
                theme_id: themeOccasionId && themeOccasionId !== String(nextOccasionId) ? '' : current.theme_id,
            };
        });
    };

    const handleThemeChange = (event) => {
        const nextThemeId = event.target.value;
        const nextTheme = themes.find((theme) => String(theme?.id) === String(nextThemeId));
        const lockedOccasionId = getThemeOccasionId(nextTheme);

        setForm((current) => ({
            ...current,
            theme_id: nextThemeId,
            occasion_type_id: nextThemeId && lockedOccasionId ? lockedOccasionId : current.occasion_type_id,
        }));
    };

    const updateMilestone = (index, key, value) => {
        setForm((current) => ({
            ...current,
            milestones: current.milestones.map((item, itemIndex) => (
                itemIndex === index ? { ...item, [key]: value } : item
            )),
        }));
    };

    const addMilestone = () => {
        setForm((current) => (
            current.milestones.length >= MAX_STORY_MILESTONES
                ? current
                : {
                    ...current,
                    milestones: [...current.milestones, buildMilestoneState()],
                }
        ));
    };

    const removeMilestone = (index) => {
        setForm((current) => ({
            ...current,
            milestones: current.milestones.filter((_, itemIndex) => itemIndex !== index),
        }));
    };

    const updateImage = (index, key, value) => {
        setForm((current) => ({
            ...current,
            images: current.images.map((item, itemIndex) => (
                itemIndex === index ? { ...item, [key]: value } : item
            )),
        }));
    };

    const addImage = () => {
        setForm((current) => (
            current.images.length >= MAX_STORY_IMAGES
                ? current
                : {
                    ...current,
                    images: [...current.images, buildImageState()],
                }
        ));
    };

    const removeImage = (index) => {
        setForm((current) => ({
            ...current,
            images: current.images.filter((_, itemIndex) => itemIndex !== index),
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setFormError('');

        const parsedMilestones = normalizeMilestonesForSubmit(form.milestones);
        const parsedImages = normalizeImagesForSubmit(form.images);

        if (parsedMilestones.length > MAX_STORY_MILESTONES) {
            setFormError(`You can save up to ${MAX_STORY_MILESTONES} milestones per story.`);
            return;
        }

        if (parsedMilestones.some((item) => !item.title)) {
            setFormError('Each milestone needs a title before you save.');
            return;
        }

        if (parsedImages.length > MAX_STORY_IMAGES) {
            setFormError(`You can save up to ${MAX_STORY_IMAGES} images per story.`);
            return;
        }

        if (parsedImages.some((item) => !item.url)) {
            setFormError('Each image needs a URL before you save.');
            return;
        }

        if (!form.theme_id) {
            setFormError('Select a theme to continue.');
            return;
        }

        if (!form.occasion_type_id) {
            setFormError('Select an occasion type to continue.');
            return;
        }

        onSubmit({
            slug: normalizedSlug || null,
            occasion_type_id: parseOptionalId(form.occasion_type_id),
            theme_id: parseOptionalId(form.theme_id),
            person_one_name: String(form.person_one_name || '').trim(),
            person_two_name: String(form.person_two_name || '').trim(),
            start_date: String(form.start_date || '').trim(),
            tagline: String(form.tagline || '').trim() || null,
            story: String(form.story || '').trim() || null,
            final_message: String(form.final_message || '').trim() || null,
            cover_image_url: String(form.cover_image_url || '').trim() || null,
            milestones: parsedMilestones,
            images: parsedImages,
            ai_polished: !!form.ai_polished,
            ai_model: form.ai_polished ? (form.ai_model || 'gemini-2.5-flash') : null,
            is_branding_hidden: !!form.is_branding_hidden,
            ...(isAdmin && isEdit ? { is_published: !!form.is_published } : {}),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            <div className={`relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-outline-variant/20 bg-surface-container-lowest shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] transition-all duration-300 dark:border-stone-700/50 dark:bg-stone-900 dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] ${isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-95 opacity-0'}`}>
                <div className="flex items-center justify-between border-b border-outline-variant/15 px-7 py-5 dark:border-stone-700/50">
                    <div>
                        <h2 className="font-headline text-base font-bold text-on-surface dark:text-white">
                            {isEdit ? 'Edit Story' : 'New Story'}
                        </h2>
                        <p className="mt-1 text-sm text-on-surface-variant dark:text-stone-400">
                            {isAdmin
                                ? 'Stories created by admins publish immediately.'
                                : 'Stories created by non-admins stay pending until an admin approves them.'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface dark:hover:bg-stone-800"
                    >
                        <span className="material-symbols-outlined text-[1.15rem]">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-7 py-6">
                    {(serverError || formError) && (
                        <div className="mb-6 rounded-2xl border border-error/20 bg-error-container/30 px-4 py-3 text-xs text-error dark:bg-error-container/20 dark:text-red-400">
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-[1rem]">error</span>
                                <span>{formError || getErrorText(serverError)}</span>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                        <div className="space-y-5">
                            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                                        Person One *
                                    </label>
                                    <input
                                        required
                                        value={form.person_one_name}
                                        onChange={handlePersonOneChange}
                                        placeholder="Aarav"
                                        className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container px-4 py-2.5 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary/50 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:focus:border-red-400/50"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                                        Person Two *
                                    </label>
                                    <input
                                        required
                                        value={form.person_two_name}
                                        onChange={handlePersonTwoChange}
                                        placeholder="Mira"
                                        className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container px-4 py-2.5 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary/50 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:focus:border-red-400/50"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5 sm:col-span-2">
                                    <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                                        Slug
                                    </label>
                                    <input
                                        value={form.slug}
                                        onChange={handleSlugChange}
                                        onBlur={handleSlugBlur}
                                        placeholder="aarav-mira-love-story"
                                        className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container px-4 py-2.5 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary/50 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:focus:border-red-400/50"
                                    />
                                    <p className="text-xs text-on-surface-variant dark:text-stone-400">
                                        Leave blank to auto-generate. Spaces convert to hyphens automatically.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                                        Occasion Type *
                                    </label>
                                    <select
                                        required
                                        value={form.occasion_type_id}
                                        onChange={handleOccasionChange}
                                        disabled={isOccasionDisabled}
                                        className={`w-full rounded-2xl border border-outline-variant/30 bg-surface-container px-4 py-2.5 text-sm text-on-surface outline-none transition-all focus:border-primary/50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:focus:border-red-400/50 ${isOccasionDisabled ? 'disabled:bg-surface-container-high dark:disabled:bg-stone-900' : ''}`}
                                    >
                                        <option value="">Select occasion</option>
                                        {occasionTypes.map((occasion) => (
                                            <option key={occasion.id} value={occasion.id}>
                                                {occasion.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-on-surface-variant dark:text-stone-400">
                                        {isUniversalThemeSelected
                                            ? 'Universal themes work with any occasion, so choose the occasion you want to publish under.'
                                            : themeLockedOccasionId
                                                ? `This theme is locked to ${lockedOccasionName}.`
                                                : 'Pick an occasion first to narrow the theme list, or choose a theme to auto-fill it.'}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                                        Theme *
                                    </label>
                                    <select
                                        required
                                        value={form.theme_id}
                                        onChange={handleThemeChange}
                                        className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container px-4 py-2.5 text-sm text-on-surface outline-none transition-all focus:border-primary/50 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:focus:border-red-400/50"
                                    >
                                        <option value="">{form.occasion_type_id ? 'Select matching theme' : 'Select theme'}</option>
                                        {filteredThemes.map((theme) => (
                                            <option key={theme.id} value={theme.id}>
                                                {theme.name}{!getThemeOccasionId(theme) ? ' (Universal)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-on-surface-variant dark:text-stone-400">
                                        {form.occasion_type_id
                                            ? 'Only themes for this occasion plus universal themes are shown.'
                                            : 'Choose a theme directly to auto-fill the occasion when needed.'}
                                    </p>
                                </div>

                                <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
                                    <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                                        Start Date *
                                    </label>
                                    <input
                                        required
                                        type="date"
                                        value={form.start_date}
                                        onChange={(event) => set('start_date', event.target.value)}
                                        className="block w-full min-w-0 max-w-full appearance-none rounded-2xl border border-outline-variant/30 bg-surface-container px-3 py-2.5 text-sm text-on-surface outline-none transition-all focus:border-primary/50 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:focus:border-red-400/50 sm:px-4"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5 sm:col-span-2">
                                    <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                                        Tagline
                                    </label>
                                    <input
                                        value={form.tagline}
                                        onChange={(event) => set('tagline', event.target.value)}
                                        placeholder="A promise wrapped in intention and joy."
                                        className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container px-4 py-2.5 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary/50 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:focus:border-red-400/50"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5 sm:col-span-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                                            Story
                                        </label>
                                        {form.ai_polished && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary dark:bg-red-400/10 dark:text-red-300">
                                                <span className="material-symbols-outlined text-[0.85rem]">auto_awesome</span>
                                                AI Enhanced
                                            </span>
                                        )}
                                    </div>
                                    <textarea
                                        rows={9}
                                        value={form.story}
                                        onChange={(event) => set('story', event.target.value)}
                                        placeholder="Write the full story here..."
                                        className="w-full resize-none rounded-2xl border border-outline-variant/30 bg-surface-container px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary/50 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:focus:border-red-400/50"
                                    />

                                    {/* ── Enhance button ── */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={handleEnhance}
                                            disabled={aiEnhancing || form.story.trim().length < 10}
                                            title={form.story.trim().length < 10 ? 'Write at least 10 characters first' : 'Enhance your story with AI'}
                                            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-4 py-2 text-xs font-semibold text-primary transition-all hover:bg-primary/15 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-400/30 dark:bg-red-400/8 dark:text-red-300 dark:hover:bg-red-400/15"
                                        >
                                            {aiEnhancing ? (
                                                <>
                                                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                    </svg>
                                                    Enhancing…
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-[1rem]">auto_awesome</span>
                                                    Enhance with AI
                                                </>
                                            )}
                                        </button>
                                        {aiError && (
                                            <p className="flex items-center gap-1 text-xs text-error dark:text-red-400">
                                                <span className="material-symbols-outlined text-[0.9rem]">error</span>
                                                {aiError}
                                            </p>
                                        )}
                                    </div>

                                    {/* ── AI suggestion preview panel ── */}
                                    {aiSuggestion && (
                                        <div className="mt-1 overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 dark:border-red-400/20 dark:bg-red-400/5">
                                            <div className="flex items-center justify-between gap-3 border-b border-primary/15 px-4 py-2.5 dark:border-red-400/15">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[1rem] text-primary dark:text-red-300">auto_awesome</span>
                                                    <p className="text-xs font-semibold text-primary dark:text-red-300">
                                                        AI Suggestion — review before accepting
                                                    </p>
                                                </div>
                                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary dark:bg-red-400/10 dark:text-red-300">
                                                    gemini
                                                </span>
                                            </div>
                                            <p className="whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed text-on-surface dark:text-stone-200">
                                                {aiSuggestion}
                                            </p>
                                            <div className="flex items-center gap-2 border-t border-primary/15 px-4 py-3 dark:border-red-400/15">
                                                <button
                                                    type="button"
                                                    onClick={handleAcceptEnhancement}
                                                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-on-primary shadow-sm transition-all hover:opacity-90 dark:bg-red-500 dark:text-white"
                                                >
                                                    <span className="material-symbols-outlined text-[0.95rem]">check</span>
                                                    Accept
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleRejectEnhancement}
                                                    className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/40 px-4 py-1.5 text-xs font-semibold text-on-surface-variant transition-all hover:bg-surface-container dark:border-stone-600 dark:text-stone-400 dark:hover:bg-stone-800"
                                                >
                                                    <span className="material-symbols-outlined text-[0.95rem]">close</span>
                                                    Keep original
                                                </button>
                                                <p className="ml-auto text-[10px] text-on-surface-variant dark:text-stone-500">
                                                    DB is not updated until you save
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="rounded-[1.75rem] border border-outline-variant/15 bg-surface-container p-5 dark:border-stone-700/50 dark:bg-stone-800">
                                <p className="font-headline text-base font-semibold text-on-surface dark:text-white">Publishing</p>
                                <p className="mt-1 text-sm text-on-surface-variant dark:text-stone-400">
                                    {isAdmin
                                        ? isEdit
                                            ? 'You can approve pending stories or unpublish live ones from here.'
                                            : 'This story will publish immediately because it is being created by an admin.'
                                        : 'This story will remain pending approval until an admin publishes it.'}
                                </p>

                                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-outline-variant/20 bg-surface px-4 py-3 dark:border-stone-700/60 dark:bg-stone-900">
                                        <p className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Current Status</p>
                                        <div className="mt-2">
                                            <StoryStatusBadge story={{ is_published: isEdit ? form.is_published : isAdmin }} />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={!isAdmin || !isEdit}
                                        onClick={() => isAdmin && isEdit && set('is_published', !form.is_published)}
                                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${
                                            isAdmin && isEdit
                                                ? form.is_published
                                                    ? 'border-tertiary-fixed/40 bg-tertiary-fixed/20 text-tertiary dark:border-tertiary/30 dark:bg-tertiary/10 dark:text-tertiary-fixed'
                                                    : 'border-secondary-fixed/40 bg-secondary-fixed/15 text-secondary dark:border-secondary/30 dark:bg-secondary/10 dark:text-secondary-fixed'
                                                : 'cursor-not-allowed border-outline-variant/30 bg-surface-container text-on-surface-variant opacity-75 dark:border-stone-700 dark:bg-stone-900'
                                        }`}
                                    >
                                        <div>
                                            <p className="font-label text-xs font-semibold uppercase tracking-wider">Approval Control</p>
                                            <p className="mt-1 text-sm font-semibold">
                                                {!isAdmin
                                                    ? 'Admin only'
                                                    : !isEdit
                                                        ? 'Auto-published'
                                                        : form.is_published
                                                            ? 'Unpublish'
                                                            : 'Approve & Publish'}
                                            </p>
                                        </div>
                                        <span className={`material-symbols-outlined ${form.is_published ? 'text-tertiary dark:text-tertiary-fixed' : 'text-secondary dark:text-secondary-fixed'}`}>
                                            {form.is_published ? 'visibility_off' : 'task_alt'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-[1.75rem] border border-outline-variant/15 bg-surface-container p-5 dark:border-stone-700/50 dark:bg-stone-800">
                                <div className="grid gap-4">
                                    <ImageUploader
                                        label="Cover Image"
                                        value={form.cover_image_url}
                                        onUploadSuccess={(url) => set('cover_image_url', url)}
                                        onRemove={() => set('cover_image_url', '')}
                                    />

                                    <div className="flex flex-col gap-1.5">
                                        <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                                            Final Message
                                        </label>
                                        <textarea
                                            rows={4}
                                            value={form.final_message}
                                            onChange={(event) => set('final_message', event.target.value)}
                                            placeholder="A final line that closes the story..."
                                            className="w-full resize-none rounded-2xl border border-outline-variant/30 bg-surface-container px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary/50 dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-red-400/50"
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <button
                                            type="button"
                                            onClick={() => set('ai_polished', !form.ai_polished)}
                                            className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${
                                                form.ai_polished
                                                    ? 'border-primary/40 bg-primary/10 text-primary dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300'
                                                    : 'border-outline-variant/30 bg-surface-container text-on-surface-variant dark:border-stone-700 dark:bg-stone-900'
                                            }`}
                                        >
                                            <div>
                                                <p className="font-label text-xs font-semibold uppercase tracking-wider">AI Polish</p>
                                                <p className="mt-1 text-sm font-semibold">{form.ai_polished ? 'Enabled' : 'Disabled'}</p>
                                            </div>
                                            <span className="material-symbols-outlined">auto_awesome</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => set('is_branding_hidden', !form.is_branding_hidden)}
                                            className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${
                                                form.is_branding_hidden
                                                    ? 'border-secondary-fixed/40 bg-secondary-fixed/15 text-secondary dark:border-secondary/30 dark:bg-secondary/10 dark:text-secondary-fixed'
                                                    : 'border-outline-variant/30 bg-surface-container text-on-surface-variant dark:border-stone-700 dark:bg-stone-900'
                                            }`}
                                        >
                                            <div>
                                                <p className="font-label text-xs font-semibold uppercase tracking-wider">Branding</p>
                                                <p className="mt-1 text-sm font-semibold">{form.is_branding_hidden ? 'Hidden' : 'Visible'}</p>
                                            </div>
                                            <span className="material-symbols-outlined">visibility</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-6 xl:grid-cols-2 xl:items-start">
                        <div className="rounded-[1.5rem] border border-outline-variant/20 bg-surface px-4 py-4 dark:border-stone-700/60 dark:bg-stone-900">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                                        Milestones
                                    </p>
                                    <p className="mt-1 text-xs text-on-surface-variant dark:text-stone-400">
                                        Add up to {MAX_STORY_MILESTONES} milestone entries.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={addMilestone}
                                    disabled={form.milestones.length >= MAX_STORY_MILESTONES}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/30 px-3 py-2 text-xs font-semibold text-on-surface transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-700 dark:text-white dark:hover:bg-stone-800"
                                >
                                    <span className="material-symbols-outlined text-[1rem]">add</span>
                                    Add milestone
                                </button>
                            </div>

                            <div className="mt-4 space-y-3">
                                {form.milestones.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-outline-variant/30 px-4 py-5 text-sm text-on-surface-variant dark:border-stone-700 dark:text-stone-400">
                                        No milestones added yet.
                                    </div>
                                ) : form.milestones.map((milestone, index) => (
                                    <div
                                        key={`milestone-${index}`}
                                        className="rounded-[1.35rem] border border-outline-variant/20 bg-surface-container px-4 py-4 dark:border-stone-700/60 dark:bg-stone-800"
                                    >
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <p className="text-sm font-semibold text-on-surface dark:text-white">
                                                Milestone {index + 1}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => removeMilestone(index)}
                                                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-error transition-colors hover:bg-error-container/30 dark:text-red-300 dark:hover:bg-red-950/40"
                                            >
                                                <span className="material-symbols-outlined text-[1rem]">delete</span>
                                                Remove
                                            </button>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                                <label className="font-label text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                                                    Title *
                                                </label>
                                                <input
                                                    value={milestone.title}
                                                    onChange={(event) => updateMilestone(index, 'title', event.target.value)}
                                                    placeholder="First conversation"
                                                    className="w-full rounded-2xl border border-outline-variant/30 bg-surface px-4 py-2.5 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary/50 dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-red-400/50"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <label className="font-label text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                                                    Event Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={milestone.event_date}
                                                    onChange={(event) => updateMilestone(index, 'event_date', event.target.value)}
                                                    className="w-full rounded-2xl border border-outline-variant/30 bg-surface px-4 py-2.5 text-sm text-on-surface outline-none transition-all focus:border-primary/50 dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-red-400/50"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1.5 mt-2">
                                                <ImageUploader
                                                    label="Milestone Image (Optional)"
                                                    value={milestone.image_url}
                                                    onUploadSuccess={(url) => updateMilestone(index, 'image_url', url)}
                                                    onRemove={() => updateMilestone(index, 'image_url', '')}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                                <label className="font-label text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                                                    Description
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={milestone.description}
                                                    onChange={(event) => updateMilestone(index, 'description', event.target.value)}
                                                    placeholder="The spark that started everything."
                                                    className="w-full resize-none rounded-2xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary/50 dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-red-400/50"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[1.5rem] border border-outline-variant/20 bg-surface px-4 py-4 dark:border-stone-700/60 dark:bg-stone-900">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                                        Images
                                    </p>
                                    <p className="mt-1 text-xs text-on-surface-variant dark:text-stone-400">
                                        Add up to {MAX_STORY_IMAGES} gallery items.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={addImage}
                                    disabled={form.images.length >= MAX_STORY_IMAGES}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/30 px-3 py-2 text-xs font-semibold text-on-surface transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-700 dark:text-white dark:hover:bg-stone-800"
                                >
                                    <span className="material-symbols-outlined text-[1rem]">add_photo_alternate</span>
                                    Add image
                                </button>
                            </div>

                            <div className="mt-4 space-y-3">
                                {form.images.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-outline-variant/30 px-4 py-5 text-sm text-on-surface-variant dark:border-stone-700 dark:text-stone-400">
                                        No images added yet.
                                    </div>
                                ) : form.images.map((image, index) => (
                                    <div
                                        key={`image-${index}`}
                                        className="rounded-[1.35rem] border border-outline-variant/20 bg-surface-container px-4 py-4 dark:border-stone-700/60 dark:bg-stone-800"
                                    >
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <p className="text-sm font-semibold text-on-surface dark:text-white">
                                                Image {index + 1}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-error transition-colors hover:bg-error-container/30 dark:text-red-300 dark:hover:bg-red-950/40"
                                            >
                                                <span className="material-symbols-outlined text-[1rem]">delete</span>
                                                Remove
                                            </button>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                                <ImageUploader
                                                    label="Image"
                                                    value={image.url}
                                                    onUploadSuccess={(url) => updateImage(index, 'url', url)}
                                                    onRemove={() => updateImage(index, 'url', '')}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                                <label className="font-label text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                                                    Caption
                                                </label>
                                                <input
                                                    value={image.caption}
                                                    onChange={(event) => updateImage(index, 'caption', event.target.value)}
                                                    placeholder="Our first trip together"
                                                    className="w-full rounded-2xl border border-outline-variant/30 bg-surface px-4 py-2.5 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary/50 dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-red-400/50"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
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
                                    <span className="material-symbols-outlined text-[1rem]">{isEdit ? 'save' : 'add'}</span>
                                    {isEdit ? 'Save Story' : 'Create Story'}
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
                    <span className="material-symbols-outlined text-error dark:text-red-400 text-[1.5rem]">delete</span>
                </div>
                <h3 className="mb-2 font-headline text-base font-bold text-on-surface dark:text-white">
                    Delete "{item?.title || `${item?.person_one_name || ''} & ${item?.person_two_name || ''}`}"?
                </h3>
                <p className="mb-6 font-body text-sm text-on-surface-variant dark:text-stone-400">
                    This soft-deletes the story record. It cannot be undone from the UI.
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

function StoryActionsMenu({ item, busy, isAdmin, onEdit, onDelete, onTogglePublish }) {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const buttonRef = React.useRef(null);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const updatePosition = () => {
            const rect = buttonRef.current?.getBoundingClientRect();
            if (!rect) {
                return;
            }

            const width = 210;
            const height = isAdmin ? 156 : 112;
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
    }, [open, isAdmin]);

    const menu = open && typeof document !== 'undefined'
        ? createPortal(
            <>
                <button
                    type="button"
                    aria-label="Close story menu"
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 z-50 bg-transparent"
                />
                <div
                    className="fixed z-[60] w-[210px] rounded-[1rem] border border-outline-variant/20 bg-surface-container-lowest p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.16)] dark:border-stone-700/60 dark:bg-stone-900"
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
                        Edit story
                    </button>

                    {isAdmin && (
                        <button
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                onTogglePublish(item);
                            }}
                            disabled={busy}
                            className="flex w-full items-center gap-2.5 rounded-[0.85rem] px-3 py-2.5 text-left text-sm font-medium text-secondary transition-colors hover:bg-secondary-fixed/20 disabled:opacity-60 dark:text-secondary-fixed dark:hover:bg-secondary/10"
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                {item?.is_published ? 'visibility_off' : 'task_alt'}
                            </span>
                            {item?.is_published ? 'Unpublish story' : 'Approve & publish'}
                        </button>
                    )}

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
                        Delete story
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

export default function Stories({ mode = 'auto' }) {
    const dispatch = useDispatch();
    const { items, loading, submitting, error } = useSelector((state) => state.stories);
    const { items: themes } = useSelector((state) => state.themes);
    const { items: occasionTypes } = useSelector((state) => state.occasionTypes);
    const { user, role } = useSelector((state) => state.auth);

    const [modal, setModal] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [pendingId, setPendingId] = useState(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const isAdmin = mode === 'admin'
        ? true
        : mode === 'user'
            ? false
            : isPrivilegedRole(role || user?.role);
    const pageTitle = isAdmin ? 'Stories' : 'My Stories';
    const pageDescription = isAdmin
        ? 'Manage the stories that power public microsites. Admin-created stories publish instantly, while non-admin submissions stay pending until approval.'
        : 'Create, edit, and manage only the stories attached to your account. New stories are stored under your user profile automatically.';
    const createButtonLabel = isAdmin ? 'Add New Story' : 'Create Story';
    const errorText = getErrorText(error);

    useEffect(() => {
        dispatch(fetchStories());
        dispatch(fetchThemes());
        dispatch(fetchOccasionTypes());
    }, [dispatch]);

    const stats = useMemo(() => {
        const published = items.filter((item) => item?.is_published).length;
        const pending = items.filter((item) => !item?.is_published).length;

        return {
            total: items.length,
            published,
            pending,
        };
    }, [items]);

    const filtered = useMemo(
        () =>
            items
                .filter(Boolean)
                .filter((item) => {
                    if (filterStatus === 'published') {
                        return !!item?.is_published;
                    }

                    if (filterStatus === 'pending') {
                        return !item?.is_published;
                    }

                    return true;
                })
                .filter((item) => {
                    const haystack = [
                        item?.title,
                        item?.slug,
                        item?.person_one_name,
                        item?.person_two_name,
                        item?.tagline,
                        item?.themeName,
                        item?.occasion,
                    ]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase();

                    return haystack.includes(search.toLowerCase());
                }),
        [items, filterStatus, search]
    );

    const openCreate = () => {
        dispatch(clearError());
        setModal('create');
    };

    const openEdit = (item) => {
        dispatch(clearError());
        setModal(item);
    };

    const handleCreate = async (payload) => {
        setPendingId('create');
        const result = await dispatch(createStory(payload));
        setPendingId(null);

        if (!result.error) {
            setModal(null);
        }
    };

    const handleUpdate = async (payload) => {
        if (!modal || modal === 'create') {
            return;
        }

        setPendingId(modal.id);
        const result = await dispatch(updateStory({ id: modal.id, payload }));
        setPendingId(null);

        if (!result.error) {
            setModal(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) {
            return;
        }

        setPendingId(deleteTarget.id);
        const result = await dispatch(deleteStory(deleteTarget.id));
        setPendingId(null);

        if (!result.error) {
            setDeleteTarget(null);
        }
    };

    const handleTogglePublish = async (item) => {
        if (!item || !isAdmin) {
            return;
        }

        setPendingId(item.id);
        await dispatch(updateStory({
            id: item.id,
            payload: { is_published: !item.is_published },
        }));
        setPendingId(null);
    };

    return (
        <div className="mx-auto w-full max-w-7xl p-6 md:p-8 lg:px-12">
            <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                <div className="max-w-2xl text-center md:text-left">
                    <h1 className="mb-3 font-headline text-4xl font-extrabold tracking-tighter text-on-surface dark:text-white">
                        {pageTitle}
                    </h1>
                    <p className="font-body text-base leading-relaxed text-on-surface-variant dark:text-stone-400">
                        {pageDescription}
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="hidden md:flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-container px-7 py-3 text-sm font-bold text-on-primary shadow-[0_20px_40px_-15px_rgba(183,16,42,0.3)] transition-all hover:scale-[1.02] active:scale-98"
                >
                    <span className="material-symbols-outlined text-[1.1rem]">add</span>
                    {createButtonLabel}
                </button>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-2 md:gap-4">
                <div className="rounded-[1.2rem] md:rounded-[1.6rem] border border-outline-variant/15 bg-surface-container-lowest p-3 md:p-5 dark:border-stone-700/50 dark:bg-stone-900 text-center md:text-left">
                    <p className="font-label text-[10px] md:text-xs font-semibold uppercase tracking-wider text-on-surface-variant truncate">Total Stories</p>
                    <p className="mt-1 md:mt-3 font-headline text-xl md:text-3xl font-bold text-on-surface dark:text-white">{stats.total}</p>
                </div>
                <div className="rounded-[1.2rem] md:rounded-[1.6rem] border border-outline-variant/15 bg-surface-container-lowest p-3 md:p-5 dark:border-stone-700/50 dark:bg-stone-900 text-center md:text-left">
                    <p className="font-label text-[10px] md:text-xs font-semibold uppercase tracking-wider text-on-surface-variant truncate">Published</p>
                    <p className="mt-1 md:mt-3 font-headline text-xl md:text-3xl font-bold text-tertiary dark:text-tertiary-fixed">{stats.published}</p>
                </div>
                <div className="rounded-[1.2rem] md:rounded-[1.6rem] border border-outline-variant/15 bg-surface-container-lowest p-3 md:p-5 dark:border-stone-700/50 dark:bg-stone-900 text-center md:text-left">
                    <p className="font-label text-[10px] md:text-xs font-semibold uppercase tracking-wider text-on-surface-variant truncate">Pending</p>
                    <p className="mt-1 md:mt-3 font-headline text-xl md:text-3xl font-bold text-secondary dark:text-secondary-fixed">{stats.pending}</p>
                </div>
            </div>

            {errorText && (
                <div className="mb-5 flex items-center gap-2 rounded-2xl border border-error/20 bg-error-container/30 px-4 py-3 text-sm text-error dark:text-red-400">
                    <span className="material-symbols-outlined text-[1rem]">error</span>
                    {errorText}
                    <button onClick={() => dispatch(clearError())} className="ml-auto">
                        <span className="material-symbols-outlined text-[0.9rem]">close</span>
                    </button>
                </div>
            )}

            {/* Mobile Action Row */}
            <div className="flex md:hidden items-center justify-between gap-3 mb-6">
                <div className="flex gap-1 rounded-full bg-surface-container p-1 dark:bg-stone-800">
                    {['all', 'published', 'pending'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilterStatus(tab)}
                            className={`rounded-full px-3 py-1.5 text-[10px] font-bold capitalize transition-all ${
                                filterStatus === tab
                                    ? 'bg-surface-container-lowest text-on-surface shadow-sm dark:bg-stone-700 dark:text-white'
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
                    <span className="material-symbols-outlined text-[1.2rem]">add</span>
                </button>
            </div>

            <div className="mb-5 flex flex-wrap items-center gap-3">
                <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest px-4 py-2.5 dark:border-stone-700/50 dark:bg-stone-900">
                    <span className="material-symbols-outlined text-on-surface-variant text-[1rem]">search</span>
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search stories..."
                        className="flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50 dark:text-white"
                    />
                </div>

                <div className="hidden md:flex gap-1 rounded-full bg-surface-container p-1 dark:bg-stone-800">
                    {['all', 'published', 'pending'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilterStatus(tab)}
                            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-all ${
                                filterStatus === tab
                                    ? 'bg-surface-container-lowest text-on-surface shadow-sm dark:bg-stone-700 dark:text-white'
                                    : 'text-on-surface-variant hover:text-on-surface dark:text-stone-400 dark:hover:text-white'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-20">
                    <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-outline-variant/30 border-t-primary" />
                    <p className="font-body text-sm text-on-surface-variant dark:text-stone-400">Loading stories...</p>
                </div>
            ) : filtered.length === 0 && !search && filterStatus === 'all' ? (
                <EmptyState onAdd={openCreate} isAdmin={isAdmin} />
            ) : (
                <div className="rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.04)] dark:border-stone-700/30 dark:bg-stone-900 dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-outline-variant/20 text-xs uppercase tracking-wider text-on-surface-variant dark:border-stone-700 dark:text-stone-400">
                                    <th className="px-3 pb-4 font-semibold">Story</th>
                                    <th className="px-3 pb-4 font-semibold">Occasion</th>
                                    <th className="px-3 pb-4 font-semibold">Theme</th>
                                    <th className="px-3 pb-4 font-semibold">Date</th>
                                    <th className="px-3 pb-4 font-semibold text-center">Status</th>
                                    <th className="px-3 pb-4 font-semibold text-center">Views</th>
                                    <th className="px-3 pb-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10 text-on-surface dark:divide-stone-700/50 dark:text-white">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-sm text-on-surface-variant dark:text-stone-400">
                                            No stories match your current filters.
                                        </td>
                                    </tr>
                                ) : filtered.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="group transition-colors duration-300 hover:bg-surface-container-low/50 dark:hover:bg-stone-800/50"
                                    >
                                        <td className="px-3 py-4">
                                            <div className="flex items-center gap-3">
                                                <StoryThumb item={item} />
                                                <div className="min-w-0">
                                                    <p className="truncate font-headline text-base font-semibold text-on-surface dark:text-white">
                                                        {item?.title || `${item?.person_one_name || ''} & ${item?.person_two_name || ''}`}
                                                    </p>
                                                    <p className="truncate text-sm text-on-surface-variant dark:text-stone-400">
                                                        {item?.tagline || item?.slug}
                                                    </p>
                                                    <p className="mt-1 text-xs text-on-surface-variant/80 dark:text-stone-500">
                                                        {isAdmin
                                                            ? (String(item?.user_id) === String(user?.id) ? 'Created by you' : `Created by user #${item?.user_id ?? '-'}`)
                                                            : 'Linked to your account'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-sm text-on-surface-variant dark:text-stone-400">
                                            {item?.occasion || item?.occasion_type?.name || '-'}
                                        </td>
                                        <td className="px-3 py-4 text-sm text-on-surface-variant dark:text-stone-400">
                                            {item?.themeName || item?.theme?.name || '-'}
                                        </td>
                                        <td className="px-3 py-4 text-sm text-on-surface-variant dark:text-stone-400 whitespace-nowrap">
                                            {formatDate(item?.start_date)}
                                        </td>
                                        <td className="px-3 py-4 text-center">
                                            <StoryStatusBadge story={item} />
                                        </td>
                                        <td className="px-3 py-4 text-center text-sm text-on-surface-variant dark:text-stone-400">
                                            {Number(item?.view_count ?? 0)}
                                        </td>
                                        <td className="px-3 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {isAdmin && !item?.is_published && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTogglePublish(item)}
                                                        disabled={pendingId === item.id}
                                                        className="inline-flex h-9 items-center gap-1 rounded-full border border-secondary-fixed/40 bg-secondary-fixed/15 px-3 text-xs font-semibold text-secondary transition-colors hover:bg-secondary-fixed/25 disabled:opacity-60 dark:border-secondary/30 dark:bg-secondary/10 dark:text-secondary-fixed"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">task_alt</span>
                                                        Approve
                                                    </button>
                                                )}

                                                <StoryActionsMenu
                                                    item={item}
                                                    busy={pendingId === item.id}
                                                    isAdmin={isAdmin}
                                                    onEdit={openEdit}
                                                    onDelete={setDeleteTarget}
                                                    onTogglePublish={handleTogglePublish}
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
                            Showing {filtered.length} of {items.length} stories
                        </span>
                    </div>
                </div>
            )}

            {modal === 'create' && (
                <StoryModal
                    themes={themes}
                    occasionTypes={occasionTypes}
                    isAdmin={isAdmin}
                    onClose={() => setModal(null)}
                    onSubmit={handleCreate}
                    submitting={submitting && pendingId === 'create'}
                    serverError={error}
                />
            )}

            {modal && modal !== 'create' && (
                <StoryModal
                    initialData={modal}
                    themes={themes}
                    occasionTypes={occasionTypes}
                    isAdmin={isAdmin}
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
