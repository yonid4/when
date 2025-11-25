import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useToast, Alert, AlertIcon, AlertTitle, AlertDescription, Button, Box, HStack } from "@chakra-ui/react";
import { isSameDay, format as formatDate } from "date-fns";
import { ExternalLinkIcon, EmailIcon, DeleteIcon, RepeatIcon } from "@chakra-ui/icons";
import api from "../services/api";
import { me } from "../services/authService";
import { getMergedBusySlots } from "../services/busySlotsService";
import { getPreferredSlots, addPreferredSlot, deletePreferredSlot } from "../services/preferredSlotsService";
import CalendarView from "../components/calendar/CalendarView";
import UserList from "../components/event/UserList";
import EventInformation from "../components/event/EventInformation";
import CalendarConnectPrompt from "../components/calendar/CalendarConnectPrompt";
import ParticipantSlotPopup from "../components/calendar/ParticipantSlotPopup";
import CoordinatorSlotPopup from "../components/calendar/CoordinatorSlotPopup";
import SlotDetailPopup from "../components/calendar/SlotDetailPopup";
import FinalizationModal from "../components/calendar/FinalizationModal";
import SuccessModal from "../components/calendar/SuccessModal";
import InviteModal from "../components/event/InviteModal";
import DeleteEventModal from "../components/event/DeleteEventModal";
import { useEnsureProfile } from "../hooks/useEnsureProfile";
import { useCalendarConnection } from "../hooks/useCalendarConnection";
import { supabase } from "../services/supabaseClient";
import TimeSlotDisplayExample from "../components/events/TimeSlotDisplayExample";
import "../styles/event-page.css";
import "../styles/calendar.css";
import "../styles/time-slot-display.css";

