import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  VStack
} from "@chakra-ui/react";
import { format } from "date-fns";

/**
 * Popup shown to coordinators when they drag to select a time slot
 * Offers two options: add as preferred time or finalize event
 */
const CoordinatorSlotPopup = ({ isOpen, onClose, slotInfo, onAddPreferred, onFinalize }) => {
  const handleAddPreferred = async () => {
    try {
      await onAddPreferred(slotInfo);
      onClose();
    } catch (error) {
      // Error handled by parent
    }
  };

  const handleFinalize = () => {
    // Call parent's finalize handler which opens FinalizationModal
    onFinalize(slotInfo);
    onClose();
  };

  if (!slotInfo) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Choose Action</ModalHeader>
        <ModalBody>
          <Text fontSize="lg" fontWeight="semibold" mb={4} color="gray.700">
            {format(slotInfo.start, "EEEE, MMM d")} • {format(slotInfo.start, "h:mm a")} -{" "}
            {format(slotInfo.end, "h:mm a")}
          </Text>
          <VStack spacing={3} width="100%">
            <Button
              width="100%"
              variant="outline"
              colorScheme="blue"
              onClick={handleAddPreferred}
            >
              Add as my preferred time
            </Button>
            <Button
              width="100%"
              colorScheme="green"
              onClick={handleFinalize}
            >
              Finalize event at this time
            </Button>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CoordinatorSlotPopup;

