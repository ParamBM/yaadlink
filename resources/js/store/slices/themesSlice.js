import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const THEMES_CACHE_TTL = 5 * 60 * 1000;

const isFresh = (timestamp) => !!timestamp && Date.now() - timestamp < THEMES_CACHE_TTL;

const sortThemes = (items = []) => [...items].sort((left, right) => {
    const leftOrder = Number(left?.sort_order ?? 0);
    const rightOrder = Number(right?.sort_order ?? 0);

    if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
    }

    return String(left?.name || '').localeCompare(String(right?.name || ''));
});

const appendThemeFormValue = (formData, key, value) => {
    if (value === undefined) {
        return;
    }

    if (value === null) {
        formData.append(key, '');
        return;
    }

    if (typeof File !== 'undefined' && value instanceof File) {
        formData.append(key, value);
        return;
    }

    if (typeof value === 'boolean') {
        formData.append(key, value ? '1' : '0');
        return;
    }

    if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
        return;
    }

    formData.append(key, String(value));
};

const buildThemeRequestBody = (payload = {}) => {
    if (!payload?.preview_image_file) {
        const { preview_image_file, ...jsonPayload } = payload;

        return {
            body: jsonPayload,
            extraHeaders: {},
        };
    }

    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
        appendThemeFormValue(formData, key, value);
    });

    return {
        body: formData,
        extraHeaders: {
            'Content-Type': 'multipart/form-data',
        },
    };
};

export const fetchThemes = createAsyncThunk(
    'themes/fetchAll',
    async (_, { getState, rejectWithValue }) => {
        const { auth, themes } = getState();

        if (isFresh(themes.lastFetched) && themes.items.length > 0) {
            return {
                data: themes.items,
                fetchedAt: themes.lastFetched,
            };
        }

        try {
            const res = await axios.get('/api/themes/', {
                headers: { Authorization: `Bearer ${auth.token}` },
            });

            return {
                data: res.data.data || [],
                fetchedAt: Date.now(),
            };
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Failed to load themes');
        }
    }
);

export const fetchPublicThemes = createAsyncThunk(
    'themes/fetchPublic',
    async (_, { getState, rejectWithValue }) => {
        const { themes } = getState();

        if (isFresh(themes.publicLastFetched) && themes.publicItems.length > 0) {
            return {
                data: themes.publicItems,
                fetchedAt: themes.publicLastFetched,
            };
        }

        try {
            const res = await axios.get('/api/themes/public');

            return {
                data: res.data.data || [],
                fetchedAt: Date.now(),
            };
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Failed to load public themes');
        }
    }
);

export const createTheme = createAsyncThunk(
    'themes/create',
    async (payload, { getState, rejectWithValue }) => {
        const { auth } = getState();
        const { body, extraHeaders } = buildThemeRequestBody(payload);

        try {
            const res = await axios.post('/api/themes/', body, {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                    ...extraHeaders,
                },
            });

            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.errors || err.response?.data?.error || 'Failed to create theme');
        }
    }
);

export const updateTheme = createAsyncThunk(
    'themes/update',
    async ({ id, payload }, { getState, rejectWithValue }) => {
        const { auth } = getState();
        const { body, extraHeaders } = buildThemeRequestBody(payload);

        try {
            const res = await axios.put(`/api/themes/${id}`, body, {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                    ...extraHeaders,
                },
            });

            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.errors || err.response?.data?.error || 'Failed to update theme');
        }
    }
);

export const deleteTheme = createAsyncThunk(
    'themes/delete',
    async (id, { getState, rejectWithValue }) => {
        const { auth } = getState();

        try {
            await axios.delete(`/api/themes/${id}`, {
                headers: { Authorization: `Bearer ${auth.token}` },
            });

            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Failed to delete theme');
        }
    }
);

const themesSlice = createSlice({
    name: 'themes',
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
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchThemes.pending, (state) => {
                state.loading = !isFresh(state.lastFetched);
                state.error = null;
            })
            .addCase(fetchThemes.fulfilled, (state, action) => {
                state.loading = false;
                state.items = sortThemes(action.payload.data);
                state.lastFetched = action.payload.fetchedAt;
            })
            .addCase(fetchThemes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        builder
            .addCase(fetchPublicThemes.pending, (state) => {
                state.publicLoading = !isFresh(state.publicLastFetched);
                state.publicError = null;
            })
            .addCase(fetchPublicThemes.fulfilled, (state, action) => {
                state.publicLoading = false;
                state.publicItems = sortThemes(action.payload.data);
                state.publicLastFetched = action.payload.fetchedAt;
            })
            .addCase(fetchPublicThemes.rejected, (state, action) => {
                state.publicLoading = false;
                state.publicError = action.payload;
            });

        builder
            .addCase(createTheme.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(createTheme.fulfilled, (state, action) => {
                state.submitting = false;

                if (action.payload) {
                    state.items = sortThemes([...state.items, action.payload]);

                    if (action.payload.is_active) {
                        state.publicItems = sortThemes([...state.publicItems, action.payload]);
                        state.publicLastFetched = Date.now();
                    }
                }

                state.lastFetched = Date.now();
            })
            .addCase(createTheme.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            });

        builder
            .addCase(updateTheme.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(updateTheme.fulfilled, (state, action) => {
                state.submitting = false;

                if (!action.payload) {
                    return;
                }

                const itemIndex = state.items.findIndex((item) => String(item?.id) === String(action.payload.id));
                if (itemIndex !== -1) {
                    state.items[itemIndex] = action.payload;
                }
                state.items = sortThemes(state.items);

                const publicIndex = state.publicItems.findIndex((item) => String(item?.id) === String(action.payload.id));
                if (action.payload?.is_active) {
                    if (publicIndex !== -1) {
                        state.publicItems[publicIndex] = action.payload;
                    } else {
                        state.publicItems.push(action.payload);
                    }

                    state.publicItems = sortThemes(state.publicItems);
                } else if (publicIndex !== -1) {
                    state.publicItems = state.publicItems.filter((item) => item.id !== action.payload.id);
                }

                state.lastFetched = Date.now();
                state.publicLastFetched = Date.now();
            })
            .addCase(updateTheme.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            });

        builder
            .addCase(deleteTheme.pending, (state) => {
                state.submitting = true;
                state.error = null;
            })
            .addCase(deleteTheme.fulfilled, (state, action) => {
                state.submitting = false;
                state.items = state.items.filter((item) => item.id !== action.payload);
                state.publicItems = state.publicItems.filter((item) => item.id !== action.payload);
                state.lastFetched = Date.now();
                state.publicLastFetched = Date.now();
            })
            .addCase(deleteTheme.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            });
    },
});

export const { clearError } = themesSlice.actions;
export default themesSlice.reducer;
