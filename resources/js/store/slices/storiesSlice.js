import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const STORIES_CACHE_TTL = 5 * 60 * 1000;

const isFresh = (timestamp) => !!timestamp && Date.now() - timestamp < STORIES_CACHE_TTL;

const sortStories = (items = []) =>
    [...items].sort((left, right) => {
        const leftPublished = left?.published_at ? new Date(left.published_at).getTime() : 0;
        const rightPublished = right?.published_at ? new Date(right.published_at).getTime() : 0;

        if (leftPublished !== rightPublished) {
            return rightPublished - leftPublished;
        }

        return Number(right?.id ?? 0) - Number(left?.id ?? 0);
    });

const storyIdKey = (storyOrId) => String(storyOrId?.id ?? storyOrId ?? '');
const storySlugKey = (storyOrSlug) => String(storyOrSlug?.slug ?? storyOrSlug ?? '').trim();

const syncStoryCache = (state, story, fetchedAt = Date.now()) => {
    const idKey = storyIdKey(story);
    if (!idKey) {
        return;
    }

    state.storyCache[idKey] = story;
    state.detailFetchedAt[idKey] = fetchedAt;
};

const syncPublicStoryCache = (state, story, fetchedAt = Date.now()) => {
    const slugKey = storySlugKey(story);
    if (!slugKey) {
        return;
    }

    state.publicStoryCache[slugKey] = story;
    state.publicDetailFetchedAt[slugKey] = fetchedAt;
};

const removeStoryFromList = (items, id) => items.filter((item) => String(item?.id) !== String(id));

const removePublicStoryCacheById = (state, storyId) => {
    Object.keys(state.publicStoryCache).forEach((slugKey) => {
        const cachedStory = state.publicStoryCache[slugKey];
        if (String(cachedStory?.id) === String(storyId)) {
            delete state.publicStoryCache[slugKey];
            delete state.publicDetailFetchedAt[slugKey];
        }
    });
};

export const fetchStories = createAsyncThunk(
    'stories/fetchAll',
    async (_, { getState, rejectWithValue }) => {
        const { auth, stories } = getState();

        if (isFresh(stories.lastFetched) && stories.items.length > 0) {
            return {
                data: stories.items,
                fetchedAt: stories.lastFetched,
            };
        }

        try {
            const res = await axios.get('/api/stories/', {
                headers: { Authorization: `Bearer ${auth.token}` },
            });

            return {
                data: res.data.data || [],
                fetchedAt: Date.now(),
            };
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Failed to load stories');
        }
    }
);

export const fetchPublicStories = createAsyncThunk(
    'stories/fetchPublic',
    async (_, { getState, rejectWithValue }) => {
        const { stories } = getState();

        if (isFresh(stories.publicLastFetched) && stories.publicItems.length > 0) {
            return {
                data: stories.publicItems,
                fetchedAt: stories.publicLastFetched,
            };
        }

        try {
            const res = await axios.get('/api/stories/public');

            return {
                data: res.data.data || [],
                fetchedAt: Date.now(),
            };
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Failed to load public stories');
        }
    }
);

export const fetchStory = createAsyncThunk(
    'stories/fetchOne',
    async (id, { getState, rejectWithValue }) => {
        const { auth, stories } = getState();
        const idKey = storyIdKey(id);

        if (idKey && isFresh(stories.detailFetchedAt[idKey]) && stories.storyCache[idKey]) {
            return {
                data: stories.storyCache[idKey],
                fetchedAt: stories.detailFetchedAt[idKey],
            };
        }

        try {
            const res = await axios.get(`/api/stories/${id}`, {
                headers: { Authorization: `Bearer ${auth.token}` },
            });

            return {
                data: res.data.data || null,
                fetchedAt: Date.now(),
            };
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Failed to load story');
        }
    }
);

export const fetchPublicStoryBySlug = createAsyncThunk(
    'stories/fetchPublicOne',
    async (slug, { getState, rejectWithValue }) => {
        const { stories } = getState();
        const slugKey = storySlugKey(slug);

        if (slugKey && isFresh(stories.publicDetailFetchedAt[slugKey]) && stories.publicStoryCache[slugKey]) {
            return {
                data: stories.publicStoryCache[slugKey],
                fetchedAt: stories.publicDetailFetchedAt[slugKey],
            };
        }

        try {
            const res = await axios.get(`/api/stories/public/${encodeURIComponent(slugKey)}`);

            return {
                data: res.data.data || null,
                fetchedAt: Date.now(),
            };
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Failed to load public story');
        }
    }
);

