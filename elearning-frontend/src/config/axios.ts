import axios, { AxiosError, AxiosResponse } from "axios";
import QueryString from "qs";

/**
 * ==========================================
 * AXIOS CONFIGURATION FOR E-LEARNING APP
 * ==========================================
 *
 * Authentication Strategy:
 * - Backend uses httpOnly cookie named "ACCESS_TOKEN" to store JWT token
 * - Cookie is automatically sent with every request (withCredentials: true)
 * - Frontend CANNOT and SHOULD NOT read the httpOnly cookie (security feature)
 * - No need to manually add Authorization header - backend reads from cookie
 *
 * Response Format:
 * - All backend APIs return: { message: string, result: T }
 * - Interceptor extracts and returns response.data for convenience
 *
 * Error Handling:
 * - 401 (Unauthorized): Clear user profile from localStorage and let auth components handle redirect
 * - Network errors: Return custom error message
 * - Other errors: Return backend error message
 */

const axiosRequest = axios.create({
  baseURL: "http://localhost:3000/api/v1",
  withCredentials: true, // CRITICAL: Allows httpOnly cookies to be sent automatically
  paramsSerializer: {
    serialize: (params) => {
      return QueryString.stringify(params, {
        arrayFormat: "indices",
        allowDots: true,
      });
    },
  },
});

// ==================== REQUEST INTERCEPTOR ====================
// No need to add Authorization header - backend reads JWT from httpOnly cookie
axiosRequest.interceptors.request.use(
  (config) => {
    // Just pass through the config
    // Cookie is automatically included because of withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==================== RESPONSE INTERCEPTOR ====================
axiosRequest.interceptors.response.use(
  (response: AxiosResponse) => {
    // Backend returns { message, result }
    // We return the whole response for consistency
    return response.data;
  },

  async function (error) {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear user profile from localStorage
      // if (typeof window !== "undefined") {
      //   localStorage.removeItem("user");
      // }

      // Let the auth components handle the redirect to login
      // Don't redirect here to avoid conflicts with Next.js routing
      return Promise.reject(error);
    }

    // Handle network errors
    if (axios.isAxiosError(error)) {
      if (error.code === AxiosError.ERR_NETWORK) {
        return Promise.reject(
          new Error("Network error. Please check your connection.")
        );
      }
    }

    // Return backend error message
    const errorMessage = error.response?.data?.message || "An error occurred";
    return Promise.reject(new Error(errorMessage));
  }
);

export default axiosRequest;
