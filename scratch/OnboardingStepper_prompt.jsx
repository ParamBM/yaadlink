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
        </>
    );
}
