import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  HStack,
  VStack,
  Text,
  Spinner,
  useColorModeValue,
  useToast
} from "@chakra-ui/react";
import { eventsAPI, preferredSlotsAPI, busySlotsAPI } from "../services/apiService";
import api from "../services/api";
import { useApiCall } from "../hooks/useApiCall";
import { useAuth } from "../hooks/useAuth";
import { colors, shadows } from "../styles/designSystem";
import { EventPageSkeleton } from "../components/skeletons";

// Components
import { CalendarView } from "../components/calendar";
import {
  InviteModal,
  EditEventModal,
  ProposedTimesModal,
  FinalizeEventModal,
  EventHeader,
  EventDetailsCard,
  ActionsPanel,
  ParticipantsList
} from "../components/event";

// Utils
import { extractCalendarTimeBound } from "../utils/dateUtils";
import {
  transformBusySlotsForCalendar,
  transformPreferredSlotsForCalendar,
  detectOverlaps
} from "../utils/calendarEventUtils";

// Demo data for local testing (add ?demo=true to URL)
const DEMO_EVENT = {
  id: 1,
  uid: "demo-event-1",
  name: "Team Planning Meeting",
  description: "Quarterly planning session to discuss roadmap, priorities, and resource allocation for the upcoming quarter. Please come prepared with your team's updates and proposals.",
  status: "planning",
  event_type: "meeting",
  coordinator_id: "demo-user-1",
  coordinator_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  earliest_datetime_utc: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
  latest_datetime_utc: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  duration_minutes: 60,
  location: "Conference Room A / Zoom",
  video_call_link: "https://zoom.us/j/123456789",
  created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
};

const DEMO_PARTICIPANTS = [
  { id: 1, user_id: "demo-user-1", name: "You (Demo)", email: "demo@example.com", rsvp_status: "going", avatar_url: null },
  { id: 2, user_id: "demo-user-2", name: "Sarah Chen", email: "sarah@example.com", rsvp_status: "going", avatar_url: null },
  { id: 3, user_id: "demo-user-3", name: "Mike Johnson", email: "mike@example.com", rsvp_status: "maybe", avatar_url: null },
  { id: 4, user_id: "demo-user-4", name: "Emily Davis", email: "emily@example.com", rsvp_status: "not_going", avatar_url: null },
  { id: 5, user_id: "demo-user-5", name: "Alex Kim", email: "alex@example.com", rsvp_status: null, avatar_url: null },
  { id: 6, user_id: "demo-user-6", name: "Jordan Lee", email: "jordan@example.com", rsvp_status: "going", avatar_url: null }
];

const DEMO_PREFERRED_SLOTS = [
  { id: 1, user_id: "demo-user-1", user_name: "You", start_time_utc: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(), end_time_utc: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000).toISOString() },
  { id: 2, user_id: "demo-user-2", user_name: "Sarah", start_time_utc: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(), end_time_utc: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString() },
  { id: 3, user_id: "demo-user-3", user_name: "Mike", start_time_utc: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000).toISOString(), end_time_utc: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000).toISOString() },
  { id: 4, user_id: "demo-user-1", user_name: "You", start_time_utc: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(), end_time_utc: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000).toISOString() },
  { id: 5, user_id: "demo-user-2", user_name: "Sarah", start_time_utc: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000).toISOString(), end_time_utc: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000).toISOString() },
  { id: 6, user_id: "demo-user-6", user_name: "Jordan", start_time_utc: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(), end_time_utc: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000).toISOString() }
];

const DEMO_BUSY_SLOTS = [
  { start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(), end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(), busy_participants_count: 2 },
  { start_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000).toISOString(), end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(), busy_participants_count: 3 }
];

