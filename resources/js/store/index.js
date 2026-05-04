import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import storiesReducer from './slices/storiesSlice';
import themesReducer from './slices/themesSlice';
import occasionTypesReducer from './slices/occasionTypesSlice';
import usersReducer from './slices/usersSlice';
import activityLogsReducer from './slices/activityLogsSlice';
import analyticsReducer from './slices/analyticsSlice';
import uploadReducer from './slices/uploadSlice';
import contactQueriesReducer from './slices/contactQueriesSlice';

const PUBLIC_CACHE_STORAGE_KEY = 'yaadlink_public_redux_cache_v1';

const loadPublicCache = () => {
    if (typeof window === 'undefined') {
        return undefined;
    }

    try {
        const raw = window.sessionStorage.getItem(PUBLIC_CACHE_STORAGE_KEY);
        if (!raw) {
            return undefined;
        }

        const parsed = JSON.parse(raw);

        const baseStories = storiesReducer(undefined, { type: '@@yaadlink/init' });
        const baseThemes = themesReducer(undefined, { type: '@@yaadlink/init' });
        const baseOccasionTypes = occasionTypesReducer(undefined, { type: '@@yaadlink/init' });

        return {
            stories: {
                ...baseStories,
                publicItems: parsed?.stories?.publicItems || [],
                publicStoryCache: parsed?.stories?.publicStoryCache || {},
                publicDetailFetchedAt: parsed?.stories?.publicDetailFetchedAt || {},
                publicLastFetched: parsed?.stories?.publicLastFetched || null,
            },
            themes: {
                ...baseThemes,
                publicItems: parsed?.themes?.publicItems || [],
                publicLastFetched: parsed?.themes?.publicLastFetched || null,
            },
            occasionTypes: {
                ...baseOccasionTypes,
                publicItems: parsed?.occasionTypes?.publicItems || [],
                publicLastFetched: parsed?.occasionTypes?.publicLastFetched || null,
            },
        };
    } catch {
        window.sessionStorage.removeItem(PUBLIC_CACHE_STORAGE_KEY);
        return undefined;
    }
};

const savePublicCache = (state) => {
    if (typeof window === 'undefined') {
        return;
    }

    const payload = {
        stories: {
            publicItems: state.stories.publicItems,
            publicStoryCache: state.stories.publicStoryCache,
            publicDetailFetchedAt: state.stories.publicDetailFetchedAt,
            publicLastFetched: state.stories.publicLastFetched,
        },
        themes: {
            publicItems: state.themes.publicItems,
            publicLastFetched: state.themes.publicLastFetched,
        },
        occasionTypes: {
            publicItems: state.occasionTypes.publicItems,
            publicLastFetched: state.occasionTypes.publicLastFetched,
        },
    };

    try {
        window.sessionStorage.setItem(PUBLIC_CACHE_STORAGE_KEY, JSON.stringify(payload));
    } catch {
        // Storage can be unavailable or full; Redux memory cache still works.
    }
};

const store = configureStore({
    reducer: {
        auth: authReducer,
        stories: storiesReducer,
        themes: themesReducer,
        occasionTypes: occasionTypesReducer,
        users: usersReducer,
        activityLogs: activityLogsReducer,
        analytics: analyticsReducer,
        upload: uploadReducer,
        contactQueries: contactQueriesReducer,
    },
    preloadedState: loadPublicCache(),
});

let persistTimer = null;
store.subscribe(() => {
    if (typeof window === 'undefined') {
        return;
    }

    if (persistTimer) {
        window.clearTimeout(persistTimer);
    }

    persistTimer = window.setTimeout(() => {
        savePublicCache(store.getState());
    }, 250);
});

export default store;
