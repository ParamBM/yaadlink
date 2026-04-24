import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Only the token is persisted — user details are always verified from the backend
const token = sessionStorage.getItem('token');

/** Skip repeat /api/auth/check calls when user was loaded recently (same pattern as other slices). */
const AUTH_USER_CACHE_TTL_MS = 2 * 60 * 1000;

const isUserCacheFresh = (checkedAt) =>
    !!checkedAt && Date.now() - checkedAt < AUTH_USER_CACHE_TTL_MS;

const initialState = {
    user: null,               // never stored in sessionStorage — fetched from /api/auth/check
    token,
    isAuthenticated: !!token,
    loading: false,
    error: null,
    isInitialized: !token,    // if no token, already initialized; otherwise wait for fetchUser
    userCheckedAt: null,
};

// Called on app boot when a token already exists in sessionStorage
export const fetchUser = createAsyncThunk('auth/fetchUser', async (_, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('No token');

    if (auth.user && isUserCacheFresh(auth.userCheckedAt)) {
        return auth.user;
    }

    try {
        const response = await axios.get('/api/auth/check', {
            headers: { Authorization: `Bearer ${auth.token}` },
        });
        return response.data.user;
    } catch (error) {
        sessionStorage.removeItem('token');
        return rejectWithValue(error.response?.data?.error || 'Failed to authenticate');
    }
});

export const registerUser = createAsyncThunk('auth/registerUser', async (formData, { rejectWithValue }) => {
    try {
        const response = await axios.post('/api/auth/register', formData);
        const { user, token } = response.data;

        if (token) sessionStorage.setItem('token', token);
        // user data is NOT stored in sessionStorage — comes from backend on next check

        return { user, token };
    } catch (error) {
        const payload = error.response?.data;
        const validationMessage = payload?.errors
            ? Object.values(payload.errors).flat().find(Boolean)
            : null;

        return rejectWithValue(
            validationMessage ||
            payload?.message ||
            payload?.error ||
            'Failed to register'
        );
    }
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        loginSuccess: (state, action) => {
            state.loading = false;
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.error = null;
            state.isInitialized = true;
            state.userCheckedAt = Date.now();
            // Only token is persisted
            if (action.payload.token) {
                sessionStorage.setItem('token', action.payload.token);
            }
        },
        loginFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.loading = false;
            state.isInitialized = true;
            state.userCheckedAt = null;
            sessionStorage.removeItem('token');
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.error = null;
                state.isInitialized = true;
                state.userCheckedAt = Date.now();
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.isAuthenticated = false;
            })
            .addCase(fetchUser.pending, (state) => {
                state.loading = !state.user;
            })
            .addCase(fetchUser.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload;
                state.isInitialized = true;
                state.userCheckedAt = Date.now();
            })
            .addCase(fetchUser.rejected, (state, action) => {
                state.loading = false;
                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
                state.error = action.payload;
                state.isInitialized = true;
                state.userCheckedAt = null;
            });
    },
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;

export default authSlice.reducer;