export const createStory = createAsyncThunk(
    'stories/create',
    async (payload, { getState, rejectWithValue }) => {
        const { auth } = getState();

        if (!auth.token) {
            return rejectWithValue('Please log in to publish your story');
        }

        try {
            const res = await axios.post('/api/stories/', payload, {
                headers: { Authorization: `Bearer ${auth.token}` },
            });

            return res.data.data;
        } catch (err) {
            const validationErrors = err.response?.data?.errors;
            const validationMessage = validationErrors
                ? Object.values(validationErrors).flat().find(Boolean)
                : null;

            return rejectWithValue(validationMessage || err.response?.data?.error || 'Failed to create story');
        }
    }
);

export const updateStory = createAsyncThunk(
    'stories/update',
    async ({ id, payload }, { getState, rejectWithValue }) => {
        const { auth } = getState();

        try {
            const res = await axios.put(`/api/stories/${id}`, payload, {
                headers: { Authorization: `Bearer ${auth.token}` },
            });

            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.errors || err.response?.data?.error || 'Failed to update story');
        }
    }
);

export const deleteStory = createAsyncThunk(
    'stories/delete',
    async (id, { getState, rejectWithValue }) => {
        const { auth } = getState();

        try {
            await axios.delete(`/api/stories/${id}`, {
                headers: { Authorization: `Bearer ${auth.token}` },
            });

            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Failed to delete story');
        }
    }
);

/**
 * Enhance story text via the Gemini AI backend.
 * Public endpoint — no auth token required.
 * Returns the enhanced story string as the fulfilled payload.
 * The component previews it first; the DB is only updated when the user saves the form.
 */
export const enhanceStory = createAsyncThunk(
    'stories/enhance',
    async (payload, { rejectWithValue }) => {
        try {
            const res = await axios.post('/api/stories/enhance', payload);
            return {
                enhanced_story: res.data.enhanced_story,
                ai_model: res.data.ai_model || 'gemini-2.5-flash',
            };
        } catch (err) {
            const serverError =
                err.response?.data?.error ||
                (err.response?.data?.errors
                    ? Object.values(err.response.data.errors).flat().join(' ')
                    : null) ||
                'AI enhancement failed. Please try again.';
            return rejectWithValue(serverError);
        }
    }
);

