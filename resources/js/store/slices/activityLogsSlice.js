import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const ACTIVITY_LOGS_CACHE_TTL = 60 * 1000;

const buildCacheKey = (params = {}) =>
    JSON.stringify(
        Object.entries(params || {})
            .filter(([, value]) => value !== undefined && value !== null && value !== '')
            .sort(([a], [b]) => a.localeCompare(b))
    );

const isFresh = (entry) => !!entry && Date.now() - entry.fetchedAt < ACTIVITY_LOGS_CACHE_TTL;

export const fetchActivityLogs = createAsyncThunk(
    'activityLogs/fetchAll',
    async (params = {}, { getState, rejectWithValue }) => {
        const { auth, activityLogs } = getState();
        const cacheKey = buildCacheKey(params);
        const cached = activityLogs.cache[cacheKey];

        // Do not serve cached empty results — avoids "No activity logs" sticking after backend/schema fixes.
        if (isFresh(cached) && Array.isArray(cached.data) && cached.data.length > 0) {
            return {
                cacheKey,
                data: cached.data,
                pagination: cached.pagination,
                fetchedAt: cached.fetchedAt,
            };
        }

        try {
            const res = await axios.get('/api/activity-logs', {
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
            return rejectWithValue(err.response?.data?.error || 'Failed to load activity logs');
        }
    }
);

const activityLogsSlice = createSlice({
    name: 'activityLogs',
    initialState: {
        items: [],
        pagination: null,
        loading: false,
        error: null,
        cache: {},
        activeCacheKey: buildCacheKey(),
    },
    reducers: {
        clearError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchActivityLogs.pending, (state, action) => {
                const cacheKey = buildCacheKey(action.meta.arg);
                const cached = state.cache[cacheKey];

                const useCache = isFresh(cached) && Array.isArray(cached.data) && cached.data.length > 0;
                state.loading = !useCache;
                state.error = null;

                if (useCache) {
                    state.items = cached.data;
                    state.pagination = cached.pagination;
                    state.activeCacheKey = cacheKey;
                }
            })
            .addCase(fetchActivityLogs.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.data;
                state.pagination = action.payload.pagination;
                state.activeCacheKey = action.payload.cacheKey;
                const rows = action.payload.data;
                if (Array.isArray(rows) && rows.length > 0) {
                    state.cache[action.payload.cacheKey] = {
                        data: rows,
                        pagination: action.payload.pagination,
                        fetchedAt: action.payload.fetchedAt,
                    };
                } else {
                    delete state.cache[action.payload.cacheKey];
                }
            })
            .addCase(fetchActivityLogs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearError } = activityLogsSlice.actions;
export default activityLogsSlice.reducer;
