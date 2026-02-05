import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// --- Thunks ---

export const loginUser = createAsyncThunk(
    "auth/login",
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await api.post("/users/login", credentials);
            return response.data.data; 
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Login failed. The server is shy.");
        }
    }
);

export const registerUser = createAsyncThunk(
    "auth/register",
    async (userData, { rejectWithValue }) => {
        try {
            const response = await api.post("/users/register", userData);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Registration failed.");
        }
    }
);

// New: Check if user is already logged in (on page refresh)
export const checkAuth = createAsyncThunk(
    "auth/checkAuth",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get("/users/me");
            return response.data.data;
        } catch (error) {
            return rejectWithValue(null);
        }
    }
);

// New: Logout thunk to hit the backend endpoint
export const logoutUser = createAsyncThunk(
    "auth/logout",
    async (_, { rejectWithValue }) => {
        try {
            await api.post("/users/logout");
            return null;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Logout failed.");
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState: {
        user: null,
        loading: true, // Start as true to prevent "flicker" during checkAuth
        error: null,
        success: false, 
    },
    reducers: {
        resetAuthState: (state) => {
            state.error = null;
            state.loading = false;
            state.success = false;
        },
        // Manual local clear if needed
        logoutLocal: (state) => {
            state.user = null;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            /* --- Login Handlers --- */
            .addCase(loginUser.pending, (state) => { 
                state.loading = true; 
                state.error = null; 
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.error = null;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload; 
            })

            /* --- Register Handlers --- */
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(registerUser.fulfilled, (state) => {
                state.loading = false;
                state.success = true; 
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            /* --- Check Auth Handlers --- */
            .addCase(checkAuth.pending, (state) => {
                state.loading = true;
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(checkAuth.rejected, (state) => {
                state.loading = false;
                state.user = null;
            })

            /* --- Logout Handlers --- */
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
                state.loading = false;
            });
    },
});

export const { resetAuthState, logoutLocal } = authSlice.actions;
export default authSlice.reducer;