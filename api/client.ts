import axios, { AxiosRequestConfig } from 'axios';

import { AUTH_API_BASE_URL, AUTH_API_BASE_URLS } from './backend-client';

import { runtimeConfig } from '../constants/runtime-config';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/use-auth-store';
type RetryableAxiosRequestConfig = AxiosRequestConfig & {
  _authBaseRetryIndex?: number;
  _retry?: boolean;
};

export const apiClient = axios.create({
  baseURL: AUTH_API_BASE_URL,
  timeout: 60000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config as RetryableAxiosRequestConfig | undefined;

    if (!request) {
      return Promise.reject(error);
    }

    if (!error.response && error.code === 'ERR_NETWORK') {
      const currentBaseUrl = request.baseURL || apiClient.defaults.baseURL || AUTH_API_BASE_URL;
      const currentBaseIndex =
        typeof request._authBaseRetryIndex === 'number'
          ? request._authBaseRetryIndex
          : Math.max(AUTH_API_BASE_URLS.indexOf(currentBaseUrl), 0);
      const nextBaseUrl = AUTH_API_BASE_URLS[currentBaseIndex + 1];

      if (nextBaseUrl) {
        request.baseURL = nextBaseUrl;
        request._authBaseRetryIndex = currentBaseIndex + 1;
        return apiClient(request);
      }
    }

    if (error.response?.status === 401 && !request._retry && request.url !== '/api/auth/refresh-token') {
      request._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        await useAuthStore.getState().signOut();
        return Promise.reject(error);
      }

      try {
        const tokens = await authService.refreshAccessToken(refreshToken);
        await useAuthStore.getState().setTokens(tokens);
        request.headers = request.headers ?? {};
        request.headers.Authorization = `Bearer ${tokens.accessToken}`;
      } catch (refreshError) {
        await useAuthStore.getState().signOut();
        return Promise.reject(refreshError);
      }

      return apiClient(request);
    }

    return Promise.reject(error);
  }
);
