import axios from "axios";
import { getAccessToken } from "./supabaseClient.js";

const BASE_URL = (process.env.REACT_APP_API_BASE_URL || "https://when-now.com/api").replace(/\/$/, "");
const BASE_HAS_API = BASE_URL.endsWith("/api");

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use(async (config) => {
  if (config.url && BASE_HAS_API && /^\/api(\/|$)/.test(config.url)) {
    config.url = config.url.replace(/^\/api/, "");
  }

  const token = await getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
