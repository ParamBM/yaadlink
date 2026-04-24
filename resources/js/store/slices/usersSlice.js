import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const USERS_CACHE_TTL = 60 * 1000;

const buildUsersCacheKey = (params = {}) =>
    JSON.stringify(
        Object.entries(params || {})
            .filter(([, value]) => value !== undefined && value !== null && value !== '')
            .sort(([left], [right]) => left.localeCompare(right))
    );

const isFresh = (entry) => !!entry && Date.now() - entry.fetchedAt < USERS_CACHE_TTL;

const matchesUser = (left, right) => {
    if (!left || !right) {
        return false;
    }

    if (left.id != null && right.id != null && String(left.id) === String(right.id)) {
        return true;
    }

    if (left.uuid && right.uuid && String(left.uuid) === String(right.uuid)) {
        return true;
    }

    return false;
};

const mergeUpdatedUserIntoList = (items = [], updatedUser) =>
    items.map((user) => (matchesUser(user, updatedUser) ? { ...user, ...updatedUser } : user));

const mergeUpdatedUserIntoState = (state, updatedUser) => {
    state.items = mergeUpdatedUserIntoList(state.items, updatedUser);
    state.lastFetched = Date.now();

    Object.keys(state.cache).forEach((cacheKey) => {
        state.cache[cacheKey] = {
            ...state.cache[cacheKey],
            data: mergeUpdatedUserIntoList(state.cache[cacheKey]?.data, updatedUser),
            fetchedAt: state.lastFetched,
        };
    });
};

export const fetchUsers = createAsyncThunk(
    'users/fetchAll',
    async (params = {}, { getState, rejectWithValue }) => {
        const { auth, users } = getState();
        const cacheKey = buildUsersCacheKey(params);
        const cached = users.cache[cacheKey];

        if (isFresh(cached)) {
            return {
                data: cached.data,
                cacheKey,
                fetchedAt: cached.fetchedAt,
            };
        }

        try {
            const response = await axios.get('/api/users', {
                headers: { Authorization: `Bearer ${auth.token}` },
                params,
            });

            return {
                data: response.data.data || [],
                cacheKey,
                fetchedAt: Date.now(),
            };
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to load users');
        }
    }
);

export const updateUserStatus = createAsyncThunk(
    'users/updateStatus',
    async ({ uuid, id, status }, { getState, rejectWithValue }) => {
        const { auth } = getState();
        const targetId = id ?? uuid;

        if (!targetId) {
            return rejectWithValue('Missing user identifier');
        }

        try {
            const response = await axios.put(`/api/users/${targetId}`, { status }, {
                headers: { Authorization: `Bearer ${auth.token}` },
            });

            return response.data.data || { id: targetId, status };
        } catch (error) {
            return rejectWithValue(error.response?.data || error.response?.data?.error || 'Failed to update user status');
        }
    }
);

export const updateUser = createAsyncThunk(
    'users/update',
    async ({ uuid, id, payload }, { getState, rejectWithValue }) => {
        const { auth } = getState();
        const targetId = id ?? uuid;

        if (!targetId) {
            return rejectWithValue('Missing user identifier');
        }

        try {
            const response = await axios.put(`/api/users/${targetId}`, payload, {
                headers: { Authorization: `Bearer ${auth.token}` },
            });

            return response.data.data || { id: targetId, ...payload };
        } catch (error) {
            return rejectWithValue(error.response?.data || error.response?.data?.error || 'Failed to update user');
        }
    }
);

export const createUser = createAsyncThunk(
    'users/create',
    async (payload, { getState, rejectWithValue }) => {
        const { auth } = getState();

        try {
            const response = await axios.post('/api/users', payload, {
                headers: { Authorization: `Bearer ${auth.token}` },
            });

            return response.data.data || payload;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.response?.data?.error || 'Failed to create user');
        }
    }
);

export const deleteUser = createAsyncThunk(
    'users/delete',
    async ({ uuid, id }, { getState, rejectWithValue }) => {
        const { auth } = getState();
        const targetId = id ?? uuid;

        if (!targetId) {
            return rejectWithValue('Missing user identifier');
        }

        try {
            await axios.delete(`/api/users/${targetId}`, {
                headers: { Authorization: `Bearer ${auth.token}` },
            });

            return { id: targetId, uuid };
        } catch (error) {
            return rejectWithValue(error.response?.data || error.response?.data?.error || 'Failed to delete user');
        }
    }
);

export const forceDeleteUser = createAsyncThunk(
    'users/forceDelete',
    async ({ uuid, id }, { getState, rejectWithValue }) => {
        const { auth } = getState();
        const targetId = id ?? uuid;

        if (!targetId) {
            return rejectWithValue('Missing user identifier');
        }

        try {
            await axios.delete(`/api/users/${targetId}/force`, {
                headers: { Authorization: `Bearer ${auth.token}` },
            });

            return { id: targetId, uuid };
        } catch (error) {
            return rejectWithValue(error.response?.data || error.response?.data?.error || 'Failed to permanently delete user');
        }
    }
);

const usersSlice = createSlice({
    name: 'users',
    initialState: {
        items: [],
        loading: false,
        error: null,
        cache: {},
        activeCacheKey: buildUsersCacheKey(),
        lastFetched: null,
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state, action) => {
                const cacheKey = buildUsersCacheKey(action.meta.arg);
                const cached = state.cache[cacheKey];

                state.loading = !isFresh(cached);
                state.error = null;

                if (cached) {
                    state.items = cached.data;
                    state.activeCacheKey = cacheKey;
                    state.lastFetched = cached.fetchedAt;
                }
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.data;
                state.activeCacheKey = action.payload.cacheKey;
                state.lastFetched = action.payload.fetchedAt;
                state.cache[action.payload.cacheKey] = {
                    data: action.payload.data,
                    fetchedAt: action.payload.fetchedAt,
                };
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(updateUserStatus.fulfilled, (state, action) => {
                state.error = null;
                mergeUpdatedUserIntoState(state, action.payload);
            })
            .addCase(updateUserStatus.rejected, (state, action) => {
                state.error = action.payload;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.error = null;
                mergeUpdatedUserIntoState(state, action.payload);
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.error = action.payload;
            })
            .addCase(createUser.fulfilled, (state, action) => {
                state.error = null;
                state.items = [action.payload, ...state.items];
                state.lastFetched = Date.now();
                state.cache = {};
            })
            .addCase(createUser.rejected, (state, action) => {
                state.error = action.payload;
            })
            .addCase(deleteUser.fulfilled, (state) => {
                state.error = null;
                state.cache = {};
                state.lastFetched = Date.now();
            })
            .addCase(deleteUser.rejected, (state, action) => {
                state.error = action.payload;
            })
            .addCase(forceDeleteUser.fulfilled, (state) => {
                state.error = null;
                state.cache = {};
                state.lastFetched = Date.now();
            })
            .addCase(forceDeleteUser.rejected, (state, action) => {
                state.error = action.payload;
            });
    },
});

export const { clearError } = usersSlice.actions;
export default usersSlice.reducer;
