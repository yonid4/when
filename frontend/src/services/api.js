import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
  headers: {
    "Content-Type": "application/json"
  }
});

// Add trailing slash to all requests
api.interceptors.request.use(config => {
  if (!config.url.endsWith('/')) {
    config.url = `${config.url}/`;
  }
  return config;
});

export default api;
