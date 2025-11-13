import axios from "axios";
import toast from "react-hot-toast";
import getUrl from "./getUrl";
// import { showApiError } from "./showApiError";

const api = axios.create({
  baseURL: getUrl(),
});
// Axios request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Axios response interceptor
api.interceptors.response.use(
  (response) => {
    // Show success toast if needed
    if (response.data.showMessage) {
      toast.success(response.data.message);
    }
    return response;
  },
  (error) => {
    const { response } = error;

    if (response) {
      // Handle known status codes
      switch (response.status) {
        case 400:
          toast.error(response.data.message || "Bad Request: Invalid input.");
          break;
        case 401:
          toast.error(response.data.message || "Unauthorized: Please log in.");
          // clearToken(); // Clear token on 401 error
          window.location.href = "/login"; // Redirect to login page
          break;
        case 403:
          toast.error(response.data.message || "Forbidden: Access denied.");
          break;
        case 404:
          toast.error(
            response.data.message || "Not Found: Resource not found."
          );
          break;
        case 500:
          toast.error(response.data.message);
          break;
        default:
          toast.error(
            response.data.message ||
              `Error ${response.status}: An unknown error occurred.`
          );
          break;
      }
    } else if (error.request) {
      // Handle no response from server
      console.error("No response from the server. Please check your network.");
    } else {
      // Handle errors setting up the request
      toast.error("Request setup failed: " + error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
