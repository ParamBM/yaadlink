import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    clearContactError,
    fetchContactCaptcha,
    resetContactSubmission,
    submitContactQuery,
} from '../store/slices/contactQueriesSlice';

const initialForm = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    captcha_answer: '',
    website: '',
};

function formatError(error) {
    if (!error) {
        return '';
    }

    if (typeof error === 'string') {
        return error;
    }

    return Object.entries(error)
        .map(([field, messages]) => {
            const text = Array.isArray(messages) ? messages.join(', ') : String(messages);
            return `${field.replace(/_/g, ' ')}: ${text}`;
        })
        .join(' ');
}

function Field({ label, children }) {
    return (
        <label className="flex flex-col gap-2">
            <span className="font-label text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                {label}
            </span>
            {children}
        </label>
    );
}

const inputClass = 'w-full rounded-2xl border border-outline-variant/30 bg-surface-container px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/45 focus:border-primary/45 focus:bg-surface-container-lowest dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-red-400/50';

export default function ContactUs() {
    const dispatch = useDispatch();
    const {
        captcha,
        captchaLoading,
        captchaError,
        submitting,
        submitError,
        submitted,
    } = useSelector((state) => state.contactQueries);

    const [form, setForm] = useState(initialForm);

    useEffect(() => {
        dispatch(fetchContactCaptcha());

        return () => {
            dispatch(clearContactError());
            dispatch(resetContactSubmission());
        };
    }, [dispatch]);

    useEffect(() => {
        if (submitted) {
            setForm(initialForm);
            dispatch(fetchContactCaptcha());
        }
    }, [dispatch, submitted]);

    const errorText = useMemo(() => formatError(submitError || captchaError), [submitError, captchaError]);
    const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

    const handleSubmit = async (event) => {
        event.preventDefault();

        await dispatch(submitContactQuery({
            name: form.name.trim() || null,
            email: form.email.trim() || null,
            phone: form.phone.trim(),
            subject: form.subject.trim() || null,
            message: form.message.trim() || null,
            captcha_id: captcha?.captcha_id,
            captcha_answer: form.captcha_answer,
            website: form.website,
        }));
    };

    const refreshCaptcha = () => {
        set('captcha_answer', '');
        dispatch(fetchContactCaptcha());
    };

    return (
        <div className="bg-surface text-on-surface dark:bg-stone-950 dark:text-white">
            <section className="mx-auto grid min-h-[calc(100vh-12rem)] w-full max-w-6xl gap-10 px-6 pb-12 pt-28 md:grid-cols-[0.85fr_1.15fr] md:px-10 md:pb-16">
                <div className="flex flex-col justify-center">
                    <p className="font-label text-xs font-bold uppercase tracking-[0.22em] text-primary dark:text-red-400">
                        Contact
                    </p>
                    <h1 className="mt-4 font-headline text-4xl font-black leading-tight text-on-surface dark:text-white md:text-5xl">
                        Contact Us
                    </h1>
                    <p className="mt-5 max-w-md text-base leading-7 text-on-surface-variant dark:text-stone-400">
                        Send your question to the YaadLink team. A phone number is required so we can follow up clearly.
                    </p>

                    <div className="mt-8 grid gap-3 text-sm text-on-surface-variant dark:text-stone-400">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary dark:text-red-400">call</span>
                            <span>Phone number required</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary dark:text-red-400">mail</span>
                            <span>Email is optional</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-[1.75rem] border border-outline-variant/25 bg-surface-container-lowest p-5 shadow-[0_28px_70px_-35px_rgba(0,0,0,0.35)] dark:border-stone-800 dark:bg-stone-900 md:p-7">
                    {submitted && (
                        <div className="flex items-start gap-3 rounded-2xl border border-tertiary-fixed/30 bg-tertiary-fixed/15 px-4 py-3 text-sm font-medium text-tertiary dark:text-tertiary-fixed">
                            <span className="material-symbols-outlined text-[1.2rem]">check_circle</span>
                            <span>Your query has been submitted successfully.</span>
                        </div>
                    )}

                    {errorText && (
                        <div className="flex items-start gap-3 rounded-2xl border border-error/25 bg-error-container/25 px-4 py-3 text-sm font-medium text-error dark:text-red-300">
                            <span className="material-symbols-outlined text-[1.2rem]">error</span>
                            <span>{errorText}</span>
                        </div>
                    )}

                    <input
                        className="hidden"
                        tabIndex="-1"
                        autoComplete="off"
                        value={form.website}
                        onChange={(event) => set('website', event.target.value)}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Name">
                            <input className={inputClass} value={form.name} onChange={(event) => set('name', event.target.value)} placeholder="Your name" />
                        </Field>

                        <Field label="Email">
                            <input className={inputClass} type="email" value={form.email} onChange={(event) => set('email', event.target.value)} placeholder="you@example.com" />
                        </Field>
                    </div>

                    <Field label="Phone Number *">
                        <input required className={inputClass} value={form.phone} onChange={(event) => set('phone', event.target.value)} placeholder="+91 98765 43210" />
                    </Field>

                    <Field label="Subject">
                        <input className={inputClass} value={form.subject} onChange={(event) => set('subject', event.target.value)} placeholder="What is this about?" />
                    </Field>

                    <Field label="Query">
                        <textarea className={`${inputClass} min-h-36 resize-none`} value={form.message} onChange={(event) => set('message', event.target.value)} placeholder="Write your message" />
                    </Field>

                    <div className="grid gap-3 sm:grid-cols-[1fr_0.65fr]">
                        <div className="rounded-2xl border border-outline-variant/25 bg-surface-container px-4 py-3 dark:border-stone-700 dark:bg-stone-800">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-semibold text-on-surface-variant dark:text-stone-300">
                                    {captchaLoading ? 'Loading captcha...' : `Captcha: ${captcha?.question || ''}`}
                                </span>
                                <button type="button" onClick={refreshCaptcha} className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary dark:hover:bg-stone-700 dark:hover:text-red-300" aria-label="Refresh captcha">
                                    <span className="material-symbols-outlined text-[1.1rem]">refresh</span>
                                </button>
                            </div>
                        </div>
                        <input required className={inputClass} value={form.captcha_answer} onChange={(event) => set('captcha_answer', event.target.value)} placeholder="Answer" inputMode="numeric" />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || captchaLoading || !captcha}
                        className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-container px-6 py-3.5 text-sm font-bold text-on-primary shadow-[0_18px_40px_-18px_rgba(183,16,42,0.45)] transition-all hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary" />
                        ) : (
                            <span className="material-symbols-outlined text-[1.1rem]">send</span>
                        )}
                        Submit Query
                    </button>
                </form>
            </section>
        </div>
    );
}
