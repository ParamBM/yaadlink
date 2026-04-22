import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import occasionTypesReducer from './slices/occasionTypesSlice';
import usersReducer from './slices/usersSlice';
import activityLogsReducer from './slices/activityLogsSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        occasionTypes: occasionTypesReducer,
        users: usersReducer,
        activityLogs: activityLogsReducer,
    },
});

export default store;