const EventPage = () => {
  const { eventUid } = useParams();
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busySlotsLoading, setBusySlotsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { error: profileError } = useEnsureProfile();

  // Preferred slots state
  const [preferredSlots, setPreferredSlots] = useState([]);
  const [preferredSlotsLoading, setPreferredSlotsLoading] = useState(false);

  // Popup state
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showParticipantPopup, setShowParticipantPopup] = useState(false);
  const [showCoordinatorPopup, setShowCoordinatorPopup] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showSlotDetailPopup, setShowSlotDetailPopup] = useState(false);

  // Finalization state
  const [showFinalizationModal, setShowFinalizationModal] = useState(false);
  const [finalizationSlot, setFinalizationSlot] = useState(null);
  const [isFinalizingEvent, setIsFinalizingEvent] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [finalizationResult, setFinalizationResult] = useState(null);

  // Invitation state
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
        setCurrentUser(user);
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    };

    checkAuth();
  }, []);

  const fetchEventData = async () => {
    try {
      setLoading(true);

      // Mark that user has viewed an event
      markFirstEventView();

      // Re-check calendar connection (in case user just connected)
      const isConnected = await checkGoogleCalendarConnection();
      console.log('[DEBUG] Calendar connected:', isConnected);

      // Check if calendar prompt should be shown
      const shouldShow = shouldShowCalendarPrompt('view', isConnected);

      if (shouldShow) {
        showCalendarPrompt('view');
      }

      // Fetch event details from backend
      try {
        console.log(`[DEBUG] Fetching event details for UID: ${eventUid}`);
        const eventResponse = await api.get(`/api/events/${eventUid}`);

        if (eventResponse.data && eventResponse.data.name) {
          setEventData(eventResponse.data);
        } else {
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
        setEventData({
          name: "Event Not Found",
          earliest_date: "2024-01-01",
          latest_date: "2024-01-31",
          earliest_hour: "09:00:00",
          latest_hour: "17:00:00",
          duration_minutes: 60
        });
      }

      await fetchBusySlots();

      // Fetch participants from backend
      try {
        const participantsResponse = await api.get(`/api/events/${eventUid}/participants`);
        setParticipants(participantsResponse.data);
      } catch (participantsErr) {
        console.error("Error fetching participants:", participantsErr);
        setParticipants([]);
      }

      // Fetch preferred slots from backend
      try {
        setPreferredSlotsLoading(true);
        const slots = await getPreferredSlots(eventUid);
        setPreferredSlots(slots);
      } catch (preferredSlotsErr) {
        console.error("Error fetching preferred slots:", preferredSlotsErr);
        setPreferredSlots([]);
      } finally {
        setPreferredSlotsLoading(false);
      }

    } catch (err) {
      console.error("Error fetching event data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusySlots = async () => {
    try {
      setBusySlotsLoading(true);
      console.log(`[DEBUG] Fetching merged busy slots for event UID: ${eventUid}`);

      const busySlotsResponse = await getMergedBusySlots(eventUid);

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
    } catch (busySlotsErr) {
      console.error("Error fetching busy slots:", busySlotsErr);
      setEvents([]);
    } finally {
      setBusySlotsLoading(false);
    }
  };

  useEffect(() => {
    if (eventUid) {
      fetchEventData();
    }
  }, [eventUid]);

  const handleSyncCalendar = async () => {
    try {
      toast({
        title: "Syncing calendar...",
        status: "info",
        duration: 2000,
      });

      await api.post(`/api/calendar/sync`);

      toast({
        title: "Calendar synced",
        status: "success",
        duration: 3000,
      });

      // Refresh busy slots
      await fetchBusySlots();

    } catch (error) {
      console.error("Sync error:", error);
      toast({
        title: "Sync failed",
        description: error.response?.data?.message || "Could not sync calendar",
        status: "error",
        duration: 5000,
      });
    }
  };


  const handleUserSelect = (user) => {
    // Handle user selection logic
    console.log("Selected user:", user);
  };

  const handleSelectSlot = (slotInfo) => {
    // Validation 1: Minimum 30 minutes
    const duration = (slotInfo.end - slotInfo.start) / (1000 * 60);
    if (duration < 30) {
      toast({
        title: "Invalid duration",
        description: "Minimum slot duration is 30 minutes",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validation 2: Same day only
    if (!isSameDay(slotInfo.start, slotInfo.end)) {
      toast({
        title: "Invalid time range",
        description: "Time slots must be within the same day",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Check if event is finalized
    if (eventData?.status === "finalized") {
      toast({
        title: "Event finalized",
        description: "Cannot add preferred slots to a finalized event",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Show appropriate popup based on role
    setSelectedSlot(slotInfo);
    if (isCoordinator) {
      setShowCoordinatorPopup(true);
    } else {
      setShowParticipantPopup(true);
    }
  };

  const handleSelectEvent = (event) => {
    // Only handle clicks on preferred slots
    if (event.type === "preferred-slot") {
      setSelectedEvent(event);
      setShowSlotDetailPopup(true);
    }
  };

  // Delete user's slots that overlap with a specific time range
  const handleDeleteMySlotInRange = async (start, end) => {
    if (!currentUser) return;

    // Find all of current user's slots that overlap with this range
    const mySlots = preferredSlots.filter((slot) => {
      if (slot.user_id !== currentUser.id) return false;

      const slotStart = new Date(slot.start_time_utc);
      const slotEnd = new Date(slot.end_time_utc);

      // Check if slot overlaps with the clicked range
      return !(slotEnd <= start || slotStart >= end);
    });

    if (mySlots.length === 0) {
      toast({
        title: "No selection found",
        description: "You haven't selected this time range",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Delete all overlapping slots
      await Promise.all(
        mySlots.map((slot) => deletePreferredSlot(eventUid, slot.id))
      );

      // Update local state
      setPreferredSlots((prev) => prev.filter((s) => !mySlots.find((ms) => ms.id === s.id)));

      toast({
        title: "Selection removed",
        description: "Your preferred time has been removed",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Failed to remove selection",
        description: error.message || "Please try again",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
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

  // Handle finalization trigger from coordinator popup
  const handleFinalizeClick = (slotInfo) => {
    setFinalizationSlot(slotInfo);
    setShowCoordinatorPopup(false);
    setShowFinalizationModal(true);
  };

  // Handle finalization submission
  const handleFinalize = async (finalizationData) => {
    setIsFinalizingEvent(true);

    try {
      const response = await api.post(`/api/events/${eventUid}/finalize`, finalizationData);

      // Success!
      setFinalizationResult(response.data);
      setShowFinalizationModal(false);
      setShowSuccessModal(true);

      // Reload event data to get updated status
      setTimeout(async () => {
        try {
          const eventResponse = await api.get(`/api/events/${eventUid}`);
          setEventData(eventResponse.data);
        } catch (error) {
          console.error("Error reloading event:", error);
        }
      }, 1000);
    } catch (error) {
      console.error("Finalization error:", error);

      const errorMessage = error.response?.data?.message || error.message || "Failed to finalize event";

      toast({
        title: "Finalization failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsFinalizingEvent(false);
    }
  };

  // Handle success modal close
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Optionally reload the page to show the finalized state
    window.location.reload();
  };

  // Handle adding a preferred slot
  const handleAddPreferredSlot = async (slotInfo) => {
    try {
      const newSlot = await addPreferredSlot(eventUid, {
        start_time_utc: slotInfo.start.toISOString(),
        end_time_utc: slotInfo.end.toISOString(),
      });

      // Add to local state (will also be updated via real-time)
      setPreferredSlots((prev) => [...prev, newSlot]);

      console.log("Preferred slot added:", newSlot);
    } catch (error) {
      console.error("Failed to add preferred slot:", error);
      throw error;
    }
  };

  // Handle deleting a preferred slot
  const handleDeletePreferredSlot = async (slotId) => {
    try {
      await deletePreferredSlot(eventUid, slotId);

      // Remove from local state (will also be updated via real-time)
      setPreferredSlots((prev) => prev.filter((s) => s.id !== slotId));

      console.log("Preferred slot deleted:", slotId);
    } catch (error) {
      console.error("Failed to delete preferred slot:", error);
      throw error;
    }
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

  // Helper function to calculate density of preferred slots
  const calculatePreferredSlotDensity = (slots) => {
    if (!slots || slots.length === 0) return [];

    // Create time blocks with user information
    const timeBlocks = [];

    slots.forEach((slot) => {
      timeBlocks.push({
        start: new Date(slot.start_time_utc),
        end: new Date(slot.end_time_utc),
        userId: slot.user_id,
        userName: slot.user_name,
        slotId: slot.id,
      });
    });

    // Sort by start time
    timeBlocks.sort((a, b) => a.start - b.start);

    // Find all unique time points
    const timePoints = new Set();
    timeBlocks.forEach((block) => {
      timePoints.add(block.start.getTime());
      timePoints.add(block.end.getTime());
    });

    const sortedTimePoints = Array.from(timePoints).sort((a, b) => a - b);

    // For each interval, count how many users selected it
    const densityBlocks = [];

    for (let i = 0; i < sortedTimePoints.length - 1; i++) {
      const intervalStart = sortedTimePoints[i];
      const intervalEnd = sortedTimePoints[i + 1];

      // Find all slots that cover this interval
      const coveringSlots = timeBlocks.filter(
        (block) =>
          block.start.getTime() <= intervalStart && block.end.getTime() >= intervalEnd
      );

      if (coveringSlots.length > 0) {
        // Get unique users
        const uniqueUsers = new Map();
        coveringSlots.forEach((slot) => {
          uniqueUsers.set(slot.userId, {
            name: slot.userName,
            slotId: slot.slotId,
          });
        });

        densityBlocks.push({
          start_time_utc: new Date(intervalStart).toISOString(),
          end_time_utc: new Date(intervalEnd).toISOString(),
          userCount: uniqueUsers.size,
          userIds: Array.from(uniqueUsers.keys()),
          userNames: Array.from(uniqueUsers.values()).map((u) => u.name),
        });
      }
    }

    // Merge consecutive blocks with same density and same users
    const mergedBlocks = [];
    let currentBlock = null;

    densityBlocks.forEach((block) => {
      if (!currentBlock) {
        currentBlock = { ...block };
      } else if (
        currentBlock.userCount === block.userCount &&
        currentBlock.end_time_utc === block.start_time_utc &&
        arraysEqual(currentBlock.userIds.sort(), block.userIds.sort())
      ) {
        // Merge with current block
        currentBlock.end_time_utc = block.end_time_utc;
      } else {
        // Push current block and start new one
        mergedBlocks.push(currentBlock);
        currentBlock = { ...block };
      }
    });

    if (currentBlock) {
      mergedBlocks.push(currentBlock);
    }

    return mergedBlocks;
  };

  // Helper function to compare arrays
  const arraysEqual = (a, b) => {
    return a.length === b.length && a.every((val, index) => val === b[index]);
  };

  // Combine busy slots and preferred slots into calendar events
  const calendarEvents = useMemo(() => {
    const allEvents = [];

    // Add busy times
    events.forEach((busyEvent) => {
      allEvents.push({
        ...busyEvent,
        className: "busy-time-event",
      });
    });

    // Process preferred slots into density blocks
    const densityBlocks = calculatePreferredSlotDensity(preferredSlots);

    densityBlocks.forEach((block, index) => {
      const density = block.userCount;
      const densityClass =
        density >= 5 ? "preferred-slot-density-5-plus" : `preferred-slot-density-${density}`;

      allEvents.push({
        id: `preferred-${index}`,
        title: `${block.userCount} ${block.userCount === 1 ? "person" : "people"}`,
        start: new Date(block.start_time_utc),
        end: new Date(block.end_time_utc),
        type: "preferred-slot",
        resource: {
          density: block.userCount,
          userIds: block.userIds,
          userNames: block.userNames,
        },
        className: densityClass,
      });
    });

    // Add finalized slot (if exists - Task 3)
    if (eventData?.status === "finalized" && eventData.finalized_start_time_utc) {
      allEvents.push({
        id: "finalized",
        title: "FINALIZED EVENT",
        start: new Date(eventData.finalized_start_time_utc),
        end: new Date(eventData.finalized_end_time_utc),
        type: "finalized",
        className: "finalized-event",
      });
    }

    return allEvents;
  }, [events, preferredSlots, eventData]);

  // Real-time subscription for preferred slots
  useEffect(() => {
    if (!eventData?.id) return;

    console.log(`[DEBUG] Setting up real-time subscription for event ${eventData.id}`);

    const channel = supabase
      .channel(`event-${eventData.id}-slots`)
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "preferred_slots",
          filter: `event_id=eq.${eventData.id}`,
        },
        (payload) => {
          console.log("[DEBUG] Preferred slot change:", payload);

          // Refresh preferred slots from database
          const refreshSlots = async () => {
            try {
              const slots = await getPreferredSlots(eventUid);
              setPreferredSlots(slots);
            } catch (error) {
              console.error("Failed to refresh slots:", error);
            }
          };

          refreshSlots();
        }
      )
      .subscribe();

    return () => {
      console.log("[DEBUG] Unsubscribing from real-time channel");
      supabase.removeChannel(channel);
    };
  }, [eventData?.id, eventUid]);

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

  // Check if event is finalized
  const isFinalized = eventData?.status === "finalized";

  return (
    <div className={`event-page-container ${isCoordinator ? 'coordinator-layout' : 'participant-layout'}`} style={{ height: "calc(100vh - 64px - 0.5rem)", background: "var(--salt-pepper-white)" }}>
      {/* Finalized Event Banner */}
      {isFinalized && (
        <Alert status="success" variant="solid" mb={4} style={{ margin: "1rem" }}>
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>✓ Event Finalized</AlertTitle>
            <AlertDescription>
              This event has been scheduled for{" "}
              {eventData.finalized_start_time_utc &&
                formatDate(new Date(eventData.finalized_start_time_utc), "EEEE, MMMM d, yyyy 'at' h:mm a")}
              . No further changes can be made to preferred times.
            </AlertDescription>
          </Box>
          {eventData.google_calendar_html_link && (
            <Button
              as="a"
              href={eventData.google_calendar_html_link}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              colorScheme="whiteAlpha"
              variant="outline"
              rightIcon={<ExternalLinkIcon />}
            >
              View in Google Calendar
            </Button>
          )}
        </Alert>
      )}

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
              <HStack spacing={2}>
                {/* Sync Calendar Button */}
                <Button
                  leftIcon={<RepeatIcon />}
                  colorScheme="blue"
                  variant="outline"
                  size="sm"
                  onClick={handleSyncCalendar}
                  isLoading={busySlotsLoading}
                >
                  Sync Calendar
                </Button>

                {/* Invite Participants Button */}
                {!eventData?.is_finalized && (
                  <Button
                    leftIcon={<EmailIcon />}
                    colorScheme="purple"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInviteModal(true)}
                  >
                    Invite Participants
                  </Button>
                )}

                {/* Delete Event Button */}
                <Button
                  leftIcon={<DeleteIcon />}
                  colorScheme="red"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete Event
                </Button>
              </HStack>
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
        {busySlotsLoading || preferredSlotsLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-lg">Loading calendar...</div>
          </div>
        ) : (
          // <CalendarView
          //   events={calendarEvents}
          //   onSelectSlot={!isFinalized ? handleSelectSlot : null}
          //   onSelectEvent={handleSelectEvent}
          //   selectable={!isFinalized}
          <TimeSlotDisplayExample
            preferredSlots={preferredSlots}
            eventData={eventData}
            calendarEvents={calendarEvents}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            isFinalized={isFinalized}
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

      {/* Preferred Slot Popups */}
      <ParticipantSlotPopup
        isOpen={showParticipantPopup}
        onClose={() => setShowParticipantPopup(false)}
        slotInfo={selectedSlot}
        onConfirm={handleAddPreferredSlot}
      />

      <CoordinatorSlotPopup
        isOpen={showCoordinatorPopup}
        onClose={() => setShowCoordinatorPopup(false)}
        slotInfo={selectedSlot}
        onAddPreferred={handleAddPreferredSlot}
        onFinalize={handleFinalizeClick}
      />

      <SlotDetailPopup
        isOpen={showSlotDetailPopup}
        onClose={() => setShowSlotDetailPopup(false)}
        event={selectedEvent}
        onDeleteInRange={handleDeleteMySlotInRange}
        currentUserId={currentUser?.id}
      />

      {/* Finalization Modal */}
      <FinalizationModal
        isOpen={showFinalizationModal}
        onClose={() => setShowFinalizationModal(false)}
        event={eventData}
        selectedSlot={finalizationSlot}
        participants={participants}
        onFinalize={handleFinalize}
        isLoading={isFinalizingEvent}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        result={finalizationResult}
        event={eventData}
      />

      {/* Invite Participants Modal */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        eventUid={eventUid}
        onSuccess={() => {
          // Optionally refresh participant list
          // You could add a refresh function here
        }}
      />

      {/* Delete Event Modal */}
      <DeleteEventModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        event={eventData}
      />
    </div>
  );
};

export default EventPage;
