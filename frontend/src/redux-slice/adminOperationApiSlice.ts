import { apiSlice } from "./apiSlice";

export const adminOperationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllUserData: builder.query({
      query: () => ({
        url: `/api/admin/all_user_data`,
        method: "GET",
      }),
      providesTags: ['UserData'],
    }),
    
    addNewUser: builder.mutation({
      query: (data) => ({
        url: `/api/admin/create_user_data`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['UserData'],
    }),
    
    deleteAdminUser: builder.mutation({
      query: (data) => ({
        url: `/api/admin/delete_user_data`,
        method: "DELETE",
        body: data,
      }),
      invalidatesTags: ['UserData'],
    }),
    
    getNavbarDetails: builder.query({
      query: () => ({
        url: `/api/admin/get_all_user_roll_data`,
        method: "POST",
        body: {},
      }),
      providesTags: ['UserDataNavbar'],
    }),
    
    createNavbarItem: builder.mutation({
      query: (data) => ({
        url: `/api/admin/create_navbar_item`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['UserDataNavbar'],
    }),
    
    updateNavbarItem: builder.mutation({
      query: (data) => ({
        url: `/api/admin/update_navbar_item`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['UserDataNavbar'],
    }),
    
    deleteNavbarItem: builder.mutation({
      query: (data) => ({
        url: `/api/admin/delete_navbar_item`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['UserDataNavbar'],
    }),
    
    getAllRollMasters: builder.query({
      query: () => ({
        url: `/api/admin/get_all_roll_masters`,
        method: "POST",
        body: {},
      }),
      providesTags: ['RollMaster'],
    }),
    
    createRollMaster: builder.mutation({
      query: (data) => ({
        url: `/api/admin/create_roll_master`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['RollMaster'],
    }),
    
    updateRollMaster: builder.mutation({
      query: (data) => ({
        url: `/api/admin/update_roll_master`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['RollMaster'],
    }),
    
    deleteRollMaster: builder.mutation({
      query: (data) => ({
        url: `/api/admin/delete_roll_master`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['RollMaster'],
    }),

    updateRollMasterMapping: builder.mutation({
      query: (data) => {
        const url = data.ExaminerRoll 
          ? `/api/admin/updateRollMaster`
          : `/api/admin/update_user_roll_admin`;
        
        return {
          url,
          method: "POST",
          body: data,
        };
      },
      invalidatesTags: ['RollMaster'],
    }),
  }),
});

export const { 
  useGetAllUserDataQuery, 
  useAddNewUserMutation, 
  useDeleteAdminUserMutation, 
  useGetNavbarDetailsQuery,
  useCreateNavbarItemMutation,
  useUpdateNavbarItemMutation,
  useDeleteNavbarItemMutation,
  useGetAllRollMastersQuery,
  useCreateRollMasterMutation,
  useUpdateRollMasterMutation,
  useDeleteRollMasterMutation,
  useUpdateRollMasterMappingMutation
} = adminOperationApiSlice;
