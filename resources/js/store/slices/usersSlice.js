import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchUsers = createAsyncThunk(
    'users/fetchAll',
    async (params = {}, { getState, rejectWithValue }) => {
        const { auth } = getState();
        try {
            const res = await axios.get('/api/users', {
                headers: { Authorization: `Bearer ${auth.token}` },
                params,
            });
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Failed to load users');
        }
    }
);

export const updateUserStatus = createAsyncThunk(
    'users/updateStatus',
    async ({ uuid, id, status }, { getState, rejectWithValue }) => {
        const { auth } = getState();
        try {
            // UserController update accepts partial updates and expects uuid in the URL
            const targetId = uuid || id;
            const res = await axios.put(`/api/users/${targetId}`, { status }, {
                headers: { Authorization: `Bearer ${auth.token}` },
            });
            // Return the id and new status to update the local state
            return { id, status };
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Failed to update user status');
        }
    }
);

const usersSlice = createSlice({
    name: 'users',
    initialState: {
        items: [],
        loading: false,
        error: null,
    },
    reducers: {
        clearError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchUsers.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
            .addCase(fetchUsers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(updateUserStatus.fulfilled, (state, action) => {
                const index = state.items.findIndex(u => u.id === action.payload.id);
                if (index !== -1) {
                    state.items[index].status = action.payload.status;
                }
            })
            .addCase(updateUserStatus.rejected, (state, action) => { state.error = action.payload; });
    },
});

export const { clearError } = usersSlice.actions;
export default usersSlice.reducer;
