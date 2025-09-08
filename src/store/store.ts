import { configureStore } from '@reduxjs/toolkit';
import authSlice from './authSlice';
import profileSlice from './profileSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    profile: profileSlice,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
