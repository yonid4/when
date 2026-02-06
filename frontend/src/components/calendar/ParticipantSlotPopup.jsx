import { useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useToast,
} from "@chakra-ui/react";
import { format } from "date-fns";

/**
 * Popup shown to participants when they drag to select a time slot.
 */
function ParticipantSlotPopup({ isOpen, onClose, slotInfo, onConfirm }) {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  if (!slotInfo) return null;

  async function handleConfirm() {
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
  }

  const timeDisplay = `${format(slotInfo.start, "EEEE, MMM d")} \u2022 ${format(slotInfo.start, "h:mm a")} - ${format(slotInfo.end, "h:mm a")}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Preferred Time?</ModalHeader>
        <ModalBody>
          <Text fontSize="lg" fontWeight="semibold" color="gray.700">
            {timeDisplay}
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
}

export default ParticipantSlotPopup;




