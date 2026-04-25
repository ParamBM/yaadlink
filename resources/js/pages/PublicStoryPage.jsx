import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router';
import { fetchPublicStoryBySlug } from '../store/slices/storiesSlice';
import { getThemeComponent } from '../themes';

export default function PublicStoryPage() {
    const { slug = '' } = useParams();
    const dispatch = useDispatch();
    const { publicStoryCache, currentPublicStory, publicDetailLoading, publicDetailError } = useSelector((state) => state.stories);

    const story = publicStoryCache[String(slug).trim()] || currentPublicStory;

    useEffect(() => {
        if (!slug) {
            return;
        }

        dispatch(fetchPublicStoryBySlug(slug));
    }, [dispatch, slug]);

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
                </div>
            </div>
        );
    }

    if (!story) {
        return null;
    }

    const ThemeComponent = getThemeComponent(story?.theme?.slug);

    return <ThemeComponent data={story} />;
}
