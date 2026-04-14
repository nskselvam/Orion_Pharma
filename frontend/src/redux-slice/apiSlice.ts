import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface RootState {
  auth: {
    userInfo: {
      token?: string;
    } | null;
  };
}

const baseQuery = fetchBaseQuery({
  baseUrl: `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api`,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth?.userInfo?.token;
    
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    
    return headers;
  },
});

export const apiSlice = createApi({
  baseQuery,
  tagTypes: ['User', 'UserData', 'UserDataNavbar', 'RollMaster', 'Batches', 'Alerts'],
  endpoints: () => ({}),
});
