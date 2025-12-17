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
  IconButton,
  Divider,
  useToast,
  Badge,
  Checkbox,
  useColorModeValue
} from "@chakra-ui/react";
import { FiCheck, FiX, FiCalendar, FiVideo } from "react-icons/fi";
import { colors } from "../../styles/designSystem";

/**
 * Modal for finalizing an event with a selected time
 */
const FinalizeEventModal = ({
  isOpen,
  onClose,
  event,
  selectedTime,
  participants = [],
  onFinalize
}) => {
  const [eventName, setEventName] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [includeGoogleMeet, setIncludeGoogleMeet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const selectedBg = useColorModeValue("purple.50", "purple.900");

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen && event) {
      setEventName(event.name || "");
      // Select all participants by default
      setSelectedParticipants(participants.map(p => p.id || p.user_id));
      setIncludeGoogleMeet(false);
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
    setSelectedParticipants(prev => {
      if (prev.includes(participantId)) {
        return prev.filter(id => id !== participantId);
      } else {
        return [...prev, participantId];
      }
    });
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
        include_google_meet: includeGoogleMeet
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
      setIncludeGoogleMeet(false);
      onClose();
    }
  };

  if (!selectedTime) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack spacing={2}>
            <FiCalendar />
            <Text>Finalize Event</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton isDisabled={isLoading} />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            {/* Selected Time Display */}
            <Box
              p={3}
              borderWidth={1}
              borderRadius="md"
              borderColor={borderColor}
              bg={cardBg}
            >
              <Text fontSize="sm" fontWeight="bold" mb={2} color="gray.600">
                Selected Time
              </Text>
              <VStack align="start" spacing={1}>
                <Text fontSize="md" fontWeight="medium">
                  {formatDateTime(selectedTime.start_time)}
                </Text>
                <HStack spacing={2}>
                  <Badge colorScheme="purple">
                    {formatTime(selectedTime.start_time)} - {formatTime(selectedTime.end_time)}
                  </Badge>
                </HStack>
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
              />
            </Box>

            <Divider />

            {/* Google Meet Option */}
            <Box>
              <Checkbox
                isChecked={includeGoogleMeet}
                onChange={(e) => setIncludeGoogleMeet(e.target.checked)}
                isDisabled={isLoading}
                colorScheme="purple"
              >
                <HStack spacing={2}>
                  <FiVideo />
                  <Text fontSize="sm">Include Google Meet link</Text>
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
                          colorScheme="purple"
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
        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            onClick={handleClose}
            isDisabled={isLoading}
            leftIcon={<FiX />}
          >
            Cancel
          </Button>
          <Button
            colorScheme="purple"
            onClick={handleFinalize}
            isLoading={isLoading}
            loadingText="Finalizing..."
            leftIcon={<FiCheck />}
          >
            Finalize Event
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default FinalizeEventModal;
