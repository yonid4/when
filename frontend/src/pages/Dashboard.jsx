import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../layout";
import api from "../services/api";
import { useEnsureProfile } from "../hooks/useEnsureProfile";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// --- MOCK DATA (replace with backend data in the future) ---
const coordinatingEvents = [
  {
    id: "event1",
    name: "Team Offsite",
    start: new Date(2024, 4, 2),
    end: new Date(2024, 4, 7)
  },
  {
    id: "event2",
    name: "Product Launch",
    start: new Date(2024, 5, 10),
    end: new Date(2024, 5, 12)
  }
];

const participatingEvents = [
  {
    id: "event3",
    name: "Design Sprint",
    start: new Date(2024, 4, 15),
    end: new Date(2024, 4, 17)
  }
];
// ----------------------------------------------------------

function formatDateRange(start, end) {
  const options = { month: "short", day: "numeric" };
  const startStr = start.toLocaleDateString("en-US", options);
  const endStr = end.toLocaleDateString("en-US", options);
  return `${startStr} - ${endStr}`;
}

const initialForm = {
  name: "",
  description: "",
  start_date: "",
  end_date: "",
  earliest_daily_start_time: "",
  latest_daily_end_time: "",
  duration_minutes: ""
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error } = useEnsureProfile();

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "name is required";
    if (!form.start_date) newErrors.start_date = "Start date is required";
    if (!form.end_date) newErrors.end_date = "End date is required";
    if (form.start_date && form.end_date && form.end_date < form.start_date)
      newErrors.end_date = "End date must be after start date";
    if (!form.earliest_daily_start_time) newErrors.earliest_daily_start_time = "Earliest start time is required";
    if (!form.latest_daily_end_time) newErrors.latest_daily_end_time = "Latest end time is required";
    if (
      form.earliest_daily_start_time &&
      form.latest_daily_end_time &&
      form.latest_daily_end_time <= form.earliest_daily_start_time
    ) {
      newErrors.latest_daily_end_time = "Latest end time must be after earliest start time";
    }
    if (!form.duration_minutes) newErrors.duration_minutes = "Duration is required";
    if (form.duration_minutes && (!/^[1-9][0-9]*$/.test(form.duration_minutes) || parseInt(form.duration_minutes) <= 0)) {
      newErrors.duration_minutes = "Duration must be a positive number";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log("Session data:", session); // Debug log
      console.log("Session error:", sessionError); // Debug log
      
      if (sessionError) {
        throw new Error(`Session error: ${sessionError.message}`);
      }
      
      if (!session) {
        throw new Error("No active session found. Please log in again.");
      }

      if (!session.access_token) {
        throw new Error("No access token found in session. Please log in again.");
      }

      console.log("Making request with token:", session.access_token); // Debug log
      console.log("Request data:", form); // Debug log
      
      const response = await api.post("/api/events/", form, {
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });
      
      console.log("Response:", response); // Debug log
      
      if (response.data) {
        setShowModal(false);
        setForm(initialForm);
        setErrors({});
        // Optionally refresh the events list or show success message
        window.location.reload(); // Simple refresh for now
      }
    } catch (error) {
      console.error("Error creating event:", error);
      console.error("Error details:", {
        response: error.response,
        request: error.request,
        message: error.message,
        stack: error.stack
      }); // Debug log
      
      let errorMessage = "Failed to create event. Please try again.";
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const serverError = error.response.data;
        if (serverError?.error && serverError?.message) {
          errorMessage = `${serverError.error}: ${serverError.message}`;
        } else {
          errorMessage = serverError?.error || `Server error: ${error.response.status}`;
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = "No response from server. Please check if the backend is running.";
      }
      
      setErrors({
        submit: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
        {error && (
          <div style={{
            color: "#dc3545",
            marginBottom: "1rem",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            background: "#f8d7da",
            border: "1px solid #f5c6cb"
          }}>
            {error}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.6rem" }}>
          <h1 style={{ margin: 0, color: "#222", fontSize: "2.34rem" }}>Dashboard</h1>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: "var(--secondary-color)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "0.975rem 1.95rem",
              fontWeight: 600,
              fontSize: "1.3rem",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
            }}
          >
            + Create Event
          </button>
        </div>

        {/* Coordinating Events */}
        <section style={{ marginBottom: "3.25rem" }}>
          <h2 style={{ color: "var(--secondary-color)", fontSize: "1.56rem", marginBottom: "1.3rem" }}>Coordinating</h2>
          <div style={{ display: "flex", gap: "1.95rem", flexWrap: "wrap" }}>
            {coordinatingEvents.length === 0 ? (
              <div style={{ color: "#888" }}>No events to coordinate.</div>
            ) : (
              coordinatingEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => navigate(`/${event.id}`)}
                  style={{
                    minWidth: 286,
                    background: "#fff",
                    borderRadius: 10,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                    padding: "1.625rem 1.95rem",
                    cursor: "pointer",
                    border: `2px solid var(--secondary-color)`,
                    transition: "box-shadow 0.2s, border 0.2s",
                    marginBottom: "1.3rem"
                  }}
                  onMouseOver={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(220,0,78,0.12)"}
                  onMouseOut={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)"}
                >
                  <div style={{ fontWeight: 700, fontSize: "1.43rem", marginBottom: 10 }}>{event.name}</div>
                  <div style={{ color: "#666", fontSize: "1.26rem" }}>{formatDateRange(event.start, event.end)}</div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Participating Events */}
        <section>
          <h2 style={{ color: "var(--secondary-color)", fontSize: "1.56rem", marginBottom: "1.3rem" }}>Participating</h2>
          <div style={{ display: "flex", gap: "1.95rem", flexWrap: "wrap" }}>
            {participatingEvents.length === 0 ? (
              <div style={{ color: "#888" }}>No events you're participating in.</div>
            ) : (
              participatingEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => navigate(`/${event.id}`)}
                  style={{
                    minWidth: 286,
                    background: "#fff",
                    borderRadius: 10,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                    padding: "1.625rem 1.95rem",
                    cursor: "pointer",
                    border: `2px solid var(--secondary-color)`,
                    transition: "box-shadow 0.2s, border 0.2s",
                    marginBottom: "1.3rem"
                  }}
                  onMouseOver={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(225,196,255,0.12)"}
                  onMouseOut={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)"}
                >
                  <div style={{ fontWeight: 700, fontSize: "1.43rem", marginBottom: 10 }}>{event.name}</div>
                  <div style={{ color: "#666", fontSize: "1.26rem" }}>{formatDateRange(event.start, event.end)}</div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Create Event Modal */}
        {showModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}>
            <div style={{
              background: "#fff",
              borderRadius: 10,
              padding: "2rem 2.5rem",
              minWidth: 320,
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              position: "relative"
            }}>
              <button
                onClick={() => { setShowModal(false); setForm(initialForm); setErrors({}); }}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  color: "#888",
                  cursor: "pointer"
                }}
                aria-label="Close"
              >
                ×
              </button>
              <h3 style={{ marginTop: 0, marginBottom: "1.5rem", color: "var(--secondary-color)" }}>
                Create Event
              </h3>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* name */}
                <div>
                  <label style={{ fontWeight: 500 }}>Event Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleInput}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: 4, border: "1px solid #ccc", marginTop: 4 }}
                  />
                  {errors.name && <div style={{ color: "var(--secondary-color)", fontSize: 13 }}>{errors.name}</div>}
                </div>
                {/* Description */}
                <div>
                  <label style={{ fontWeight: 500 }}>Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleInput}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: 4, border: "1px solid #ccc", marginTop: 4, minHeight: 60 }}
                  />
                </div>
                {/* Dates */}
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontWeight: 500 }}>Start Date *</label>
                    <input
                      type="date"
                      name="start_date"
                      value={form.start_date}
                      onChange={handleInput}
                      style={{ width: "100%", padding: "0.5rem", borderRadius: 4, border: "1px solid #ccc", marginTop: 4 }}
                    />
                    {errors.start_date && <div style={{ color: "var(--secondary-color)", fontSize: 13 }}>{errors.start_date}</div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontWeight: 500 }}>End Date *</label>
                    <input
                      type="date"
                      name="end_date"
                      value={form.end_date}
                      onChange={handleInput}
                      min={form.start_date || undefined}
                      style={{ width: "100%", padding: "0.5rem", borderRadius: 4, border: "1px solid #ccc", marginTop: 4 }}
                    />
                    {errors.end_date && <div style={{ color: "var(--secondary-color)", fontSize: 13 }}>{errors.end_date}</div>}
                  </div>
                </div>
                {/* Times */}
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontWeight: 500 }}>Earliest Daily Start Time *</label>
                    <input
                      type="time"
                      name="earliest_daily_start_time"
                      value={form.earliest_daily_start_time}
                      onChange={handleInput}
                      style={{ width: "100%", padding: "0.5rem", borderRadius: 4, border: "1px solid #ccc", marginTop: 4 }}
                    />
                    {errors.earliest_daily_start_time && <div style={{ color: "var(--secondary-color)", fontSize: 13 }}>{errors.earliest_daily_start_time}</div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontWeight: 500 }}>Latest Daily End Time *</label>
                    <input
                      type="time"
                      name="latest_daily_end_time"
                      value={form.latest_daily_end_time}
                      onChange={handleInput}
                      style={{ width: "100%", padding: "0.5rem", borderRadius: 4, border: "1px solid #ccc", marginTop: 4 }}
                    />
                    {errors.latest_daily_end_time && <div style={{ color: "var(--secondary-color)", fontSize: 13 }}>{errors.latest_daily_end_time}</div>}
                  </div>
                </div>
                {/* Duration */}
                <div>
                  <label style={{ fontWeight: 500 }}>Duration (minutes) *</label>
                  <input
                    type="number"
                    name="duration_minutes"
                    value={form.duration_minutes}
                    onChange={handleInput}
                    min={1}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: 4, border: "1px solid #ccc", marginTop: 4 }}
                  />
                  {errors.duration_minutes && <div style={{ color: "var(--secondary-color)", fontSize: 13 }}>{errors.duration_minutes}</div>}
                </div>
                {errors.submit && (
                  <div style={{ color: "var(--secondary-color)", fontSize: 13, textAlign: "center" }}>
                    {errors.submit}
                  </div>
                )}
                {/* Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setForm(initialForm); setErrors({}); }}
                    style={{
                      background: "#eee",
                      color: "#444",
                      border: "none",
                      borderRadius: 4,
                      padding: "0.5rem 1.2rem",
                      fontWeight: 500,
                      cursor: "pointer"
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      background: "var(--secondary-color)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      padding: "0.5rem 1.2rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      opacity: isSubmitting ? 0.7 : 1
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