const storiesSlice = createSlice({
    name: 'stories',
    initialState: {
        items: [],
        publicItems: [],
        currentStory: null,
        currentPublicStory: null,
        storyCache: {},
        publicStoryCache: {},
        detailFetchedAt: {},
        publicDetailFetchedAt: {},
        loading: false,
        publicLoading: false,
        detailLoading: false,
        publicDetailLoading: false,
        submitting: false,
        aiEnhancing: false,
        aiError: null,
        error: null,
        publicError: null,
        detailError: null,
        publicDetailError: null,
        lastFetched: null,
        publicLastFetched: null,
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
            state.detailError = null;
            state.publicError = null;
            state.publicDetailError = null;
            state.aiError = null;
        },
        clearAiError: (state) => {
            state.aiError = null;
        },
        clearCurrentStory: (state) => {
            state.currentStory = null;
            state.detailError = null;
        },
        clearCurrentPublicStory: (state) => {
            state.currentPublicStory = null;
            state.publicDetailError = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchStories.pending, (state) => {
                state.loading = !isFresh(state.lastFetched);
                state.error = null;
            })
            .addCase(fetchStories.fulfilled, (state, action) => {
                state.loading = false;
                state.items = sortStories(action.payload.data);
                state.lastFetched = action.payload.fetchedAt;

                action.payload.data.forEach((story) => {
                    syncStoryCache(state, story, action.payload.fetchedAt);
                });
            })
            .addCase(fetchStories.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        builder
            .addCase(fetchPublicStories.pending, (state) => {
                state.publicLoading = !isFresh(state.publicLastFetched);
                state.publicError = null;
            })
            .addCase(fetchPublicStories.fulfilled, (state, action) => {
                state.publicLoading = false;
                state.publicItems = sortStories(action.payload.data);
                state.publicLastFetched = action.payload.fetchedAt;

                action.payload.data.forEach((story) => {
                    syncPublicStoryCache(state, story, action.payload.fetchedAt);
                });
            })
            .addCase(fetchPublicStories.rejected, (state, action) => {
                state.publicLoading = false;
                state.publicError = action.payload;
            });

        builder
            .addCase(fetchStory.pending, (state) => {
                state.detailLoading = true;
                state.detailError = null;
            })
            .addCase(fetchStory.fulfilled, (state, action) => {
                state.detailLoading = false;
                state.currentStory = action.payload.data;

                if (action.payload.data) {
                    syncStoryCache(state, action.payload.data, action.payload.fetchedAt);

                    const existingIndex = state.items.findIndex((item) => String(item?.id) === String(action.payload.data.id));
                    if (existingIndex !== -1) {
                        state.items[existingIndex] = action.payload.data;
                    } else {
                        state.items.push(action.payload.data);
                    }

                    state.items = sortStories(state.items);
                }
            })
            .addCase(fetchStory.rejected, (state, action) => {
                state.detailLoading = false;
                state.detailError = action.payload;
            });

        builder
            .addCase(fetchPublicStoryBySlug.pending, (state) => {
                state.publicDetailLoading = true;
                state.publicDetailError = null;
            })
            .addCase(fetchPublicStoryBySlug.fulfilled, (state, action) => {
                state.publicDetailLoading = false;
                state.currentPublicStory = action.payload.data;

                if (action.payload.data) {
                    syncPublicStoryCache(state, action.payload.data, action.payload.fetchedAt);

                    const existingIndex = state.publicItems.findIndex((item) => String(item?.id) === String(action.payload.data.id));
                    if (existingIndex !== -1) {
                        state.publicItems[existingIndex] = action.payload.data;
                    } else {
                        state.publicItems.push(action.payload.data);
                    }

                    state.publicItems = sortStories(state.publicItems);
                    state.publicLastFetched = Date.now();
                }
            })
            .addCase(fetchPublicStoryBySlug.rejected, (state, action) => {
                state.publicDetailLoading = false;
                state.publicDetailError = action.payload;
            });

        builder
            .addCase(createStory.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(createStory.fulfilled, (state, action) => {
                state.submitting = false;

                if (action.payload) {
                    state.items = sortStories([...state.items, action.payload]);
                    state.currentStory = action.payload;
                    syncStoryCache(state, action.payload);

                    if (action.payload.is_published) {
                        state.publicItems = sortStories([...state.publicItems, action.payload]);
                        syncPublicStoryCache(state, action.payload);
                        state.publicLastFetched = Date.now();
                    }
                }

                state.lastFetched = Date.now();
            })
            .addCase(createStory.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            });

        builder
            .addCase(updateStory.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(updateStory.fulfilled, (state, action) => {
                state.submitting = false;

                if (!action.payload) {
                    return;
                }

                const itemIndex = state.items.findIndex((item) => String(item?.id) === String(action.payload.id));
                if (itemIndex !== -1) {
                    state.items[itemIndex] = action.payload;
                } else {
                    state.items.push(action.payload);
                }
                state.items = sortStories(state.items);

                if (state.currentStory && String(state.currentStory.id) === String(action.payload.id)) {
                    state.currentStory = action.payload;
                }

                syncStoryCache(state, action.payload);

                removePublicStoryCacheById(state, action.payload.id);
                const publicIndex = state.publicItems.findIndex((item) => String(item?.id) === String(action.payload.id));
                if (action.payload.is_published) {
                    if (publicIndex !== -1) {
                        state.publicItems[publicIndex] = action.payload;
                    } else {
                        state.publicItems.push(action.payload);
                    }

                    state.publicItems = sortStories(state.publicItems);
                    syncPublicStoryCache(state, action.payload);
                } else if (publicIndex !== -1) {
                    state.publicItems = removeStoryFromList(state.publicItems, action.payload.id);
                }

                if (state.currentPublicStory && String(state.currentPublicStory.id) === String(action.payload.id)) {
                    state.currentPublicStory = action.payload.is_published ? action.payload : null;
                }

                state.lastFetched = Date.now();
                state.publicLastFetched = Date.now();
            })
            .addCase(updateStory.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            });

        builder
            .addCase(deleteStory.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(deleteStory.fulfilled, (state, action) => {
                state.submitting = false;
                state.items = removeStoryFromList(state.items, action.payload);
                state.publicItems = removeStoryFromList(state.publicItems, action.payload);

                if (state.currentStory && String(state.currentStory.id) === String(action.payload)) {
                    state.currentStory = null;
                }

                if (state.currentPublicStory && String(state.currentPublicStory.id) === String(action.payload)) {
                    state.currentPublicStory = null;
                }

                delete state.storyCache[String(action.payload)];
                delete state.detailFetchedAt[String(action.payload)];
                removePublicStoryCacheById(state, action.payload);
                state.lastFetched = Date.now();
                state.publicLastFetched = Date.now();
            })
            .addCase(deleteStory.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            });

        builder
            .addCase(enhanceStory.pending, (state) => {
                state.aiEnhancing = true;
                state.aiError = null;
            })
            .addCase(enhanceStory.fulfilled, (state) => {
                state.aiEnhancing = false;
                state.aiError = null;
            })
            .addCase(enhanceStory.rejected, (state, action) => {
                state.aiEnhancing = false;
                state.aiError = action.payload;
            });
    },
});

export const { clearError, clearAiError, clearCurrentStory, clearCurrentPublicStory } = storiesSlice.actions;
export default storiesSlice.reducer;
