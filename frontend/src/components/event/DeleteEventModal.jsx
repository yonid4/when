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
  HStack,
  useToast
} from "@chakra-ui/react";
import { WarningIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { eventsAPI } from "../../services/apiService";

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
      // Use centralized API service (automatically includes auth token and uses correct base URL)
      await eventsAPI.delete(event.id);

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
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent borderRadius="xl" overflow="hidden">
        {/* Gradient Header - Red theme for warning */}
        <Box
          bgGradient="linear(to-r, red.500, pink.500)"
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
            <HStack>
              <WarningIcon />
              <Text>Delete Event</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" _hover={{ bg: "whiteAlpha.200" }} isDisabled={isDeleting} />
        </Box>
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Box
              p={4}
              bg="red.50"
              borderRadius="lg"
              borderLeft="4px"
              borderColor="red.400"
            >
              <HStack align="start" spacing={3}>
                <Box
                  p={2}
                  bgGradient="linear(to-r, red.400, pink.400)"
                  borderRadius="lg"
                >
                  <WarningIcon color="white" />
                </Box>
                <Box>
                  <Text fontWeight="bold" color="red.900" mb={1}>
                    This action cannot be undone!
                  </Text>
                  <Text fontSize="sm" color="red.700">
                    The event will be permanently deleted.
                  </Text>
                </Box>
              </HStack>
            </Box>

            <Box p={4} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.200">
              <Text fontWeight="semibold" mb={3}>Event Details:</Text>
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
                borderColor="red.200"
                _focus={{
                  borderColor: "red.400",
                  boxShadow: "0 0 0 1px var(--chakra-colors-red-400)"
                }}
                _hover={{
                  borderColor: "red.300"
                }}
              />
            </Box>

            <Box
              p={3}
              bg="yellow.50"
              borderRadius="md"
              borderLeft="4px"
              borderColor="yellow.400"
            >
              <Text fontSize="xs" color="gray.700" fontWeight="medium">
                All participants will be notified that this event has been cancelled.
                {event.is_finalized && " The event will also be removed from Google Calendar."}
              </Text>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter bg="gray.50">
          <Button 
            variant="ghost" 
            mr={3} 
            onClick={handleClose} 
            isDisabled={isDeleting}
            _hover={{ bg: "gray.100" }}
          >
            Cancel
          </Button>
          <Button
            bgGradient="linear(to-r, red.500, pink.500)"
            color="white"
            onClick={handleDelete}
            isLoading={isDeleting}
            loadingText="Deleting..."
            isDisabled={confirmText !== event.title}
            _hover={{
              bgGradient: "linear(to-r, red.600, pink.600)",
              transform: "translateY(-2px)",
              boxShadow: "lg"
            }}
            _disabled={{
              opacity: 0.6,
              cursor: "not-allowed"
            }}
            transition="all 0.3s"
          >
            Delete Permanently
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteEventModal;
