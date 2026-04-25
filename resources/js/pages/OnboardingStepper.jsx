import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import LoginPublishModal from '../components/LoginPublishModal';
import { fetchPublicOccasionTypes } from '../store/slices/occasionTypesSlice';
import { fetchPublicThemes } from '../store/slices/themesSlice';
import { createStory, enhanceStory } from '../store/slices/storiesSlice';
import { fetchUser } from '../store/slices/authSlice';
import ImageUploader from '../components/ImageUploader';

export default function OnboardingStepper() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const { publicItems: occasionTypes } = useSelector((state) => state.occasionTypes);
    const { publicItems: themes, publicLoading: themesLoading } = useSelector((state) => state.themes);
    const { token: authToken, user: authUser } = useSelector((state) => state.auth);

    const [step, setStep] = useState(1);
    const [isVisible, setIsVisible] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const autoPublishAttemptedRef = useRef(false);
    const publishInFlightRef = useRef(false);

    const initialOccasionId = location.state?.occasion_type_id || '';

    const [form, setForm] = useState({
        occasion_type_id: initialOccasionId,
        theme_id: '',
        person_one_name: '',
        person_two_name: '',
        start_date: '',
        tagline: '',
        story: '',
        cover_image_url: '',
        final_message: '',
        milestones: [],
        images: [],
        ai_polished: false,
        ai_model: ''
    });

    const [localError, setLocalError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    // AI states
    const [aiEnhancing, setAiEnhancing] = useState(false);
    const [aiError, setAiError] = useState('');
    const [aiSuggestion, setAiSuggestion] = useState(null);

    useEffect(() => {
        const savedDraft = sessionStorage.getItem('onboarding_story_draft');
        if (savedDraft) {
            try {
                const parsedDraft = JSON.parse(savedDraft);
                setForm((current) => ({
                    ...current,
                    ...parsedDraft,
                    occasion_type_id: parsedDraft.occasion_type_id || current.occasion_type_id,
                }));
            } catch (error) {
                console.error('Failed to restore onboarding draft:', error);
            }
        }

        setIsVisible(true);
        dispatch(fetchPublicOccasionTypes());
        dispatch(fetchPublicThemes());
    }, [dispatch]);

    useEffect(() => {
        sessionStorage.setItem('onboarding_story_draft', JSON.stringify(form));
    }, [form]);

    const resolvedOccasionTypeId = useMemo(() => {
        if (!form.occasion_type_id) {
            return '';
        }

        const rawOccasionTypeId = String(form.occasion_type_id);
        const directMatch = occasionTypes.find((occasionType) => String(occasionType?.id) === rawOccasionTypeId);

        if (directMatch) {
            return String(directMatch.id);
        }

        const legacyMatch = occasionTypes.find((occasionType) =>
            String(occasionType?.slug || '') === rawOccasionTypeId
            || String(occasionType?.uuid || '') === rawOccasionTypeId
        );

        return legacyMatch ? String(legacyMatch.id) : rawOccasionTypeId;
    }, [occasionTypes, form.occasion_type_id]);

    useEffect(() => {
        if (!resolvedOccasionTypeId || String(form.occasion_type_id) === resolvedOccasionTypeId) {
            return;
        }

        setForm((current) => ({
            ...current,
            occasion_type_id: resolvedOccasionTypeId,
        }));
    }, [resolvedOccasionTypeId, form.occasion_type_id]);

    const filteredThemes = useMemo(() => {
        if (!resolvedOccasionTypeId) {
            return themes;
        }

        return themes.filter(
            (theme) => !theme.occasion_type_id || String(theme.occasion_type_id) === resolvedOccasionTypeId
        );
    }, [themes, resolvedOccasionTypeId]);

    const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

    const handleNext = () => {
        setLocalError('');
        if (step === 1) {
            if (!resolvedOccasionTypeId) {
                setLocalError('Please choose an occasion before selecting a theme.');
                return;
            }
            if (!form.theme_id) {
                setLocalError('Please select a theme.');
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!form.person_one_name.trim()) {
                setLocalError('Please provide a name/subject.');
                return;
            }
            if (!form.person_two_name.trim()) {
                setLocalError('Please provide the second name.');
                return;
            }
            if (!form.start_date) {
                setLocalError('Please select the significant date.');
                return;
            }
            setStep(3);
        } else if (step === 3) {
            setStep(4);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
            setLocalError('');
        } else {
            navigate('/onboarding');
        }
    };

    const handleEnhance = async () => {
        const storyText = form.story.trim();
        if (storyText.length < 10) {
            setAiError('Write at least 10 characters in the story field before enhancing.');
            return;
        }
        setAiEnhancing(true);
        setAiError('');
        setAiSuggestion(null);

        const occasionName = occasionTypes.find((o) => String(o.id) === resolvedOccasionTypeId)?.name || '';

        const result = await dispatch(
            enhanceStory({
                story: storyText,
                person_one_name: form.person_one_name || null,
                person_two_name: form.person_two_name || null,
                tagline: form.tagline || null,
                start_date: form.start_date || null,
                occasion: occasionName || null,
            })
        );

        setAiEnhancing(false);

        if (enhanceStory.fulfilled.match(result)) {
            setAiSuggestion(result.payload.enhanced_story);
            set('ai_model', result.payload.ai_model || 'gemini-2.5-flash');
        } else {
            const msg = typeof result.payload === 'string' ? result.payload : 'AI enhancement failed. Please try again.';
            setAiError(msg);
        }
    };

    const handleAcceptEnhancement = () => {
        set('story', aiSuggestion);
        set('ai_polished', true);
        setAiSuggestion(null);
        setAiError('');
    };

    const handleRejectEnhancement = () => {
        setAiSuggestion(null);
        setAiError('');
    };

    const buildPayload = () => {
        const normalizedMilestones = form.milestones.filter(m => m.title || m.description || m.event_date || m.image_url).map(m => ({
            ...m,
            description: m.description || null,
            event_date: m.event_date || null,
            image_url: m.image_url || null,
        }));

        const normalizedImages = form.images.filter(img => img.url || img.caption).map(img => ({
            ...img,
            caption: img.caption || null,
        }));

        return {
            occasion_type_id: resolvedOccasionTypeId ? Number(resolvedOccasionTypeId) : null,
            theme_id: form.theme_id ? Number(form.theme_id) : null,
            person_one_name: form.person_one_name.trim(),
            person_two_name: form.person_two_name.trim(),
            start_date: form.start_date.trim(),
            tagline: form.tagline.trim() || null,
            story: form.story.trim() || null,
            final_message: form.final_message.trim() || null,
            cover_image_url: form.cover_image_url.trim() || null,
            milestones: normalizedMilestones,
            images: normalizedImages,
            ai_polished: !!form.ai_polished,
            ai_model: form.ai_polished ? (form.ai_model || 'gemini-2.5-flash') : null,
            is_branding_hidden: false,
        };
    };

    const publishStory = async () => {
        if (publishInFlightRef.current) {
            return false;
        }

        publishInFlightRef.current = true;
        setIsSubmitting(true);
        setLocalError('');

        const result = await dispatch(createStory(buildPayload()));
        publishInFlightRef.current = false;
        setIsSubmitting(false);

        if (createStory.fulfilled.match(result)) {
            sessionStorage.removeItem('onboarding_story_draft');
            sessionStorage.removeItem('onboarding_publish_after_login');
            sessionStorage.removeItem('oauth_redirect_to');
            navigate(`/story/published/${result.payload.slug}`, {
                state: { story: result.payload },
            });
            return;
        }

        setLocalError(typeof result.payload === 'string' ? result.payload : 'Failed to save story. Please try again.');
        return false;
    };

    const validateReadyToPublish = () => {
        if (!resolvedOccasionTypeId) {
            setLocalError('Please choose an occasion first.');
            return false;
        }

        if (!form.theme_id) {
            setLocalError('Please select a theme.');
            return false;
        }

        if (!form.person_one_name.trim()) {
            setLocalError('Please provide a name/subject.');
            return false;
        }

        if (!form.person_two_name.trim()) {
            setLocalError('Please provide the second name.');
            return false;
        }

        if (!form.start_date) {
            setLocalError('Please select the significant date.');
            return false;
        }

        return true;
    };

    const ensureAuthenticatedUser = async (resolvedUser = null) => {
        if (resolvedUser) {
            return resolvedUser;
        }

        if (authUser) {
            return authUser;
        }

        const sessionToken = sessionStorage.getItem('token');
        if (!authToken && !sessionToken) {
            return null;
        }

        const result = await dispatch(fetchUser());
        return fetchUser.fulfilled.match(result) ? result.payload : null;
    };

    const markPublishPending = () => {
        sessionStorage.setItem('onboarding_publish_after_login', '1');
        sessionStorage.setItem('onboarding_story_draft', JSON.stringify(form));
    };

    const continuePublishAfterAuth = async (resolvedUser = null) => {
        const authenticatedUser = await ensureAuthenticatedUser(resolvedUser);

        if (!authenticatedUser) {
            markPublishPending();
            setLocalError('Please log in to publish your story.');
            setIsLoginModalOpen(true);
            return false;
        }

        return publishStory();
    };

    const handleSubmit = async () => {
        if (!validateReadyToPublish()) {
            return;
        }

        markPublishPending();

        const sessionToken = sessionStorage.getItem('token');
        if (!sessionToken && !authToken) {
            setIsLoginModalOpen(true);
            return;
        }

        await continuePublishAfterAuth();
    };

    useEffect(() => {
        const shouldAutoPublish = sessionStorage.getItem('onboarding_publish_after_login') === '1';

        if (!shouldAutoPublish || autoPublishAttemptedRef.current || !authToken) {
            return;
        }

        autoPublishAttemptedRef.current = true;

        const continuePublish = async () => {
            await continuePublishAfterAuth();
        };

        continuePublish();
    }, [authToken, authUser]);

    const MAX_STORY_MILESTONES = 4;
    const addMilestone = () => {
        if (form.milestones.length < MAX_STORY_MILESTONES) {
            set('milestones', [...form.milestones, { title: '', description: '', event_date: '', image_url: '' }]);
        }
    };
    const updateMilestone = (index, key, value) => {
        const newMilestones = [...form.milestones];
        newMilestones[index][key] = value;
        set('milestones', newMilestones);
    };
    const removeMilestone = (index) => {
        set('milestones', form.milestones.filter((_, i) => i !== index));
    };

    const MAX_STORY_IMAGES = 4;
    const addImage = () => {
        if (form.images.length < MAX_STORY_IMAGES) {
            set('images', [...form.images, { url: '', caption: '' }]);
        }
    };
    const updateImage = (index, key, value) => {
        const newImages = [...form.images];
        newImages[index][key] = value;
        set('images', newImages);
    };
    const removeImage = (index) => {
        set('images', form.images.filter((_, i) => i !== index));
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{__html: `
                .ambient-shadow {
                    box-shadow: 0 10px 40px -10px rgba(183, 16, 42, 0.08);
                }
                .shimmer-bg {
                    background: linear-gradient(90deg, 
                        #ffffff 0%, 
                        #ffdad8 50%, 
                        #ffffff 100%);
                    background-size: 200% 100%;
                    animation: shimmer 3s infinite linear;
                }
                @keyframes shimmer {
                    0% { background-position: 100% 0; }
                    100% { background-position: -100% 0; }
                }
            `}} />

            <LoginPublishModal
                isOpen={isLoginModalOpen}
                onClose={() => {
                    setIsLoginModalOpen(false);
                    sessionStorage.removeItem('onboarding_publish_after_login');
                    sessionStorage.removeItem('oauth_redirect_to');
                }}
                onSuccess={async (user) => {
                    setIsLoginModalOpen(false);
                    await continuePublishAfterAuth(user);
                }}
                draftState={form}
            />

            <div className="min-h-screen flex flex-col items-center justify-center p-0 sm:p-6 bg-surface antialiased">
                <main className={`w-full max-w-full sm:max-w-[80vw] lg:max-w-[70vw] xl:max-w-[920px] bg-surface-container-low rounded-none sm:rounded-xl p-4 sm:p-6 lg:p-7 ambient-shadow relative overflow-hidden origin-top transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0 scale-100 sm:scale-[0.88]' : 'opacity-0 translate-y-8 scale-95 sm:scale-[0.84]'}`}>
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary-fixed rounded-full blur-[80px] opacity-60 pointer-events-none"></div>
                    
                    <header className="mb-10 relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <button onClick={handleBack} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-highest transition-colors cursor-pointer">
                                <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
                            </button>
                            <img src="/branding/logo.webp" alt="Yaad Link Logo" className="h-8 object-contain" />
                            <div className="w-10"></div>
                        </div>

                        <div className="flex items-center gap-2 mb-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className={`h-1 flex-1 rounded-full relative overflow-hidden ${i <= step ? 'bg-primary' : 'bg-surface-container-highest'}`}>
                                    {i === step && (
                                        <div className="absolute inset-0 bg-primary opacity-100" />
                                    )}
                                </div>
                            ))}
                        </div>
                        <p className="text-sm font-label text-on-surface-variant uppercase tracking-widest text-center">Step {step} of 4</p>
                    </header>

                    {localError && (
                        <div className="mb-6 p-4 rounded-xl bg-error-container text-on-error-container text-sm font-medium flex items-center gap-2 relative z-10">
                            <span className="material-symbols-outlined">error</span>
                            {localError}
                        </div>
                    )}

                    <section className="relative z-10 flex flex-col gap-8">
                        {step === 1 && (
                            <>
                                <div className="text-center mb-6">
                                    <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-extrabold text-on-surface mb-4 tracking-tight leading-tight">Pick a theme</h1>
                                    <p className="font-body text-on-surface-variant text-base sm:text-lg max-w-md mx-auto leading-relaxed">
                                        Select the perfect design theme for your milestone.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-4 mt-2">
                                    {themesLoading ? (
                                        <div className="p-8 text-center text-on-surface-variant flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined animate-spin">sync</span> Loading themes...
                                        </div>
                                    ) : filteredThemes.length === 0 ? (
                                        <div className="p-8 text-center border-2 border-dashed border-outline-variant/30 rounded-2xl text-on-surface-variant">
                                            No themes found for this occasion.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            {filteredThemes.map(theme => (
                                                <button
                                                    key={theme.id}
                                                    onClick={() => set('theme_id', String(theme.id))}
                                                    className={`relative flex flex-col items-center rounded-2xl overflow-hidden transition-all border-2 text-left ${String(form.theme_id) === String(theme.id) ? 'border-primary shadow-[0_10px_20px_rgba(183,16,42,0.15)] scale-[1.02]' : 'border-transparent bg-surface-container hover:bg-surface-container-highest'}`}
                                                >
                                                    <div className="w-full aspect-video bg-surface-container-highest overflow-hidden">
                                                        {theme.preview_image ? (
                                                            <img src={theme.preview_image} alt={theme.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-on-surface-variant/50">
                                                                <span className="material-symbols-outlined text-4xl">palette</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="p-3 w-full">
                                                        <p className="font-headline font-bold text-sm truncate text-on-surface">{theme.name}</p>
                                                    </div>
                                                    {String(form.theme_id) === String(theme.id) && (
                                                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-md">
                                                            <span className="material-symbols-outlined text-xs font-bold">check</span>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <div className="text-center mb-2">
                                    <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-extrabold text-on-surface mb-4 tracking-tight leading-tight">Tell us your story</h1>
                                    <p className="font-body text-on-surface-variant text-base sm:text-lg max-w-md mx-auto leading-relaxed">
                                        Share the details of your milestone. We'll use this to craft a beautiful narrative.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-6 mt-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="font-label text-sm font-semibold text-on-surface pl-4" htmlFor="person_one_name">Person One Name *</label>
                                            <input 
                                                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-full px-6 py-4 focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest text-on-surface placeholder-on-surface-variant/50 ambient-shadow outline-none transition-all" 
                                                id="person_one_name" 
                                                placeholder="e.g., Aarav" 
                                                type="text"
                                                value={form.person_one_name}
                                                onChange={(e) => set('person_one_name', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="font-label text-sm font-semibold text-on-surface pl-4" htmlFor="person_two_name">Person Two Name *</label>
                                            <input 
                                                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-full px-6 py-4 focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest text-on-surface placeholder-on-surface-variant/50 ambient-shadow outline-none transition-all" 
                                                id="person_two_name" 
                                                placeholder="e.g., Meera" 
                                                type="text"
                                                value={form.person_two_name}
                                                onChange={(e) => set('person_two_name', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2 md:col-span-2">
                                            <label className="font-label text-sm font-semibold text-on-surface pl-4" htmlFor="date">Significant Date *</label>
                                            <div className="relative">
                                                <input 
                                                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-full px-6 py-4 focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest text-on-surface ambient-shadow outline-none transition-all appearance-none" 
                                                    id="date" 
                                                    type="date"
                                                    value={form.start_date}
                                                    onChange={(e) => set('start_date', e.target.value)}
                                                />
                                                <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">calendar_today</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 relative">
                                        <div className="flex items-center justify-between pl-4 pr-2 mb-1">
                                            <label className="font-label text-sm font-semibold text-on-surface" htmlFor="story">Your Story</label>
                                            <button 
                                                onClick={handleEnhance}
                                                disabled={aiEnhancing}
                                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-outline-variant/30 text-primary font-label text-xs font-semibold hover:bg-primary-fixed/20 transition-colors group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed" 
                                                type="button"
                                            >
                                                <div className="absolute inset-0 shimmer-bg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                                                <span className="material-symbols-outlined text-[16px] relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>
                                                    {aiEnhancing ? 'sync' : 'auto_awesome'}
                                                </span>
                                                <span className="relative z-10 uppercase tracking-wider">{aiEnhancing ? 'Polishing...' : 'Write for me'}</span>
                                            </button>
                                        </div>
                                        <textarea 
                                            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest text-on-surface placeholder-on-surface-variant/50 ambient-shadow outline-none resize-none transition-all" 
                                            id="story" 
                                            placeholder="How did you meet? What makes this moment special? Don't worry about perfect writing..." 
                                            rows="5"
                                            value={form.story}
                                            onChange={(e) => set('story', e.target.value)}
                                        ></textarea>

                                        {aiError && (
                                            <p className="text-xs text-error pl-4 mt-1">{aiError}</p>
                                        )}

                                        {aiSuggestion && (
                                            <div className="mt-2 overflow-hidden rounded-2xl border border-primary/20 bg-primary/5">
                                                <div className="flex items-center justify-between gap-3 border-b border-primary/15 px-4 py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-[1rem] text-primary">auto_awesome</span>
                                                        <p className="text-xs font-semibold text-primary">AI Suggestion</p>
                                                    </div>
                                                </div>
                                                <p className="whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed text-on-surface">
                                                    {aiSuggestion}
                                                </p>
                                                <div className="flex items-center gap-2 border-t border-primary/15 px-4 py-3">
                                                    <button onClick={handleAcceptEnhancement} type="button" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-on-primary shadow-sm hover:opacity-90">
                                                        <span className="material-symbols-outlined text-[0.95rem]">check</span> Accept
                                                    </button>
                                                    <button onClick={handleRejectEnhancement} type="button" className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/40 px-4 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container">
                                                        <span className="material-symbols-outlined text-[0.95rem]">close</span> Reject
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="font-label text-sm font-semibold text-on-surface pl-4" htmlFor="tagline">Tagline</label>
                                        <input 
                                            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-full px-6 py-4 focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest text-on-surface placeholder-on-surface-variant/50 ambient-shadow outline-none transition-all" 
                                            id="tagline" 
                                            placeholder="A short, catchy phrase..." 
                                            type="text"
                                            value={form.tagline}
                                            onChange={(e) => set('tagline', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="font-label text-sm font-semibold text-on-surface pl-4" htmlFor="final_message">Final Message / Quote</label>
                                        <input 
                                            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-full px-6 py-4 focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest text-on-surface placeholder-on-surface-variant/50 ambient-shadow outline-none transition-all" 
                                            id="final_message" 
                                            placeholder="Forever and always." 
                                            type="text"
                                            value={form.final_message}
                                            onChange={(e) => set('final_message', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 3 && (
                            <>
                                <div className="text-center mb-2">
                                    <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-extrabold text-on-surface mb-4 tracking-tight leading-tight">Timeline & Milestones</h1>
                                    <p className="font-body text-on-surface-variant text-base sm:text-lg max-w-md mx-auto leading-relaxed">
                                        Highlight key events in your journey. You can add up to {MAX_STORY_MILESTONES} milestones.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-6 mt-2">
                                    {form.milestones.length === 0 ? (
                                        <div className="p-8 text-center border-2 border-dashed border-outline-variant/30 rounded-2xl text-on-surface-variant">
                                            No milestones added yet.
                                        </div>
                                    ) : form.milestones.map((milestone, index) => (
                                        <div key={index} className="bg-surface-container-lowest border border-outline-variant/30 p-5 rounded-2xl relative shadow-sm">
                                            <button onClick={() => removeMilestone(index)} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-error-container/50 text-error hover:bg-error hover:text-white transition-colors">
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                            <p className="font-headline font-bold text-sm mb-4 text-primary">Milestone {index + 1}</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-1.5 md:col-span-2">
                                                    <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Title *</label>
                                                    <input 
                                                        className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none" 
                                                        placeholder="First meeting..." 
                                                        value={milestone.title}
                                                        onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Date</label>
                                                    <input 
                                                        type="date"
                                                        className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none appearance-none" 
                                                        value={milestone.event_date}
                                                        onChange={(e) => updateMilestone(index, 'event_date', e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1.5 md:col-span-2">
                                                    <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Description</label>
                                                    <textarea 
                                                        rows="2"
                                                        className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none resize-none" 
                                                        value={milestone.description}
                                                        onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1.5 md:col-span-2">
                                                    <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Milestone Image Link</label>
                                                    <input
                                                        type="url"
                                                        className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                                        placeholder="https://example.com/milestone-image.jpg"
                                                        value={milestone.image_url}
                                                        onChange={(e) => updateMilestone(index, 'image_url', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {form.milestones.length < MAX_STORY_MILESTONES && (
                                        <button 
                                            onClick={addMilestone}
                                            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border-2 border-dashed border-outline-variant/50 text-on-surface-variant hover:text-primary hover:border-primary/50 transition-colors font-medium text-sm"
                                        >
                                            <span className="material-symbols-outlined text-lg">add_circle</span> Add Milestone
                                        </button>
                                    )}
                                </div>
                            </>
                        )}

                        {step === 4 && (
                            <>
                                <div className="text-center mb-2">
                                    <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-extrabold text-on-surface mb-4 tracking-tight leading-tight">Bring it to life</h1>
                                    <p className="font-body text-on-surface-variant text-base sm:text-lg max-w-md mx-auto leading-relaxed">
                                        Upload a beautiful cover image and build a small gallery to complete your page.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-8 mt-2">
                                    <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 rounded-2xl shadow-sm">
                                        <h3 className="font-headline font-bold text-lg mb-4 text-on-surface">Cover Image</h3>
                                        <ImageUploader
                                            value={form.cover_image_url}
                                            onUploadSuccess={(url) => set('cover_image_url', url)}
                                            onRemove={() => set('cover_image_url', '')}
                                            isPublic
                                        />
                                    </div>

                                    <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 rounded-2xl shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-headline font-bold text-lg text-on-surface">Gallery</h3>
                                            <span className="text-xs text-on-surface-variant font-medium bg-surface-container px-2 py-1 rounded-md">{form.images.length} / {MAX_STORY_IMAGES}</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {form.images.map((image, index) => (
                                                <div key={index} className="bg-surface-container border border-outline-variant/20 p-3 rounded-xl relative">
                                                    <button onClick={() => removeImage(index)} className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-error/90 text-white hover:bg-error transition-colors z-10 shadow-sm">
                                                        <span className="material-symbols-outlined text-[14px]">close</span>
                                                    </button>
                                                    <div className="mb-2">
                                                        <input
                                                            type="url"
                                                            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none"
                                                            placeholder="https://example.com/gallery-image.jpg"
                                                            value={image.url}
                                                            onChange={(e) => updateImage(index, 'url', e.target.value)}
                                                        />
                                                    </div>
                                                    <input 
                                                        className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none" 
                                                        placeholder="Caption (optional)" 
                                                        value={image.caption}
                                                        onChange={(e) => updateImage(index, 'caption', e.target.value)}
                                                    />
                                                </div>
                                            ))}
                                            {form.images.length < MAX_STORY_IMAGES && (
                                                <button 
                                                    onClick={addImage}
                                                    className="flex flex-col items-center justify-center gap-2 aspect-square rounded-xl border-2 border-dashed border-outline-variant/50 text-on-surface-variant hover:text-primary hover:border-primary/50 transition-colors font-medium text-xs bg-surface-container-lowest/50"
                                                >
                                                    <span className="material-symbols-outlined text-2xl">add_photo_alternate</span> Add Photo
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-8 border-t border-outline-variant/15">
                            <button onClick={handleBack} className="font-label text-on-surface-variant hover:text-on-surface font-medium transition-colors px-6 py-3 cursor-pointer" type="button">
                                Back
                            </button>
                            {step < 4 ? (
                                <button onClick={handleNext} className="w-full sm:w-auto bg-gradient-to-tr from-primary to-primary-container text-on-primary rounded-full px-10 py-4 font-label font-semibold tracking-wide hover:scale-[1.02] active:scale-95 transition-transform shadow-[0_8px_24px_rgba(183,16,42,0.25)] flex items-center justify-center gap-2 cursor-pointer" type="button">
                                    Continue <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
                            ) : (
                                <button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto bg-gradient-to-tr from-primary to-primary-container text-on-primary rounded-full px-10 py-4 font-label font-semibold tracking-wide hover:scale-[1.02] active:scale-95 transition-transform shadow-[0_8px_24px_rgba(183,16,42,0.25)] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none cursor-pointer" type="button">
                                    {isSubmitting ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin text-sm">sync</span> Processing...
                                        </>
                                    ) : (
                                        <>
                                            Submit Story <span className="material-symbols-outlined text-sm">check_circle</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
