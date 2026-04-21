import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const token = sessionStorage.getItem('token');

const initialState = {
    user: null,
    token: token,
    isAuthenticated: !!token,
    loading: false,
    error: null,
    isInitialized: false, // Track if we've successfully checked the token
};

export const fetchUser = createAsyncThunk('auth/fetchUser', async (_, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (!auth.token) return rejectWithValue('No token');
    
    try {
        const response = await axios.get('/api/auth/check', {
            headers: { Authorization: `Bearer ${auth.token}` }
        });
        return response.data.user;
    } catch (error) {
        sessionStorage.removeItem('token');
        return rejectWithValue(error.response?.data?.error || 'Failed to authenticate');
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
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchUser.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload;
                state.isInitialized = true;
            })
            .addCase(fetchUser.rejected, (state, action) => {
                state.loading = false;
                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
                state.error = action.payload;
                state.isInitialized = true;
            });
    }
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;

export default authSlice.reducer;
