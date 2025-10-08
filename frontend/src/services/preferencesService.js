import api from "./api";

export async function addPreference(eventId, payload) {
  const res = await api.post(`/api/preferences/${eventId}`, payload);
  return res.data;
}

export async function getEventPreferences(eventId) {
  const res = await api.get(`/api/preferences/${eventId}`);
  return res.data;
}

export async function getUserPreferences(eventId, userId) {
  const res = await api.get(`/api/preferences/${eventId}/${userId}`);
  return res.data;
}

export async function deletePreference(preferenceId) {
  const res = await api.delete(`/api/preferences/${preferenceId}`);
  return res.data;
}


