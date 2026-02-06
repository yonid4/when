import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { format } from "date-fns";

/**
 * Popup shown to coordinators when they drag to select a time slot.
 * Offers two options: add as preferred time or finalize event.
 */
function CoordinatorSlotPopup({ isOpen, onClose, slotInfo, onAddPreferred, onFinalize }) {
  if (!slotInfo) return null;

  async function handleAddPreferred() {
    await onAddPreferred(slotInfo).catch(() => {});
    onClose();
  }

  function handleFinalize() {
    onFinalize(slotInfo);
    onClose();
  }

  const timeDisplay = `${format(slotInfo.start, "EEEE, MMM d")} \u2022 ${format(slotInfo.start, "h:mm a")} - ${format(slotInfo.end, "h:mm a")}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Choose Action</ModalHeader>
        <ModalBody>
          <Text fontSize="lg" fontWeight="semibold" mb={4} color="gray.700">
            {timeDisplay}
          </Text>
          <VStack spacing={3} width="100%">
            <Button width="100%" variant="outline" colorScheme="blue" onClick={handleAddPreferred}>
              Add as my preferred time
            </Button>
            <Button width="100%" colorScheme="green" onClick={handleFinalize}>
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
}

export default CoordinatorSlotPopup;

