import React, { Suspense, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import { useParams } from 'react-router';
import { fetchPublicStoryBySlug } from '../store/slices/storiesSlice';
import { fetchPublicThemes } from '../store/slices/themesSlice';
import { getThemeComponent } from '../themes';

export default function PublicStoryPage() {
    const { slug = '' } = useParams();
    const dispatch = useDispatch();
    const slugKey = String(slug).trim();
    const { publicStoryCache, currentPublicStory, publicDetailLoading, publicDetailError } = useSelector((state) => state.stories);
    const { publicItems: publicThemes, publicLastFetched } = useSelector((state) => state.themes);

    const cachedStory = publicStoryCache[slugKey] || null;
    const activeStory = currentPublicStory?.slug === slugKey ? currentPublicStory : null;
    const story = cachedStory || activeStory;

    const resolvedTheme =
        story?.theme ||
        publicThemes.find((theme) => String(theme?.id) === String(story?.theme_id)) ||
        null;

    const storyForTheme = story
        ? {
            ...story,
            theme: resolvedTheme,
            themeName: story.themeName || resolvedTheme?.name || null,
        }
        : null;

    useEffect(() => {
        if (!slug) {
            return;
        }

        dispatch(fetchPublicStoryBySlug(slug));
    }, [dispatch, slug]);

    useEffect(() => {
        if (!story?.theme_id || story?.theme?.slug || publicLastFetched) {
            return;
        }

        dispatch(fetchPublicThemes());
    }, [dispatch, publicLastFetched, story]);

    if (publicDetailLoading && !story) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
                    <p className="font-body text-sm text-on-surface-variant">Loading your live page...</p>
                </div>
            </div>
        );
    }

    if (publicDetailError && !story) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface px-6 text-center">
                <div className="max-w-md rounded-[2rem] bg-surface-container-lowest p-10 shadow-[0_24px_60px_rgba(183,16,42,0.08)]">
                    <h1 className="font-headline text-3xl font-bold text-on-surface">This page isn't available.</h1>
                    <p className="mt-3 font-body text-sm text-on-surface-variant">{publicDetailError}</p>
                    <Link
                        to="/contact-us"
                        className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-label text-sm font-bold text-on-primary transition-colors hover:bg-primary/90"
                    >
                        Contact Us
                    </Link>
                </div>
            </div>
        );
    }

    if (!story) {
        return null;
    }

    const ThemeComponent = getThemeComponent(storyForTheme?.theme?.slug);

    return (
        <Suspense
            fallback={(
                <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
                        <p className="font-body text-sm text-on-surface-variant">Loading your live page...</p>
                    </div>
                </div>
            )}
        >
            <ThemeComponent data={storyForTheme} />
        </Suspense>
    );
}
