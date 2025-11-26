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
  useToast
} from "@chakra-ui/react";
import { format } from "date-fns";

/**
 * Popup shown to participants when they drag to select a time slot
 */
const ParticipantSlotPopup = ({ isOpen, onClose, slotInfo, onConfirm }) => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(slotInfo);
      toast({
        title: "Preferred time added",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Failed to add preferred time",
        description: error.message || "Please try again",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!slotInfo) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Preferred Time?</ModalHeader>
        <ModalBody>
          <Text fontSize="lg" fontWeight="semibold" color="gray.700">
            {format(slotInfo.start, "EEEE, MMM d")} • {format(slotInfo.start, "h:mm a")} -{" "}
            {format(slotInfo.end, "h:mm a")}
          </Text>
          <Text fontSize="sm" color="gray.500" mt={2}>
            This will be saved as one of your preferred times for this event.
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleConfirm} isLoading={isLoading}>
            Confirm
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ParticipantSlotPopup;




