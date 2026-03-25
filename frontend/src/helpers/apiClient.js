import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getAbsoluteImageUrl = (url) => {
  if (!url) return null;
  if (typeof url !== 'string') return url;
  if (url.startsWith("http") || url.startsWith("blob:") || url.startsWith("data:")) return url;
  // Ensure we don't double the slash if url starts with /
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${API_URL}${path}`;
};

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token && config.url !== "login/") {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    const transformImages = (data) => {
      if (!data) return data;
      if (Array.isArray(data)) {
        return data.map(transformImages);
      }
      if (typeof data === "object") {
        const newData = { ...data };
        Object.keys(newData).forEach((key) => {
          if ((key === "image" || key === "image_url") && typeof newData[key] === "string") {
            newData[key] = getAbsoluteImageUrl(newData[key]);
          } else if (typeof newData[key] === "object") {
            newData[key] = transformImages(newData[key]);
          }
        });
        return newData;
      }
      return data;
    };

    if (response.data) {
      response.data = transformImages(response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "login/" &&
      originalRequest.url !== "token/refresh/"
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }
        const response = await apiClient.post("token/refresh/", {
          refresh: refreshToken,
        });
        const newAccessToken = response.data.access;
        localStorage.setItem("access_token", newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("isAuthenticated");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
