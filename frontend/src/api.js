import axios from 'axios';
import {ACCESS_TOKEN, REFRESH_TOKEN} from "./constants";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL
})

const clearTokens = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
};

api.interceptors.request.use((config) => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (token) {
            config.headers.Authorization = 'Bearer ' + token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error)
    })

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        if (!originalRequest || status !== 401) {
            return Promise.reject(error);
        }

        const isRefreshRequest = originalRequest.url?.includes("/api/accounts/token/refresh/");
        if (isRefreshRequest) {
            clearTokens();
            return Promise.reject(error);
        }

        const refreshToken = localStorage.getItem(REFRESH_TOKEN);

        if (!originalRequest._retryWithRefresh && refreshToken) {
            originalRequest._retryWithRefresh = true;

            try {
                const refreshResponse = await axios.post(
                    `${import.meta.env.VITE_API_URL}/api/accounts/token/refresh/`,
                    { refresh: refreshToken }
                );

                const newAccessToken = refreshResponse.data.access;
                localStorage.setItem(ACCESS_TOKEN, newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                clearTokens();
            }
        }

        if (!originalRequest._retryWithoutAuth) {
            originalRequest._retryWithoutAuth = true;
            if (originalRequest.headers?.Authorization) {
                delete originalRequest.headers.Authorization;
            }
            return api(originalRequest);
        }

        return Promise.reject(error);
    }
);

export default api;
