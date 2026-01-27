import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  Card,
  CardBody,
  useColorModeValue,
  useToast
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FiEdit, FiCalendar, FiUsers, FiMapPin, FiCheck, FiSave } from "react-icons/fi";
import { eventsAPI, usersAPI } from "../services/apiService";
import { useApiCall } from "../hooks/useApiCall";
import { useAuth } from "../hooks/useAuth";
import {
  EventBasicsForm,
  EventSchedulingForm,
  GuestManagementForm,
  LocationForm,
  EventReviewCard
} from "../components/event/forms";
import StepProgressIndicator from "../components/common/StepProgressIndicator";
import FormStepNavigation from "../components/common/FormStepNavigation";

const MotionBox = motion(Box);

const EventCreate = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { execute, loading } = useApiCall();

  // Capture user timezone for UTC conversion
  const [userTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);

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
      console.log("[EventCreate] Starting event creation...");
      console.log("[EventCreate] User timezone:", userTimezone);
      console.log("[EventCreate] Form data:", formData);

      // Helper: Convert local date + time to UTC ISO string
      const dateTimeToUTC = (dateStr, timeStr) => {
        if (!dateStr || timeStr === null || timeStr === undefined) {
          console.warn("[EventCreate] dateTimeToUTC called with missing data:", { dateStr, timeStr });
          return null;
        }

        // Handle hour-only format (e.g., "9" or 9)
        let timeFormatted = timeStr;
        if (!isNaN(timeStr) && timeStr.toString().length <= 2) {
          const hour = parseInt(timeStr);
          timeFormatted = `${hour.toString().padStart(2, '0')}:00`;
        } else if (typeof timeStr === 'string' && timeStr.length === 5) {
          // Already in HH:mm format, add :00 for seconds
          timeFormatted = `${timeStr}:00`;
        } else if (typeof timeStr === 'string' && timeStr.length >= 8) {
          // Already has seconds (HH:mm:ss)
          timeFormatted = timeStr;
        } else {
          // Default to 00:00:00 if format is unexpected
          timeFormatted = "00:00:00";
          console.warn("[EventCreate] Unexpected time format:", timeStr);
        }

        // Create local datetime string
        const localDatetimeStr = `${dateStr}T${timeFormatted}`;
        console.log(`[EventCreate] Converting local datetime: ${localDatetimeStr}`);

        // Create Date object (browser interprets as local time)
        const localDate = new Date(localDatetimeStr);

        // Validate date is valid
        if (isNaN(localDate.getTime())) {
          console.error("[EventCreate] Invalid date created:", localDatetimeStr);
          return null;
        }

        // Convert to UTC ISO string
        const utcISO = localDate.toISOString();
        console.log(`[EventCreate] Converted to UTC: ${utcISO}`);

        return utcISO;
      };

      // 1. Create Event payload with new UTC format
      const eventPayload = {
        name: formData.title,
        description: formData.description,
        event_type: formData.type,
        status: 'planning',
        location: formData.location,
        video_call_link: formData.videoLink,
        duration_minutes: parseInt(formData.duration),
        coordinator_timezone: userTimezone, // Include user's timezone
      };

      // 2. Add datetime fields based on mode
      if (formData.schedulingMode === "multiple") {
        // Convert local date + time to UTC timestamps
        const earliestUTC = dateTimeToUTC(formData.startDate, formData.earliestHour);
        const latestUTC = dateTimeToUTC(formData.endDate, formData.latestHour);

        console.log("[EventCreate] Multiple mode - UTC conversion:");
        console.log("  Earliest:", formData.startDate, formData.earliestHour, "->", earliestUTC);
        console.log("  Latest:", formData.endDate, formData.latestHour, "->", latestUTC);

        // NEW FORMAT: UTC timestamps
        eventPayload.earliest_datetime_utc = earliestUTC;
        eventPayload.latest_datetime_utc = latestUTC;
      } else {
        // Single mode
        const startUTC = dateTimeToUTC(formData.date, formData.time);

        // Calculate end time in UTC
        const startDate = new Date(startUTC);
        const endDate = new Date(startDate.getTime() + parseInt(formData.duration) * 60000);
        const endUTC = endDate.toISOString();

        console.log("[EventCreate] Single mode - UTC conversion:");
        console.log("  Start:", formData.date, formData.time, "->", startUTC);
        console.log("  End (calculated):", endUTC);

        // NEW FORMAT: UTC timestamps
        eventPayload.earliest_datetime_utc = startUTC;
        eventPayload.latest_datetime_utc = endUTC;
      }

      console.log("[EventCreate] Final payload:", eventPayload);

      // Validate UTC fields are present
      if (!eventPayload.earliest_datetime_utc || !eventPayload.latest_datetime_utc) {
        console.error("[EventCreate] ERROR: UTC fields missing from payload!");
        console.error("  earliest_datetime_utc:", eventPayload.earliest_datetime_utc);
        console.error("  latest_datetime_utc:", eventPayload.latest_datetime_utc);
        throw new Error("Failed to convert datetime to UTC format");
      }

      if (!eventPayload.coordinator_timezone) {
        console.error("[EventCreate] ERROR: coordinator_timezone missing!");
        throw new Error("Failed to detect user timezone");
      }

      console.log("[EventCreate] ✓ Validation passed - UTC fields present");

      const createdEvent = await execute(() => eventsAPI.create(eventPayload));

      if (!createdEvent) throw new Error("Failed to create event");

      console.log("[EventCreate] Event created successfully:", createdEvent);

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

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <EventBasicsForm
            formData={formData}
            onChange={handleInputChange}
            borderColor={borderColor}
          />
        );
      case 1:
        return (
          <EventSchedulingForm
            formData={formData}
            onChange={handleInputChange}
            borderColor={borderColor}
          />
        );
      case 2:
        return (
          <GuestManagementForm
            formData={formData}
            onChange={handleInputChange}
            guestSearchQuery={guestSearchQuery}
            onSearchQueryChange={setGuestSearchQuery}
            onSearch={handleSearchUsers}
            searchResults={searchResults}
            isSearching={isSearching}
            onAddGuest={handleAddGuest}
            onRemoveGuest={handleRemoveGuest}
          />
        );
      case 3:
        return (
          <LocationForm
            formData={formData}
            onChange={handleInputChange}
          />
        );
      case 4:
        return (
          <EventReviewCard
            formData={formData}
            onEditStep={setCurrentStep}
          />
        );
      default:
        return null;
    }
  };

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
          <StepProgressIndicator
            steps={steps}
            currentStep={currentStep}
            cardBg={cardBg}
          />

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
                {renderStepContent()}
              </MotionBox>
            </CardBody>
          </Card>

          {/* Navigation Buttons */}
          <FormStepNavigation
            currentStep={currentStep}
            totalSteps={steps.length}
            onBack={handleBack}
            onNext={handleNext}
            onSubmit={handleSubmit}
            isLoading={loading}
            submitLabel="Send Invitations"
            submitColorScheme="green"
          />
        </VStack>
      </Container>
    </Box>
  );
};

export default EventCreate;
