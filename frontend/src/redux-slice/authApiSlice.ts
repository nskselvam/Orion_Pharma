import { apiSlice } from "./apiSlice";

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: `/api/auth/login`,
        method: "POST",
        body: credentials,
      }),
    }),
    
    logout: builder.mutation({
      query: () => ({
        url: `/api/auth/logout`,
        method: "POST",
      }),
    }),
    
    resetPassword: builder.mutation({
      query: (data) => ({
        url: `/api/auth/reset-password`,
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useResetPasswordMutation,
} = authApiSlice;
