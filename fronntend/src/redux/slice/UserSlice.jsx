import { createSlice } from "@reduxjs/toolkit";
import Cookies from "js-cookie";

const INITIAL_STATE = {
  loading: false,
  error: null,
  isAuthenticated: false,
  token: null,
  userData: null,
  isBlocked:false
};
//modified userSlice

const userSlice = createSlice({
  name: "user",
  initialState: INITIAL_STATE,
  reducers: {
    userLogin(state, action) {
      state.userData = action.payload.userData;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    updateBlockStatus(state, action) {
      state.isBlocked = action.payload.isBlocked;
      if (action.payload.isBlocked) {
          state.isAuthenticated = false;
          state.userData = null;
          state.token = null;
      }
    },
    userLogout(state) {
      // Reset Redux state
      state.userData = null;
      state.token = null;
      state.isAuthenticated = false;
      state.currentUser = null;
      state.error = null;
      state.loading = false;

      // Remove cookies
      Cookies.remove('user_access_token');
      Cookies.remove('user_refresh_token');

      // Remove localStorage items
      localStorage.removeItem("accessToken");
      localStorage.removeItem("activeItem");
      localStorage.removeItem("userData");

      // Optional: Clear all user-related cookies
      Object.keys(Cookies.get()).forEach(cookieName => {
        if (cookieName.startsWith('user_')) {
          Cookies.remove(cookieName);
        }
      });
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    }
  },
});

export const { 
  userLogin, 
  userLogout, 
  setLoading, 
  setError ,
  updateBlockStatus
} = userSlice.actions;

export default userSlice.reducer;