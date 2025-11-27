import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Input,
  Textarea,
  useColorModeValue,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tag,
  TagLabel,
  TagCloseButton,
  useToast,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUsers,
  FiArrowLeft,
  FiEdit,
  FiShare2,
  FiDownload,
  FiMessageSquare,
  FiCheck,
  FiX,
  FiMinus,
  FiVideo,
  FiExternalLink,
  FiPaperclip,
  FiMoreVertical,
  FiCopy,
  FiMail
} from "react-icons/fi";
import { getEventById, getCommentsByEventId, mockCurrentUser } from "../utils/mockData";
import { colors, gradients } from "../styles/designSystem";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const EventTemp = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [event, setEvent] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [userRsvp, setUserRsvp] = useState(null);
  const [selectedTimeOption, setSelectedTimeOption] = useState(null);
  
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const heroBg = useColorModeValue("white", "gray.800");

  useEffect(() => {
    const eventData = getEventById(eventId);
    if (eventData) {
      setEvent(eventData);
      setUserRsvp(eventData.userRsvp);
      setComments(getCommentsByEventId(eventData.id));
    }
  }, [eventId]);

  if (!event) {
    return (
      <Box minH="100vh" bg={bgColor} pt={8}>
        <Container maxW="container.xl">
          <Text>Event not found</Text>
          <Button mt={4} onClick={() => navigate("/dashboard_temp")}>
            Back to Dashboard
          </Button>
        </Container>
      </Box>
    );
  }

  const handleRsvp = (status) => {
    setUserRsvp(status);
    toast({
      title: status === "going" ? "You're going!" : status === "maybe" ? "Marked as maybe" : "Declined",
      status: status === "going" ? "success" : status === "maybe" ? "info" : "warning",
      duration: 3000,
      isClosable: true
    });
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: comments.length + 1,
        eventId: event.id,
        user: mockCurrentUser,
        text: newComment,
        timestamp: new Date().toISOString(),
        type: "comment"
      };
      setComments([...comments, comment]);
      setNewComment("");
      toast({
        title: "Comment added",
        status: "success",
        duration: 2000,
        isClosable: true
      });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
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

  const getEventTypeColor = (type) => {
    const colorMap = {
      meeting: "blue",
      social: "green",
      birthday: "pink",
      other: "purple"
    };
    return colorMap[type] || "gray";
  };

  const rsvpPercentages = {
    going: (event.rsvps.going / (event.rsvps.going + event.rsvps.maybe + event.rsvps.declined)) * 100,
    maybe: (event.rsvps.maybe / (event.rsvps.going + event.rsvps.maybe + event.rsvps.declined)) * 100,
    declined: (event.rsvps.declined / (event.rsvps.going + event.rsvps.maybe + event.rsvps.declined)) * 100
  };

  return (
    <Box minH="100vh" bg={bgColor}>
      {/* Hero Section */}
      <Box bg={heroBg} borderBottom="1px" borderColor={borderColor}>
        <Container maxW="container.xl" py={8}>
          <VStack align="stretch" spacing={6}>
            {/* Back Button */}
            <Button
              leftIcon={<FiArrowLeft />}
              variant="ghost"
              w="fit-content"
              onClick={() => navigate("/dashboard_temp")}
            >
              Back to Dashboard
            </Button>

            {/* Event Header */}
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <VStack align="start" spacing={4}>
                <HStack>
                  <Badge
                    colorScheme={getEventTypeColor(event.type)}
                    fontSize="md"
                    px={3}
                    py={1}
                    borderRadius="full"
                  >
                    {event.type}
                  </Badge>
                  <Badge
                    colorScheme={event.status === "confirmed" ? "green" : "yellow"}
                    fontSize="md"
                    px={3}
                    py={1}
                    borderRadius="full"
                  >
                    {event.status}
                  </Badge>
                </HStack>

                <Heading size="2xl">{event.title}</Heading>

                <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6} w="full">
                  <HStack spacing={3}>
                    <Icon as={FiCalendar} boxSize={6} color={colors.primary} />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold" fontSize="lg">
                        {formatDate(event.date)}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        Date
                      </Text>
                    </VStack>
                  </HStack>

                  <HStack spacing={3}>
                    <Icon as={FiClock} boxSize={6} color={colors.secondary} />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold" fontSize="lg">
                        {event.time} - {event.endTime}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {event.duration} minutes
                      </Text>
                    </VStack>
                  </HStack>

                  <HStack spacing={3}>
                    <Icon as={event.isVirtual ? FiVideo : FiMapPin} boxSize={6} color={colors.accent} />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold" fontSize="lg" noOfLines={1}>
                        {event.location}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {event.isVirtual ? "Virtual" : "In-person"}
                      </Text>
                    </VStack>
                  </HStack>
                </Grid>

                <HStack spacing={3}>
                  <Avatar size="md" name={event.host.name} src={event.host.avatar} />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" color="gray.600">
                      Hosted by
                    </Text>
                    <Text fontWeight="bold">{event.host.name}</Text>
                  </VStack>
                </HStack>
              </VStack>
            </MotionBox>
          </VStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl" py={8}>
        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>
          {/* Left Column */}
          <VStack align="stretch" spacing={6}>
            {/* RSVP Section */}
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              bg={cardBg}
            >
              <CardHeader>
                <Heading size="md">Your Response</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4}>
                  <HStack spacing={3} w="full">
                    <Button
                      leftIcon={<FiCheck />}
                      colorScheme="green"
                      flex={1}
                      size="lg"
                      variant={userRsvp === "going" ? "solid" : "outline"}
                      onClick={() => handleRsvp("going")}
                    >
                      I'm Going
                    </Button>
                    <Button
                      leftIcon={<FiMinus />}
                      colorScheme="yellow"
                      flex={1}
                      size="lg"
                      variant={userRsvp === "maybe" ? "solid" : "outline"}
                      onClick={() => handleRsvp("maybe")}
                    >
                      Maybe
                    </Button>
                    <Button
                      leftIcon={<FiX />}
                      colorScheme="red"
                      flex={1}
                      size="lg"
                      variant={userRsvp === "declined" ? "solid" : "outline"}
                      onClick={() => handleRsvp("declined")}
                    >
                      Can't Make It
                    </Button>
                  </HStack>

                  <Divider />

                  {/* RSVP Stats */}
                  <VStack w="full" spacing={3}>
                    <HStack w="full" justify="space-between" fontSize="lg" fontWeight="bold">
                      <Text>{event.rsvps.going} going</Text>
                      <Text color="gray.500">{event.rsvps.maybe} maybe</Text>
                      <Text color="gray.400">{event.rsvps.declined} declined</Text>
                    </HStack>
                    
                    <Box w="full" h={3} bg="gray.200" borderRadius="full" overflow="hidden">
                      <Flex h="full">
                        <Box w={`${rsvpPercentages.going}%`} bg="green.500" />
                        <Box w={`${rsvpPercentages.maybe}%`} bg="yellow.400" />
                        <Box w={`${rsvpPercentages.declined}%`} bg="red.400" />
                      </Flex>
                    </Box>
                  </VStack>
                </VStack>
              </CardBody>
            </MotionCard>

            {/* Time Options (if event has multiple options) */}
            {event.timeOptions && (
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                bg={cardBg}
              >
                <CardHeader>
                  <Heading size="md">Vote for Best Time</Heading>
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    Select which time works best for you
                  </Text>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3}>
                    {event.timeOptions.map((option) => {
                      const percentage = (option.availableCount / option.totalParticipants) * 100;
                      const isWinner = percentage === Math.max(...event.timeOptions.map(o => (o.availableCount / o.totalParticipants) * 100));
                      
                      return (
                        <Card
                          key={option.id}
                          w="full"
                          variant="outline"
                          borderWidth={2}
                          borderColor={
                            selectedTimeOption === option.id ? colors.primary :
                            isWinner ? colors.secondary : borderColor
                          }
                          cursor="pointer"
                          onClick={() => setSelectedTimeOption(option.id)}
                          _hover={{ shadow: "md" }}
                          transition="all 0.2s"
                        >
                          <CardBody>
                            <VStack align="stretch" spacing={3}>
                              <Flex justify="space-between" align="center">
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="bold" fontSize="lg">
                                    {formatDate(option.date)}
                                  </Text>
                                  <Text color="gray.600">{option.time}</Text>
                                </VStack>
                                {isWinner && (
                                  <Badge colorScheme="green" fontSize="sm">
                                    Most Popular
                                  </Badge>
                                )}
                              </Flex>

                              <Box>
                                <Flex justify="space-between" mb={2} fontSize="sm">
                                  <Text color="gray.600">
                                    {option.availableCount} out of {option.totalParticipants} available
                                  </Text>
                                  <Text fontWeight="bold">{Math.round(percentage)}%</Text>
                                </Flex>
                                <Progress value={percentage} colorScheme={isWinner ? "green" : "blue"} />
                              </Box>

                              <AvatarGroup size="sm" max={6}>
                                {option.participants.map((participant) => (
                                  <Avatar
                                    key={participant.id}
                                    name={participant.name}
                                    src={participant.avatar}
                                  />
                                ))}
                              </AvatarGroup>
                            </VStack>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </VStack>
                </CardBody>
              </MotionCard>
            )}

            {/* Event Details */}
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              bg={cardBg}
            >
              <CardHeader>
                <Heading size="md">Event Details</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  {event.description && (
                    <>
                      <Box>
                        <Text fontWeight="bold" mb={2}>Description</Text>
                        <Text color="gray.700">{event.description}</Text>
                      </Box>
                      <Divider />
                    </>
                  )}

                  <SimpleGrid columns={2} spacing={4}>
                    <Box>
                      <Text fontWeight="bold" mb={1}>Duration</Text>
                      <Text color="gray.700">{event.duration} minutes</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold" mb={1}>Type</Text>
                      <Text color="gray.700" textTransform="capitalize">{event.type}</Text>
                    </Box>
                  </SimpleGrid>

                  {event.locationLink && (
                    <>
                      <Divider />
                      <Box>
                        <Text fontWeight="bold" mb={2}>Join Link</Text>
                        <Link href={event.locationLink} isExternal>
                          <Button
                            leftIcon={<FiExternalLink />}
                            colorScheme="blue"
                            variant="outline"
                            w="full"
                          >
                            {event.isVirtual ? "Join Video Call" : "View Location"}
                          </Button>
                        </Link>
                      </Box>
                    </>
                  )}

                  {event.attachments && event.attachments.length > 0 && (
                    <>
                      <Divider />
                      <Box>
                        <Text fontWeight="bold" mb={2}>Attachments</Text>
                        <VStack align="stretch" spacing={2}>
                          {event.attachments.map((file) => (
                            <HStack
                              key={file.id}
                              p={2}
                              borderWidth={1}
                              borderRadius="md"
                              justify="space-between"
                            >
                              <HStack>
                                <Icon as={FiPaperclip} />
                                <VStack align="start" spacing={0}>
                                  <Text fontSize="sm" fontWeight="medium">{file.name}</Text>
                                  <Text fontSize="xs" color="gray.500">{file.size}</Text>
                                </VStack>
                              </HStack>
                              <IconButton
                                icon={<FiDownload />}
                                size="sm"
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
              </CardBody>
            </MotionCard>

            {/* Comments Section */}
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              bg={cardBg}
            >
              <CardHeader>
                <Heading size="md">Discussion</Heading>
                <Text fontSize="sm" color="gray.600" mt={1}>
                  {comments.length} comments
                </Text>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  {/* Add Comment */}
                  <HStack align="start">
                    <Avatar size="sm" name={mockCurrentUser.name} src={mockCurrentUser.avatar} />
                    <VStack flex={1} align="stretch" spacing={2}>
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        size="sm"
                      />
                      <Button
                        colorScheme="blue"
                        size="sm"
                        w="fit-content"
                        onClick={handleAddComment}
                        isDisabled={!newComment.trim()}
                      >
                        Post Comment
                      </Button>
                    </VStack>
                  </HStack>

                  <Divider />

                  {/* Comments List */}
                  <VStack align="stretch" spacing={4}>
                    {comments.map((comment) => (
                      <HStack key={comment.id} align="start">
                        <Avatar size="sm" name={comment.user.name} src={comment.user.avatar} />
                        <VStack flex={1} align="stretch" spacing={1}>
                          <HStack justify="space-between">
                            <Text fontWeight="bold" fontSize="sm">{comment.user.name}</Text>
                            <Text fontSize="xs" color="gray.500">
                              {formatTimestamp(comment.timestamp)}
                            </Text>
                          </HStack>
                          <Text fontSize="sm" color="gray.700">{comment.text}</Text>
                        </VStack>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </CardBody>
            </MotionCard>
          </VStack>

          {/* Right Column - Sidebar */}
          <VStack align="stretch" spacing={6}>
            {/* Actions */}
            <MotionCard
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              bg={cardBg}
            >
              <CardHeader>
                <Heading size="sm">Actions</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={2}>
                  <Button
                    leftIcon={<FiCopy />}
                    w="full"
                    variant="outline"
                    onClick={handleCopyLink}
                  >
                    Copy Link
                  </Button>
                  <Button leftIcon={<FiMail />} w="full" variant="outline">
                    Email Guests
                  </Button>
                  <Button leftIcon={<FiDownload />} w="full" variant="outline">
                    Add to Calendar
                  </Button>
                  <Button leftIcon={<FiEdit />} w="full" variant="outline">
                    Edit Event
                  </Button>
                </VStack>
              </CardBody>
            </MotionCard>

            {/* Participants */}
            <MotionCard
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              bg={cardBg}
            >
              <CardHeader>
                <Heading size="sm">Participants ({event.participants.length})</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  {event.participants.slice(0, 8).map((participant) => (
                    <HStack key={participant.id}>
                      <Avatar size="sm" name={participant.name} src={participant.avatar} />
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontSize="sm" fontWeight="medium">{participant.name}</Text>
                        <Text fontSize="xs" color="gray.500">{participant.email}</Text>
                      </VStack>
                      <Badge colorScheme="green" fontSize="xs">Going</Badge>
                    </HStack>
                  ))}
                  {event.participants.length > 8 && (
                    <Button size="sm" variant="link" colorScheme="blue">
                      Show all {event.participants.length} participants
                    </Button>
                  )}
                </VStack>
              </CardBody>
            </MotionCard>

            {/* Event Info */}
            <MotionCard
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              bg={cardBg}
            >
              <CardHeader>
                <Heading size="sm">Event Info</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={3} fontSize="sm">
                  <HStack justify="space-between">
                    <Text color="gray.600">Created</Text>
                    <Text fontWeight="medium">
                      {new Date(event.createdAt).toLocaleDateString()}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color="gray.600">Last Updated</Text>
                    <Text fontWeight="medium">
                      {new Date(event.updatedAt).toLocaleDateString()}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color="gray.600">Event ID</Text>
                    <Text fontFamily="mono" fontSize="xs">{event.uid}</Text>
                  </HStack>
                </VStack>
              </CardBody>
            </MotionCard>
          </VStack>
        </Grid>
      </Container>
    </Box>
  );
};

export default EventTemp;

