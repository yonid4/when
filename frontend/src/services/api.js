import axios from "axios";
import { getAccessToken } from "./supabaseClient";

// Normalize baseURL: strip trailing slash
// const RAW_BASE = (process.env.REACT_APP_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const RAW_BASE = (process.env.REACT_APP_API_BASE_URL || "/api").replace(/\/$/, "");

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
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Preserve full error so callers can inspect status/response (needed for 404 logic)
api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default api;
