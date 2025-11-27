import React, { useState } from "react";
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
  Avatar,
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
  StatHelpText
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUsers,
  FiBell,
  FiPlus,
  FiEdit,
  FiShare2,
  FiMoreVertical,
  FiCheck,
  FiX,
  FiMinus,
  FiVideo
} from "react-icons/fi";
import { mockEvents, mockInvitations, mockCurrentUser, mockStats, getUpcomingEvents } from "../utils/mockData";
import { colors, gradients } from "../styles/designSystem";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const DashboardTemp = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const upcomingEvents = getUpcomingEvents().slice(0, 6);

  const handleCreateEvent = () => {
    navigate("/event/create");
  };

  const handleViewEvent = (eventId) => {
    navigate(`/event_temp/${eventId}`);
  };

  const handleAcceptInvitation = (invitationId) => {
    console.log("Accepted invitation:", invitationId);
    // In real app, would call API
  };

  const handleDeclineInvitation = (invitationId) => {
    console.log("Declined invitation:", invitationId);
    // In real app, would call API
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

  return (
    <Box minH="100vh" bg={bgColor}>
      {/* Navigation Bar */}
      <Box
        bg={cardBg}
        borderBottom="1px"
        borderColor={borderColor}
        position="sticky"
        top={0}
        zIndex={10}
        boxShadow="sm"
      >
        <Container maxW="container.xl">
          <Flex h={16} alignItems="center" justifyContent="space-between">
            {/* Logo */}
            <HStack spacing={8}>
              <Heading
                size="md"
                bgGradient={gradients.ocean}
                bgClip="text"
                fontWeight="extrabold"
              >
                When
              </Heading>
              <HStack spacing={6} display={{ base: "none", md: "flex" }}>
                <Button variant="ghost" fontWeight="medium">Home</Button>
                <Button variant="ghost" fontWeight="medium">Calendar</Button>
                <Button variant="ghost" fontWeight="medium">My Events</Button>
                <Button variant="ghost" fontWeight="medium">Profile</Button>
              </HStack>
            </HStack>

            {/* Right side */}
            <HStack spacing={4}>
              <IconButton
                icon={<FiBell />}
                variant="ghost"
                position="relative"
                aria-label="Notifications"
              >
                {mockCurrentUser.notifications > 0 && (
                  <Badge
                    colorScheme="red"
                    position="absolute"
                    top={1}
                    right={1}
                    borderRadius="full"
                    fontSize="xs"
                  >
                    {mockCurrentUser.notifications}
                  </Badge>
                )}
              </IconButton>
              <Avatar
                size="sm"
                name={mockCurrentUser.name}
                src={mockCurrentUser.avatar}
                cursor="pointer"
              />
            </HStack>
          </Flex>
        </Container>
      </Box>

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
              <Heading size="xl">Welcome back, {mockCurrentUser.name.split(" ")[0]}!</Heading>
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
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <Card bg={cardBg}>
                <CardBody>
                  <Stat>
                    <StatLabel>Events This Month</StatLabel>
                    <StatNumber color={colors.primary}>{mockStats.eventsThisMonth}</StatNumber>
                    <StatHelpText>Active events</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
              <Card bg={cardBg}>
                <CardBody>
                  <Stat>
                    <StatLabel>Upcoming</StatLabel>
                    <StatNumber color={colors.secondary}>{mockStats.upcomingEvents}</StatNumber>
                    <StatHelpText>Next 30 days</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
              <Card bg={cardBg}>
                <CardBody>
                  <Stat>
                    <StatLabel>Pending</StatLabel>
                    <StatNumber color={colors.accent}>{mockStats.pendingInvitations}</StatNumber>
                    <StatHelpText>Need response</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
              <Card bg={cardBg}>
                <CardBody>
                  <Stat>
                    <StatLabel>Friends Available</StatLabel>
                    <StatNumber color={colors.info}>{mockStats.friendsAvailable}</StatNumber>
                    <StatHelpText>This week</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>
          </MotionBox>

          {/* Pending Invitations Section */}
          {mockInvitations.length > 0 && (
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
                      {mockInvitations.length}
                    </Badge>
                  </HStack>
                </Flex>

                <VStack spacing={3} align="stretch">
                  {mockInvitations.map((invitation, index) => (
                    <MotionCard
                      key={invitation.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                      bg={cardBg}
                      borderLeft="4px"
                      borderColor={colors.accent}
                      _hover={{ shadow: "md" }}
                    >
                      <CardBody>
                        <Flex justify="space-between" align="center">
                          <VStack align="start" spacing={2} flex={1}>
                            <HStack>
                              <Icon
                                as={getEventTypeIcon(invitation.type)}
                                color={`${getEventTypeColor(invitation.type)}.500`}
                              />
                              <Heading size="sm">{invitation.title}</Heading>
                              <Badge colorScheme={getEventTypeColor(invitation.type)}>
                                {invitation.type}
                              </Badge>
                            </HStack>
                            <Text fontSize="sm" color="gray.600">
                              {invitation.description}
                            </Text>
                            <HStack spacing={4} fontSize="sm" color="gray.500">
                              <HStack>
                                <Icon as={FiCalendar} />
                                <Text>{formatDate(invitation.date)}</Text>
                              </HStack>
                              <HStack>
                                <Icon as={FiClock} />
                                <Text>{invitation.time}</Text>
                              </HStack>
                              <HStack>
                                <Icon as={FiMapPin} />
                                <Text>{invitation.location}</Text>
                              </HStack>
                            </HStack>
                            <HStack>
                              <Text fontSize="sm" color="gray.600">
                                Invited by <strong>{invitation.host.name}</strong>
                              </Text>
                              <Text fontSize="sm" color="gray.500">
                                • {invitation.participantCount} people invited
                              </Text>
                            </HStack>
                          </VStack>

                          <HStack spacing={2} ml={4}>
                            <Button
                              leftIcon={<FiCheck />}
                              colorScheme="green"
                              size="sm"
                              onClick={() => handleAcceptInvitation(invitation.id)}
                            >
                              Accept
                            </Button>
                            <Button
                              leftIcon={<FiMinus />}
                              colorScheme="yellow"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAcceptInvitation(invitation.id)}
                            >
                              Maybe
                            </Button>
                            <IconButton
                              icon={<FiX />}
                              colorScheme="red"
                              variant="ghost"
                              size="sm"
                              aria-label="Decline"
                              onClick={() => handleDeclineInvitation(invitation.id)}
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
                      transition="all 0.3s"
                    >
                      <CardBody>
                        <VStack align="stretch" spacing={3}>
                          {/* Header */}
                          <Flex justify="space-between" align="start">
                            <HStack>
                              <Icon
                                as={getEventTypeIcon(event.type)}
                                color={`${getEventTypeColor(event.type)}.500`}
                                boxSize={5}
                              />
                              <Badge colorScheme={getEventTypeColor(event.type)}>
                                {event.type}
                              </Badge>
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
                            {event.title}
                          </Heading>

                          {/* Date/Time */}
                          <VStack align="stretch" spacing={2} fontSize="sm">
                            <HStack color="gray.600">
                              <Icon as={FiCalendar} />
                              <Text fontWeight="medium">{formatDate(event.date)}</Text>
                            </HStack>
                            <HStack color="gray.600">
                              <Icon as={FiClock} />
                              <Text>{event.time} - {event.endTime}</Text>
                            </HStack>
                            <HStack color="gray.600">
                              <Icon as={event.isVirtual ? FiVideo : FiMapPin} />
                              <Text noOfLines={1}>{event.location}</Text>
                            </HStack>
                          </VStack>

                          <Divider />

                          {/* Participants */}
                          <Flex justify="space-between" align="center">
                            <AvatarGroup size="sm" max={4}>
                              {event.participants.map((participant) => (
                                <Avatar
                                  key={participant.id}
                                  name={participant.name}
                                  src={participant.avatar}
                                />
                              ))}
                            </AvatarGroup>
                            <Text fontSize="xs" color="gray.500">
                              +{event.rsvps.going - 4} more
                            </Text>
                          </Flex>

                          {/* RSVP Status */}
                          <Badge
                            colorScheme={
                              event.userRsvp === "going" ? "green" :
                              event.userRsvp === "maybe" ? "yellow" :
                              "gray"
                            }
                            fontSize="xs"
                            px={2}
                            py={1}
                            borderRadius="md"
                          >
                            {event.userRsvp === "going" ? "✓ You're going" :
                             event.userRsvp === "maybe" ? "? Maybe" :
                             "Not responded"}
                          </Badge>

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

export default DashboardTemp;

