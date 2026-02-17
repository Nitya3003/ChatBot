import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,          // ✅ REQUIRED for JWT cookies
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,                 // ✅ Prevent hanging requests
});

// OPTIONAL: global response error handling (recommended)
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log once for debugging
    console.error("API Error:", error?.response || error?.message);

    // You can handle auth failures globally here
    if (error?.response?.status === 401) {
      console.warn("Unauthorized - user may need to login again");
    }

    return Promise.reject(error);
  }
);

export default instance;
