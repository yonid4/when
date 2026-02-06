import api from "./api.js";

export async function connectGoogleCalendar() {
  const response = await api.post("/api/auth/google/connect");
  return response.data;
}

export async function checkCalendarConnection() {
  const response = await api.get("/api/users/me").catch(() => ({ data: null }));
  return response.data?.google_calendar_id != null;
}

export async function getCalendarInfo() {
  const response = await api.get("/api/users/me");
  const calendarId = response.data?.google_calendar_id;
  return {
    google_calendar_id: calendarId,
    timezone: response.data?.timezone,
    has_google_calendar: calendarId != null
  };
}

export async function disconnectGoogleCalendar() {
  const response = await api.delete("/api/auth/google/disconnect");
  return response.data;
}

export async function getCalendarEvents(startDate, endDate) {
  const response = await api.get("/api/calendar/events", {
    params: { start_date: startDate, end_date: endDate }
  });
  return response.data;
}

export async function createCalendarEvent(eventData) {
  const response = await api.post("/api/calendar/events", eventData);
  return response.data;
}

export async function updateCalendarEvent(eventId, eventData) {
  const response = await api.put(`/api/calendar/events/${eventId}`, eventData);
  return response.data;
}

export async function deleteCalendarEvent(eventId) {
  const response = await api.delete(`/api/calendar/events/${eventId}`);
  return response.data;
}