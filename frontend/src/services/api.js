import axios from "axios";
import { getAccessToken } from "./supabaseClient";

// Normalize baseURL: strip trailing slash
// const RAW_BASE = (process.env.REACT_APP_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
// const RAW_BASE = (process.env.REACT_APP_API_BASE_URL || 'https://when-now.com/api').replace(/\/$/, "");
const RAW_BASE = 'https://when-now.com/api'

const api = axios.create({
  baseURL: RAW_BASE,
  headers: { "Content-Type": "application/json" }
});

// Attach auth token and normalize path to avoid double /api
api.interceptors.request.use(async (config) => {
  if (config.url) {
    // If baseURL already ends with /api and path starts with /api → drop leading /api from path
    const baseHasApi = RAW_BASE.endsWith("/api");
    if (baseHasApi && /^\/api(\/|$)/.test(config.url)) {
      config.url = config.url.replace(/^\/api/, "");
    }
  }

  const token = await getAccessToken();
  console.log(`DEBUG api interceptor: Method=${config.method}, baseURL=${config.baseURL}, URL=${config.url}, Token present=${!!token}`);
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    console.log(`DEBUG api interceptor: Authorization header added (token length=${token.length})`);
  } else {
    console.warn(`DEBUG api interceptor: No token available for ${config.method} ${config.url}`);
  }
  return config;
});

// Preserve full error so callers can inspect status/response (needed for 404 logic)
api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default api;
