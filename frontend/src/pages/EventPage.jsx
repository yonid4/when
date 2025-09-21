import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import CalendarView from "../components/calendar/CalendarView";
import UserList from "../components/event/UserList";
import Preferences from "../components/event/Preferences";
import { useEnsureProfile } from "../hooks/useEnsureProfile";

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

  return (
    <div className="container mx-auto p-4 h-screen">
      <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
        {/* Top Left - Calendar */}
        <div className="bg-white rounded-lg shadow p-4">
          <CalendarView
            // events={events}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
          />
        </div>

        {/* Top Right - User List */}
        <div className="bg-white rounded-lg shadow">
          <UserList
            participants={participants}
            onUserSelect={handleUserSelect}
          />
        </div>

        {/* Bottom Left - Calendar (same component, different view) */}
        <div className="bg-white rounded-lg shadow p-4">
          <CalendarView
            // events={events}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
          />
        </div>

        {/* Bottom Right - Preferences */}
        <div className="bg-white rounded-lg shadow">
          <Preferences
            preferences={preferences}
            onPreferenceChange={handlePreferenceChange}
          />
        </div>
      </div>
    </div>
  );
};

export default EventPage;
