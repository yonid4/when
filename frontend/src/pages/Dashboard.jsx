import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../layout";

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

const Dashboard = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  return (
    <Layout>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h1 style={{ margin: 0, color: "#222" }}>Dashboard</h1>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: "var(--secondary-color)",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "0.75rem 1.5rem",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
            }}
          >
            + Create Event
          </button>
        </div>

        {/* Coordinating Events */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ color: "var(--secondary-color)", fontSize: "1.2rem", marginBottom: "1rem" }}>Coordinating</h2>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {coordinatingEvents.length === 0 ? (
              <div style={{ color: "#888" }}>No events to coordinate.</div>
            ) : (
              coordinatingEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => navigate(`/${event.id}`)}
                  style={{
                    minWidth: 220,
                    background: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                    padding: "1.25rem 1.5rem",
                    cursor: "pointer",
                    border: `2px solid var(--secondary-color)`,
                    transition: "box-shadow 0.2s, border 0.2s",
                    marginBottom: "1rem"
                  }}
                  onMouseOver={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(220,0,78,0.12)"}
                  onMouseOut={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)"}
                >
                  <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 8 }}>{event.name}</div>
                  <div style={{ color: "#666", fontSize: "0.97rem" }}>{formatDateRange(event.start, event.end)}</div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Participating Events */}
        <section>
          <h2 style={{ color: "var(--secondary-color)", fontSize: "1.2rem", marginBottom: "1rem" }}>Participating</h2>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {participatingEvents.length === 0 ? (
              <div style={{ color: "#888" }}>No events you're participating in.</div>
            ) : (
              participatingEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => navigate(`/${event.id}`)}
                  style={{
                    minWidth: 220,
                    background: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                    padding: "1.25rem 1.5rem",
                    cursor: "pointer",
                    border: `2px solid var(--primary-color)`,
                    transition: "box-shadow 0.2s, border 0.2s",
                    marginBottom: "1rem"
                  }}
                  onMouseOver={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(225,196,255,0.12)"}
                  onMouseOut={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)"}
                >
                  <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 8 }}>{event.name}</div>
                  <div style={{ color: "#666", fontSize: "0.97rem" }}>{formatDateRange(event.start, event.end)}</div>
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
                onClick={() => setShowModal(false)}
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
              {/* Event creation form goes here */}
              <div style={{ color: "#888" }}>
                (Event creation form coming soon)
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
