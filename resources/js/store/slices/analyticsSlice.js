import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const ANALYTICS_CACHE_TTL = 60 * 1000;

const isFresh = (timestamp) => !!timestamp && Date.now() - timestamp < ANALYTICS_CACHE_TTL;

export const fetchAnalytics = createAsyncThunk(
    'analytics/fetch',
    async ({ days = 30, force = false } = {}, { getState, rejectWithValue }) => {
        const { auth, analytics } = getState();
        const cacheKey = String(days);
        const cached = analytics.cache[cacheKey];

        if (!force && cached && isFresh(cached.fetchedAt)) {
            return {
                data: cached.data,
                days,
                fetchedAt: cached.fetchedAt,
            };
        }

        try {
            const response = await axios.get('/api/analytics', {
                headers: { Authorization: `Bearer ${auth.token}` },
                params: { days },
            });

            return {
                data: response.data.data,
                days,
                fetchedAt: Date.now(),
            };
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to load analytics');
        }
    }
);

const analyticsSlice = createSlice({
    name: 'analytics',
    initialState: {
        data: null,
        loading: false,
        error: null,
        fetchedAt: null,
        selectedDays: 30,
        cache: {},
    },
    reducers: {
        clearAnalyticsError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAnalytics.pending, (state, action) => {
                const days = action.meta.arg?.days ?? 30;
                const cached = state.cache[String(days)];

                state.selectedDays = days;
                state.loading = !cached || !isFresh(cached.fetchedAt);
                state.error = null;
            })
            .addCase(fetchAnalytics.fulfilled, (state, action) => {
                const cacheKey = String(action.payload.days);

                state.loading = false;
                state.data = action.payload.data;
                state.fetchedAt = action.payload.fetchedAt;
                state.selectedDays = action.payload.days;
                state.cache[cacheKey] = {
                    data: action.payload.data,
                    fetchedAt: action.payload.fetchedAt,
                };
            })
            .addCase(fetchAnalytics.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearAnalyticsError } = analyticsSlice.actions;
export default analyticsSlice.reducer;
