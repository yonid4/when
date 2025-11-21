import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  Box,
  VStack,
  HStack,
  Checkbox,
  Avatar,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Heading,
} from "@chakra-ui/react";
import { format, differenceInMinutes } from "date-fns";

/**
 * Modal for finalizing an event with participant selection
 * Coordinator selects which participants to invite and whether to include Google Meet
 */
const FinalizationModal = ({ 
  isOpen, 
  onClose, 
  event, 
  selectedSlot, 
  participants, 
  onFinalize,
  isLoading 
}) => {
  const [selectedParticipants, setSelectedParticipants] = useState(
    participants.map(p => p.user_id) // All selected by default
  );
  const [includeGoogleMeet, setIncludeGoogleMeet] = useState(true);
  const [error, setError] = useState(null);

  if (!selectedSlot || !event) return null;

  const duration = differenceInMinutes(selectedSlot.end, selectedSlot.start);

  const handleParticipantToggle = (participantId, checked) => {
    if (checked) {
      setSelectedParticipants([...selectedParticipants, participantId]);
    } else {
      setSelectedParticipants(selectedParticipants.filter(id => id !== participantId));
    }
    setError(null);
  };

  const handleCreate = () => {
    if (selectedParticipants.length === 0) {
      setError("Please select at least one participant");
      return;
    }

    onFinalize({
      start_time_utc: selectedSlot.start.toISOString(),
      end_time_utc: selectedSlot.end.toISOString(),
      participant_ids: selectedParticipants,
      include_google_meet: includeGoogleMeet
    });
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" closeOnOverlayClick={!isLoading}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Finalize Event</ModalHeader>
        <ModalBody>
          {error && (
            <Alert status="error" mb={4} borderRadius="md">
              <AlertIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Event Details Section */}
          <Box mb={4} p={4} bg="blue.50" borderRadius="md">
            <Heading size="md" mb={2} color="blue.800">
              {event.name}
            </Heading>
            <Text fontSize="lg" fontWeight="semibold" color="blue.700">
              {format(selectedSlot.start, "EEEE, MMMM d, yyyy")}
            </Text>
            <Text fontSize="lg" color="blue.700">
              {format(selectedSlot.start, "h:mm a")} - {format(selectedSlot.end, "h:mm a")}
            </Text>
            <Text color="blue.600" fontSize="sm" mt={1}>
              Duration: {duration} minutes
            </Text>
          </Box>

          {/* Participant Selection */}
          <Box mb={4}>
            <Heading size="sm" mb={2}>
              Select Participants to Invite
            </Heading>
            <Text fontSize="sm" color="gray.600" mb={3}>
              Calendar invitations will be sent to selected participants via email
            </Text>

            <VStack align="stretch" spacing={2} maxH="300px" overflowY="auto">
              {participants.map(participant => (
                <Box
                  key={participant.user_id}
                  p={2}
                  borderWidth="1px"
                  borderRadius="md"
                  borderColor={selectedParticipants.includes(participant.user_id) ? "blue.300" : "gray.200"}
                  bg={selectedParticipants.includes(participant.user_id) ? "blue.50" : "white"}
                  transition="all 0.2s"
                >
                  <Checkbox
                    isChecked={selectedParticipants.includes(participant.user_id)}
                    onChange={(e) => handleParticipantToggle(participant.user_id, e.target.checked)}
                    width="100%"
                  >
                    <HStack spacing={3}>
                      <Avatar 
                        size="sm" 
                        name={participant.name || participant.email} 
                      />
                      <Box>
                        <Text fontWeight="medium">
                          {participant.name || "Unknown User"}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {participant.email}
                        </Text>
                      </Box>
                    </HStack>
                  </Checkbox>
                </Box>
              ))}
            </VStack>

            <Text fontSize="xs" color="gray.500" mt={2}>
              {selectedParticipants.length} of {participants.length} participant(s) selected
            </Text>
          </Box>

          {/* Google Meet Option */}
          <Box mb={2} p={3} borderWidth="1px" borderRadius="md" borderColor="gray.200">
            <Checkbox
              isChecked={includeGoogleMeet}
              onChange={(e) => setIncludeGoogleMeet(e.target.checked)}
            >
              <HStack spacing={2}>
                <Text>📹</Text>
                <Box>
                  <Text fontWeight="medium">Include Google Meet video link</Text>
                  <Text fontSize="xs" color="gray.600">
                    Automatically add a video conference link to the calendar event
                  </Text>
                </Box>
              </HStack>
            </Checkbox>
          </Box>

          {/* Warning */}
          <Alert status="warning" borderRadius="md" mt={4}>
            <AlertIcon />
            <Box flex="1">
              <AlertTitle fontSize="sm">This action cannot be undone</AlertTitle>
              <AlertDescription fontSize="xs">
                The event will be finalized and calendar invitations will be sent immediately. 
                No further changes can be made to preferred times.
              </AlertDescription>
            </Box>
          </Alert>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={handleClose} isDisabled={isLoading}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={handleCreate}
              isLoading={isLoading}
              loadingText="Creating event..."
              isDisabled={selectedParticipants.length === 0}
            >
              Create & Send Invitations
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default FinalizationModal;


