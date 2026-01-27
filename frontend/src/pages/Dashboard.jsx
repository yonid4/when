import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Text,
  HStack,
  VStack,
  Badge,
  Card,
  CardBody,
  Icon,
  IconButton,
  Spinner,
  Center,
  Collapse,
  useDisclosure
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiCheck,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiPlus,
  FiInbox
} from "react-icons/fi";
import { eventsAPI, notificationsAPI } from "../services/apiService";
import { useApiCall } from "../hooks/useApiCall";
import { useAuth } from "../hooks/useAuth";
import { useEnsureProfile } from "../hooks/useEnsureProfile";
import { colors, shadows, components } from "../styles/designSystem";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

// Section header component
const SectionHeader = ({ title, count, colorScheme = "gray" }) => (
  <HStack mb={4} spacing={2}>
    <Text
      fontSize="xs"
      fontWeight="semibold"
      textTransform="uppercase"
      letterSpacing="0.5px"
      color="gray.600"
    >
      {title}
    </Text>
    {count !== undefined && (
      <Badge colorScheme={colorScheme} borderRadius="full" fontSize="xs" px={2}>
        {count}
      </Badge>
    )}
  </HStack>
);

// Compact stat row component for sidebar
const StatRow = ({ icon, label, value, borderColor, textColor }) => (
  <HStack
    py={3}
    borderLeft="3px solid"
    borderColor={borderColor}
    pl={3}
    bg="gray.50"
    borderRadius="md"
  >
    <Icon as={icon} color={textColor} boxSize={4} />
    <Text flex={1} fontSize="sm" color="gray.700">{label}</Text>
    <Text fontWeight="bold" fontSize="lg" color={textColor}>{value}</Text>
  </HStack>
);

// Simplified event card component
const EventCard = ({ event, onClick, isUpcoming }) => {
  const getStatusColor = (status) => {
    if (status === "finalized") return "green";
    if (status === "planning") return "blue";
    return "gray";
  };

  const formatEventDate = (event) => {
    if (event.status === "finalized" && event.finalized_start_time_utc) {
      return new Date(event.finalized_start_time_utc).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    }
    if (event.earliest_datetime_utc && event.latest_datetime_utc) {
      const start = new Date(event.earliest_datetime_utc).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const end = new Date(event.latest_datetime_utc).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return `${start} - ${end}`;
    }
    return "Date TBD";
  };

  return (
    <Card
      borderRadius="xl"
      border="1px solid"
      borderColor="gray.200"
      bg="white"
      shadow={shadows.card}
      cursor="pointer"
      onClick={onClick}
      _hover={{
        borderColor: "gray.300",
        shadow: shadows.cardHover,
        transform: "translateY(-2px)"
      }}
      transition="all 0.15s ease-out"
    >
      <CardBody p={4}>
        <HStack justify="space-between" mb={2}>
          <Badge colorScheme={getStatusColor(event.status)} size="sm" borderRadius="md">
            {event.status}
          </Badge>
          {event.role && (
            <Text fontSize="xs" color="gray.500" textTransform="capitalize">
              {event.role}
            </Text>
          )}
        </HStack>
        <Heading size="sm" mb={2} noOfLines={1} color="gray.800">
          {event.name}
        </Heading>
        <HStack fontSize="xs" color="gray.600" mb={3}>
          <Icon as={FiCalendar} />
          <Text>{formatEventDate(event)}</Text>
        </HStack>
        {event.duration_minutes && (
          <HStack fontSize="xs" color="gray.500" mb={3}>
            <Icon as={FiClock} />
            <Text>{event.duration_minutes} min</Text>
          </HStack>
        )}
        <Button
          size="sm"
          w="full"
          variant="ghost"
          colorScheme="purple"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          View Details
        </Button>
      </CardBody>
    </Card>
  );
};

