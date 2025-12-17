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
  Badge,
  Card,
  CardBody,
  Icon,
  IconButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Switch,
  useColorModeValue,
  Progress,
  Divider,
  Tag,
  TagLabel,
  TagCloseButton,
  useToast,
  RadioGroup,
  Radio,
  Stack,
  Wrap,
  WrapItem,
  Spinner
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUsers,
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiVideo,
  FiX,
  FiEdit,
  FiMail,
  FiSave,
  FiPlus,
  FiSearch
} from "react-icons/fi";
import { mockUsers, mockEvents } from "../utils/mockData";
import { colors, gradients } from "../styles/designSystem";
import { eventsAPI, usersAPI } from "../services/apiService";
import { useApiCall } from "../hooks/useApiCall";
import { useAuth } from "../hooks/useAuth";

const MotionBox = motion(Box);

const EventCreate = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { execute, loading } = useApiCall();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Step 1: Basics
    title: "",
    type: "meeting",
    description: "",

    // Step 2: When
    schedulingMode: "multiple", // DEFAULT TO MULTIPLE - "single" or "multiple"
    // For single mode
    date: "",
    time: "",
    endTime: "",
    // For multiple mode (range)
    startDate: "",
    endDate: "",
    earliestHour: "9",
    latestHour: "17",
    duration: "60",
    timeOptions: [],

    // Step 3: Who
    guests: [],
    guestPermissions: {
      canInviteOthers: false,
      canSeeGuestList: true
    },

    // Step 4: Where
    isVirtual: false,
    location: "",
    videoLink: "",
    noLocation: false
  });

  const [guestSearchQuery, setGuestSearchQuery] = useState("");
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const steps = [
    { id: 0, name: "Basics", icon: FiEdit },
    { id: 1, name: "When", icon: FiCalendar },
    { id: 2, name: "Who", icon: FiUsers },
    { id: 3, name: "Where", icon: FiMapPin },
    { id: 4, name: "Review", icon: FiCheck }
  ];

  const eventTypes = [
    { value: "meeting", label: "Meeting", color: "blue", emoji: "💼" },
    { value: "social", label: "Social", color: "green", emoji: "🎉" },
    { value: "birthday", label: "Birthday", color: "pink", emoji: "🎂" },
    { value: "other", label: "Other", color: "purple", emoji: "📅" }
  ];

  const durationOptions = [
    { value: "15", label: "15 minutes" },
    { value: "30", label: "30 minutes" },
    { value: "60", label: "1 hour" },
    { value: "90", label: "1.5 hours" },
    { value: "120", label: "2 hours" },
    { value: "180", label: "3 hours" },
    { value: "custom", label: "Custom" }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearchUsers = async () => {
    if (!guestSearchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await usersAPI.search(guestSearchQuery);
      // Filter out already added guests
      const filtered = results.filter(u => !formData.guests.find(g => g.id === u.id));
      setSearchResults(filtered);
    } catch (error) {
      console.error("Search failed:", error);
      toast({
        title: "Search failed",
        status: "error",
        duration: 2000
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddGuest = (user) => {
    if (!formData.guests.find(g => g.id === user.id)) {
      setFormData(prev => ({
        ...prev,
        guests: [...prev.guests, user]
      }));
      setGuestSearchQuery("");
      setSearchResults([]); // Clear search results
    }
  };

  const handleRemoveGuest = (userId) => {
    setFormData(prev => ({
      ...prev,
      guests: prev.guests.filter(g => g.id !== userId)
    }));
  };

  const handleNext = () => {
    // Validation for each step
    if (currentStep === 0 && !formData.title) {
      toast({
        title: "Event title is required",
        status: "error",
        duration: 3000,
        isClosable: true
      });
      return;
    }

    if (currentStep === 1) {
      if (formData.schedulingMode === "single" && (!formData.date || !formData.time)) {
        toast({
          title: "Please select date and time",
          status: "error",
          duration: 3000,
          isClosable: true
        });
        return;
      }
      if (formData.schedulingMode === "multiple") {
        if (!formData.startDate || !formData.endDate) {
          toast({
            title: "Please select a date range",
            status: "error",
            duration: 3000,
            isClosable: true
          });
          return;
        }
        if (formData.startDate > formData.endDate) {
          toast({
            title: "Start date must be before end date",
            status: "error",
            duration: 3000,
            isClosable: true
          });
          return;
        }
        if (parseInt(formData.earliestHour) >= parseInt(formData.latestHour)) {
          toast({
            title: "Earliest time must be before latest time",
            status: "error",
            duration: 3000,
            isClosable: true
          });
          return;
        }
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSaveDraft = () => {
    toast({
      title: "Draft saved",
      description: "Your event has been saved as a draft",
      status: "success",
      duration: 3000,
      isClosable: true
    });
  };

  const handleSubmit = async () => {
    try {
      // Format helpers
      const formatDateForAPI = (dateString) => {
        if (!dateString) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      const formatTimeForAPI = (timeString) => {
        if (!timeString) return null;
        // If time is "09:00", convert to "09:00:00"
        if (timeString.length === 5) return `${timeString}:00`;
        // If it's just an hour number like "9" or 9
        if (!isNaN(timeString) && timeString.toString().length <= 2) {
          const hour = parseInt(timeString);
          return `${hour.toString().padStart(2, '0')}:00:00`;
        }
        return timeString;
      };

      // 1. Create Event with backend field names
      const eventPayload = {
        name: formData.title,
        description: formData.description,
        event_type: formData.type,
        status: 'planning',
        location: formData.location,
        is_virtual: formData.isVirtual,
        google_meet_link: formData.videoLink,
        duration_minutes: parseInt(formData.duration),
      };

      // Add range fields based on mode
      if (formData.schedulingMode === "multiple") {
        eventPayload.earliest_date = formatDateForAPI(formData.startDate);
        eventPayload.latest_date = formatDateForAPI(formData.endDate);
        eventPayload.earliest_hour = formatTimeForAPI(formData.earliestHour);
        eventPayload.latest_hour = formatTimeForAPI(formData.latestHour);
      } else {
        // For single mode, use date as both earliest and latest
        eventPayload.earliest_date = formatDateForAPI(formData.date);
        eventPayload.latest_date = formatDateForAPI(formData.date);
        eventPayload.earliest_hour = formatTimeForAPI(formData.time);

        // Calculate end time
        const startHour = parseInt(formData.time.split(':')[0]);
        const durationHours = Math.ceil(parseInt(formData.duration) / 60);
        const endHour = startHour + durationHours;
        eventPayload.latest_hour = formatTimeForAPI(`${endHour}:00`);
      }

      console.log('Sending event payload:', eventPayload);
      const createdEvent = await execute(() => eventsAPI.create(eventPayload));

      if (!createdEvent) throw new Error("Failed to create event");

      console.log('Event created successfully:', createdEvent);

      // 2. Send invitations if guests were added
      if (formData.guests && formData.guests.length > 0) {
        console.log('Sending invitations to:', formData.guests);

        try {
          // Extract emails from guest objects - handle both email and email_address fields
          const guestEmails = formData.guests.map(guest => {
            if (typeof guest === 'object') {
              return guest.email_address || guest.email;
            }
            return guest;
          }).filter(email => email); // Filter out any undefined/null values

          console.log('Extracted emails:', guestEmails);

          if (guestEmails.length > 0) {
            await execute(() => eventsAPI.sendInvitations(createdEvent.uid, guestEmails), {
              showSuccessToast: false
            });
            console.log('Invitations sent successfully');
          }
        } catch (inviteError) {
          console.error('Failed to send invitations:', inviteError);
          // Don't fail - event already created
          toast({
            title: 'Event created but invitations failed',
            description: 'You can invite people from the event page',
            status: 'warning',
            duration: 5000,
            isClosable: true
          });
        }
      }

      toast({
        title: "Event created!",
        description: formData.guests.length > 0
          ? `Invitations sent to ${formData.guests.length} people`
          : "Redirecting to event page...",
        status: "success",
        duration: 2000,
      });

      // Navigate to new event
      setTimeout(() => {
        navigate(`/events/${createdEvent.uid}`);
      }, 1000);

    } catch (error) {
      console.error("Creation failed:", error);
      toast({
        title: "Failed to create event",
        description: error.message || "Please try again.",
        status: "error",
        duration: 3000,
      });
    }
  };

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(guestSearchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(guestSearchQuery.toLowerCase())
  );

  const renderBasicsStep = () => (
    <VStack spacing={6} align="stretch">
      <FormControl isRequired>
        <FormLabel fontSize="lg" fontWeight="bold">Event Title</FormLabel>
        <Input
          size="lg"
          placeholder="e.g. Team Standup, Coffee Chat, Birthday Party"
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          fontSize="lg"
        />
      </FormControl>

      <FormControl isRequired>
        <FormLabel fontSize="lg" fontWeight="bold">Event Type</FormLabel>
        <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={3}>
          {eventTypes.map((type) => (
            <Card
              key={type.value}
              variant="outline"
              cursor="pointer"
              borderWidth={2}
              borderColor={formData.type === type.value ? `${type.color}.500` : borderColor}
              bg={formData.type === type.value ? `${type.color}.50` : "transparent"}
              onClick={() => handleInputChange("type", type.value)}
              _hover={{ shadow: "md" }}
              transition="all 0.2s"
            >
              <CardBody textAlign="center">
                <VStack spacing={2}>
                  <Text fontSize="3xl">{type.emoji}</Text>
                  <Text fontWeight="bold">{type.label}</Text>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </Grid>
      </FormControl>

      <FormControl>
        <FormLabel fontSize="lg" fontWeight="bold">
          Description <Text as="span" fontWeight="normal" color="gray.500">(Optional)</Text>
        </FormLabel>
        <Textarea
          placeholder="Add any details or context about this event..."
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          rows={5}
          resize="vertical"
        />
      </FormControl>
    </VStack>
  );

  const renderWhenStep = () => (
    <VStack spacing={6} align="stretch">
      <FormControl>
        <FormLabel fontSize="lg" fontWeight="bold">How do you want to schedule this?</FormLabel>
        <RadioGroup
          value={formData.schedulingMode}
          onChange={(value) => handleInputChange("schedulingMode", value)}
        >
          <Stack spacing={4}>
            <Card
              variant="outline"
              cursor="pointer"
              borderWidth={2}
              borderColor={formData.schedulingMode === "single" ? colors.primary : borderColor}
              bg={formData.schedulingMode === "single" ? "purple.50" : "transparent"}
              onClick={() => handleInputChange("schedulingMode", "single")}
            >
              <CardBody>
                <HStack spacing={4}>
                  <Radio value="single" size="lg" />
                  <VStack align="start" spacing={1} flex={1}>
                    <Text fontWeight="bold">Single Time</Text>
                    <Text fontSize="sm" color="gray.600">I know when the event should be</Text>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>

            <Card
              variant="outline"
              cursor="pointer"
              borderWidth={2}
              borderColor={formData.schedulingMode === "multiple" ? colors.primary : borderColor}
              bg={formData.schedulingMode === "multiple" ? "purple.50" : "transparent"}
              onClick={() => handleInputChange("schedulingMode", "multiple")}
            >
              <CardBody>
                <HStack spacing={4}>
                  <Radio value="multiple" size="lg" />
                  <VStack align="start" spacing={1} flex={1}>
                    <Text fontWeight="bold">Find Best Time</Text>
                    <Text fontSize="sm" color="gray.600">Let guests vote on multiple time options</Text>
                  </VStack>
                  <Badge colorScheme="purple">Recommended</Badge>
                </HStack>
              </CardBody>
            </Card>
          </Stack>
        </RadioGroup>
      </FormControl>

      {formData.schedulingMode === "single" && (
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
          <FormControl isRequired>
            <FormLabel>Date</FormLabel>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Start Time</FormLabel>
            <Input
              type="time"
              value={formData.time}
              onChange={(e) => handleInputChange("time", e.target.value)}
            />
          </FormControl>
        </Grid>
      )}

      {formData.schedulingMode === "multiple" && (
        <Card variant="outline" bg="blue.50">
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold">Select Date Range</Text>
              <Text fontSize="sm" color="gray.600">Choose the range of dates for guests to vote on.</Text>

              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                <FormControl isRequired>
                  <FormLabel>Start Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange("startDate", e.target.value)}
                    bg="white"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>End Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange("endDate", e.target.value)}
                    bg="white"
                  />
                </FormControl>
              </Grid>

              <Divider borderColor="blue.200" />

              <Text fontWeight="bold">Daily Time Range</Text>
              <Text fontSize="sm" color="gray.600">What hours are available each day?</Text>

              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                <FormControl isRequired>
                  <FormLabel>Earliest Start Time</FormLabel>
                  <Select
                    value={formData.earliestHour}
                    onChange={(e) => handleInputChange("earliestHour", e.target.value)}
                    bg="white"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i.toString()}>
                        {i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Latest End Time</FormLabel>
                  <Select
                    value={formData.latestHour}
                    onChange={(e) => handleInputChange("latestHour", e.target.value)}
                    bg="white"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i.toString()}>
                        {i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </VStack>
          </CardBody>
        </Card>
      )}

      <FormControl isRequired>
        <FormLabel fontSize="lg" fontWeight="bold">Duration</FormLabel>
        <Select
          value={formData.duration}
          onChange={(e) => handleInputChange("duration", e.target.value)}
          size="lg"
        >
          {durationOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </FormControl>
    </VStack>
  );

  const renderWhoStep = () => (
    <VStack spacing={6} align="stretch">
      <FormControl>
        <FormLabel fontSize="lg" fontWeight="bold">Add Guests</FormLabel>
        <HStack mb={3}>
          <Input
            placeholder="Search by email..."
            value={guestSearchQuery}
            onChange={(e) => setGuestSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
          />
          <IconButton
            icon={isSearching ? <Spinner size="sm" /> : <FiSearch />}
            onClick={handleSearchUsers}
            aria-label="Search users"
          />
        </HStack>
        {searchResults.length > 0 && (
          <Card variant="outline" maxH="200px" overflowY="auto" mb={3}>
            <CardBody p={2}>
              <VStack align="stretch" spacing={1}>
                {searchResults.map((user) => (
                  <HStack
                    key={user.id}
                    p={2}
                    cursor="pointer"
                    _hover={{ bg: "gray.50" }}
                    borderRadius="md"
                    onClick={() => handleAddGuest(user)}
                  >
                    <Avatar size="sm" name={user.full_name} src={user.avatar_url} />
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontSize="sm" fontWeight="medium">{user.full_name || "User"}</Text>
                      <Text fontSize="xs" color="gray.500">{user.email_address}</Text>
                    </VStack>
                    <Icon as={FiPlus} color="gray.400" />
                  </HStack>
                ))}
              </VStack>
            </CardBody>
          </Card>
        )}
      </FormControl>

      <FormControl>
        <FormLabel fontSize="lg" fontWeight="bold">Invited Guests ({formData.guests.length})</FormLabel>
        {formData.guests.length > 0 ? (
          <Wrap spacing={2}>
            {formData.guests.map((guest) => (
              <WrapItem key={guest.id}>
                <Tag size="lg" colorScheme="blue" borderRadius="full">
                  <Avatar size="xs" name={guest.name} src={guest.avatar} ml={-2} mr={2} />
                  <TagLabel>{guest.name || guest.full_name || guest.email}</TagLabel>
                  <TagCloseButton onClick={() => handleRemoveGuest(guest.id)} />
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        ) : (
          <Card variant="outline">
            <CardBody textAlign="center" py={8}>
              <Icon as={FiUsers} boxSize={12} color="gray.300" mb={2} />
              <Text color="gray.500">No guests added yet</Text>
              <Text fontSize="sm" color="gray.400">Search above to add people to this event</Text>
            </CardBody>
          </Card>
        )}
      </FormControl>

      <Divider />

      <FormControl>
        <FormLabel fontSize="lg" fontWeight="bold">Guest Permissions</FormLabel>
        <VStack align="stretch" spacing={3}>
          <HStack justify="space-between">
            <VStack align="start" spacing={0}>
              <Text fontWeight="medium">Allow guests to invite others</Text>
              <Text fontSize="sm" color="gray.600">Guests can add more people to the event</Text>
            </VStack>
            <Switch
              isChecked={formData.guestPermissions.canInviteOthers}
              onChange={(e) => handleInputChange("guestPermissions", { ...formData.guestPermissions, canInviteOthers: e.target.checked })}
              colorScheme="purple"
            />
          </HStack>
          <HStack justify="space-between">
            <VStack align="start" spacing={0}>
              <Text fontWeight="medium">Show guest list</Text>
              <Text fontSize="sm" color="gray.600">All guests can see who else is invited</Text>
            </VStack>
            <Switch
              isChecked={formData.guestPermissions.canSeeGuestList}
              onChange={(e) => handleInputChange("guestPermissions", { ...formData.guestPermissions, canSeeGuestList: e.target.checked })}
              colorScheme="purple"
            />
          </HStack>
        </VStack>
      </FormControl>
    </VStack>
  );

  const renderWhereStep = () => (
    <VStack spacing={6} align="stretch">
      <FormControl>
        <HStack justify="space-between" mb={3}>
          <FormLabel fontSize="lg" fontWeight="bold" mb={0}>Virtual Event</FormLabel>
          <Switch
            isChecked={formData.isVirtual}
            onChange={(e) => {
              handleInputChange("isVirtual", e.target.checked);
              if (e.target.checked) {
                handleInputChange("noLocation", false);
              }
            }}
            colorScheme="purple"
            size="lg"
          />
        </HStack>
        <Text fontSize="sm" color="gray.600">Toggle if this is an online meeting</Text>
      </FormControl>

      {formData.isVirtual ? (
        <FormControl>
          <FormLabel>Video Call Link</FormLabel>
          <Input
            placeholder="https://zoom.us/j/..."
            value={formData.videoLink}
            onChange={(e) => handleInputChange("videoLink", e.target.value)}
            leftIcon={<Icon as={FiVideo} />}
          />
          <Text fontSize="sm" color="gray.500" mt={2}>Add a Zoom, Google Meet, or Teams link</Text>
        </FormControl>
      ) : (
        <>
          <FormControl>
            <FormLabel>Location</FormLabel>
            <Input
              placeholder="Enter address or place name..."
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              isDisabled={formData.noLocation}
            />
            <Text fontSize="sm" color="gray.500" mt={2}>We'll show this location to all guests</Text>
          </FormControl>

          <FormControl>
            <HStack>
              <Switch
                isChecked={formData.noLocation}
                onChange={(e) => {
                  handleInputChange("noLocation", e.target.checked);
                  if (e.target.checked) {
                    handleInputChange("location", "");
                  }
                }}
                colorScheme="purple"
              />
              <Text>No location needed</Text>
            </HStack>
          </FormControl>

          {formData.location && !formData.noLocation && (
            <Card variant="outline" bg="blue.50">
              <CardBody>
                <VStack spacing={2}>
                  <Icon as={FiMapPin} boxSize={8} color="blue.500" />
                  <Text fontWeight="bold">{formData.location}</Text>
                  <Text fontSize="sm" color="gray.600" textAlign="center">Map preview would appear here</Text>
                </VStack>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </VStack>
  );

  const renderReviewStep = () => (
    <VStack spacing={6} align="stretch">
      <Heading size="md">Review Your Event</Heading>
      <Text color="gray.600">Please review all details before sending invitations</Text>

      <Card variant="outline">
        <CardBody>
          <VStack align="stretch" spacing={4}>
            <HStack justify="space-between">
              <Text fontWeight="bold">Event Title</Text>
              <IconButton icon={<FiEdit />} size="sm" variant="ghost" onClick={() => setCurrentStep(0)} aria-label="Edit" />
            </HStack>
            <Heading size="lg">{formData.title || "Untitled Event"}</Heading>
            <Badge w="fit-content" colorScheme={eventTypes.find(t => t.value === formData.type)?.color}>
              {eventTypes.find(t => t.value === formData.type)?.emoji} {formData.type}
            </Badge>
            {formData.description && <Text color="gray.700">{formData.description}</Text>}
          </VStack>
        </CardBody>
      </Card>

      <Card variant="outline">
        <CardBody>
          <HStack justify="space-between" mb={4}>
            <Text fontWeight="bold">When</Text>
            <IconButton icon={<FiEdit />} size="sm" variant="ghost" onClick={() => setCurrentStep(1)} aria-label="Edit" />
          </HStack>
          {formData.schedulingMode === "single" ? (
            <VStack align="start" spacing={2}>
              <HStack>
                <Icon as={FiCalendar} color={colors.primary} />
                <Text>{formData.date || "No date selected"}</Text>
              </HStack>
              <HStack>
                <Icon as={FiClock} color={colors.secondary} />
                <Text>{formData.time || "No time selected"}</Text>
              </HStack>
              <Text fontSize="sm" color="gray.600">Duration: {formData.duration} minutes</Text>
            </VStack>
          ) : (
            <VStack align="start" spacing={2}>
              <Text>Multiple time options:</Text>
              <Text fontWeight="medium">Range: {formData.startDate} to {formData.endDate}</Text>
              <Text fontSize="sm" color="gray.600">Daily: {formData.earliestHour}:00 - {formData.latestHour}:00</Text>
              <Text fontSize="sm" color="gray.600">Duration: {formData.duration} minutes</Text>
            </VStack>
          )}
        </CardBody>
      </Card>

      <Card variant="outline">
        <CardBody>
          <HStack justify="space-between" mb={4}>
            <Text fontWeight="bold">Guests ({formData.guests.length})</Text>
            <IconButton icon={<FiEdit />} size="sm" variant="ghost" onClick={() => setCurrentStep(2)} aria-label="Edit" />
          </HStack>
          {formData.guests.length > 0 ? (
            <Wrap spacing={2}>
              {formData.guests.map((guest) => (
                <WrapItem key={guest.id}>
                  <HStack>
                    <Avatar size="sm" name={guest.name} src={guest.avatar} />
                    <Text fontSize="sm">{guest.name}</Text>
                  </HStack>
                </WrapItem>
              ))}
            </Wrap>
          ) : (
            <Text color="gray.500">No guests added</Text>
          )}
        </CardBody>
      </Card>

      <Card variant="outline">
        <CardBody>
          <HStack justify="space-between" mb={4}>
            <Text fontWeight="bold">Location</Text>
            <IconButton icon={<FiEdit />} size="sm" variant="ghost" onClick={() => setCurrentStep(3)} aria-label="Edit" />
          </HStack>
          <HStack>
            <Icon as={formData.isVirtual ? FiVideo : FiMapPin} color={colors.primary} />
            <Text>
              {formData.isVirtual ? (formData.videoLink || "Virtual Event") : (formData.location || "No location specified")}
            </Text>
          </HStack>
        </CardBody>
      </Card>

      <Card bg="purple.50" variant="outline" borderColor="purple.200">
        <CardBody>
          <VStack spacing={3}>
            <Icon as={FiMail} boxSize={8} color={colors.primary} />
            <Text fontWeight="bold" textAlign="center">
              Ready to send invitations?
            </Text>
            <Text fontSize="sm" color="gray.600" textAlign="center">
              All {formData.guests.length} guest{formData.guests.length !== 1 ? "s" : ""} will receive an email invitation with event details
            </Text>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="container.lg" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Heading size="lg">Create New Event</Heading>
              <Text color="gray.600">
                Step {currentStep + 1} of {steps.length}: {steps[currentStep].name}
              </Text>
            </VStack>
            <Button
              leftIcon={<FiSave />}
              variant="outline"
              onClick={handleSaveDraft}
            >
              Save Draft
            </Button>
          </Flex>

          {/* Progress Bar */}
          <Card bg={cardBg}>
            <CardBody>
              <VStack spacing={4}>
                <Progress
                  value={progressPercentage}
                  w="full"
                  colorScheme="purple"
                  borderRadius="full"
                  size="sm"
                />
                <HStack w="full" justify="space-between" flexWrap="wrap">
                  {steps.map((step, index) => (
                    <VStack
                      key={step.id}
                      spacing={1}
                      flex={1}
                      minW="80px"
                      opacity={index <= currentStep ? 1 : 0.5}
                    >
                      <Icon
                        as={step.icon}
                        boxSize={6}
                        color={index < currentStep ? colors.secondary : index === currentStep ? colors.primary : "gray.400"}
                      />
                      <Text fontSize="xs" fontWeight="medium" textAlign="center">
                        {step.name}
                      </Text>
                      {index < currentStep && (
                        <Icon as={FiCheck} color={colors.secondary} boxSize={4} />
                      )}
                    </VStack>
                  ))}
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Form Content */}
          <Card bg={cardBg} minH="500px">
            <CardBody>
              <MotionBox
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStep === 0 && renderBasicsStep()}
                {currentStep === 1 && renderWhenStep()}
                {currentStep === 2 && renderWhoStep()}
                {currentStep === 3 && renderWhereStep()}
                {currentStep === 4 && renderReviewStep()}
              </MotionBox>
            </CardBody>
          </Card>

          {/* Navigation Buttons */}
          <Flex justify="space-between">
            <Button
              leftIcon={<FiArrowLeft />}
              variant="outline"
              onClick={handleBack}
              isDisabled={currentStep === 0}
              size="lg"
            >
              Back
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                rightIcon={<FiArrowRight />}
                colorScheme="purple"
                onClick={handleNext}
                size="lg"
              >
                Next
              </Button>
            ) : (
              <Button
                rightIcon={<FiCheck />}
                colorScheme="green"
                onClick={handleSubmit}
                size="lg"
                px={8}
              >
                Send Invitations
              </Button>
            )}
          </Flex>
        </VStack>
      </Container >
    </Box >
  );
};

export default EventCreate;

