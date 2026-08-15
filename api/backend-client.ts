import axios, { AxiosRequestConfig } from 'axios';

import { runtimeConfig } from '../constants/runtime-config';

const cleanUrl = (url?: string) => String(url || '').trim().replace(/\/+$|\s+$/g, '');

const configuredBaseUrl = cleanUrl(runtimeConfig.authApiBaseUrl);
const DEFAULT_AUTH_API_BASE_URL = 'https://api.anushatrade.com';
const FALLBACK_AUTH_API_BASE_URL = 'https://api.anushatrade.com';

export const AUTH_API_BASE_URLS = Array.from(
  new Set([configuredBaseUrl, DEFAULT_AUTH_API_BASE_URL, FALLBACK_AUTH_API_BASE_URL].map(cleanUrl).filter(Boolean))
);

type RetryableAxiosRequestConfig = AxiosRequestConfig & {
  _authBaseRetryIndex?: number;
};

export const AUTH_API_BASE_URL = AUTH_API_BASE_URLS[0] || DEFAULT_AUTH_API_BASE_URL;

export const backendApiClient = axios.create({
  baseURL: AUTH_API_BASE_URL,
  timeout: 15000,
});

backendApiClient.interceptors.request.use(async (config) => {
  if (!config.headers.Authorization) {
    try {
      const { useAuthStore } = require('../store/use-auth-store');
      const token = useAuthStore.getState().accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore fallback when store is initializing
    }
  }
  return config;
});

backendApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config as RetryableAxiosRequestConfig | undefined;

    if (!request || error.response || error.code !== 'ERR_NETWORK') {
      return Promise.reject(error);
    }

    const currentBaseUrl = request.baseURL || backendApiClient.defaults.baseURL || AUTH_API_BASE_URL;
    const currentBaseIndex =
      typeof request._authBaseRetryIndex === 'number'
        ? request._authBaseRetryIndex
        : Math.max(AUTH_API_BASE_URLS.indexOf(currentBaseUrl), 0);
    const nextBaseUrl = AUTH_API_BASE_URLS[currentBaseIndex + 1];

    if (!nextBaseUrl) {
      return Promise.reject(error);
    }

    request.baseURL = nextBaseUrl;
    request._authBaseRetryIndex = currentBaseIndex + 1;

    return backendApiClient(request);
  }
);
