import { configureStore } from '@reduxjs/toolkit';
import authSlice from './authSlice';
import profileSlice from './profileSlice';
import discoverySlice from './slices/discoverySlice';
import connectionSlice from './slices/connectionSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    profile: profileSlice,
    discovery: discoverySlice,
    connections: connectionSlice,
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
