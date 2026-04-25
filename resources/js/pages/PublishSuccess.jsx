import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPublicStoryBySlug } from '../store/slices/storiesSlice';

export default function PublishSuccess() {
    const { slug = '' } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { publicStoryCache, currentPublicStory, publicDetailLoading } = useSelector((state) => state.stories);
    const [copied, setCopied] = useState(false);

    const story = location.state?.story || publicStoryCache[String(slug).trim()] || currentPublicStory;
    const displaySlug = story?.slug || slug;

    useEffect(() => {
        if (!slug || location.state?.story) {
            return;
        }

        dispatch(fetchPublicStoryBySlug(slug));
    }, [dispatch, slug, location.state?.story]);

    const liveUrl = useMemo(() => {
        if (typeof window === 'undefined' || !slug) {
            return '';
        }

        return `${window.location.origin}/story/${slug}`;
    }, [slug]);

    const previewUrl = useMemo(() => {
        if (!displaySlug) {
            return '';
        }

        return `/story/${displaySlug}?preview=1`;
    }, [displaySlug]);

    const whatsappUrl = useMemo(() => {
        const message = story?.title
            ? `Our page is live: ${liveUrl}`
            : `Take a look at this live page: ${liveUrl}`;

        return `https://wa.me/?text=${encodeURIComponent(message)}`;
    }, [liveUrl, story?.title]);

    const handleCopy = async () => {
        if (!liveUrl || !navigator.clipboard) {
            return;
        }

        await navigator.clipboard.writeText(liveUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    };

    if (publicDetailLoading && !story) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-on-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
                    <p className="font-body text-sm text-on-surface-variant">Preparing your published page...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background text-on-background min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
            <main className="w-full max-w-[92vw] sm:max-w-[78vw] lg:max-w-[70vw] xl:max-w-[760px] relative z-10 flex flex-col items-center">
                <div className="bg-surface-container-lowest rounded-[1.5rem] p-5 sm:p-6 md:p-7 w-full text-center flex flex-col items-center gap-5 shadow-[0_20px_60px_rgba(183,16,42,0.06)] relative overflow-visible">
                    <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-secondary-fixed flex items-center justify-center -mt-11 sm:-mt-13 shadow-[0_10px_30px_rgba(183,16,42,0.15)] border-4 border-surface-container-lowest">
                        <span className="material-symbols-outlined text-4xl sm:text-5xl text-on-secondary-fixed-variant" style={{ fontVariationSettings: "'FILL' 1" }}>
                            check_circle
                        </span>
                    </div>

                    <div className="space-y-2">
                        <h1 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-on-background">
                            Your page is live!
                        </h1>
                        <p className="text-on-surface-variant text-sm sm:text-base md:text-lg font-medium max-w-md mx-auto leading-relaxed">
                            Share it with the people who matter most.
                        </p>
                    </div>

                    <button
                        className="w-full max-w-[460px] rounded-2xl border border-outline-variant/20 bg-surface shadow-[0_15px_40px_rgba(27,28,28,0.1)] p-3 relative overflow-hidden text-left"
                        type="button"
                        onClick={() => navigate(`/story/${displaySlug}`)}
                    >
                        <div className="mb-3 flex items-center gap-2 rounded-xl bg-surface-container px-3 py-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                            <p className="ml-2 truncate text-xs font-medium text-on-surface-variant">{liveUrl}</p>
                        </div>

                        <div className="aspect-[16/10] overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest">
                            {previewUrl ? (
                                <iframe
                                    aria-label="Published website preview"
                                    className="h-full w-full pointer-events-none"
                                    loading="lazy"
                                    src={previewUrl}
                                    title="Published website preview"
                                />
                            ) : story?.cover_image_url ? (
                                <img alt="Published website preview" className="h-full w-full object-cover" src={story.cover_image_url} />
                            ) : (
                                <div className="h-full w-full bg-gradient-to-br from-primary-fixed to-secondary-fixed" />
                            )}
                        </div>
                    </button>

                    <div className="w-full bg-surface-container rounded-xl p-3 flex items-center justify-between gap-3 group hover:bg-surface-container-high transition-colors">
                        <div className="flex-1 truncate text-left">
                            <p className="text-on-surface text-xs sm:text-sm font-semibold truncate">{liveUrl}</p>
                        </div>
                        <button
                            className="flex items-center gap-2 text-primary hover:text-primary-container font-medium text-xs sm:text-sm transition-colors py-2 px-3 rounded-full bg-surface-container-lowest shadow-sm group-hover:shadow-[0_4px_12px_rgba(183,16,42,0.08)]"
                            onClick={handleCopy}
                            type="button"
                        >
                            <span className="material-symbols-outlined text-base">content_copy</span>
                            <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                    </div>

                    <div className="w-full flex flex-col gap-3">
                        <a
                            className="w-full rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-3.5 px-6 font-headline font-bold text-sm sm:text-base shadow-[0_8px_20px_rgba(183,16,42,0.2)] hover:scale-[1.02] hover:shadow-[0_12px_25px_rgba(183,16,42,0.3)] transition-all flex items-center justify-center gap-3"
                            href={whatsappUrl}
                            rel="noreferrer"
                            target="_blank"
                        >
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
                            Share via WhatsApp
                        </a>
                        <Link
                            className="w-full rounded-full bg-transparent border border-outline-variant/30 text-primary py-3.5 px-6 font-headline font-semibold text-sm hover:bg-surface-container hover:border-outline-variant/50 transition-colors flex items-center justify-center gap-2"
                            to="/dashboard/stories"
                        >
                            <span className="material-symbols-outlined">edit</span>
                            Edit my page
                        </Link>
                    </div>
                </div>

                <div className="mt-7 text-center">
                    <p className="text-on-surface-variant/80 text-xs sm:text-sm flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-sm text-tertiary-container">workspace_premium</span>
                        Want custom domains and RSVP tracking? <a className="text-tertiary font-medium hover:underline hover:text-tertiary-container transition-colors" href="#">Upgrade to Premium</a>
                    </p>
                </div>
            </main>
        </div>
    );
}
