import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  Text,
  HStack,
  VStack,
  Avatar,
  AvatarGroup,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Icon,
  IconButton,
  Divider,
  Progress,
  Input,
  Textarea,
  useColorModeValue,
  Link,
  useToast,
  SimpleGrid,
  Spinner,
  Center,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiArrowLeft,
  FiEdit,
  FiDownload,
  FiCheck,
  FiX,
  FiMinus,
  FiExternalLink,
  FiPaperclip,
  FiCopy,
  FiMail,
  FiRefreshCw,
  FiVideo,
  FiUsers,
  FiCoffee,
  FiGift,
  FiMoreHorizontal,
  FiMoreVertical
} from "react-icons/fi";
import { eventsAPI, preferredSlotsAPI, busySlotsAPI } from "../services/apiService";
import api from "../services/api";
import { useApiCall } from "../hooks/useApiCall";
import { useAuth } from "../hooks/useAuth";
import { colors, shadows } from "../styles/designSystem";
import InviteModal from "../components/event/InviteModal";
import EditEventModal from "../components/event/EditEventModal";
import CalendarView from "../components/calendar/CalendarView";
import ProposedTimesModal from "../components/event/ProposedTimesModal";
import FinalizeEventModal from "../components/event/FinalizeEventModal";
import { getUserTimezone, formatTimezone } from "../utils/timezoneUtils";

// Helper to convert time string to Date object for calendar
const parseTimeForCalendar = (timeString) => {
  if (!timeString) return null;
  const [hours, minutes] = timeString.split(':');
  return new Date(0, 0, 0, parseInt(hours), parseInt(minutes), 0);
};

