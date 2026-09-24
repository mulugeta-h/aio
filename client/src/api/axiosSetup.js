import axios from "axios";

let unauthorizedHandler = null;

// Vite: No changes needed - axios interceptors work exactly the same
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && unauthorizedHandler) {
      unauthorizedHandler(error.response?.data?.msg);
    }
    return Promise.reject(error);
  },
);

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}