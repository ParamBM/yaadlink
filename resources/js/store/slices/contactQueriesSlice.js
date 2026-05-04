import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const CONTACT_QUERIES_CACHE_TTL = 60 * 1000;

const buildCacheKey = (params = {}) =>
    JSON.stringify(
        Object.entries(params || {})
            .filter(([, value]) => value !== undefined && value !== null && value !== '')
            .sort(([a], [b]) => a.localeCompare(b))
    );

const isFresh = (entry) => !!entry && Date.now() - entry.fetchedAt < CONTACT_QUERIES_CACHE_TTL;

export const fetchContactCaptcha = createAsyncThunk(
    'contactQueries/fetchCaptcha',
    async (_, { rejectWithValue }) => {
        try {
            const res = await axios.get('/api/contact-queries/captcha');
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Failed to load captcha');
        }
    }
);

export const submitContactQuery = createAsyncThunk(
    'contactQueries/submit',
    async (payload, { rejectWithValue }) => {
        try {
            const res = await axios.post('/api/contact-queries/', payload);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.errors || err.response?.data?.error || 'Failed to submit contact query');
        }
    }
);

export const fetchContactQueries = createAsyncThunk(
    'contactQueries/fetchAll',
    async (params = {}, { getState, rejectWithValue }) => {
        const { auth, contactQueries } = getState();
        const cacheKey = buildCacheKey(params);
        const cached = contactQueries.cache[cacheKey];

        if (isFresh(cached)) {
            return {
                cacheKey,
                data: cached.data,
                pagination: cached.pagination,
                fetchedAt: cached.fetchedAt,
            };
        }

        try {
            const res = await axios.get('/api/contact-queries/', {
                headers: { Authorization: `Bearer ${auth.token}` },
                params,
            });

            return {
                cacheKey,
                data: res.data.data || [],
                pagination: res.data.pagination || null,
                fetchedAt: Date.now(),
            };
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Failed to load contact queries');
        }
    }
);

export const updateContactQuery = createAsyncThunk(
    'contactQueries/update',
    async ({ id, payload }, { getState, rejectWithValue }) => {
        const { auth } = getState();

        try {
            const res = await axios.put(`/api/contact-queries/${id}`, payload, {
                headers: { Authorization: `Bearer ${auth.token}` },
            });

            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.errors || err.response?.data?.error || 'Failed to update contact query');
        }
    }
);

export const deleteContactQuery = createAsyncThunk(
    'contactQueries/delete',
    async (id, { getState, rejectWithValue }) => {
        const { auth } = getState();

        try {
            await axios.delete(`/api/contact-queries/${id}`, {
                headers: { Authorization: `Bearer ${auth.token}` },
            });

            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Failed to delete contact query');
        }
    }
);

const contactQueriesSlice = createSlice({
    name: 'contactQueries',
    initialState: {
        items: [],
        pagination: null,
        loading: false,
        submitting: false,
        updating: false,
        error: null,
        submitError: null,
        submitted: false,
        captcha: null,
        captchaLoading: false,
        captchaError: null,
        cache: {},
        activeCacheKey: buildCacheKey(),
    },
    reducers: {
        clearContactError: (state) => {
            state.error = null;
            state.submitError = null;
            state.captchaError = null;
        },
        resetContactSubmission: (state) => {
            state.submitted = false;
            state.submitError = null;
        },
        invalidateContactQueriesCache: (state) => {
            state.cache = {};
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchContactCaptcha.pending, (state) => {
                state.captchaLoading = true;
                state.captchaError = null;
            })
            .addCase(fetchContactCaptcha.fulfilled, (state, action) => {
                state.captchaLoading = false;
                state.captcha = action.payload;
            })
            .addCase(fetchContactCaptcha.rejected, (state, action) => {
                state.captchaLoading = false;
                state.captchaError = action.payload;
            });

        builder
            .addCase(submitContactQuery.pending, (state) => {
                state.submitting = true;
                state.submitted = false;
                state.submitError = null;
            })
            .addCase(submitContactQuery.fulfilled, (state) => {
                state.submitting = false;
                state.submitted = true;
                state.captcha = null;
                state.cache = {};
            })
            .addCase(submitContactQuery.rejected, (state, action) => {
                state.submitting = false;
                state.submitError = action.payload;
                state.captcha = null;
            });

        builder
            .addCase(fetchContactQueries.pending, (state, action) => {
                const cacheKey = buildCacheKey(action.meta.arg);
                const cached = state.cache[cacheKey];

                state.loading = !isFresh(cached);
                state.error = null;

                if (isFresh(cached)) {
                    state.items = cached.data;
                    state.pagination = cached.pagination;
                    state.activeCacheKey = cacheKey;
                }
            })
            .addCase(fetchContactQueries.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.data;
                state.pagination = action.payload.pagination;
                state.activeCacheKey = action.payload.cacheKey;
                state.cache[action.payload.cacheKey] = {
                    data: action.payload.data,
                    pagination: action.payload.pagination,
                    fetchedAt: action.payload.fetchedAt,
                };
            })
            .addCase(fetchContactQueries.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        builder
            .addCase(updateContactQuery.pending, (state) => {
                state.updating = true;
                state.error = null;
            })
            .addCase(updateContactQuery.fulfilled, (state, action) => {
                state.updating = false;
                state.items = state.items.map((item) => (
                    String(item.id) === String(action.payload.id) ? action.payload : item
                ));
                state.cache = {};
            })
            .addCase(updateContactQuery.rejected, (state, action) => {
                state.updating = false;
                state.error = action.payload;
            });

        builder
            .addCase(deleteContactQuery.fulfilled, (state, action) => {
                state.items = state.items.filter((item) => String(item.id) !== String(action.payload));
                if (state.pagination?.total) {
                    state.pagination.total = Math.max(0, state.pagination.total - 1);
                }
                state.cache = {};
            })
            .addCase(deleteContactQuery.rejected, (state, action) => {
                state.error = action.payload;
            });
    },
});

export const {
    clearContactError,
    resetContactSubmission,
    invalidateContactQueriesCache,
} = contactQueriesSlice.actions;

export default contactQueriesSlice.reducer;
