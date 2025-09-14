import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './authSlice';
import profileReducer from './profileSlice';
import discoveryReducer from './slices/discoverySlice';
import connectionReducer from './slices/connectionSlice';
import messagingReducer from './slices/messagingSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    discovery: discoveryReducer,
    connections: connectionReducer,
    messaging: messagingReducer,
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

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
