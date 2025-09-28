import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import CalendarView from "../components/calendar/CalendarView";
import UserList from "../components/event/UserList";
import Preferences from "../components/event/Preferences";
import { useEnsureProfile } from "../hooks/useEnsureProfile";
import "../styles/event-page.css";

const EventPage = () => {
  const { eventUid } = useParams();
//   const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState();
  const [preferences, setPreferences] = useState();
  const [loading, setLoading] = useState(true);
  const { error: profileError } = useEnsureProfile();

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        // TODO: Replace with your actual API call
        // const response = await fetch(`/api/events/${eventUid}`);
        // const data = await response.json();
        // setEvents(data.events);
        // setParticipants(data.participants);
        // setPreferences(data.preferences);
        
        // Temporary mock data for testing
        setParticipants([
          {
            id: 1,
            name: "John Doe",
            email: "john@example.com",
            available: true,
          },
          {
            id: 2,
            name: "Jane Smith",
            email: "jane@example.com",
            available: false,
          },
        ]);
        setPreferences({
          duration: "60",
          timezone: "UTC",
          meetingType: "virtual",
          reminder: "30",
        });
      } catch (err) {
        console.error("Error fetching event data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (eventUid) {
      fetchEventData();
    }
  }, [eventUid]);

  const handlePreferenceChange = (key, value) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleUserSelect = (user) => {
    // Handle user selection logic
    console.log("Selected user:", user);
  };

  const handleSelectSlot = (slotInfo) => {
    // Handle slot selection logic
    console.log("Selected slot:", slotInfo);
  };

  const handleSelectEvent = (event) => {
    // Handle event selection logic
    console.log("Selected event:", event);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading event data...</div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-500">Error: {profileError}</div>
      </div>
    );
  }

  // Determine if user is coordinator (for now, assume all users are coordinators)
  const isCoordinator = true; // TODO: Replace with actual role check

  return (
    <div className={`event-page-container ${isCoordinator ? 'coordinator-layout' : 'participant-layout'}`}>
      {/* Header Section - Coordinator only */}
      {isCoordinator && (
        <div className="event-header">
          <h1>Coordinator's Event Page</h1>
          <div className="header-controls">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <span>Auto Create Earliest Preferred Event</span>
                <div className="toggle-switch">
                  <input type="checkbox" />
                  <span className="toggle-slider"></span>
                </div>
              </label>
            </div>
            <button>
              Copy Link
            </button>
          </div>
        </div>
      )}

      {/* Login Section - Participant only */}
      {!isCoordinator && (
        <div className="event-login">
          <h2>Log in with Google/Name if not logged in</h2>
          <button>
            Copy Link
          </button>
        </div>
      )}

      {/* Calendar Section */}
      <div className="event-calendar">
        <CalendarView
          // events={events}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
        />
      </div>

      {/* User List Section */}
      <div className="event-users">
        <UserList
          participants={participants}
          onUserSelect={handleUserSelect}
        />
      </div>

      {/* Preferences Section */}
      <div className="event-preferences">
        <Preferences
          preferences={preferences}
          onPreferenceChange={handlePreferenceChange}
        />
      </div>

      {/* Actions Section - Coordinator only */}
      {isCoordinator && (
        <div className="event-actions">
          <button className="create-event-btn">
            Create Event Invite
          </button>
        </div>
      )}
    </div>
  );
};

export default EventPage;