const MotionBox = motion(Box);
const MotionCard = motion(Card);

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
  // Helper to format UTC datetime in user's local timezone
  const formatEventDateTime = (utcTimestamp, timezone = null) => {
    if (!utcTimestamp) return null;

    const date = new Date(utcTimestamp);
    const viewerTimezone = timezone || getUserTimezone();

    return date.toLocaleString('en-US', {
      timeZone: viewerTimezone,
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  // Helper to format UTC date only in user's local timezone
  const formatEventDateOnly = (utcTimestamp, timezone = null) => {
    if (!utcTimestamp) return null;

    const date = new Date(utcTimestamp);
    const viewerTimezone = timezone || getUserTimezone();

    return date.toLocaleDateString('en-US', {
      timeZone: viewerTimezone,
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper to extract time bounds from UTC timestamp for calendar view
  const extractCalendarTimeBound = (utcTimestamp, fallbackHour) => {
    if (utcTimestamp) {
      // Convert UTC timestamp to local time
      const localDate = new Date(utcTimestamp);
      const timeBound = new Date(0, 0, 0, localDate.getHours(), localDate.getMinutes(), 0);

      console.log('[EventPage] Calendar time bound:', {
        utc: utcTimestamp,
        localHour: localDate.getHours(),
        localMinute: localDate.getMinutes(),
        timeBound: timeBound
      });

      return timeBound;
    }
    // Fallback to old format or default
    const fallback = parseTimeForCalendar(fallbackHour) || new Date(0, 0, 0, fallbackHour || 8, 0, 0);
    console.log('[EventPage] Using fallback time bound:', { fallbackHour, timeBound: fallback });
    return fallback;
  };

  const { eventUid } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();
  const { execute, loading } = useApiCall();

  // Initialize with demo data if in demo mode
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
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const heroBg = useColorModeValue("white", "gray.800");

  // Mock current user for comments if not logged in (though auth is required)
  const mockCurrentUser = {
    name: user?.user_metadata?.full_name || "You",
    avatar: user?.user_metadata?.avatar_url || null
  };

  useEffect(() => {
    if (isDemo) {
      // Load demo data
      setEvent(DEMO_EVENT);
      setParticipants(DEMO_PARTICIPANTS);
      setPreferredSlots(DEMO_PREFERRED_SLOTS);
      setBusySlots(DEMO_BUSY_SLOTS);
      setUserRsvp("going");
      setCanInvite(true);
      setPreferredSlotsLoading(false);
      setBusySlotsLoading(false);
    } else if (eventUid && !authLoading) {
      // Wait for auth to load before fetching event data
      loadEventData();
    }
  }, [eventUid, authLoading, isDemo]);

  const loadEventData = async (bustCache = false) => {
    try {
      // 1. Fetch event details by UID (with optional cache-busting)
      const eventData = await execute(() => eventsAPI.getByUid(eventUid, bustCache));

      if (eventData) {
        setEvent(eventData);

        // 2. Fetch participants
        const participantsData = await execute(() => eventsAPI.getParticipants(eventUid), { showSuccessToast: false });
        if (participantsData) setParticipants(participantsData);

        // 3. Fetch preferred slots
        setPreferredSlotsLoading(true);
        try {
          const preferredData = await execute(() => preferredSlotsAPI.getByEvent(eventData.id), { showSuccessToast: false });
          setPreferredSlots(preferredData || []);
        } catch (error) {
          console.error('Failed to fetch preferred slots:', error);
          setPreferredSlots([]);
        } finally {
          setPreferredSlotsLoading(false);
        }

        // Determine user's RSVP status and invite permission from participants list
        const myParticipantRecord = participantsData?.find(p => p.user_id === user?.id);
        if (myParticipantRecord) {
          setUserRsvp(myParticipantRecord.rsvp_status); // Use new rsvp_status field
          setCanInvite(myParticipantRecord.can_invite || false); // Check if user has invite permission
        } else {
          // User is not a participant, reset permissions
          setCanInvite(false);
        }

        // 3. Fetch busy slots
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
    if (!eventUid || !event || event.status === "finalized") {
      return;
    }

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
        console.log(`[AI_PROPOSALS] ${result.cached ? 'Loaded cached' : 'Generated'} ${result.proposals.length} time proposals`);
      }
    } catch (error) {
      console.error("Failed to generate AI proposals:", error);
      // Don't show error toast - AI proposals are optional feature
      setAiProposals([]);
    } finally {
      setIsLoadingProposals(false);
    }
  };

  // Fetch AI proposals when event and participants are loaded
  useEffect(() => {
    if (isDemo) {
      // Set demo AI proposals
      setAiProposals([
        {
          start_time_utc: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000).toISOString(),
          end_time_utc: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000).toISOString(),
          score: 95,
          available_count: 4
        },
        {
          start_time_utc: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000).toISOString(),
          end_time_utc: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000).toISOString(),
          score: 88,
          available_count: 3
        }
      ]);
      setIsLoadingProposals(false);
    } else if (event && participants.length > 0 && !preferredSlotsLoading && !busySlotsLoading) {
      fetchAIProposals();
    }
  }, [event, participants, preferredSlotsLoading, busySlotsLoading, isDemo]);

  // Transform busy slots for calendar display (must be before early returns)
  const transformBusySlotsForCalendar = React.useCallback((busySlots) => {
    if (!busySlots || busySlots.length === 0) return [];

    // Backend already returns merged slots with participant counts
    // Format: { start_time, end_time, busy_participants_count }
    return busySlots.map((slot, index) => ({
      id: `busy-${index}`,
      title: `${slot.busy_participants_count} participant${slot.busy_participants_count > 1 ? "s" : ""} busy`,
      start: new Date(slot.start_time),
      end: new Date(slot.end_time),
      type: "busy",
      participantCount: slot.busy_participants_count,
      allDay: false
    }));
  }, []);

  // Helper function to compare arrays
  const arraysEqual = (a, b) => {
    return a.length === b.length && a.every((val, index) => val === b[index]);
  };

  // Calculate density-based intervals for preferred slots
  const calculatePreferredSlotDensity = (slots) => {
    if (!slots || slots.length === 0) return [];

    // Create time blocks with user information
    const timeBlocks = slots.map((slot) => ({
      start: new Date(slot.start_time_utc),
      end: new Date(slot.end_time_utc),
      userId: slot.user_id,
      userName: slot.user_name || 'User',
      slotId: slot.id,
    }));

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
          slotIds: Array.from(uniqueUsers.values()).map((u) => u.slotId),
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
        currentBlock.slotIds = [...currentBlock.slotIds, ...block.slotIds];
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

  // Transform preferred slots for calendar - density based coloring
  const transformPreferredSlotsForCalendar = React.useCallback((preferredSlots) => {
    if (!preferredSlots || preferredSlots.length === 0) return [];

    // Use density calculation for proper merging
    const densityBlocks = calculatePreferredSlotDensity(preferredSlots);

    return densityBlocks.map((block, index) => {
      const density = block.userCount;

      // Determine color based on density
      let backgroundColor;
      if (density <= 2) {
        backgroundColor = '#efbbff'; // Very light purple - 1-2 people
      } else if (density <= 4) {
        backgroundColor = '#d896ff'; // Light purple - 3-4 people
      } else if (density <= 6) {
        backgroundColor = '#be29ec'; // Medium purple - 5-6 people
      } else if (density <= 9) {
        backgroundColor = '#800080'; // Dark purple - 7-9 people
      } else {
        backgroundColor = '#660066'; // Darkest purple - 10+ people
      }

      const textColor = density >= 7 ? 'white' : '#2b2b2b';

      return {
        id: `preferred-${index}`,
        title: `${density} available`,
        start: new Date(block.start_time_utc),
        end: new Date(block.end_time_utc),
        type: 'preferred-slot',
        density: density,
        backgroundColor: backgroundColor,
        textColor: textColor,
        slotIds: block.slotIds,
        resource: {
          userIds: block.userIds,
          userNames: block.userNames,
        },
        allDay: false
      };
    });
  }, []);

  // Detect overlaps between busy and preferred slots and split them properly
  const detectOverlaps = (busyEvents, preferredEvents) => {
    const overlaps = [];
    const splitBusy = [];
    const splitPreferred = [];

    // Process each busy slot
    busyEvents.forEach(busySlot => {
      const busyIntervals = [{ start: busySlot.start.getTime(), end: busySlot.end.getTime() }];

      // Find all overlaps with preferred slots
      preferredEvents.forEach(preferredSlot => {
        const overlapStart = Math.max(busySlot.start.getTime(), preferredSlot.start.getTime());
        const overlapEnd = Math.min(busySlot.end.getTime(), preferredSlot.end.getTime());

        if (overlapStart < overlapEnd) {
          // Create overlap slot
          overlaps.push({
            id: `overlap-${busySlot.id}-${preferredSlot.id}`,
            title: `${busySlot.participantCount} busy, ${preferredSlot.density} prefer`,
            start: new Date(overlapStart),
            end: new Date(overlapEnd),
            type: 'overlap',
            className: 'overlap-event',
            busyCount: busySlot.participantCount,
            preferredCount: preferredSlot.density,
            preferredBackgroundColor: preferredSlot.backgroundColor,
            preferredTextColor: preferredSlot.textColor,
            allDay: false
          });

          // Remove overlapping portion from busy intervals
          const newIntervals = [];
          busyIntervals.forEach(interval => {
            if (interval.end <= overlapStart || interval.start >= overlapEnd) {
              // No overlap with this interval
              newIntervals.push(interval);
            } else {
              // Split the interval
              if (interval.start < overlapStart) {
                newIntervals.push({ start: interval.start, end: overlapStart });
              }
              if (interval.end > overlapEnd) {
                newIntervals.push({ start: overlapEnd, end: interval.end });
              }
            }
          });
          busyIntervals.length = 0;
          busyIntervals.push(...newIntervals);
        }
      });

      // Add remaining non-overlapping busy intervals
      busyIntervals.forEach((interval, idx) => {
        splitBusy.push({
          ...busySlot,
          id: `${busySlot.id}-split-${idx}`,
          start: new Date(interval.start),
          end: new Date(interval.end),
        });
      });
    });

    // Process each preferred slot
    preferredEvents.forEach(preferredSlot => {
      const preferredIntervals = [{ start: preferredSlot.start.getTime(), end: preferredSlot.end.getTime() }];

      // Remove overlapping portions
      busyEvents.forEach(busySlot => {
        const overlapStart = Math.max(busySlot.start.getTime(), preferredSlot.start.getTime());
        const overlapEnd = Math.min(busySlot.end.getTime(), preferredSlot.end.getTime());

        if (overlapStart < overlapEnd) {
          const newIntervals = [];
          preferredIntervals.forEach(interval => {
            if (interval.end <= overlapStart || interval.start >= overlapEnd) {
              newIntervals.push(interval);
            } else {
              if (interval.start < overlapStart) {
                newIntervals.push({ start: interval.start, end: overlapStart });
              }
              if (interval.end > overlapEnd) {
                newIntervals.push({ start: overlapEnd, end: interval.end });
              }
            }
          });
          preferredIntervals.length = 0;
          preferredIntervals.push(...newIntervals);
        }
      });

      // Add remaining non-overlapping preferred intervals
      preferredIntervals.forEach((interval, idx) => {
        splitPreferred.push({
          ...preferredSlot,
          id: `${preferredSlot.id}-split-${idx}`,
          start: new Date(interval.start),
          end: new Date(interval.end),
        });
      });
    });

    return { overlaps, nonOverlappingBusy: splitBusy, nonOverlappingPreferred: splitPreferred };
  };

  // Combine busy slots for calendar display with overlap detection
  const calendarEvents = React.useMemo(() => {
    const busy = transformBusySlotsForCalendar(busySlots);
    const preferred = transformPreferredSlotsForCalendar(preferredSlots);

    const { overlaps, nonOverlappingBusy, nonOverlappingPreferred } = detectOverlaps(busy, preferred);

    return [...nonOverlappingBusy, ...nonOverlappingPreferred, ...overlaps];
  }, [busySlots, preferredSlots, transformBusySlotsForCalendar, transformPreferredSlotsForCalendar]);

  if (loading && !event) {
    return (
      <Center minH="100vh" bg={bgColor}>
        <Spinner size="xl" color={colors.primary} />
      </Center>
    );
  }

  if (!event) {
    return (
      <Box minH="100vh" bg={bgColor} pt={8}>
        <Container maxW="container.xl">
          <Text>Event not found</Text>
          <Button mt={4} onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </Container>
      </Box>
    );
  }

  const handleRsvp = async (status) => {
    // Optimistic update
    const previousStatus = userRsvp;
    setUserRsvp(status);

    // Demo mode - just show toast
    if (isDemo) {
      const statusMessages = {
        'going': 'confirmed your attendance',
        'maybe': 'marked yourself as tentative',
        'not_going': 'declined'
      };
      toast({
        title: "RSVP Updated (Demo)",
        description: `You have ${statusMessages[status]} for this event.`,
        status: "success",
        duration: 3000,
        isClosable: true
      });
      return;
    }

    try {
      if (!user) {
        toast({
          title: "Please log in",
          status: "warning",
          duration: 3000
        });
        return;
      }

      // If user is not in participants list, we might need to add them first?
      // But usually they are invited. If it's a public event, maybe addParticipant?
      // For now, assume they are a participant or the endpoint handles it.
      // Actually, the API requires eventId (UUID) not UID.

      // Use the new RSVP status endpoint with eventUid
      await execute(() => eventsAPI.updateRsvpStatus(eventUid, status), { showSuccessToast: false });

      // Create user-friendly status messages
      const statusMessages = {
        'going': 'confirmed your attendance',
        'maybe': 'marked yourself as tentative',
        'not_going': 'declined'
      };

      toast({
        title: "RSVP Updated",
        description: `You have ${statusMessages[status]} for this event.`,
        status: "success",
        duration: 3000,
        isClosable: true
      });

      // Refresh data to update stats
      loadEventData();

    } catch (error) {
      console.error("RSVP failed:", error);
      setUserRsvp(previousStatus); // Revert on error
      toast({
        title: "Update failed",
        description: "Could not update your RSVP status.",
        status: "error",
        duration: 3000
      });
    }
  };



  const handleReconnectGoogleCalendar = async () => {
    // Demo mode
    if (isDemo) {
      toast({
        title: "Google Calendar (Demo)",
        description: "Calendar reconnection simulated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Get the OAuth URL from the backend
      const response = await execute(() => api.get(`/api/auth/google?return_url=/events/${eventUid}`), {
        showSuccessToast: false
      });

      // Extract data from axios response
      const data = response?.data || response;

      if (data?.auth_url) {
        // Open OAuth in popup to preserve session
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          data.auth_url,
          'Google Calendar OAuth',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Poll for popup close and reload page data
        const checkPopup = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkPopup);
            // Reload the event data after OAuth completes
            toast({
              title: "Reconnecting...",
              description: "Checking Google Calendar connection",
              status: "info",
              duration: 2000,
              isClosable: true
            });
            // Reload page data after a short delay to allow backend to process
            setTimeout(() => {
              loadEventData();
            }, 1000);
          }
        }, 500);
      } else {
        toast({
          title: "Error",
          description: "Could not initiate Google Calendar connection",
          status: "error",
          duration: 3000,
          isClosable: true
        });
      }
    } catch (error) {
      console.error("Failed to reconnect Google Calendar:", error);
      toast({
        title: "Connection failed",
        description: error.message || "Could not connect to Google Calendar",
        status: "error",
        duration: 3000,
        isClosable: true
      });
    }
  };

  const handleSyncCalendars = async () => {
    // Demo mode
    if (isDemo) {
      toast({
        title: "Calendars synced (Demo)",
        description: "Synced: 4, Failed: 0, Skipped: 2",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setBusySlotsLoading(true);

      toast({
        title: "Syncing calendars...",
        description: "Updating busy slots for all participants",
        status: "info",
        duration: 2000,
      });

      // Call the new endpoint that syncs all participants
      const response = await execute(() => eventsAPI.syncEventCalendars(eventUid), {
        showSuccessToast: false
      });

      const syncResults = response.sync_results;

      // Build detailed description
      let description = `Synced: ${syncResults.synced}, Failed: ${syncResults.failed}, Skipped: ${syncResults.skipped}`;

      // Add details about failed participants who need to reconnect
      const needReconnect = syncResults.details?.filter(d => d.needs_reconnect) || [];
      if (needReconnect.length > 0) {
        const names = needReconnect.map(d => d.name || d.email).join(', ');
        description += `\n\nNeeds reconnection: ${names}`;
      }

      // Determine status
      let status = "success";
      let title = "Calendars synced successfully";
      if (syncResults.synced === 0) {
        status = "warning";
        title = "No calendars synced";
      } else if (syncResults.failed > 0) {
        status = "warning";
        title = "Calendars partially synced";
      }

      // Show detailed results
      toast({
        title: title,
        description: description,
        status: status,
        duration: 7000,
        isClosable: true,
      });

      // Log details to console for debugging
      console.log("Calendar sync details:", syncResults.details);

      // Refresh data after sync (even if some failed)
      await loadEventData();

    } catch (error) {
      console.error("Sync error:", error);
      toast({
        title: "Sync failed",
        description: error.message || "Could not sync calendars",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setBusySlotsLoading(false);
    }
  };

  const handleCopyLink = () => {
    const link = isDemo ? "https://when-now.com/events/demo-event (Demo Link)" : window.location.href;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      status: "success",
      duration: 2000,
      isClosable: true
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Calculate RSVP stats from real participants data using rsvp_status
  const rsvpStats = {
    going: participants.filter(p => p.rsvp_status === 'going').length,
    maybe: participants.filter(p => p.rsvp_status === 'maybe').length,
    declined: participants.filter(p => p.rsvp_status === 'not_going').length,
    noResponse: participants.filter(p => !p.rsvp_status).length
  };

  const totalResponses = rsvpStats.going + rsvpStats.maybe + rsvpStats.declined;

  const rsvpPercentages = {
    going: totalResponses ? (rsvpStats.going / totalResponses) * 100 : 0,
    maybe: totalResponses ? (rsvpStats.maybe / totalResponses) * 100 : 0,
    declined: totalResponses ? (rsvpStats.declined / totalResponses) * 100 : 0
  };

  // Find host
  const host = participants.find(p => p.user_id === event.coordinator_id) || { name: 'Coordinator', avatar: null };
  const isCoordinator = isDemo ? true : (user?.id === event.coordinator_id);

  // Get event type icon and label
  const getEventTypeInfo = (eventType) => {
    switch (eventType) {
      case 'meeting':
        return { icon: FiUsers, label: 'Meeting', color: 'blue' };
      case 'social':
        return { icon: FiCoffee, label: 'Social', color: 'purple' };
      case 'birthday':
        return { icon: FiGift, label: 'Birthday', color: 'pink' };
      case 'other':
        return { icon: FiMoreHorizontal, label: 'Other', color: 'gray' };
      default:
        return null;
    }
  };

  const handleSelectSlot = async (slotInfo) => {
    console.log('Slot selected:', slotInfo);

    // Check if this is a finalization action (Ctrl/Cmd + click for coordinators)
    if (isCoordinator && slotInfo.action === "select") {
      // If coordinator holds Ctrl/Cmd while dragging, open finalize modal
      if (slotInfo.box?.ctrlKey || slotInfo.box?.metaKey) {
        handleSelectTimeFromCalendar(slotInfo);
        return;
      }
    }

    // Validate minimum duration (30 minutes)
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

    // Demo mode - just show toast
    if (isDemo) {
      toast({
        title: "Time slot added (Demo)",
        description: "Your preferred time has been saved",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    // Validate same day selection
    const isSameDay = slotInfo.start.toDateString() === slotInfo.end.toDateString();
    if (!isSameDay) {
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
    if (event?.status === "finalized") {
      toast({
        title: "Event finalized",
        description: "Cannot add preferred slots to a finalized event",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Find all existing slots for current user that overlap with new selection
      const userSlots = preferredSlots.filter((slot) => {
        if (slot.user_id !== user?.id) return false;

        const slotStart = new Date(slot.start_time_utc);
        const slotEnd = new Date(slot.end_time_utc);
        const newStart = slotInfo.start;
        const newEnd = slotInfo.end;

        // Check if slot overlaps with the new selection
        return !(slotEnd <= newStart || slotStart >= newEnd);
      });

      let finalStartTime = slotInfo.start;
      let finalEndTime = slotInfo.end;

      // If there are overlapping slots, merge them
      if (userSlots.length > 0) {
        console.log(`Found ${userSlots.length} overlapping slots, merging...`);

        // Calculate merged time range (earliest start, latest end)
        const allTimes = [
          slotInfo.start,
          slotInfo.end,
          ...userSlots.flatMap(slot => [
            new Date(slot.start_time_utc),
            new Date(slot.end_time_utc)
          ])
        ];

        finalStartTime = new Date(Math.min(...allTimes));
        finalEndTime = new Date(Math.max(...allTimes));

        // Delete all overlapping slots
        await Promise.all(
          userSlots.map((slot) => 
            execute(() => preferredSlotsAPI.delete(event.id, slot.id), {
              showSuccessToast: false
            })
          )
        );

        console.log(`Merged time range: ${finalStartTime.toISOString()} to ${finalEndTime.toISOString()}`);
      }

      // Create the new (possibly merged) slot
      await execute(() => 
        preferredSlotsAPI.create(event.id, {
          start_time_utc: finalStartTime.toISOString(),
          end_time_utc: finalEndTime.toISOString(),
        }),
        { showSuccessToast: false }
      );

      toast({
        title: userSlots.length > 0 ? "Time slots merged" : "Time slot added",
        description: userSlots.length > 0 
          ? `Combined ${userSlots.length + 1} overlapping selections into one` 
          : "Your preferred time has been saved",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      // Refresh preferred slots to get updated data
      const updatedSlots = await execute(() => preferredSlotsAPI.getByEvent(event.id), {
        showSuccessToast: false
      });
      setPreferredSlots(updatedSlots || []);

    } catch (error) {
      console.error("Failed to add preferred slot:", error);
      toast({
        title: "Failed to add time slot",
        description: error.message || "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSelectTimeFromProposal = (proposedTime) => {
    // When coordinator clicks on a proposed time in the modal
    if (!isCoordinator) return;

    setSelectedFinalizeTime({
      start_time: proposedTime.start_time_utc || proposedTime.start_time,
      end_time: proposedTime.end_time_utc || proposedTime.end_time
    });
    setIsProposedTimesModalOpen(false);
    setIsFinalizeModalOpen(true);
  };

  const handleSelectTimeFromCalendar = (slotInfo) => {
    // When coordinator drags on calendar to select a custom time
    if (!isCoordinator) return;

    // Validate minimum duration (30 minutes)
    const duration = (slotInfo.end - slotInfo.start) / (1000 * 60);
    if (duration < 30) {
      toast({
        title: "Invalid duration",
        description: "Minimum slot duration is 30 minutes for finalization",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate same day selection
    const isSameDay = slotInfo.start.toDateString() === slotInfo.end.toDateString();
    if (!isSameDay) {
      toast({
        title: "Invalid time range",
        description: "Time slots must be within the same day",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSelectedFinalizeTime({
      start_time: slotInfo.start.toISOString(),
      end_time: slotInfo.end.toISOString()
    });
    setIsFinalizeModalOpen(true);
  };

  const handleFinalize = async (finalizationData) => {
    try {
      const result = await execute(() =>
        eventsAPI.finalize(eventUid, {
          start_time_utc: finalizationData.start_time_utc,
          end_time_utc: finalizationData.end_time_utc,
          participant_ids: finalizationData.participant_ids,
          include_google_meet: finalizationData.include_google_meet
        }),
        { showSuccessToast: false }
      );

      // Update event name if changed
      if (finalizationData.title !== event.name) {
        await execute(() =>
          eventsAPI.update(event.id, { name: finalizationData.title }),
          { showSuccessToast: false }
        );
      }

      toast({
        title: "Event finalized successfully!",
        description: result.meet_link
          ? "Google Calendar event created with Meet link"
          : "Google Calendar event created",
        status: "success",
        duration: 5000,
        isClosable: true
      });

      // Reload event data to show updated status
      await loadEventData();

      setIsFinalizeModalOpen(false);
      setSelectedFinalizeTime(null);
    } catch (error) {
      console.error("Finalization failed:", error);

      // Check if it's a Google Calendar authentication error
      const errorMessage = error.response?.data?.message || error.message;
      const needsReconnect = error.response?.data?.needs_reconnect;

      if (needsReconnect || errorMessage?.includes("expired") || errorMessage?.includes("reconnect")) {
        // Show error toast with reconnect option
        const toastId = toast({
          title: "Google Calendar Connection Expired",
          description: "Click the 'Reconnect Google Calendar' button below to refresh your connection.",
          status: "warning",
          duration: 15000,
          isClosable: true,
          position: "top"
        });

        // Highlight the reconnect button temporarily
        setTimeout(() => {
          const reconnectBtn = document.querySelector('[data-reconnect-calendar]');
          if (reconnectBtn) {
            reconnectBtn.style.animation = "pulse 2s ease-in-out 3";
          }
        }, 500);
      } else {
        toast({
          title: "Finalization failed",
          description: errorMessage || "Could not finalize the event. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true
        });
      }

      throw error; // Re-throw so modal can handle loading state
    }
  };

  const handleSelectEvent = async (calEvent) => {
    console.log('Event clicked:', calEvent);

    // Only handle clicks on preferred slots
    if (calEvent.type !== 'preferred-slot') {
      return;
    }

    // Find all user's slots in this time range
    const userSlots = preferredSlots.filter((slot) => {
      if (slot.user_id !== user?.id) return false;

      const slotStart = new Date(slot.start_time_utc);
      const slotEnd = new Date(slot.end_time_utc);
      const eventStart = calEvent.start;
      const eventEnd = calEvent.end;

      // Check if slot overlaps with the clicked event
      return !(slotEnd <= eventStart || slotStart >= eventEnd);
    });

    if (userSlots.length === 0) {
      toast({
        title: "Not your selection",
        description: "You can only remove your own preferred times",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    // Ask for confirmation before deleting
    if (window.confirm(`Remove your preferred time for this slot?`)) {
      try {
        // Delete all overlapping slots
        await Promise.all(
          userSlots.map((slot) => 
            execute(() => preferredSlotsAPI.delete(event.id, slot.id), {
              showSuccessToast: false
            })
          )
        );

        toast({
          title: "Time slot removed",
          description: "Your preferred time has been removed",
          status: "success",
          duration: 2000,
          isClosable: true,
        });

        // Refresh preferred slots
        const updatedSlots = await execute(() => preferredSlotsAPI.getByEvent(event.id), {
          showSuccessToast: false
        });
        setPreferredSlots(updatedSlots || []);

      } catch (error) {
        console.error("Failed to remove preferred slot:", error);
        toast({
          title: "Failed to remove time slot",
          description: error.message || "Please try again",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleEditSuccess = (updatedEvent) => {
    console.log("[EDIT_EVENT] Event updated successfully:", updatedEvent);
    // Reload event data to reflect changes (with cache-busting to ensure fresh data)
    loadEventData(true);
    toast({
      title: "Changes saved",
      description: "Event has been updated successfully",
      status: "success",
      duration: 3000,
      isClosable: true
    });
  };

  // Use AI-generated proposals as time options
  const timeOptions = aiProposals;

  return (
    <Box h="100vh" bg={bgColor} overflow="hidden">
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(49, 130, 206, 0.7);
            }
            50% {
              transform: scale(1.05);
              box-shadow: 0 0 0 10px rgba(49, 130, 206, 0);
            }
          }
        `}
      </style>

      {/* Compact Header Bar */}
      <Flex
        px={4}
        py={3}
        borderBottom="1px"
        borderColor="gray.200"
        align="center"
        bg="white"
        shadow={shadows.card}
      >
        <IconButton
          icon={<FiArrowLeft />}
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard")}
          aria-label="Back to Dashboard"
        />
        <Heading size="md" flex={1} ml={2} noOfLines={1} color="gray.800">
          {event.name}
        </Heading>
        <Badge
          colorScheme={event.status === "finalized" ? "green" : "blue"}
          mr={2}
          px={2}
          py={0.5}
          borderRadius="full"
          fontSize="xs"
        >
          {event.status?.toUpperCase()}
        </Badge>
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<FiMoreVertical />}
            variant="ghost"
            size="sm"
            aria-label="More options"
          />
          <MenuList>
            {isCoordinator && (
              <MenuItem icon={<FiEdit />} onClick={() => setIsEditModalOpen(true)}>
                Edit Event
              </MenuItem>
            )}
            <MenuItem icon={<FiCopy />} onClick={handleCopyLink}>
              Copy Link
            </MenuItem>
            {event.google_calendar_html_link && (
              <MenuItem
                icon={<FiExternalLink />}
                as="a"
                href={event.google_calendar_html_link}
                target="_blank"
              >
                View in Google Calendar
              </MenuItem>
            )}
          </MenuList>
        </Menu>
      </Flex>

      <Container maxW="95%" h="calc(100vh - 57px)" py={4}>
        <Grid templateColumns={{ base: "1fr", lg: "65fr 35fr" }} gap={6} h="full">

          {/* Left Column */}
          <Flex direction="column" h="full" overflow="hidden">


            {/* Calendar Section - Flexible Height */}
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
              {/* Compact inline legend at top */}
              <Flex justify="flex-end" align="center" mb={2} flexShrink={0}>
                <HStack spacing={4} fontSize="xs" color="gray.500">
                  <HStack spacing={1.5}>
                    <Box w="10px" h="10px" bg="gray.400" opacity={0.6} borderRadius="sm" />
                    <Text>Busy</Text>
                  </HStack>
                  <HStack spacing={1.5}>
                    <Box w="10px" h="10px" bg="#efbbff" borderRadius="sm" />
                    <Text>1-2</Text>
                  </HStack>
                  <HStack spacing={1.5}>
                    <Box w="10px" h="10px" bg="#be29ec" borderRadius="sm" />
                    <Text>5-6</Text>
                  </HStack>
                  <HStack spacing={1.5}>
                    <Box w="10px" h="10px" bg="#660066" borderRadius="sm" />
                    <Text>10+</Text>
                  </HStack>
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
                    selectable={event?.status !== 'finalized'}
                    minTime={extractCalendarTimeBound(event.earliest_datetime_utc, event.earliest_hour)}
                    maxTime={extractCalendarTimeBound(event.latest_datetime_utc, event.latest_hour)}
                  />
                )}
              </Box>
            </Box>

            {/* Proposed Times Section - Now shown in modal only */}
          </Flex>

          {/* Right Column - Sidebar */}
          <Box h="full" overflowY="auto" pb={4}>
            <VStack align="stretch" spacing={4}>

              {/* Event Details Section */}
              <Box borderWidth="1px" borderRadius="xl" p={4} bg={cardBg} shadow={shadows.card}>
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                  color="gray.500"
                  mb={3}
                >
                  Event Details
                </Text>
                <VStack align="stretch" spacing={3}>
                  <Flex justify="space-between" align="center" gap={3}>
                    <HStack spacing={3} flex={1}>
                      <Avatar size="sm" name={host.name || "Coordinator"} src={host.avatar_url} />
                      <VStack align="start" spacing={0}>
                        <Text fontSize="xs" color="gray.500">Host</Text>
                        <Text fontWeight="medium" fontSize="sm">{host.name || "Coordinator"}</Text>
                      </VStack>
                    </HStack>
                    
                    <VStack align="end" spacing={1}>
                      <HStack spacing={2}>
                        <Button
                          size="xs"
                          colorScheme="green"
                          variant={userRsvp === "going" ? "solid" : "outline"}
                          borderRadius="full"
                          onClick={() => handleRsvp("going")}
                          leftIcon={<FiCheck />}
                        >
                          Going
                        </Button>
                        <Button
                          size="xs"
                          colorScheme="yellow"
                          variant={userRsvp === "maybe" ? "solid" : "outline"}
                          borderRadius="full"
                          onClick={() => handleRsvp("maybe")}
                          leftIcon={<FiMinus />}
                        >
                          Maybe
                        </Button>
                        <Button
                          size="xs"
                          colorScheme="red"
                          variant={userRsvp === "not_going" ? "solid" : "outline"}
                          borderRadius="full"
                          onClick={() => handleRsvp("not_going")}
                          leftIcon={<FiX />}
                        >
                          Can't
                        </Button>
                      </HStack>
                      <Text fontSize="2xs" color="gray.600">
                        {rsvpStats.going} going · {rsvpStats.maybe} maybe · {rsvpStats.declined} can't
                      </Text>
                    </VStack>
                  </Flex>

                  <Divider />

                  {/* Date info */}
                  <Box>
                    <HStack spacing={2} color="gray.700">
                      <Icon as={FiCalendar} boxSize={4} color="gray.500" />
                      <Text fontSize="sm">
                        {event.status === 'finalized' && event.finalized_start_time_utc
                          ? formatEventDateTime(event.finalized_start_time_utc, event.coordinator_timezone)
                          : event.earliest_datetime_utc && event.latest_datetime_utc
                          ? `${formatEventDateOnly(event.earliest_datetime_utc, event.coordinator_timezone)} - ${formatEventDateOnly(event.latest_datetime_utc, event.coordinator_timezone)}`
                          : 'Date TBD'}
                      </Text>
                    </HStack>
                  </Box>

                  {/* Duration */}
                  <Box>
                    <HStack spacing={2} color="gray.700">
                      <Icon as={FiClock} boxSize={4} color="gray.500" />
                      <Text fontSize="sm">{event.duration_minutes} minutes</Text>
                    </HStack>
                  </Box>

                  {/* Location */}
                  {event.location && (
                    <Box>
                      <HStack spacing={2} color="gray.700">
                        <Icon as={FiMapPin} boxSize={4} color="gray.500" />
                        <Text fontSize="sm" noOfLines={2}>{event.location}</Text>
                      </HStack>
                    </Box>
                  )}

                  {/* Video Call Link */}
                  {event.video_call_link && (
                    <Link href={event.video_call_link} isExternal>
                      <HStack spacing={2} color="blue.500" _hover={{ color: "blue.600" }}>
                        <Icon as={FiVideo} boxSize={4} />
                        <Text fontSize="sm">Join Meeting</Text>
                        <Icon as={FiExternalLink} boxSize={3} />
                      </HStack>
                    </Link>
                  )}

                  <Divider />

                  {event.description && (
                    <Text color="gray.600" fontSize="sm" lineHeight="tall">
                      {event.description}
                    </Text>
                  )}

                  {/* Event Type Badge */}
                  {event.event_type && getEventTypeInfo(event.event_type) && (
                    <Badge
                      colorScheme={getEventTypeInfo(event.event_type).color}
                      variant="subtle"
                      px={2}
                      py={1}
                      borderRadius="md"
                    >
                      <HStack spacing={1}>
                        <Icon as={getEventTypeInfo(event.event_type).icon} boxSize={3} />
                        <Text fontSize="xs">{getEventTypeInfo(event.event_type).label}</Text>
                      </HStack>
                    </Badge>
                  )}

                  {event.attachments && event.attachments.length > 0 && (
                    <>
                      <Divider />
                      <Box>
                        <Text fontSize="xs" color="gray.500" mb={2}>Attachments</Text>
                        <VStack align="stretch" spacing={1}>
                          {event.attachments.map((file) => (
                            <HStack
                              key={file.id}
                              p={2}
                              bg="gray.50"
                              borderRadius="md"
                              justify="space-between"
                            >
                              <HStack>
                                <Icon as={FiPaperclip} boxSize={3} color="gray.500" />
                                <Text fontSize="xs" fontWeight="medium" noOfLines={1}>{file.name}</Text>
                              </HStack>
                              <IconButton
                                icon={<FiDownload />}
                                size="xs"
                                variant="ghost"
                                aria-label="Download"
                              />
                            </HStack>
                          ))}
                        </VStack>
                      </Box>
                    </>
                  )}
                </VStack>
              </Box>

              {/* Actions Section */}
              <Box borderWidth="1px" borderRadius="xl" p={4} bg={cardBg} shadow={shadows.card}>
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                  color="gray.500"
                  mb={3}
                >
                  Actions
                </Text>
                <VStack spacing={3}>
                  {/* Primary Action - Coordinator: View Proposed Times */}
                  {isCoordinator && event?.status !== 'finalized' && (
                    <Button
                      colorScheme="purple"
                      w="full"
                      size="md"
                      leftIcon={isLoadingProposals ? <Spinner size="sm" /> : <FiClock />}
                      onClick={() => setIsProposedTimesModalOpen(true)}
                      isDisabled={isLoadingProposals}
                    >
                      {isLoadingProposals ? "Generating..." : "View Proposed Times"}
                      {!isLoadingProposals && timeOptions.length > 0 && (
                        <Badge ml={2} colorScheme="whiteAlpha" bg="whiteAlpha.300">{timeOptions.length}</Badge>
                      )}
                    </Button>
                  )}

                  {/* Secondary Actions Row */}
                  <HStack w="full" spacing={2}>
                    {isCoordinator && (
                      <Button
                        flex={1}
                        size="sm"
                        variant="outline"
                        leftIcon={<FiRefreshCw />}
                        onClick={handleSyncCalendars}
                        isLoading={busySlotsLoading}
                        isDisabled={event?.status === 'finalized'}
                      >
                        Sync
                      </Button>
                    )}
                    {(isCoordinator || canInvite) && (
                      <Button
                        flex={1}
                        size="sm"
                        variant="outline"
                        leftIcon={<FiMail />}
                        onClick={() => setIsInviteModalOpen(true)}
                      >
                        Invite
                      </Button>
                    )}
                  </HStack>

                  {/* Tertiary Actions */}
                  <HStack w="full" spacing={2}>
                    <Button
                      flex={1}
                      size="xs"
                      variant="ghost"
                      leftIcon={<FiCopy />}
                      onClick={handleCopyLink}
                    >
                      Copy Link
                    </Button>
                    <Button
                      flex={1}
                      size="xs"
                      variant="ghost"
                      leftIcon={<FiCalendar />}
                      onClick={handleReconnectGoogleCalendar}
                      data-reconnect-calendar
                    >
                      Reconnect
                    </Button>
                  </HStack>
                </VStack>
              </Box>

              {/* Participants Section */}
              <Box borderWidth="1px" borderRadius="xl" p={4} bg={cardBg} shadow={shadows.card}>
                <HStack justify="space-between" mb={3}>
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    textTransform="uppercase"
                    letterSpacing="0.5px"
                    color="gray.500"
                  >
                    Participants
                  </Text>
                  <Badge colorScheme="purple" borderRadius="full" fontSize="xs">
                    {participants.length}
                  </Badge>
                </HStack>

                {/* Avatar stack preview */}
                <HStack mb={3}>
                  <AvatarGroup size="sm" max={5}>
                    {participants.map((p) => (
                      <Avatar key={p.id} name={p.name || p.email} src={p.avatar_url} />
                    ))}
                  </AvatarGroup>
                  {participants.length > 5 && (
                    <Text fontSize="sm" color="gray.500">+{participants.length - 5} more</Text>
                  )}
                </HStack>

                {/* RSVP breakdown bar */}
                <Box w="full" h={2} bg="gray.100" borderRadius="full" overflow="hidden" mb={2}>
                  <Flex h="full">
                    <Box w={`${rsvpPercentages.going}%`} bg="green.400" />
                    <Box w={`${rsvpPercentages.maybe}%`} bg="yellow.400" />
                    <Box w={`${rsvpPercentages.declined}%`} bg="red.400" />
                  </Flex>
                </Box>

                {/* Expandable participant list */}
                <VStack align="stretch" spacing={2} maxH="200px" overflowY="auto" mt={3}>
                  {participants.map((participant) => (
                    <HStack key={participant.id} py={1}>
                      <Avatar size="xs" name={participant.name || participant.email} src={participant.avatar_url} />
                      <Text fontSize="sm" flex={1} noOfLines={1}>{participant.name || "User"}</Text>
                      <Badge
                        size="sm"
                        colorScheme={
                          participant.rsvp_status === 'going' ? 'green' :
                            participant.rsvp_status === 'maybe' ? 'yellow' :
                              participant.rsvp_status === 'not_going' ? 'red' : 'gray'
                        }
                        variant="subtle"
                        fontSize="2xs"
                      >
                        {participant.rsvp_status === 'going' ? 'Going' :
                          participant.rsvp_status === 'maybe' ? 'Maybe' :
                            participant.rsvp_status === 'not_going' ? "Can't" :
                              'Pending'}
                      </Badge>
                    </HStack>
                  ))}
                </VStack>
              </Box>

            </VStack>
          </Box>

        </Grid>
      </Container>
      
      {/* Invite Modal */}
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        eventUid={eventUid}
        onSuccess={() => {
          loadEventData();
          setIsInviteModalOpen(false);
        }}
      />

      {/* Edit Event Modal */}
      <EditEventModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        event={event}
        onSuccess={handleEditSuccess}
      />

      {/* Proposed Times Modal */}
      <ProposedTimesModal
        isOpen={isProposedTimesModalOpen}
        onClose={() => setIsProposedTimesModalOpen(false)}
        timeOptions={timeOptions}
        selectedTimeOption={selectedTimeOption}
        setSelectedTimeOption={setSelectedTimeOption}
        proposalMetadata={proposalMetadata}
        isCoordinator={isCoordinator}
        isLoadingProposals={isLoadingProposals}
        onRefresh={() => fetchAIProposals(true)}
        onSelectTime={handleSelectTimeFromProposal}
      />

      {/* Finalize Event Modal */}
      <FinalizeEventModal
        isOpen={isFinalizeModalOpen}
        onClose={() => {
          setIsFinalizeModalOpen(false);
          setSelectedFinalizeTime(null);
        }}
        event={event}
        selectedTime={selectedFinalizeTime}
        participants={participants}
        onFinalize={handleFinalize}
      />
    </Box>
  );
};

export default EventPage;
