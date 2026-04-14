import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

// Clear invalid localStorage data
if (localStorage.getItem("userInfo") === "undefined" || localStorage.getItem("userInfo") === "null") {
  localStorage.removeItem("userInfo");
}

if (localStorage.getItem("degreeInfo") === "undefined" || localStorage.getItem("degreeInfo") === "null") {
  localStorage.removeItem("degreeInfo");
}

if (localStorage.getItem("monthyearInfo") === "undefined" || localStorage.getItem("monthyearInfo") === "null") {
  localStorage.removeItem("monthyearInfo");
}

// Define types
interface UserInfo {
  user_id?: number;
  email?: string;
  name?: string;
  role?: string;
  user_status?: number;
  user_Success?: boolean;
  token?: string;
  message?: string;
  terms?: boolean;
  selected_course?: string;
  [key: string]: unknown;
}

interface AuthState {
  userInfo: UserInfo | null;
  degreeInfo: unknown;
  monthyearInfo: unknown;
  items: unknown[];
  user_active_role: string | null;
  isAuthenticated: boolean;
}
 
const initialState: AuthState = {
  userInfo: localStorage.getItem("userInfo") ? JSON.parse(localStorage.getItem("userInfo")!)  : null,
  degreeInfo: localStorage.getItem("degreeInfo") ? JSON.parse(localStorage.getItem("degreeInfo")!) : null,
  monthyearInfo: localStorage.getItem("monthyearInfo") ? JSON.parse(localStorage.getItem("monthyearInfo")!) : null,
  items: [],
  user_active_role: null,
  isAuthenticated: false
};

const authSlice = createSlice({
    name:"auth",
    initialState,
    reducers:{
        newloginitemadd : (state, action: PayloadAction<unknown>) => {
            state.items.push(action.payload)
        },

        setUserActiveRole: (state, action: PayloadAction<string | null>) => {
            state.user_active_role = action.payload
        },

        loginSuccess: (state, action: PayloadAction<UserInfo>) => {
            state.userInfo = action.payload
            state.isAuthenticated = true
            localStorage.setItem('userInfo', JSON.stringify(action.payload)) 
        },
        
        updateTerms: (state, action: PayloadAction<boolean>) => {
            if (state.userInfo) {
                state.userInfo = { ...state.userInfo, terms: action.payload }
                localStorage.setItem('userInfo', JSON.stringify(state.userInfo))
            }
        },
        
        degreeLoad: (state, action: PayloadAction<unknown>) => {
            state.degreeInfo = action.payload
            localStorage.setItem('degreeInfo', JSON.stringify(action.payload)) 
        },
        
        logoutSuccess: (state) => {
            state.userInfo = null
            state.user_active_role = null
            state.items = []
            state.isAuthenticated = false
            localStorage.removeItem('userInfo')
            localStorage.removeItem('degreeInfo')
            localStorage.removeItem('monthyearInfo')
        },
        
        monthYearLoad: (state, action: PayloadAction<unknown>) => {
            state.monthyearInfo = action.payload
            localStorage.setItem('monthyearInfo', JSON.stringify(action.payload)) 
        },
        
        checkAuth: (state) => {
            state.isAuthenticated = !!localStorage.getItem('token');
        }
    },
});

export const {
  loginSuccess,
  logoutSuccess,
  checkAuth,
  newloginitemadd,
  setUserActiveRole,
  degreeLoad,
  monthYearLoad,
  updateTerms
} = authSlice.actions;

export default authSlice.reducer;
