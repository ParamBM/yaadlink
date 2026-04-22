import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchOccasionTypes = createAsyncThunk(
    'occasionTypes/fetchAll',
    async (_, { getState, rejectWithValue }) => {
        const { auth } = getState();
        try {
            const res = await axios.get('/api/occasion-types/', {
                headers: { Authorization: `Bearer ${auth.token}` },
            });
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Failed to load occasion types');
        }
    }
);

export const createOccasionType = createAsyncThunk(
    'occasionTypes/create',
    async (payload, { getState, rejectWithValue }) => {
        const { auth } = getState();
        try {
            const res = await axios.post('/api/occasion-types/', payload, {
                headers: { Authorization: `Bearer ${auth.token}` },
            });
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.errors || err.response?.data?.error || 'Failed to create');
        }
    }
);

export const updateOccasionType = createAsyncThunk(
    'occasionTypes/update',
    async ({ id, payload }, { getState, rejectWithValue }) => {
        const { auth } = getState();
        try {
            const res = await axios.put(`/api/occasion-types/${id}`, payload, {
                headers: { Authorization: `Bearer ${auth.token}` },
            });
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.errors || err.response?.data?.error || 'Failed to update');
        }
    }
);

export const deleteOccasionType = createAsyncThunk(
    'occasionTypes/delete',
    async (id, { getState, rejectWithValue }) => {
        const { auth } = getState();
        try {
            await axios.delete(`/api/occasion-types/${id}`, {
                headers: { Authorization: `Bearer ${auth.token}` },
            });
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Failed to delete');
        }
    }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const occasionTypesSlice = createSlice({
    name: 'occasionTypes',
    initialState: {
        items: [],
        loading: false,
        submitting: false,
        error: null,
    },
    reducers: {
        clearError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        // fetchAll
        builder
            .addCase(fetchOccasionTypes.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchOccasionTypes.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
            .addCase(fetchOccasionTypes.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

        // create
        builder
            .addCase(createOccasionType.pending, (state) => { state.submitting = true; state.error = null; })
            .addCase(createOccasionType.fulfilled, (state, action) => { state.submitting = false; state.items.push(action.payload); })
            .addCase(createOccasionType.rejected, (state, action) => { state.submitting = false; state.error = action.payload; });

        // update
        builder
            .addCase(updateOccasionType.pending, (state) => { state.submitting = true; state.error = null; })
            .addCase(updateOccasionType.fulfilled, (state, action) => {
                state.submitting = false;
                const idx = state.items.findIndex(i => i.id === action.payload.id);
                if (idx !== -1) state.items[idx] = action.payload;
            })
            .addCase(updateOccasionType.rejected, (state, action) => { state.submitting = false; state.error = action.payload; });

        // delete
        builder
            .addCase(deleteOccasionType.pending, (state) => { state.submitting = true; state.error = null; })
            .addCase(deleteOccasionType.fulfilled, (state, action) => {
                state.submitting = false;
                state.items = state.items.filter(i => i.id !== action.payload);
            })
            .addCase(deleteOccasionType.rejected, (state, action) => { state.submitting = false; state.error = action.payload; });
    },
});

export const { clearError } = occasionTypesSlice.actions;
export default occasionTypesSlice.reducer;
