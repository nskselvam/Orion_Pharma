import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../redux-slice/authSlice";
import { apiSlice } from "../redux-slice/apiSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,    
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore RTK Query actions that may contain non-serializable data (blobs)
        ignoredActions: [
          'api/executeQuery/fulfilled', 
          'api/executeQuery/pending',
          'api/executeQuery/rejected',
        ],
        // Ignore the entire api.queries state path which may contain cached blobs
        ignoredPaths: ['api.queries', 'api.mutations'],
      },
    }).concat(apiSlice.middleware),
  // Enable Redux DevTools
  devTools: true,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