// Compact invitation card for sidebar
const InvitationCard = ({ notification, onAccept, onDecline, onNavigate }) => (
  <Card
    size="sm"
    borderLeft="3px solid"
    borderColor={colors.accent}
    bg="white"
    shadow={shadows.card}
    _hover={{ shadow: shadows.cardHover }}
    cursor="pointer"
    onClick={onNavigate}
  >
    <CardBody py={3} px={3}>
      <HStack justify="space-between" align="start">
        <VStack align="start" spacing={1} flex={1}>
          <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
            {notification.metadata?.event_name || notification.title}
          </Text>
          <Text fontSize="xs" color="gray.500" noOfLines={1}>
            {notification.message}
          </Text>
        </VStack>
        <HStack spacing={1}>
          <IconButton
            icon={<FiCheck />}
            colorScheme="green"
            size="xs"
            variant="solid"
            aria-label="Accept"
            onClick={(e) => {
              e.stopPropagation();
              onAccept();
            }}
          />
          <IconButton
            icon={<FiX />}
            colorScheme="red"
            size="xs"
            variant="ghost"
            aria-label="Decline"
            onClick={(e) => {
              e.stopPropagation();
              onDecline();
            }}
          />
        </HStack>
      </HStack>
    </CardBody>
  </Card>
);

// Demo data for local testing (add ?demo=true to URL)
const DEMO_EVENTS = [
  {
    id: 1,
    uid: "demo-event-1",
    name: "Team Planning Meeting",
    status: "finalized",
    role: "coordinator",
    finalized_start_time_utc: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    finalized_end_time_utc: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    duration_minutes: 60
  },
  {
    id: 2,
    uid: "demo-event-2",
    name: "Product Launch Party",
    status: "finalized",
    role: "participant",
    finalized_start_time_utc: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    finalized_end_time_utc: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 180
  },
  {
    id: 3,
    uid: "demo-event-3",
    name: "Weekly Standup",
    status: "planning",
    role: "coordinator",
    earliest_datetime_utc: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    latest_datetime_utc: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 30
  },
  {
    id: 4,
    uid: "demo-event-4",
    name: "Design Review Session",
    status: "planning",
    role: "participant",
    earliest_datetime_utc: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    latest_datetime_utc: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 90
  },
  {
    id: 5,
    uid: "demo-event-5",
    name: "Q4 Retrospective",
    status: "finalized",
    role: "coordinator",
    finalized_start_time_utc: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    finalized_end_time_utc: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 120
  }
];

