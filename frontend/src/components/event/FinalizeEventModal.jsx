import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Input,
  Box,
  Avatar,
  Divider,
  useToast,
  Badge,
  Checkbox,
  useColorModeValue,
  Icon,
  Radio,
  RadioGroup,
  Stack
} from "@chakra-ui/react";
import { FiCheck, FiX, FiCalendar, FiVideo } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { BsMicrosoft } from "react-icons/bs";

/**
 * Modal for finalizing an event with a selected time
 */
const FinalizeEventModal = ({
  isOpen,
  onClose,
  event,
  selectedTime,
  participants = [],
  onFinalize,
  calendarProvider = null
}) => {
  const [eventName, setEventName] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [includeOnlineMeeting, setIncludeOnlineMeeting] = useState(false);
  const [primaryProvider, setPrimaryProvider] = useState("google");
  const [syncToSecondary, setSyncToSecondary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const toast = useToast();

  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const selectedBg = useColorModeValue("brand.50", "brand.900");

  // Fetch user profile to get default primary provider
  useEffect(() => {
    async function fetchProfile() {
      if (!isOpen) return;

      try {
        const { data: { user } } = await import("../../services/supabaseClient.js").then(m => m.supabase.auth.getUser());
        if (user) {
          const res = await import("../../services/api.js").then(m => m.default.get(`/api/users/${user.id}`));
          if (res.data?.primary_calendar_provider) {
            setPrimaryProvider(res.data.primary_calendar_provider);
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile settings", err);
      } finally {
        setLoadingProfile(false);
      }
    }
    fetchProfile();
  }, [isOpen]);

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen && event) {
      setEventName(event.name || "");
      // Select all participants by default
      setSelectedParticipants(participants.map(p => p.id || p.user_id));
      setIncludeOnlineMeeting(false);
    }
  }, [isOpen, event, participants]);

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short"
    });
  };

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short"
    });
  };

  const toggleParticipant = (participantId) => {
    setSelectedParticipants(prev =>
      prev.includes(participantId)
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  const handleFinalize = async () => {
    // Validation
    if (!eventName.trim()) {
      toast({
        title: "Event name required",
        description: "Please enter an event name",
        status: "error",
        duration: 3000,
        isClosable: true
      });
      return;
    }

    if (selectedParticipants.length === 0) {
      toast({
        title: "No participants selected",
        description: "Please select at least one participant",
        status: "error",
        duration: 3000,
        isClosable: true
      });
      return;
    }

    if (!selectedTime?.start_time || !selectedTime?.end_time) {
      toast({
        title: "Invalid time selection",
        description: "Please select a valid time range",
        status: "error",
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setIsLoading(true);

    try {
      // Call the finalize callback with the data
      await onFinalize({
        title: eventName,
        start_time_utc: selectedTime.start_time,
        end_time_utc: selectedTime.end_time,
        participant_ids: selectedParticipants,
        include_online_meeting: includeOnlineMeeting,
        include_google_meet: includeOnlineMeeting,
        primary_calendar_provider: primaryProvider,
        sync_to_secondary: syncToSecondary
      });

      // Success is handled by parent component
      handleClose();
    } catch (error) {
      // Error is handled by parent component
      console.error("Finalization error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setEventName("");
      setSelectedParticipants([]);
      setIncludeOnlineMeeting(false);
      onClose();
    }
  };

  if (!selectedTime) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" isCentered>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent borderRadius="xl" overflow="hidden">
        {/* Gradient Header */}
        <Box
          bgGradient="linear(to-r, green.500, teal.500)"
          position="relative"
          overflow="hidden"
        >
          {/* Background Pattern */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            opacity={0.1}
            bgImage="radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)"
          />
          <ModalHeader color="white" position="relative" py={6}>
            <HStack spacing={2}>
              <FiCalendar />
              <Text>Finalize Event</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" _hover={{ bg: "whiteAlpha.200" }} isDisabled={isLoading} />
        </Box>
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            {/* Selected Time Display - Gradient Card */}
            <Box
              position="relative"
              borderRadius="xl"
              overflow="hidden"
              bgGradient="linear(to-r, green.500, teal.500)"
              p={4}
              boxShadow="lg"
            >
              {/* Background Pattern */}
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                opacity={0.1}
                bgImage="radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)"
              />
              <VStack align="start" spacing={2} position="relative">
                <HStack>
                  <Box
                    p={2}
                    bg="whiteAlpha.300"
                    borderRadius="lg"
                    backdropFilter="blur(10px)"
                  >
                    <FiCalendar color="white" />
                  </Box>
                  <Text fontSize="sm" fontWeight="bold" color="white">
                    Selected Time
                  </Text>
                </HStack>
                <Text fontSize="lg" fontWeight="bold" color="white">
                  {formatDateTime(selectedTime.start_time)}
                </Text>
                <Badge
                  bg="whiteAlpha.300"
                  color="white"
                  backdropFilter="blur(10px)"
                  px={3}
                  py={1}
                  fontSize="sm"
                >
                  {formatTime(selectedTime.start_time)} - {formatTime(selectedTime.end_time)}
                </Badge>
              </VStack>
            </Box>

            <Divider />

            {/* Event Name Input */}
            <Box>
              <Text fontSize="sm" fontWeight="bold" mb={2}>
                Event Name
              </Text>
              <Input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Enter event name"
                isDisabled={isLoading}
                borderColor="green.200"
                _focus={{
                  borderColor: "green.400",
                  boxShadow: "0 0 0 1px var(--chakra-colors-green-400)"
                }}
                _hover={{
                  borderColor: "green.300"
                }}
              />
            </Box>

            <Divider />

            {/* Primary Sender Selection */}
            {!loadingProfile && (
              <Box p={3} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                <VStack align="start" spacing={3}>
                  <Box>
                    <Text fontSize="sm" fontWeight="bold">Primary Calendar (Sends Invites)</Text>
                    <Text fontSize="xs" color="gray.500">
                      Choose which calendar service sends invitations to guests.
                    </Text>
                  </Box>

                  <RadioGroup onChange={setPrimaryProvider} value={primaryProvider}>
                    <Stack direction="row" spacing={4}>
                      <Radio value="google" colorScheme="blue">
                        <HStack spacing={1}>
                          <Icon as={FcGoogle} />
                          <Text fontSize="sm">Google</Text>
                        </HStack>
                      </Radio>
                      <Radio value="microsoft" colorScheme="blue">
                        <HStack spacing={1}>
                          <Icon as={BsMicrosoft} color="#00a1f1" />
                          <Text fontSize="sm">Microsoft</Text>
                        </HStack>
                      </Radio>
                    </Stack>
                  </RadioGroup>

                  <Checkbox
                    isChecked={syncToSecondary}
                    onChange={(e) => setSyncToSecondary(e.target.checked)}
                    colorScheme="purple"
                    size="sm"
                  >
                    <Text fontSize="sm">Also block time on {primaryProvider === 'google' ? 'Microsoft' : 'Google'}</Text>
                  </Checkbox>
                </VStack>
              </Box>
            )}

            <Divider />

            {/* Online Meeting Option */}
            <Box
              p={3}
              bg="green.50"
              borderRadius="md"
              borderLeft="4px"
              borderColor="green.400"
            >
              <Checkbox
                isChecked={includeOnlineMeeting}
                onChange={(e) => setIncludeOnlineMeeting(e.target.checked)}
                isDisabled={isLoading}
                colorScheme="green"
              >
                <HStack spacing={2}>
                  <FiVideo />
                  <Text fontSize="sm" fontWeight="medium">
                    {primaryProvider === "microsoft"
                      ? "Include Microsoft Teams link"
                      : "Include Google Meet link"}
                  </Text>
                </HStack>
              </Checkbox>
            </Box>

            <Divider />

            {/* Participants List */}
            <Box>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" fontWeight="bold">
                  Participants ({selectedParticipants.length}/{participants.length})
                </Text>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    if (selectedParticipants.length === participants.length) {
                      setSelectedParticipants([]);
                    } else {
                      setSelectedParticipants(participants.map(p => p.id || p.user_id));
                    }
                  }}
                  isDisabled={isLoading}
                >
                  {selectedParticipants.length === participants.length ? "Deselect All" : "Select All"}
                </Button>
              </HStack>
              <VStack
                align="stretch"
                spacing={2}
                maxH="200px"
                overflowY="auto"
                p={2}
                borderWidth={1}
                borderRadius="md"
                borderColor={borderColor}
              >
                {participants.length === 0 ? (
                  <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                    No participants available
                  </Text>
                ) : (
                  participants.map((participant) => {
                    const participantId = participant.id || participant.user_id;
                    const isSelected = selectedParticipants.includes(participantId);

                    return (
                      <HStack
                        key={participantId}
                        p={2}
                        borderRadius="md"
                        cursor="pointer"
                        onClick={() => toggleParticipant(participantId)}
                        _hover={{ bg: hoverBg }}
                        bg={isSelected ? selectedBg : "transparent"}
                        transition="all 0.2s"
                      >
                        <Checkbox
                          isChecked={isSelected}
                          onChange={() => toggleParticipant(participantId)}
                          onClick={(e) => e.stopPropagation()}
                          isDisabled={isLoading}
                          colorScheme="brand"
                        />
                        <Avatar
                          size="sm"
                          name={participant.name || participant.email}
                          src={participant.avatar_url}
                        />
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontSize="sm" fontWeight="medium">
                            {participant.name || "User"}
                          </Text>
                          {participant.email && (
                            <Text fontSize="xs" color="gray.500">
                              {participant.email}
                            </Text>
                          )}
                        </VStack>
                        {participant.user_id === event?.coordinator_id && (
                          <Badge colorScheme="blue" fontSize="xs">
                            Coordinator
                          </Badge>
                        )}
                      </HStack>
                    );
                  })
                )}
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter bg="gray.50">
          <Button
            variant="ghost"
            mr={3}
            onClick={handleClose}
            isDisabled={isLoading}
            leftIcon={<FiX />}
            _hover={{ bg: "gray.100" }}
          >
            Cancel
          </Button>
          <Button
            bgGradient="linear(to-r, green.500, teal.500)"
            color="white"
            onClick={handleFinalize}
            isLoading={isLoading}
            loadingText="Finalizing..."
            leftIcon={<FiCheck />}
            _hover={{
              bgGradient: "linear(to-r, green.600, teal.600)",
              transform: "translateY(-2px)",
              boxShadow: "lg"
            }}
            transition="all 0.3s"
          >
            Finalize Event
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default FinalizeEventModal;
