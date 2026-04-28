import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk for uploading an image to Cloudinary
export const uploadToCloudinary = createAsyncThunk(
    'upload/uploadToCloudinary',
    async ({ file }, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('image', file);

            const token = sessionStorage.getItem('token');
            const headers = {
                'Content-Type': 'multipart/form-data',
                'Accept': 'application/json',
            };

            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await axios.post('/api/upload/cloudinary', formData, {
                headers
            });

            if (response.data.success) {
                const fileSignature = `${file.name}-${file.size}-${file.lastModified}`;
                return { signature: fileSignature, url: response.data.url };
            } else {
                return rejectWithValue(response.data.error || 'Cloudinary upload failed.');
            }
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 
                error.response?.data?.error || 
                'Failed to upload image to Cloudinary.'
            );
        }
    }
);

// Async thunk for uploading an image
export const uploadImage = createAsyncThunk(
    'upload/uploadImage',
    async ({ file, isPublic = false }, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('image', file);

            const token = sessionStorage.getItem('token');
            const headers = {
                'Content-Type': 'multipart/form-data',
                'Accept': 'application/json',
            };

            if (!isPublic && token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await axios.post(isPublic ? '/api/upload/public' : '/api/upload', formData, {
                headers: {
                    ...headers,
                }
            });

            if (response.data.success) {
                // Generate a unique signature for this file to cache it
                const fileSignature = `${file.name}-${file.size}-${file.lastModified}`;
                return { signature: fileSignature, url: response.data.url };
            } else {
                return rejectWithValue(response.data.error || 'Upload failed.');
            }
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 
                error.response?.data?.error || 
                'Failed to upload image.'
            );
        }
    }
);

const uploadSlice = createSlice({
    name: 'upload',
    initialState: {
        isUploading: false,
        error: null,
        // Cache object mapping file signatures to uploaded URLs
        cachedUploads: {}
    },
    reducers: {
        clearUploadError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(uploadImage.pending, (state) => {
                state.isUploading = true;
                state.error = null;
            })
            .addCase(uploadImage.fulfilled, (state, action) => {
                state.isUploading = false;
                state.error = null;
                // Save to cache
                state.cachedUploads[action.payload.signature] = action.payload.url;
            })
            .addCase(uploadImage.rejected, (state, action) => {
                state.isUploading = false;
                state.error = action.payload;
            })
            .addCase(uploadToCloudinary.pending, (state) => {
                state.isUploading = true;
                state.error = null;
            })
            .addCase(uploadToCloudinary.fulfilled, (state, action) => {
                state.isUploading = false;
                state.error = null;
                state.cachedUploads[action.payload.signature] = action.payload.url;
            })
            .addCase(uploadToCloudinary.rejected, (state, action) => {
                state.isUploading = false;
                state.error = action.payload;
            });
    }
});

export const { clearUploadError } = uploadSlice.actions;
export default uploadSlice.reducer;