const DEMO_INVITATIONS = [
  {
    id: 101,
    notification_type: "event_invitation",
    action_taken: false,
    title: "You're invited!",
    message: "Sarah invited you to Birthday Dinner",
    metadata: { event_name: "Birthday Dinner", event_uid: "demo-invite-1" }
  },
  {
    id: 102,
    notification_type: "event_invitation",
    action_taken: false,
    title: "New event invitation",
    message: "Mike invited you to Hackathon Planning",
    metadata: { event_name: "Hackathon Planning", event_uid: "demo-invite-2" }
  }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";

  const { user, loading: authLoading } = useAuth();
  useEnsureProfile();

  const [events, setEvents] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { execute } = useApiCall();
  const { isOpen: isPastOpen, onToggle: onTogglePast } = useDisclosure({ defaultIsOpen: false });

  // Load dashboard data
  useEffect(() => {
    if (isDemo) {
      // Use demo data
      setEvents(DEMO_EVENTS);
      setInvitations(DEMO_INVITATIONS);
      setLoading(false);
    } else {
      loadDashboardData();
    }
  }, [isDemo]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [eventsData, notificationsData] = await Promise.all([
        execute(() => eventsAPI.getAll(), { showSuccessToast: false }),
        execute(() => notificationsAPI.getAll(false, 50), { showSuccessToast: false })
      ]);

      if (eventsData) {
        setEvents(eventsData);
      }

      if (notificationsData) {
        const pendingInvitations = (notificationsData.notifications || notificationsData || []).filter(
          n => n.notification_type === "event_invitation" && !n.action_taken
        );
        setInvitations(pendingInvitations);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewEvent = (eventUid) => {
    navigate(`/events/${eventUid}`);
  };

  const handleAcceptInvitation = async (notificationId, eventUid) => {
    const result = await execute(
      () => notificationsAPI.handleAction(notificationId, "accept"),
      {
        successMessage: "Invitation accepted!",
        onSuccess: () => {
          if (result?.event_uid || eventUid) {
            navigate(`/events/${result?.event_uid || eventUid}`);
          } else {
            loadDashboardData();
          }
        }
      }
    );
  };

  const handleDeclineInvitation = async (notificationId) => {
    await execute(
      () => notificationsAPI.handleAction(notificationId, "decline"),
      {
        successMessage: "Invitation declined",
        onSuccess: () => loadDashboardData()
      }
    );
  };

  // Compute stats from real data
  const now = new Date();

  const completedUpcomingEvents = events.filter(e => {
    if (e.status !== "finalized") return false;
    if (!e.finalized_end_time_utc) return false;
    return new Date(e.finalized_end_time_utc) >= now;
  });

  const inProgressEvents = events.filter(e => {
    if (e.status === "cancelled") return false;
    if (e.status === "finalized") return false;
    if (!e.latest_datetime_utc) return true;
    return new Date(e.latest_datetime_utc) >= now;
  });

  const pastEvents = events.filter(e => {
    if (e.status === "cancelled") return false;
    if (e.status === "finalized" && e.finalized_end_time_utc) {
      return new Date(e.finalized_end_time_utc) < now;
    }
    if (e.status !== "finalized" && e.latest_datetime_utc) {
      return new Date(e.latest_datetime_utc) < now;
    }
    return false;
  });

  const stats = {
    completedUpcoming: completedUpcomingEvents.length,
    inProgress: inProgressEvents.length,
    pastEvents: pastEvents.length,
    pendingInvitations: invitations.length
  };

  const userName = isDemo ? "Demo User" : (user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User");

  if (loading || (!isDemo && authLoading)) {
    return (
      <Center minH="100vh" bg={colors.bgPage}>
        <VStack spacing={4}>
          <Spinner size="xl" color={colors.primary} thickness="4px" />
          <Text color="gray.600">Loading your dashboard...</Text>
        </VStack>
      </Center>
    );
  }

  const hasNoEvents = events.length === 0;

  return (
    <Box h="calc(100vh - 64px)" bg={colors.bgPage} overflow="hidden">
      <Grid
        templateColumns={{ base: "1fr", lg: `1fr ${components.sidebar.width}` }}
        gap={0}
        h="100%"
      >
        {/* Main Content Area */}
        <Box
          overflowY="auto"
          py={6}
          px={{ base: 4, md: 6 }}
          h="100%"
        >
          {/* Welcome Section - Compact */}
          <MotionBox
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            mb={6}
          >
            <HStack justify="space-between" align="baseline">
              <Heading size="lg" color={colors.textHeading}>
                Welcome back, {userName.split(" ")[0]}!
              </Heading>
              <Text color={colors.textMuted} fontSize="sm">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric"
                })}
              </Text>
            </HStack>
          </MotionBox>

          {/* Upcoming Events Section */}
          <MotionBox
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            mb={6}
          >
            <SectionHeader
              title="Upcoming Events"
              count={completedUpcomingEvents.length}
              colorScheme="green"
            />
            {completedUpcomingEvents.length > 0 ? (
              <Grid
                templateColumns={{
                  base: "1fr",
                  md: "repeat(2, 1fr)",
                  xl: "repeat(3, 1fr)"
                }}
                gap={4}
              >
                {completedUpcomingEvents.map((event, index) => (
                  <MotionBox
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.15 + index * 0.04 }}
                  >
                    <EventCard
                      event={event}
                      onClick={() => handleViewEvent(event.uid)}
                      isUpcoming
                    />
                  </MotionBox>
                ))}
              </Grid>
            ) : (
              <Card bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200">
                <CardBody py={8} textAlign="center">
                  <Icon as={FiCalendar} boxSize={10} color="gray.300" mb={3} />
                  <Text color="gray.500">No upcoming events</Text>
                </CardBody>
              </Card>
            )}
          </MotionBox>

          {/* In Progress Section */}
          <MotionBox
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            mb={6}
          >
            <SectionHeader
              title="In Progress"
              count={inProgressEvents.length}
              colorScheme="blue"
            />
            {inProgressEvents.length > 0 ? (
              <Grid
                templateColumns={{
                  base: "1fr",
                  md: "repeat(2, 1fr)",
                  xl: "repeat(3, 1fr)"
                }}
                gap={4}
              >
                {inProgressEvents.map((event, index) => (
                  <MotionBox
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.25 + index * 0.04 }}
                  >
                    <EventCard
                      event={event}
                      onClick={() => handleViewEvent(event.uid)}
                    />
                  </MotionBox>
                ))}
              </Grid>
            ) : (
              <Card bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200">
                <CardBody py={8} textAlign="center">
                  <Icon as={FiClock} boxSize={10} color="gray.300" mb={3} />
                  <Text color="gray.500" mb={3}>No events being planned</Text>
                  <Button
                    colorScheme="purple"
                    size="sm"
                    leftIcon={<FiPlus />}
                    onClick={() => navigate("/event/create")}
                  >
                    Create Event
                  </Button>
                </CardBody>
              </Card>
            )}
          </MotionBox>

          {/* Past Events Section - Collapsible */}
          {pastEvents.length > 0 && (
            <MotionBox
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <HStack mb={4} spacing={2} cursor="pointer" onClick={onTogglePast}>
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                  color="gray.600"
                >
                  Past Events
                </Text>
                <Badge colorScheme="gray" borderRadius="full" fontSize="xs" px={2}>
                  {pastEvents.length}
                </Badge>
                <Icon
                  as={isPastOpen ? FiChevronUp : FiChevronDown}
                  color="gray.500"
                  boxSize={4}
                />
              </HStack>
              <Collapse in={isPastOpen} animateOpacity>
                <Grid
                  templateColumns={{
                    base: "1fr",
                    md: "repeat(2, 1fr)",
                    xl: "repeat(3, 1fr)"
                  }}
                  gap={4}
                >
                  {pastEvents.map((event, index) => (
                    <MotionBox
                      key={event.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.04 }}
                    >
                      <EventCard
                        event={event}
                        onClick={() => handleViewEvent(event.uid)}
                      />
                    </MotionBox>
                  ))}
                </Grid>
              </Collapse>
            </MotionBox>
          )}
        </Box>

        {/* Sidebar */}
        <Box
          borderLeft="1px"
          borderColor="gray.200"
          bg="white"
          p={5}
          position="relative"
          h="100%"
          overflowY="auto"
          display={{ base: "none", lg: "block" }}
          shadow={shadows.sidebar}
        >
          {/* Quick Stats */}
          <VStack align="stretch" spacing={3} mb={6}>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              textTransform="uppercase"
              letterSpacing="0.5px"
              color="gray.600"
              mb={1}
            >
              Quick Stats
            </Text>
            <StatRow
              icon={FiCheck}
              label="Upcoming"
              value={stats.completedUpcoming}
              borderColor="green.400"
              textColor="green.600"
            />
            <StatRow
              icon={FiClock}
              label="In Progress"
              value={stats.inProgress}
              borderColor="blue.400"
              textColor="blue.600"
            />
            <StatRow
              icon={FiCalendar}
              label="Past Events"
              value={stats.pastEvents}
              borderColor="gray.400"
              textColor="gray.600"
            />
          </VStack>

          {/* Pending Invitations */}
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between">
              <Text
                fontSize="xs"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="0.5px"
                color="gray.600"
              >
                Invitations
              </Text>
              {invitations.length > 0 && (
                <Badge colorScheme="orange" borderRadius="full" fontSize="xs">
                  {invitations.length}
                </Badge>
              )}
            </HStack>

            {invitations.length > 0 ? (
              <VStack
                align="stretch"
                spacing={2}
                maxH="300px"
                overflowY="auto"
                pr={1}
              >
                {invitations.map((notification, index) => (
                  <MotionBox
                    key={notification.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <InvitationCard
                      notification={notification}
                      onAccept={() => handleAcceptInvitation(notification.id, notification.metadata?.event_uid)}
                      onDecline={() => handleDeclineInvitation(notification.id)}
                      onNavigate={() => {
                        if (notification.metadata?.event_uid) {
                          navigate(`/events/${notification.metadata.event_uid}`);
                        }
                      }}
                    />
                  </MotionBox>
                ))}
              </VStack>
            ) : (
              <Card bg="gray.50" borderRadius="lg">
                <CardBody py={6} textAlign="center">
                  <Icon as={FiInbox} boxSize={8} color="gray.300" mb={2} />
                  <Text fontSize="sm" color="gray.500">No pending invitations</Text>
                </CardBody>
              </Card>
            )}
          </VStack>

          {/* Create Event CTA if no events */}
          {hasNoEvents && (
            <Box mt={6}>
              <Button
                w="full"
                colorScheme="purple"
                size="md"
                leftIcon={<FiPlus />}
                onClick={() => navigate("/event/create")}
              >
                Create Your First Event
              </Button>
            </Box>
          )}
        </Box>
      </Grid>
    </Box>
  );
};

export default Dashboard;
