import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true, // Crucial for sending/receiving cookies
    headers: {
        "Content-Type": "application/json",
    },
});

// Optional: Add an interceptor to handle errors globally (like 401 Unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Logic to redirect to login or clear local state
            console.error("Session expired. Time to log back in.");
        }
        return Promise.reject(error);
    }
);



export default api;