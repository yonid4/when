import { eventsAPI, usersAPI } from "../services/apiService";
import { useApiCall } from "../hooks/useApiCall";
import {
  EventBasicsForm,
  EventSchedulingForm,
  GuestManagementForm,
  LocationForm,
  EventReviewCard
} from "../components/event/forms";
import { StepProgressIndicator, FormStepNavigation, WizardHeader } from "../components/common";
import { colors, shadows } from "../styles/designSystem";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Flex,
  Progress,
  Spinner,
  useToast
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { FiEdit, FiCalendar, FiUsers, FiMapPin, FiCheck } from "react-icons/fi";
import { useCalendarConnection } from "../hooks/useCalendarConnection";
import CalendarConnectPrompt from "../components/calendar/CalendarConnectPrompt";

const MotionBox = motion(Box);

const EventCreate = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { execute, loading } = useApiCall();
  const { isConnected, isChecking, connectGoogleCalendar, connectMicrosoftCalendar } = useCalendarConnection();

  // Capture user timezone for UTC conversion
  const [userTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward
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

  const steps = [
    { id: 0, name: "Basics", icon: FiEdit },
    { id: 1, name: "When", icon: FiCalendar },
    { id: 2, name: "Who", icon: FiUsers },
    { id: 3, name: "Where", icon: FiMapPin },
    { id: 4, name: "Review", icon: FiCheck }
  ];

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

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
      const filtered = results.filter(user => !formData.guests.find(guest => guest.id === user.id));
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
    if (!formData.guests.find(guest => guest.id === user.id)) {
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
      guests: prev.guests.filter(guest => guest.id !== userId)
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
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleHeaderBack = () => {
    if (currentStep > 0) {
      handleBack();
    } else {
      navigate(-1);
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

      // Helper: Convert local date + time to UTC ISO string
      const dateTimeToUTC = (dateStr, timeStr) => {
        if (!dateStr || timeStr === null || timeStr === undefined) {
          return null;
        }

        // Normalize time to HH:mm:ss format
        let timeFormatted;
        if (!isNaN(timeStr) && timeStr.toString().length <= 2) {
          // Hour-only format (e.g., "9" or 9)
          timeFormatted = `${parseInt(timeStr).toString().padStart(2, "0")}:00:00`;
        } else if (typeof timeStr === "string" && timeStr.length === 5) {
          // HH:mm format
          timeFormatted = `${timeStr}:00`;
        } else if (typeof timeStr === "string" && timeStr.length >= 8) {
          // Already has seconds (HH:mm:ss)
          timeFormatted = timeStr;
        } else {
          timeFormatted = "00:00:00";
        }

        const localDate = new Date(`${dateStr}T${timeFormatted}`);
        if (isNaN(localDate.getTime())) {
          return null;
        }

        return localDate.toISOString();
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
        guests_can_invite: formData.guestPermissions.canInviteOthers,
      };

      // 2. Add datetime fields based on mode
      if (formData.schedulingMode === "multiple") {
        eventPayload.earliest_datetime_utc = dateTimeToUTC(formData.startDate, formData.earliestHour);
        eventPayload.latest_datetime_utc = dateTimeToUTC(formData.endDate, formData.latestHour);
      } else {
        const startUTC = dateTimeToUTC(formData.date, formData.time);
        const startDate = new Date(startUTC);
        const endDate = new Date(startDate.getTime() + parseInt(formData.duration) * 60000);

        eventPayload.earliest_datetime_utc = startUTC;
        eventPayload.latest_datetime_utc = endDate.toISOString();
      }

      // Validate required fields
      if (!eventPayload.earliest_datetime_utc || !eventPayload.latest_datetime_utc) {
        throw new Error("Failed to convert datetime to UTC format");
      }

      if (!eventPayload.coordinator_timezone) {
        throw new Error("Failed to detect user timezone");
      }

      const createdEvent = await execute(() => eventsAPI.create(eventPayload));

      if (!createdEvent) throw new Error("Failed to create event");

      // Send invitations if guests were added
      if (formData.guests && formData.guests.length > 0) {
        try {
          const guestEmails = formData.guests
            .map(guest => typeof guest === "object" ? (guest.email_address || guest.email) : guest)
            .filter(Boolean);

          if (guestEmails.length > 0) {
            await execute(() => eventsAPI.sendInvitations(createdEvent.uid, guestEmails), {
              showSuccessToast: false
            });
          }
        } catch (inviteError) {
          console.error("Failed to send invitations:", inviteError);
          toast({
            title: "Event created but invitations failed",
            description: "You can invite people from the event page",
            status: "warning",
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
            borderColor="gray.200"
          />
        );
      case 1:
        return (
          <EventSchedulingForm
            formData={formData}
            onChange={handleInputChange}
            borderColor="gray.200"
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

  // Animation variants for directional slide
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction > 0 ? -50 : 50,
      opacity: 0
    })
  };

  if (isChecking) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg={colors.bgPage}>
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  if (!isConnected) {
    return (
      <CalendarConnectPrompt
        isVisible={true}
        context="create"
        onConnect={connectGoogleCalendar}
        onConnectMicrosoft={connectMicrosoftCalendar}
        onSkip={() => navigate(-1)}
        onClose={() => navigate(-1)}
      />
    );
  }

  return (
    <Box minH="100vh" bg={colors.bgPage}>
      {/* Wizard Header */}
      <WizardHeader
        title="Create Event"
        onBack={handleHeaderBack}
        onSaveDraft={handleSaveDraft}
        showSaveDraft={true}
      />

      {/* Stepper Section */}
      <Box bg="white" borderBottom="1px solid" borderColor="gray.200" shadow={shadows.sm}>
        <Container maxW={{ base: "100%", md: "700px" }} px={{ base: 4, md: 6 }}>
          <StepProgressIndicator
            steps={steps}
            currentStep={currentStep}
          />
        </Container>
      </Box>

      {/* Progress Bar */}
      <Progress
        value={progressPercentage}
        size="xs"
        colorScheme="brand"
        bg="gray.100"
        borderRadius={0}
      />

      {/* Form Content */}
      <Container maxW={{ base: "100%", md: "700px" }} px={{ base: 4, md: 6 }} py={8}>
        <AnimatePresence mode="wait" custom={direction}>
          <MotionBox
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Box
              bg="white"
              borderRadius="xl"
              boxShadow={shadows.card}
              border="1px solid"
              borderColor="gray.200"
              p={{ base: 6, md: 8 }}
              minH="450px"
            >
              {/* Step Content */}
              {renderStepContent()}

              {/* Navigation Inside Card */}
              <FormStepNavigation
                currentStep={currentStep}
                totalSteps={steps.length}
                onBack={handleBack}
                onNext={handleNext}
                onSubmit={handleSubmit}
                isLoading={loading}
                submitLabel={formData.guests.length > 0 ? "Create & Send Invitations" : "Create Event"}
                submitColorScheme="brand"
                mt={8}
              />
            </Box>
          </MotionBox>
        </AnimatePresence>
      </Container>
    </Box>
  );
};

export default EventCreate;
