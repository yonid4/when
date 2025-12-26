import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  AvatarGroup,
  Badge,
  Card,
  CardBody,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Image,
  Divider,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Spinner,
  Center
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUsers,
  FiPlus,
  FiEdit,
  FiShare2,
  FiMoreVertical,
  FiCheck,
  FiX,
  FiMinus,
  FiVideo
} from "react-icons/fi";
import { eventsAPI, notificationsAPI } from "../services/apiService";
import { useApiCall } from "../hooks/useApiCall";
import { useAuth } from "../hooks/useAuth";
import { useEnsureProfile } from "../hooks/useEnsureProfile";
import { colors, gradients } from "../styles/designSystem";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  useEnsureProfile();

  const [hoveredCard, setHoveredCard] = useState(null);
  const [events, setEvents] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { execute } = useApiCall();

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

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

      // Filter for pending invitations only
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

  const handleCreateEvent = () => {
    navigate("/event/create");
  };

  const handleViewEvent = (eventUid) => {
    // Navigate using UID, not ID!
    navigate(`/events/${eventUid}`);
  };

  const handleAcceptInvitation = async (notificationId, eventUid) => {
    const result = await execute(
      () => notificationsAPI.handleAction(notificationId, "accept"),
      {
        successMessage: "Invitation accepted!",
        onSuccess: () => {
          // Navigate to the event page instead of reloading dashboard
          if (result?.event_uid || eventUid) {
            navigate(`/events/${result?.event_uid || eventUid}`);
          } else {
            // Fallback to reload if no UID available
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

  const getEventTypeColor = (type) => {
    const colorMap = {
      meeting: "blue",
      social: "green",
      birthday: "pink",
      other: "purple"
    };
    return colorMap[type] || "gray";
  };

  const getEventTypeIcon = (type) => {
    const iconMap = {
      meeting: FiUsers,
      social: FiCalendar,
      birthday: FiCalendar,
      other: FiCalendar
    };
    return iconMap[type] || FiCalendar;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { month: "short", day: "numeric", weekday: "short" };
    return date.toLocaleDateString("en-US", options);
  };

  // Compute stats from real data
  const now = new Date();

  const stats = {
    eventsThisMonth: events.length,
    upcomingEvents: events.filter(e => {
      // Skip cancelled events
      if (e.status === "cancelled") return false;

      // If event is finalized, check if finalized date is >= current date
      if (e.status === "finalized" && e.finalized_end_time_utc) {
        const finalizedDate = new Date(e.finalized_end_time_utc);
        return finalizedDate >= now;
      }

      // If event is NOT finalized, check if end date of date range is >= current date
      if (e.status !== "finalized" && e.latest_date) {
        const latestDate = new Date(e.latest_date);
        return latestDate >= now;
      }

      // If no date info available, include it in upcoming
      return true;
    }).length,
    pendingInvitations: invitations.length
  };

  // Get user info
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";
  const userAvatar = user?.user_metadata?.avatar_url;

  // Filter events for display
  const upcomingEvents = events.filter(e => e.status !== "cancelled").slice(0, 6);

  // Show loading state
  if (loading || authLoading) {
    return (
      <Center minH="100vh" bg={bgColor}>
        <VStack spacing={4}>
          <Spinner size="xl" color={colors.primary} thickness="4px" />
          <Text color="gray.600">Loading your dashboard...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      {/* Main Content */}
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Welcome Section */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <VStack align="start" spacing={2}>
              <Heading size="xl">Welcome back, {userName.split(" ")[0]}!</Heading>
              <Text color="gray.600" fontSize="lg">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </Text>
            </VStack>
          </MotionBox>

          {/* Create Event Button */}
          <MotionBox
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card
              bg={gradients.ocean}
              color="white"
              cursor="pointer"
              onClick={handleCreateEvent}
              _hover={{ transform: "translateY(-4px)", shadow: "xl" }}
              transition="all 0.3s"
            >
              <CardBody>
                <Flex align="center" justify="center" py={4}>
                  <Icon as={FiPlus} boxSize={8} mr={4} />
                  <Heading size="lg">Create New Event</Heading>
                </Flex>
              </CardBody>
            </Card>
          </MotionBox>

          {/* Quick Stats */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
              <Card bg={cardBg}>
                <CardBody>
                  <Stat>
                    <StatLabel>Events This Month</StatLabel>
                    <StatNumber color={colors.primary}>{stats.eventsThisMonth}</StatNumber>
                    <StatHelpText>Active events</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
              <Card bg={cardBg}>
                <CardBody>
                  <Stat>
                    <StatLabel>Upcoming</StatLabel>
                    <StatNumber color={colors.secondary}>{stats.upcomingEvents}</StatNumber>
                    <StatHelpText>Not passed yet</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
              <Card bg={cardBg}>
                <CardBody>
                  <Stat>
                    <StatLabel>Pending</StatLabel>
                    <StatNumber color={colors.accent}>{stats.pendingInvitations}</StatNumber>
                    <StatHelpText>Need response</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>
          </MotionBox>

          {/* Pending Invitations Section */}
          {invitations.length > 0 && (
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <VStack align="stretch" spacing={4}>
                <Flex align="center" justify="space-between">
                  <HStack>
                    <Heading size="md">Pending Invitations</Heading>
                    <Badge colorScheme="red" borderRadius="full" px={2}>
                      {invitations.length}
                    </Badge>
                  </HStack>
                </Flex>

                {/* Invitation Cards */}
                <VStack spacing={3} align="stretch">
                  {invitations.map((notification, index) => (
                    <MotionCard
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                      bg={cardBg}
                      borderLeft="4px"
                      borderColor={colors.accent}
                      _hover={{ shadow: "md" }}
                      cursor="pointer"
                      onClick={() => {
                        // Navigate to event if uid exists in metadata
                        if (notification.metadata?.event_uid) {
                          navigate(`/events/${notification.metadata.event_uid}`);
                        }
                      }}
                    >
                      <CardBody>
                        <Flex justify="space-between" align="center">
                          <VStack align="start" spacing={2} flex={1}>
                            <HStack>
                              <Icon as={FiCalendar} color={colors.primary} />
                              <Heading size="sm">
                                {notification.metadata?.event_name || notification.title}
                              </Heading>
                            </HStack>
                            <Text fontSize="sm" color="gray.600">
                              {notification.message}
                            </Text>
                            {notification.metadata?.event_description && (
                              <Text fontSize="sm" color="gray.500" noOfLines={2}>
                                {notification.metadata.event_description}
                              </Text>
                            )}
                          </VStack>

                          <HStack spacing={2} ml={4}>
                            <Button
                              leftIcon={<FiCheck />}
                              colorScheme="green"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptInvitation(notification.id, notification.metadata?.event_uid);
                              }}
                            >
                              Accept
                            </Button>
                            <IconButton
                              icon={<FiX />}
                              colorScheme="red"
                              variant="ghost"
                              size="sm"
                              aria-label="Decline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeclineInvitation(notification.id);
                              }}
                            />
                          </HStack>
                        </Flex>
                      </CardBody>
                    </MotionCard>
                  ))}
                </VStack>
              </VStack>
            </MotionBox>
          )}

          {/* Upcoming Events Section */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <VStack align="stretch" spacing={4}>
              <Heading size="md">Upcoming Events</Heading>

              {upcomingEvents.length > 0 ? (
                <Grid
                  templateColumns={{
                    base: "1fr",
                    md: "repeat(2, 1fr)",
                    lg: "repeat(3, 1fr)"
                  }}
                  gap={6}
                >
                  {upcomingEvents.map((event, index) => (
                    <MotionCard
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                      bg={cardBg}
                      cursor="pointer"
                      onClick={() => handleViewEvent(event.uid)}
                      onMouseEnter={() => setHoveredCard(event.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      _hover={{ shadow: "lg", transform: "translateY(-4px)" }}
                    >
                      <CardBody>
                        <VStack align="stretch" spacing={3}>
                          {/* Header */}
                          <Flex justify="space-between" align="start">
                            <HStack>
                              <Icon
                                as={FiCalendar}
                                color={colors.primary}
                                boxSize={5}
                              />
                              <Badge colorScheme={event.status === "finalized" ? "green" : "blue"}>
                                {event.status}
                              </Badge>
                              {event.role && (
                                <Badge colorScheme={event.role === "coordinator" ? "purple" : "gray"}>
                                  {event.role}
                                </Badge>
                              )}
                            </HStack>
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                icon={<FiMoreVertical />}
                                variant="ghost"
                                size="sm"
                                aria-label="Options"
                              />
                              <MenuList>
                                <MenuItem icon={<FiEdit />}>Edit</MenuItem>
                                <MenuItem icon={<FiShare2 />}>Share</MenuItem>
                              </MenuList>
                            </Menu>
                          </Flex>

                          {/* Title */}
                          <Heading size="sm" noOfLines={2}>
                            {event.name}
                          </Heading>

                          {/* Date Range */}
                          <VStack align="stretch" spacing={2} fontSize="sm">
                            {event.status === "finalized" && event.finalized_start_time_utc ? (
                              <>
                                <HStack color="gray.600">
                                  <Icon as={FiCalendar} />
                                  <Text fontWeight="medium">
                                    {new Date(event.finalized_start_time_utc).toLocaleDateString()}
                                  </Text>
                                </HStack>
                                <HStack color="gray.600">
                                  <Icon as={FiClock} />
                                  <Text>
                                    {new Date(event.finalized_start_time_utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </Text>
                                </HStack>
                              </>
                            ) : (
                              <>
                                <HStack color="gray.600">
                                  <Icon as={FiCalendar} />
                                  <Text fontWeight="medium">
                                    {event.earliest_datetime_utc && event.latest_datetime_utc
                                      ? `${new Date(event.earliest_datetime_utc).toLocaleDateString()} - ${new Date(event.latest_datetime_utc).toLocaleDateString()}`
                                      : 'Date TBD'}
                                  </Text>
                                </HStack>
                                <HStack color="gray.600">
                                  <Icon as={FiClock} />
                                  <Text>{event.duration_minutes} min</Text>
                                </HStack>
                              </>
                            )}
                          </VStack>

                          <Divider />

                          {/* Event Info */}
                          <VStack align="stretch" spacing={2} fontSize="sm">
                            {event.description && (
                              <Text color="gray.600" noOfLines={2}>
                                {event.description}
                              </Text>
                            )}
                            {event.google_calendar_html_link && (
                              <HStack color="blue.500">
                                <Icon as={FiVideo} />
                                <Text fontSize="xs">Calendar Link Available</Text>
                              </HStack>
                            )}
                          </VStack>

                          {/* Quick Actions */}
                          {hoveredCard === event.id && (
                            <HStack spacing={2} pt={2}>
                              <Button
                                size="sm"
                                colorScheme="blue"
                                flex={1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewEvent(event.uid);
                                }}
                              >
                                View
                              </Button>
                              <IconButton
                                icon={<FiShare2 />}
                                size="sm"
                                variant="outline"
                                aria-label="Share"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </HStack>
                          )}
                        </VStack>
                      </CardBody>
                    </MotionCard>
                  ))}
                </Grid>
              ) : (
                <Card bg={cardBg}>
                  <CardBody>
                    <VStack spacing={4} py={8}>
                      <Icon as={FiCalendar} boxSize={12} color="gray.400" />
                      <Text color="gray.500" fontSize="lg">
                        No upcoming events. Create one!
                      </Text>
                      <Button colorScheme="blue" onClick={handleCreateEvent}>
                        Create Event
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
};

export default Dashboard;

