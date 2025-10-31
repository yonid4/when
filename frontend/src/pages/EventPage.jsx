import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { me } from "../services/authService";
import { getMergedBusySlots } from "../services/busySlotsService";
import CalendarView from "../components/calendar/CalendarView";
import UserList from "../components/event/UserList";
import EventInformation from "../components/event/EventInformation";
import CalendarConnectPrompt from "../components/calendar/CalendarConnectPrompt";
import { useEnsureProfile } from "../hooks/useEnsureProfile";
import { useCalendarConnection } from "../hooks/useCalendarConnection";
import "../styles/event-page.css";
import "../styles/calendar.css";

const EventPage = () => {
  const { eventUid } = useParams();
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busySlotsLoading, setBusySlotsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { error: profileError } = useEnsureProfile();
  
  // Calendar connection logic
  const {
    needsCalendarPrompt,
    calendarPromptContext,
    shouldShowCalendarPrompt,
    showCalendarPrompt,
    hideCalendarPrompt,
    connectGoogleCalendar,
    handleCalendarConnected,
    handleSkipCalendar,
    markFirstEventView,
    checkGoogleCalendarConnection
  } = useCalendarConnection();

  useEffect(() => {
    // Check authentication status through backend API
    const checkAuth = async () => {
      try {
        const user = await me();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        
        // // Mark that user has viewed an event
        // markFirstEventView();

        // Re-check calendar connection (in case user just connected)
        const isConnected = await checkGoogleCalendarConnection();
        console.log('[DEBUG] Calendar connected:', isConnected);

        // Check if calendar prompt should be shown
        const shouldShow = shouldShowCalendarPrompt('view', isConnected);
        console.log('[DEBUG] Should show calendar prompt:', shouldShow);
        // console.log('[DEBUG] isChecking:', isChecking);
        console.log('[DEBUG] needsCalendarPrompt:', needsCalendarPrompt);
        
        if (shouldShow) {
          console.log('[DEBUG] Showing calendar prompt for context: view');
          showCalendarPrompt('view');
        } else {
          console.log('[DEBUG] NOT showing calendar prompt');
        }

        // Mark that user has viewed an event
        markFirstEventView();
        
        // Fetch event details from backend
        try {
          console.log(`[DEBUG] Fetching event details for UID: ${eventUid}`);
          const eventResponse = await api.get(`/api/events/${eventUid}`);
          console.log(`[DEBUG] Event response:`, eventResponse.data);
          
          if (eventResponse.data && eventResponse.data.name) {
            setEventData(eventResponse.data);
            console.log(`[DEBUG] Successfully loaded event: ${eventResponse.data.name}`);
          } else {
            console.warn("[DEBUG] Event data received but missing name field");
            setEventData({
              name: "Event Data Incomplete",
              earliest_date: "2024-01-01",
              latest_date: "2024-01-31",
              earliest_hour: "09:00:00",
              latest_hour: "17:00:00",
              duration_minutes: 60
            });
          }
        } catch (eventErr) {
          console.error("Error fetching event details:", eventErr);
          console.error("Event error details:", eventErr.response?.data);
          console.error("Event error status:", eventErr.response?.status);
          // Fallback to mock data if event can't be fetched
          setEventData({
            name: "Event Not Found",
            earliest_date: "2024-01-01",
            latest_date: "2024-01-31",
            earliest_hour: "09:00:00",
            latest_hour: "17:00:00",
            duration_minutes: 60
          });
        }
        
        // Fetch merged busy slots from backend
        try {
          setBusySlotsLoading(true);
          console.log(`[DEBUG] Fetching merged busy slots for event UID: ${eventUid}`);
          
          const busySlotsResponse = await getMergedBusySlots(eventUid);
          console.log(`[DEBUG] Busy slots response:`, busySlotsResponse);
          
          // Transform merged busy slots to calendar events format
          const calendarEvents = busySlotsResponse.merged_busy_slots.map((slot, index) => ({
            id: `busy-${index}`,
            title: `${slot.busy_participants_count} participant(s) busy`,
            start: new Date(slot.start_time),
            end: new Date(slot.end_time),
            type: 'busy',
            participantCount: slot.busy_participants_count,
          }));
          
          setEvents(calendarEvents);
          console.log(`[DEBUG] Loaded ${calendarEvents.length} busy slots for calendar`);
        } catch (busySlotsErr) {
          console.error("Error fetching busy slots:", busySlotsErr);
          console.error("Busy slots error details:", busySlotsErr.response?.data);
          // Fallback to empty array if busy slots can't be fetched
          setEvents([]);
        } finally {
          setBusySlotsLoading(false);
        }
        
        // Fetch participants from backend
        try {
          console.log(`[DEBUG] Fetching participants for event UID: ${eventUid}`);
          const participantsResponse = await api.get(`/api/events/${eventUid}/participants`);
          console.log(`[DEBUG] Participants response:`, participantsResponse.data);
          
          setParticipants(participantsResponse.data);
        } catch (participantsErr) {
          console.error("Error fetching participants:", participantsErr);
          console.error("Participants error details:", participantsErr.response?.data);
          // Fallback to empty array if participants can't be fetched
          setParticipants([]);
        }
        
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
      const user = await me();
      if (user) {
        return {
          id: user.id,
          name: user.full_name || user.email_address,
          email: user.email_address,
          avatar_url: user.avatar_url,
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

  // Calendar connection handlers
  const handleConnectCalendar = async () => {
    try {
      await connectGoogleCalendar();
      handleCalendarConnected();
    } catch (error) {
      console.error('Failed to connect calendar:', error);
    }
  };

  const handleSkipCalendarConnection = () => {
    handleSkipCalendar();
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
    <div className={`event-page-container ${isCoordinator ? 'coordinator-layout' : 'participant-layout'}`} style={{ height: "calc(100vh - 64px - 0.5rem)", background: "var(--salt-pepper-white)" }}>
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

      {/* Event Information Section */}
      <div className="event-info">
        <EventInformation
          eventName={eventData?.name || "Loading..."}
          dateRange={eventData ? `${new Date(eventData.earliest_date).toLocaleDateString()} - ${new Date(eventData.latest_date).toLocaleDateString()}` : "Loading..."}
          timeWindow={eventData ? `${eventData.earliest_hour} - ${eventData.latest_hour}` : "Loading..."}
          duration={eventData ? `${eventData.duration_minutes} minutes` : "Loading..."}
        />
      </div>

      {/* Calendar Section */}
      <div className="event-calendar">
        {busySlotsLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-lg">Loading calendar...</div>
          </div>
        ) : (
          <CalendarView
            events={events}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
          />
        )}
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

      {/* Calendar Connect Prompt */}
      <CalendarConnectPrompt
        context={calendarPromptContext}
        onConnect={handleConnectCalendar}
        onSkip={handleSkipCalendarConnection}
        onClose={hideCalendarPrompt}
        isVisible={needsCalendarPrompt}
      />
    </div>
  );
};

export default EventPage;
