const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';

const firstString = (...values) => values.find(isNonEmptyString)?.trim() || '';

const toArray = (value) => {
    if (Array.isArray(value)) {
        return value;
    }

    if (isNonEmptyString(value)) {
        try {
            const parsed = JSON.parse(value);

            return Array.isArray(parsed) ? parsed : [];
        } catch (_) {
            return [];
        }
    }

    return [];
};

/**
 * Format a raw date string (e.g. "2023-10-10") into a human-readable form
 * like "OCTOBER 10, 2023". Falls back to the raw string if parsing fails.
 */
export function formatDisplayDate(raw) {
    if (!isNonEmptyString(raw)) return '';

    try {
        const d = new Date(raw);
        if (isNaN(d.getTime())) return raw;

        return d
            .toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            })
            .toUpperCase();
    } catch (_) {
        return raw;
    }
}

/**
 * Format a milestone date (may be "YYYY-MM-DD" or arbitrary text)
 * into a short "MMM D, YYYY" label. Falls back to the raw string.
 */
export function formatMilestoneDate(raw) {
    if (!isNonEmptyString(raw)) return '';

    try {
        const d = new Date(raw);
        if (isNaN(d.getTime())) return raw;

        return d
            .toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            })
            .toUpperCase();
    } catch (_) {
        return raw;
    }
}

const normalizePersonName = (person) => {
    if (!person) {
        return '';
    }

    if (typeof person === 'string') {
        return person.trim();
    }

    return firstString(person.name, person.title, person.label);
};

const normalizeMilestone = (milestone, index) => {
    if (!milestone) {
        return null;
    }

    if (typeof milestone === 'string') {
        return {
            title: milestone,
            date: '',
            description: '',
            imageUrl: '',
            key: `milestone-${index}`,
        };
    }

    return {
        title: firstString(milestone.title, milestone.name, milestone.heading, `Chapter ${index + 1}`),
        // Support API field `event_date` as well as legacy `date`/`label`
        date: firstString(milestone.event_date, milestone.date, milestone.label),
        description: firstString(milestone.description, milestone.summary, milestone.copy),
        // Support API field `image_url`
        imageUrl: firstString(milestone.image_url, milestone.imageUrl, milestone.image),
        key: milestone.id || `milestone-${index}`,
    };
};

const normalizeImage = (image, index) => {
    if (!image) {
        return null;
    }

    if (typeof image === 'string') {
        return {
            src: image,
            alt: `Story image ${index + 1}`,
            caption: '',
            key: `image-${index}`,
        };
    }

    // API uses `url`; preview data uses `src`
    const src = firstString(image.url, image.src);

    return {
        src,
        // API uses `caption` as a human-readable label
        alt: firstString(image.alt, image.caption, `Story image ${index + 1}`),
        caption: firstString(image.caption, image.alt, ''),
        key: image.id || `image-${index}`,
    };
};

export function getThemeStoryContent(data = {}) {
    // ── Resolve participant names ──────────────────────────────────────────────
    // Supports both the real API fields (person_one_name / person_two_name)
    // and the legacy preview-data shape (people / names / couple arrays).
    let participantNames = [];

    if (isNonEmptyString(data.person_one_name) || isNonEmptyString(data.person_two_name)) {
        participantNames = [
            data.person_one_name,
            data.person_two_name,
        ].filter(isNonEmptyString).map((n) => n.trim());
    } else {
        const people = Array.isArray(data.people)
            ? data.people
            : Array.isArray(data.names)
              ? data.names
              : Array.isArray(data.couple)
                ? data.couple
                : [];

        participantNames = people.map(normalizePersonName).filter(Boolean);
    }

    const heroNames = participantNames.length > 0 ? participantNames.join(' & ') : 'Your Story';

    const milestones = toArray(data.milestones)
        .map(normalizeMilestone)
        .filter(Boolean)
        .slice(0, 6);

    const images = toArray(data.images)
        .map(normalizeImage)
        .filter((image) => image?.src)
        .slice(0, 4);

    // `start_date` is the real API field; fall through to legacy previews
    const rawDate = firstString(data.start_date, data.eventDate, data.date, data.dates?.event);

    return {
        // Eyebrow / tagline
        eyebrow: firstString(data.eyebrow, data.tagline, 'Crafted Theme'),
        // Main headline — couple names
        title: firstString(data.title, heroNames),
        // Subtitle / occasion label
        subtitle: firstString(data.subtitle, data.occasion, data.themeName, 'A moment to remember'),
        // The relationship / event start date (raw, for formatting in the theme)
        rawDate,
        // Pre-formatted date label for themes that don't want to format themselves
        dateLabel: firstString(data.eventDate, data.date, data.dates?.event, rawDate, 'A date to remember'),
        location: firstString(data.location, data.venue),
        // The narrative story / summary
        summary: firstString(
            data.story,
            data.summary,
            data.description,
            'Every theme receives the same story data shape and turns it into a tailored visual experience.'
        ),
        // Hero / cover image URL (API field: cover_image_url)
        coverImageUrl: firstString(data.cover_image_url, data.coverImage, data.heroImage, images[0]?.src),
        // Closing / final message (API field: final_message)
        finalMessage: firstString(data.final_message, data.finalMessage, data.closing),
        // Initials for signing off (e.g. "P & A")
        initials: participantNames.map((n) => n.charAt(0).toUpperCase()).join(' & '),
        milestones,
        images,
        people: participantNames,
    };
}