const EventPage = () => {
  const { eventUid } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();
  const { execute, loading } = useApiCall();

  // State
  const [event, setEvent] = useState(isDemo ? DEMO_EVENT : null);
  const [participants, setParticipants] = useState(isDemo ? DEMO_PARTICIPANTS : []);
  const [preferredSlots, setPreferredSlots] = useState(isDemo ? DEMO_PREFERRED_SLOTS : []);
  const [preferredSlotsLoading, setPreferredSlotsLoading] = useState(!isDemo);
  const [busySlots, setBusySlots] = useState(isDemo ? DEMO_BUSY_SLOTS : []);
  const [busySlotsLoading, setBusySlotsLoading] = useState(false);
  const [userRsvp, setUserRsvp] = useState(isDemo ? "going" : null);
  const [canInvite, setCanInvite] = useState(isDemo ? true : false);
  const [selectedTimeOption, setSelectedTimeOption] = useState(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProposedTimesModalOpen, setIsProposedTimesModalOpen] = useState(false);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [selectedFinalizeTime, setSelectedFinalizeTime] = useState(null);
  const [aiProposals, setAiProposals] = useState([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [proposalMetadata, setProposalMetadata] = useState({
    cached: false,
    generatedAt: null,
    needsUpdate: false
  });

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");

  useEffect(() => {
    if (isDemo) {
      setEvent(DEMO_EVENT);
      setParticipants(DEMO_PARTICIPANTS);
      setPreferredSlots(DEMO_PREFERRED_SLOTS);
      setBusySlots(DEMO_BUSY_SLOTS);
      setUserRsvp("going");
      setCanInvite(true);
      setPreferredSlotsLoading(false);
      setBusySlotsLoading(false);
    } else if (eventUid && !authLoading) {
      loadEventData();
    }
  }, [eventUid, authLoading, isDemo]);

  const loadEventData = async (bustCache = false) => {
    try {
      const eventData = await execute(() => eventsAPI.getByUid(eventUid, bustCache));

      if (eventData) {
        setEvent(eventData);

        const participantsData = await execute(() => eventsAPI.getParticipants(eventUid), { showSuccessToast: false });
        if (participantsData) setParticipants(participantsData);

        setPreferredSlotsLoading(true);
        try {
          const preferredData = await execute(() => preferredSlotsAPI.getByEvent(eventData.id), { showSuccessToast: false });
          setPreferredSlots(preferredData || []);
        } catch (error) {
          console.error("Failed to fetch preferred slots:", error);
          setPreferredSlots([]);
        } finally {
          setPreferredSlotsLoading(false);
        }

        const myParticipantRecord = participantsData?.find(p => p.user_id === user?.id);
        if (myParticipantRecord) {
          setUserRsvp(myParticipantRecord.rsvp_status);
          setCanInvite(myParticipantRecord.can_invite || false);
        } else {
          setCanInvite(false);
        }

        setBusySlotsLoading(true);
        try {
          const busyData = await execute(() => busySlotsAPI.getMerged(eventData.id), { showSuccessToast: false });
          setBusySlots(busyData?.merged_busy_slots || []);
        } catch (error) {
          console.error("Failed to fetch busy slots:", error);
          setBusySlots([]);
        } finally {
          setBusySlotsLoading(false);
        }
      }
    } catch (error) {
      console.error("Failed to load event data:", error);
    }
  };

  const fetchAIProposals = async (forceRefresh = false) => {
    if (!eventUid || !event || event.status === "finalized") return;

    setIsLoadingProposals(true);
    try {
      const result = await execute(() => eventsAPI.proposeTimesAI(eventUid, 5, forceRefresh), {
        showSuccessToast: false
      });

      if (result && result.proposals) {
        setAiProposals(result.proposals);
        setProposalMetadata({
          cached: result.cached || false,
          generatedAt: result.generated_at || null,
          needsUpdate: result.needs_update || false
        });
      }
    } catch (error) {
      console.error("Failed to generate AI proposals:", error);
      setAiProposals([]);
    } finally {
      setIsLoadingProposals(false);
    }
  };

  useEffect(() => {
    if (isDemo) {
      setAiProposals([
        {
          id: "demo-1",
          start_time_utc: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000).toISOString(),
          end_time_utc: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000).toISOString(),
          availableCount: 5,
          preferredCount: 3,
          conflicts: 1,
          totalParticipants: 6
        },
        {
          id: "demo-2",
          start_time_utc: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000).toISOString(),
          end_time_utc: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000).toISOString(),
          availableCount: 4,
          preferredCount: 2,
          conflicts: 2,
          totalParticipants: 6
        }
      ]);
      setIsLoadingProposals(false);
    } else if (event && participants.length > 0 && !preferredSlotsLoading && !busySlotsLoading) {
      fetchAIProposals();
    }
  }, [event, participants, preferredSlotsLoading, busySlotsLoading, isDemo]);

  // Memoized calendar events
  const calendarEvents = useMemo(() => {
    const busy = transformBusySlotsForCalendar(busySlots);
    const preferred = transformPreferredSlotsForCalendar(preferredSlots);
    const { overlaps, nonOverlappingBusy, nonOverlappingPreferred } = detectOverlaps(busy, preferred);
    return [...nonOverlappingBusy, ...nonOverlappingPreferred, ...overlaps];
  }, [busySlots, preferredSlots]);

  // Computed values
  const host = participants.find(p => p.user_id === event?.coordinator_id) || { name: "Coordinator", avatar: null };
  const isCoordinator = isDemo ? true : (user?.id === event?.coordinator_id);
  const rsvpStats = {
    going: participants.filter(p => p.rsvp_status === "going").length,
    maybe: participants.filter(p => p.rsvp_status === "maybe").length,
    declined: participants.filter(p => p.rsvp_status === "not_going").length,
    noResponse: participants.filter(p => !p.rsvp_status).length
  };

  // Handlers
  const handleRsvp = async (status) => {
    const previousStatus = userRsvp;
    setUserRsvp(status);

    if (isDemo) {
      const statusMessages = { going: "confirmed your attendance", maybe: "marked yourself as tentative", not_going: "declined" };
      toast({ title: "RSVP Updated (Demo)", description: `You have ${statusMessages[status]} for this event.`, status: "success", duration: 3000, isClosable: true });
      return;
    }

    try {
      if (!user) {
        toast({ title: "Please log in", status: "warning", duration: 3000 });
        return;
      }

      await execute(() => eventsAPI.updateRsvpStatus(eventUid, status), { showSuccessToast: false });
      const statusMessages = { going: "confirmed your attendance", maybe: "marked yourself as tentative", not_going: "declined" };
      toast({ title: "RSVP Updated", description: `You have ${statusMessages[status]} for this event.`, status: "success", duration: 3000, isClosable: true });
      loadEventData();
    } catch (error) {
      console.error("RSVP failed:", error);
      setUserRsvp(previousStatus);
      toast({ title: "Update failed", description: "Could not update your RSVP status.", status: "error", duration: 3000 });
    }
  };

  const handleReconnectGoogleCalendar = async () => {
    if (isDemo) {
      toast({ title: "Google Calendar (Demo)", description: "Calendar reconnection simulated successfully", status: "success", duration: 3000, isClosable: true });
      return;
    }

    try {
      const response = await execute(() => api.get(`/api/auth/google?return_url=/events/${eventUid}`), { showSuccessToast: false });
      const data = response?.data || response;

      if (data?.auth_url) {
        const width = 600, height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        const popup = window.open(data.auth_url, "Google Calendar OAuth", `width=${width},height=${height},left=${left},top=${top}`);

        const checkPopup = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkPopup);
            toast({ title: "Reconnecting...", description: "Checking Google Calendar connection", status: "info", duration: 2000, isClosable: true });
            setTimeout(() => loadEventData(), 1000);
          }
        }, 500);
      } else {
        toast({ title: "Error", description: "Could not initiate Google Calendar connection", status: "error", duration: 3000, isClosable: true });
      }
    } catch (error) {
      console.error("Failed to reconnect Google Calendar:", error);
      toast({ title: "Connection failed", description: error.message || "Could not connect to Google Calendar", status: "error", duration: 3000, isClosable: true });
    }
  };

  const handleSyncCalendars = async () => {
    if (isDemo) {
      toast({ title: "Calendars synced (Demo)", description: "Synced: 4, Failed: 0, Skipped: 2", status: "success", duration: 3000, isClosable: true });
      return;
    }

    try {
      setBusySlotsLoading(true);
      toast({ title: "Syncing calendars...", description: "Updating busy slots for all participants", status: "info", duration: 2000 });

      const response = await execute(() => eventsAPI.syncEventCalendars(eventUid), { showSuccessToast: false });
      const syncResults = response.sync_results;

      let description = `Synced: ${syncResults.synced}, Failed: ${syncResults.failed}, Skipped: ${syncResults.skipped}`;
      const needReconnect = syncResults.details?.filter(d => d.needs_reconnect) || [];
      if (needReconnect.length > 0) {
        const names = needReconnect.map(d => d.name || d.email).join(", ");
        description += `\n\nNeeds reconnection: ${names}`;
      }

      let status = "success", title = "Calendars synced successfully";
      if (syncResults.synced === 0) { status = "warning"; title = "No calendars synced"; }
      else if (syncResults.failed > 0) { status = "warning"; title = "Calendars partially synced"; }

      toast({ title, description, status, duration: 7000, isClosable: true });
      await loadEventData();
    } catch (error) {
      console.error("Sync error:", error);
      toast({ title: "Sync failed", description: error.message || "Could not sync calendars", status: "error", duration: 5000, isClosable: true });
    } finally {
      setBusySlotsLoading(false);
    }
  };

  const handleCopyLink = () => {
    const link = isDemo ? "https://when-now.com/events/demo-event (Demo Link)" : window.location.href;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copied!", status: "success", duration: 2000, isClosable: true });
  };

  const handleSelectSlot = async (slotInfo) => {
    if (isCoordinator && slotInfo.action === "select" && (slotInfo.box?.ctrlKey || slotInfo.box?.metaKey)) {
      handleSelectTimeFromCalendar(slotInfo);
      return;
    }

    const duration = (slotInfo.end - slotInfo.start) / (1000 * 60);
    if (duration < 30) {
      toast({ title: "Invalid duration", description: "Minimum slot duration is 30 minutes", status: "error", duration: 3000, isClosable: true });
      return;
    }

    if (isDemo) {
      toast({ title: "Time slot added (Demo)", description: "Your preferred time has been saved", status: "success", duration: 2000, isClosable: true });
      return;
    }

    if (slotInfo.start.toDateString() !== slotInfo.end.toDateString()) {
      toast({ title: "Invalid time range", description: "Time slots must be within the same day", status: "error", duration: 3000, isClosable: true });
      return;
    }

    if (event?.status === "finalized") {
      toast({ title: "Event finalized", description: "Cannot add preferred slots to a finalized event", status: "warning", duration: 3000, isClosable: true });
      return;
    }

    try {
      const userSlots = preferredSlots.filter(slot => {
        if (slot.user_id !== user?.id) return false;
        const slotStart = new Date(slot.start_time_utc);
        const slotEnd = new Date(slot.end_time_utc);
        return !(slotEnd <= slotInfo.start || slotStart >= slotInfo.end);
      });

      let finalStartTime = slotInfo.start;
      let finalEndTime = slotInfo.end;

      if (userSlots.length > 0) {
        const allTimes = [slotInfo.start, slotInfo.end, ...userSlots.flatMap(slot => [new Date(slot.start_time_utc), new Date(slot.end_time_utc)])];
        finalStartTime = new Date(Math.min(...allTimes));
        finalEndTime = new Date(Math.max(...allTimes));
        await Promise.all(userSlots.map(slot => execute(() => preferredSlotsAPI.delete(event.id, slot.id), { showSuccessToast: false })));
      }

      await execute(() => preferredSlotsAPI.create(event.id, { start_time_utc: finalStartTime.toISOString(), end_time_utc: finalEndTime.toISOString() }), { showSuccessToast: false });

      toast({
        title: userSlots.length > 0 ? "Time slots merged" : "Time slot added",
        description: userSlots.length > 0 ? `Combined ${userSlots.length + 1} overlapping selections into one` : "Your preferred time has been saved",
        status: "success", duration: 2000, isClosable: true
      });

      const updatedSlots = await execute(() => preferredSlotsAPI.getByEvent(event.id), { showSuccessToast: false });
      setPreferredSlots(updatedSlots || []);
    } catch (error) {
      console.error("Failed to add preferred slot:", error);
      toast({ title: "Failed to add time slot", description: error.message || "Please try again", status: "error", duration: 3000, isClosable: true });
    }
  };

  const handleSelectEvent = async (calEvent) => {
    if (calEvent.type !== "preferred-slot") return;

    const userSlots = preferredSlots.filter(slot => {
      if (slot.user_id !== user?.id) return false;
      const slotStart = new Date(slot.start_time_utc);
      const slotEnd = new Date(slot.end_time_utc);
      return !(slotEnd <= calEvent.start || slotStart >= calEvent.end);
    });

    if (userSlots.length === 0) {
      toast({ title: "Not your selection", description: "You can only remove your own preferred times", status: "info", duration: 2000, isClosable: true });
      return;
    }

    if (window.confirm("Remove your preferred time for this slot?")) {
      try {
        await Promise.all(userSlots.map(slot => execute(() => preferredSlotsAPI.delete(event.id, slot.id), { showSuccessToast: false })));
        toast({ title: "Time slot removed", description: "Your preferred time has been removed", status: "success", duration: 2000, isClosable: true });
        const updatedSlots = await execute(() => preferredSlotsAPI.getByEvent(event.id), { showSuccessToast: false });
        setPreferredSlots(updatedSlots || []);
      } catch (error) {
        console.error("Failed to remove preferred slot:", error);
        toast({ title: "Failed to remove time slot", description: error.message || "Please try again", status: "error", duration: 3000, isClosable: true });
      }
    }
  };

  const handleSelectTimeFromProposal = (proposedTime) => {
    if (!isCoordinator) return;
    setSelectedFinalizeTime({ start_time: proposedTime.start_time_utc || proposedTime.start_time, end_time: proposedTime.end_time_utc || proposedTime.end_time });
    setIsProposedTimesModalOpen(false);
    setIsFinalizeModalOpen(true);
  };

  const handleSelectTimeFromCalendar = (slotInfo) => {
    if (!isCoordinator) return;

    const duration = (slotInfo.end - slotInfo.start) / (1000 * 60);
    if (duration < 30) {
      toast({ title: "Invalid duration", description: "Minimum slot duration is 30 minutes for finalization", status: "error", duration: 3000, isClosable: true });
      return;
    }

    if (slotInfo.start.toDateString() !== slotInfo.end.toDateString()) {
      toast({ title: "Invalid time range", description: "Time slots must be within the same day", status: "error", duration: 3000, isClosable: true });
      return;
    }

    setSelectedFinalizeTime({ start_time: slotInfo.start.toISOString(), end_time: slotInfo.end.toISOString() });
    setIsFinalizeModalOpen(true);
  };

  const handleFinalize = async (finalizationData) => {
    try {
      const result = await execute(() => eventsAPI.finalize(eventUid, {
        start_time_utc: finalizationData.start_time_utc,
        end_time_utc: finalizationData.end_time_utc,
        participant_ids: finalizationData.participant_ids,
        include_google_meet: finalizationData.include_google_meet
      }), { showSuccessToast: false });

      if (finalizationData.title !== event.name) {
        await execute(() => eventsAPI.update(event.id, { name: finalizationData.title }), { showSuccessToast: false });
      }

      toast({
        title: "Event finalized successfully!",
        description: result.meet_link ? "Google Calendar event created with Meet link" : "Google Calendar event created",
        status: "success", duration: 5000, isClosable: true
      });

      await loadEventData();
      setIsFinalizeModalOpen(false);
      setSelectedFinalizeTime(null);
    } catch (error) {
      console.error("Finalization failed:", error);
      const errorMessage = error.response?.data?.message || error.message;
      const needsReconnect = error.response?.data?.needs_reconnect;

      if (needsReconnect || errorMessage?.includes("expired") || errorMessage?.includes("reconnect")) {
        toast({ title: "Google Calendar Connection Expired", description: "Click the 'Reconnect Google Calendar' button below to refresh your connection.", status: "warning", duration: 15000, isClosable: true, position: "top" });
      } else {
        toast({ title: "Finalization failed", description: errorMessage || "Could not finalize the event. Please try again.", status: "error", duration: 5000, isClosable: true });
      }
      throw error;
    }
  };

  const handleEditSuccess = (updatedEvent) => {
    loadEventData(true);
    toast({ title: "Changes saved", description: "Event has been updated successfully", status: "success", duration: 3000, isClosable: true });
  };

  // Loading state
  if (loading && !event) {
    return <EventPageSkeleton />;
  }

  // Not found state
  if (!event) {
    return (
      <Box h="calc(100vh - 64px)" bg={bgColor} pt={8}>
        <Container maxW="container.xl">
          <Text>Event not found</Text>
          <Button mt={4} onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box h="calc(100vh - 64px)" bg={bgColor} overflow="hidden">
      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(49, 130, 206, 0.7); }
            50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(49, 130, 206, 0); }
          }
        `}
      </style>

      <EventHeader
        eventName={event.name}
        status={event.status}
        isCoordinator={isCoordinator}
        googleCalendarLink={event.google_calendar_html_link}
        onBack={() => navigate("/dashboard")}
        onEdit={() => setIsEditModalOpen(true)}
        onCopyLink={handleCopyLink}
      />

      <Container maxW="95%" h="calc(100% - 57px)" py={4}>
        <Grid templateColumns={{ base: "1fr", lg: "65fr 35fr" }} gap={6} h="full">
          {/* Left Column - Calendar */}
          <Flex direction="column" h="full" overflow="hidden">
            <Box
              borderWidth="1px"
              borderRadius="xl"
              p={4}
              bg={cardBg}
              shadow={shadows.card}
              flex="1"
              display="flex"
              flexDirection="column"
              minH="0"
            >
              {/* Legend */}
              <Flex justify="flex-end" align="center" mb={2} flexShrink={0}>
                <HStack spacing={4} fontSize="xs" color="gray.500">
                  <HStack spacing={1.5}><Box w="10px" h="10px" bg="gray.400" opacity={0.6} borderRadius="sm" /><Text>Busy</Text></HStack>
                  <HStack spacing={1.5}><Box w="10px" h="10px" bg="#efbbff" borderRadius="sm" /><Text>1-2</Text></HStack>
                  <HStack spacing={1.5}><Box w="10px" h="10px" bg="#be29ec" borderRadius="sm" /><Text>5-6</Text></HStack>
                  <HStack spacing={1.5}><Box w="10px" h="10px" bg="#660066" borderRadius="sm" /><Text>10+</Text></HStack>
                </HStack>
              </Flex>

              <Box flex="1" minH="0">
                {(busySlotsLoading || preferredSlotsLoading) ? (
                  <Flex justify="center" align="center" h="full">
                    <Spinner size="xl" color={colors.primary} />
                    <Text ml={4}>Loading calendar data...</Text>
                  </Flex>
                ) : (
                  <CalendarView
                    events={calendarEvents}
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    selectable={event?.status !== "finalized"}
                    minTime={extractCalendarTimeBound(event.earliest_datetime_utc, event.earliest_hour)}
                    maxTime={extractCalendarTimeBound(event.latest_datetime_utc, event.latest_hour)}
                  />
                )}
              </Box>
            </Box>
          </Flex>

          {/* Right Column - Sidebar */}
          <Box h="full" overflowY="auto" pb={4}>
            <VStack align="stretch" spacing={4}>
              <EventDetailsCard
                event={event}
                host={host}
                userRsvp={userRsvp}
                onRsvp={handleRsvp}
                rsvpStats={rsvpStats}
                cardBg={cardBg}
              />

              <ActionsPanel
                isCoordinator={isCoordinator}
                canInvite={canInvite}
                isFinalized={event?.status === "finalized"}
                isLoadingProposals={isLoadingProposals}
                proposalCount={aiProposals.length}
                isSyncing={busySlotsLoading}
                onViewProposals={() => setIsProposedTimesModalOpen(true)}
                onSync={handleSyncCalendars}
                onInvite={() => setIsInviteModalOpen(true)}
                onCopyLink={handleCopyLink}
                onReconnect={handleReconnectGoogleCalendar}
                cardBg={cardBg}
              />

              <ParticipantsList
                participants={participants}
                rsvpStats={rsvpStats}
                cardBg={cardBg}
              />
            </VStack>
          </Box>
        </Grid>
      </Container>

      {/* Modals */}
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        eventUid={eventUid}
        onSuccess={() => { loadEventData(); setIsInviteModalOpen(false); }}
      />

      <EditEventModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        event={event}
        onSuccess={handleEditSuccess}
      />

      <ProposedTimesModal
        isOpen={isProposedTimesModalOpen}
        onClose={() => setIsProposedTimesModalOpen(false)}
        timeOptions={aiProposals}
        selectedTimeOption={selectedTimeOption}
        setSelectedTimeOption={setSelectedTimeOption}
        proposalMetadata={proposalMetadata}
        isCoordinator={isCoordinator}
        isLoadingProposals={isLoadingProposals}
        onRefresh={() => fetchAIProposals(true)}
        onSelectTime={handleSelectTimeFromProposal}
      />

      <FinalizeEventModal
        isOpen={isFinalizeModalOpen}
        onClose={() => { setIsFinalizeModalOpen(false); setSelectedFinalizeTime(null); }}
        event={event}
        selectedTime={selectedFinalizeTime}
        participants={participants}
        onFinalize={handleFinalize}
      />
    </Box>
  );
};

export default EventPage;
