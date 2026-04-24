import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import storiesReducer from './slices/storiesSlice';
import themesReducer from './slices/themesSlice';
import occasionTypesReducer from './slices/occasionTypesSlice';
import usersReducer from './slices/usersSlice';
import activityLogsReducer from './slices/activityLogsSlice';
import uploadReducer from './slices/uploadSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        stories: storiesReducer,
        themes: themesReducer,
        occasionTypes: occasionTypesReducer,
        users: usersReducer,
        activityLogs: activityLogsReducer,
        upload: uploadReducer,
    },
});

export default store;
