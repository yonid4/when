import api from "./api";

export async function addBusySlots(eventId, slots) {
  const res = await api.post(`/api/busy_slots/${eventId}`, { slots });
  return res.data;
}

export async function getBusySlots(eventId) {
  const res = await api.get(`/api/busy_slots/${eventId}`);
  return res.data;
}

export async function getUserBusySlots(userId, eventId) {
  const res = await api.get(`/api/busy_slots/user/${userId}`, { params: { event_id: eventId } });
  return res.data;
}

export async function deleteUserBusySlots(eventId, userId) {
  const res = await api.delete(`/api/busy_slots/${eventId}/${userId}`);
  return res.data;
}

export async function getMergedBusySlots(eventId) {
  const res = await api.get(`/api/busy_slots/event/${eventId}/merged`);
  return res.data;
}

export async function syncUserGoogleCalendar(userId, startDateISO, endDateISO) {
  const res = await api.post(`/api/busy_slots/sync/${userId}`, {
    start_date: startDateISO,
    end_date: endDateISO
  });
  return res.data;
}


