import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Input,
  Text,
  VStack,
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  HStack,
  useToast
} from "@chakra-ui/react";
import { WarningIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";

/**
 * Modal for confirming event deletion
 * Requires typing event name to confirm
 */
const DeleteEventModal = ({ isOpen, onClose, event }) => {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  if (!event) return null;

  const handleDelete = async () => {
    // Require user to type event name for confirmation
    if (confirmText !== event.title) {
      toast({
        title: "Confirmation required",
        description: "Please type the event name correctly to confirm deletion",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsDeleting(true);

    try {
      const accessToken = localStorage.getItem("access_token");
      
      const response = await fetch(`http://localhost:5001/api/events/${event.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete event");
      }

      toast({
        title: "Event deleted",
        description: "The event has been permanently deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Redirect to dashboard/home after brief delay
      setTimeout(() => {
        navigate("/");
      }, 1000);

    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Failed to delete event",
        description: error.message || "An error occurred while deleting the event",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmText("");
      onClose();
    }
  };

  const participantCount = event.participant_count || 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <WarningIcon color="red.500" />
            <Text>Delete Event</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton isDisabled={isDeleting} />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Alert status="error">
              <AlertIcon />
              <Box>
                <AlertTitle>This action cannot be undone!</AlertTitle>
                <AlertDescription>
                  The event will be permanently deleted.
                </AlertDescription>
              </Box>
            </Alert>

            <Box p={3} bg="gray.50" borderRadius="md">
              <Text fontWeight="semibold" mb={2}>Event Details:</Text>
              <VStack align="stretch" spacing={1}>
                <Text fontSize="sm">
                  <strong>Title:</strong> {event.title}
                </Text>
                {event.description && (
                  <Text fontSize="sm">
                    <strong>Description:</strong> {event.description}
                  </Text>
                )}
                <Text fontSize="sm">
                  <strong>Participants:</strong> {participantCount} {participantCount === 1 ? "person" : "people"}
                </Text>
                {event.is_finalized && (
                  <Text fontSize="sm" color="red.600" fontWeight="semibold">
                    <strong>Status:</strong> This event is finalized with a scheduled time
                  </Text>
                )}
              </VStack>
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb={2}>
                To confirm deletion, type the event name:
              </Text>
              <Input
                placeholder={event.title}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoFocus
                isDisabled={isDeleting}
              />
            </Box>

            <Text fontSize="xs" color="gray.600">
              All participants will be notified that this event has been cancelled.
              {event.is_finalized && " The event will also be removed from Google Calendar."}
            </Text>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose} isDisabled={isDeleting}>
            Cancel
          </Button>
          <Button
            colorScheme="red"
            onClick={handleDelete}
            isLoading={isDeleting}
            loadingText="Deleting..."
            isDisabled={confirmText !== event.title}
          >
            Delete Permanently
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteEventModal;


