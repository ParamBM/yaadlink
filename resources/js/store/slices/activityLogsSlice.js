import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchActivityLogs = createAsyncThunk(
    'activityLogs/fetchAll',
    async (params = {}, { getState, rejectWithValue }) => {
        const { auth } = getState();
        try {
            const res = await axios.get('/api/activity-logs', {
                headers: { Authorization: `Bearer ${auth.token}` },
                params,
            });
            return res.data; // { data: [], pagination: {} }
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
    },
    reducers: {
        clearError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchActivityLogs.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchActivityLogs.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.data || [];
                state.pagination = action.payload.pagination || null;
            })
            .addCase(fetchActivityLogs.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
    },
});

export const { clearError } = activityLogsSlice.actions;
export default activityLogsSlice.reducer;
