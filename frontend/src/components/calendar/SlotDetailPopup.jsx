import { useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
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
 * Popup shown when clicking on a preferred slot density block.
 * Shows all users who selected that time and allows current user to remove their selection.
 */
function SlotDetailPopup({ isOpen, onClose, event, onDeleteInRange, currentUserId }) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const cancelRef = useRef();

  if (!event) return null;

  const userNames = event.resource?.userNames || [];
  const userIds = event.resource?.userIds || [];
  const currentUserSelected = currentUserId && userIds.includes(currentUserId);
  const personLabel = userNames.length === 1 ? "person" : "people";

  function handleDeleteClick() {
    setShowConfirmDelete(true);
  }

  function closeConfirmDialog() {
    setShowConfirmDelete(false);
  }

  async function handleConfirmDelete() {
    setShowConfirmDelete(false);
    await onDeleteInRange(event.start, event.end);
    onClose();
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="sm" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Preferred Time</ModalHeader>
          <ModalBody>
            <Text fontWeight="semibold" mb={2} color="gray.800">
              {format(event.start, "EEEE, MMM d")}
            </Text>
            <Text fontSize="md" fontWeight="semibold" color="gray.700" mb={4}>
              {format(event.start, "h:mm a")} - {format(event.end, "h:mm a")}
            </Text>

            <Text fontSize="sm" color="gray.600" mb={2}>
              Selected by {userNames.length} {personLabel}:
            </Text>

            <VStack align="stretch" spacing={1}>
              {userNames.map((name, index) => (
                <Text key={index} fontSize="sm" color="gray.700">
                  {"\u2022"} {name}
                </Text>
              ))}
            </VStack>
          </ModalBody>
          <ModalFooter>
            {currentUserSelected && (
              <Button colorScheme="red" size="sm" mr={3} onClick={handleDeleteClick}>
                Remove My Selection
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={showConfirmDelete}
        leastDestructiveRef={cancelRef}
        onClose={closeConfirmDialog}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remove Your Selection
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to remove your preferred time for this slot? This action cannot
              be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={closeConfirmDialog}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleConfirmDelete} ml={3}>
                Remove
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}

export default SlotDetailPopup;

