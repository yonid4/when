import api from "./api";

export async function createProfile(data) {
  const res = await api.post("/api/users", data);
  return res.data;
}

export async function getProfile(userId) {
  const res = await api.get(`/api/users/${userId}`);
  return res.data;
}

export async function updateProfile(userId, updates) {
  const res = await api.put(`/api/users/${userId}`);
  return res.data;
}

export async function deleteProfile(userId) {
  const res = await api.delete(`/api/users/${userId}`);
  return res.data;
}


