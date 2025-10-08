import api from "./api";

export async function createEvent(payload) {
  const res = await api.post("/api/events", payload);
  return res.data;
}

export async function getEvent(eventId) {
  const res = await api.get(`/api/events/${eventId}`);
  return res.data;
}

export async function updateEvent(eventId, updates) {
  const res = await api.put(`/api/events/${eventId}`, updates);
  return res.data;
}

export async function deleteEvent(eventId) {
  const res = await api.delete(`/api/events/${eventId}`);
  return res.data;
}

export async function addParticipant(eventId, userId) {
  const res = await api.post(`/api/events/${eventId}/participants`, { user_id: userId });
  return res.data;
}

export async function updateParticipantStatus(eventId, userId, status) {
  const res = await api.put(`/api/events/${eventId}/participants/${userId}`, { status });
  return res.data;
}


