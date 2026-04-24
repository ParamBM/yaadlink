import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const OCCASION_TYPES_CACHE_TTL = 5 * 60 * 1000;

const isFresh = (timestamp) => !!timestamp && Date.now() - timestamp < OCCASION_TYPES_CACHE_TTL;
const sortOccasionTypes = (items = []) => [...items].sort((left, right) => {
    const leftOrder = Number(left?.sort_order ?? 0);
    const rightOrder = Number(right?.sort_order ?? 0);

    if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
    }

    return String(left?.name || '').localeCompare(String(right?.name || ''));
});

export const fetchOccasionTypes = createAsyncThunk(
    'occasionTypes/fetchAll',
    async (_, { getState, rejectWithValue }) => {
        const { auth, occasionTypes } = getState();

        if (isFresh(occasionTypes.lastFetched) && occasionTypes.items.length > 0) {
            return {
                data: occasionTypes.items,
                fetchedAt: occasionTypes.lastFetched,
            };
        }

        try {
            const res = await axios.get('/api/occasion-types/', {
                headers: { Authorization: `Bearer ${auth.token}` },
            });
            return {
                data: res.data.data || [],
                fetchedAt: Date.now(),
            };
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Failed to load occasion types');
        }
    }
);

export const fetchPublicOccasionTypes = createAsyncThunk(
    'occasionTypes/fetchPublic',
    async (_, { getState, rejectWithValue }) => {
        const { occasionTypes } = getState();

        if (isFresh(occasionTypes.publicLastFetched) && occasionTypes.publicItems.length > 0) {
            return {
                data: occasionTypes.publicItems,
                fetchedAt: occasionTypes.publicLastFetched,
            };
        }

        try {
            const res = await axios.get('/api/occasion-types/public');
            return {
                data: res.data.data || [],
                fetchedAt: Date.now(),
            };
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Failed to load public occasion types');
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

const occasionTypesSlice = createSlice({
    name: 'occasionTypes',
    initialState: {
        items: [],
        publicItems: [],
        loading: false,
        publicLoading: false,
        submitting: false,
        error: null,
        publicError: null,
        lastFetched: null,
        publicLastFetched: null,
    },
    reducers: {
        clearError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchOccasionTypes.pending, (state) => {
                state.loading = !isFresh(state.lastFetched);
                state.error = null;
            })
            .addCase(fetchOccasionTypes.fulfilled, (state, action) => {
                state.loading = false;
                state.items = sortOccasionTypes(action.payload.data);
                state.lastFetched = action.payload.fetchedAt;
            })
            .addCase(fetchOccasionTypes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        builder
            .addCase(fetchPublicOccasionTypes.pending, (state) => {
                state.publicLoading = !isFresh(state.publicLastFetched);
                state.publicError = null;
            })
            .addCase(fetchPublicOccasionTypes.fulfilled, (state, action) => {
                state.publicLoading = false;
                state.publicItems = sortOccasionTypes(action.payload.data);
                state.publicLastFetched = action.payload.fetchedAt;
            })
            .addCase(fetchPublicOccasionTypes.rejected, (state, action) => {
                state.publicLoading = false;
                state.publicError = action.payload;
            });

        builder
            .addCase(createOccasionType.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(createOccasionType.fulfilled, (state, action) => {
                state.submitting = false;
                if (action.payload) {
                    state.items = sortOccasionTypes([...state.items, action.payload]);

                    if (action.payload.is_active) {
                        state.publicItems = sortOccasionTypes([...state.publicItems, action.payload]);
                        state.publicLastFetched = Date.now();
                    }
                }
                state.lastFetched = Date.now();
            })
            .addCase(createOccasionType.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            });

        builder
            .addCase(updateOccasionType.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(updateOccasionType.fulfilled, (state, action) => {
                state.submitting = false;
                if (!action.payload) {
                    return;
                }

                const idx = state.items.findIndex(i => String(i?.id) === String(action.payload.id));
                if (idx !== -1) state.items[idx] = action.payload;
                state.items = sortOccasionTypes(state.items);

                const publicIdx = state.publicItems.findIndex(i => String(i?.id) === String(action.payload.id));
                if (action.payload?.is_active) {
                    if (publicIdx !== -1) {
                        state.publicItems[publicIdx] = action.payload;
                    } else {
                        state.publicItems.push(action.payload);
                    }
                    state.publicItems = sortOccasionTypes(state.publicItems);
                } else if (publicIdx !== -1) {
                    state.publicItems = state.publicItems.filter(i => i.id !== action.payload.id);
                }

                state.lastFetched = Date.now();
                state.publicLastFetched = Date.now();
            })
            .addCase(updateOccasionType.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            });

        builder
            .addCase(deleteOccasionType.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(deleteOccasionType.fulfilled, (state, action) => {
                state.submitting = false;
                state.items = state.items.filter(i => i.id !== action.payload);
                state.publicItems = state.publicItems.filter(i => i.id !== action.payload);
                state.lastFetched = Date.now();
                state.publicLastFetched = Date.now();
            })
            .addCase(deleteOccasionType.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            });
    },
});

export const { clearError } = occasionTypesSlice.actions;
export default occasionTypesSlice.reducer;
