import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import CalendarView from "../components/calendar/CalendarView";
import UserList from "../components/event/UserList";
import Preferences from "../components/event/Preferences";
import { useEnsureProfile } from "../hooks/useEnsureProfile";
import "../styles/event-page.css";

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

const EventPage = () => {
  const { eventUid } = useParams();
  const [events, setEvents] = useState([]);
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
        
        // Mock events for dynamic hour range testing
        const mockEvents = [
          {
            id: 1,
            title: "Morning Meeting",
            start: new Date(2024, 0, 15, 7, 30), // 7:30 AM - should extend range backward
            end: new Date(2024, 0, 15, 9, 0),
          },
          {
            id: 2,
            title: "Late Evening Call",
            start: new Date(2024, 0, 16, 21, 0), // 9:00 PM - should extend range forward
            end: new Date(2024, 0, 16, 22, 30),
          },
          {
            id: 3,
            title: "Regular Meeting",
            start: new Date(2024, 0, 17, 14, 0), // 2:00 PM - within normal range
            end: new Date(2024, 0, 17, 15, 30),
          },
        ];
        
        setEvents(mockEvents);
        // setParticipants(data.participants);
        // setPreferences(data.preferences);
        
        // Get current user profile for demonstration
        const currentUser = await getCurrentUserProfile();
        
        // Temporary mock data for testing
        const mockParticipants = [
          {
            id: 1,
            name: "John Doe",
            email: "john@example.com",
            available: true,
            avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
          },
          {
            id: 2,
            name: "Jane Smith",
            email: "jane@example.com",
            available: false,
            avatar_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
          },
        ];
        
        // Add current user to participants if they're logged in
        if (currentUser && !mockParticipants.find(p => p.email === currentUser.email)) {
          mockParticipants.unshift({
            ...currentUser,
            available: true,
          });
        }
        
        setParticipants(mockParticipants);
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

  const getCurrentUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        return {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email,
          email: session.user.email,
          avatar_url: session.user.user_metadata?.avatar_url,
        };
      }
    } catch (error) {
      console.error("Error getting user profile:", error);
    }
    return null;
  };

  const handleInviteUser = async (email) => {
    // Handle user invitation logic
    console.log("Inviting user:", email);
    // TODO: Implement actual invitation API call
    // This should send an email invite and track the invitation status
    // Only add to participants list when user accepts the invitation
    
    // For demo purposes, when a user "accepts" an invitation,
    // their profile data (including avatar_url) would come from:
    // 1. Their Supabase user session data
    // 2. Backend API that fetches their profile
    // Example of how real participant would be added:
    /*
    const newParticipant = {
      id: invitedUser.id,
      name: invitedUser.user_metadata?.full_name || invitedUser.email,
      email: invitedUser.email,
      avatar_url: invitedUser.user_metadata?.avatar_url,
    };
    setParticipants(prev => [...prev, newParticipant]);
    */
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
          <div className="header-layout">
            <div className="header-left">
              <h4 className="page-title">Coordinator's Event Page</h4>
              <button className="copy-link-btn">
                Copy Link
              </button>
            </div>
            <div className="header-right">
              <label className="flex items-center space-x-2">
                <span>Auto Create Earliest Preferred Event</span>
                <div className="toggle-switch">
                  <input type="checkbox" />
                  <span className="toggle-slider"></span>
                </div>
              </label>
            </div>
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
          events={events}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
        />
      </div>

      {/* User List Section */}
      <div className="event-users">
        <UserList
          participants={participants}
          onUserSelect={handleUserSelect}
          isCoordinator={isCoordinator}
          onInviteUser={handleInviteUser}
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
