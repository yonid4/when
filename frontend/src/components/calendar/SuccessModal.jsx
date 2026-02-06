import {
  Box,
  Button,
  HStack,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { CheckCircleIcon, ExternalLinkIcon } from "@chakra-ui/icons";

/**
 * Success modal shown after event finalization.
 * Displays confirmation, Google Calendar link, and Google Meet link (if applicable).
 */
function SuccessModal({ isOpen, onClose, result }) {
  if (!result) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack spacing={3}>
            <CheckCircleIcon color="green.500" boxSize={8} />
            <Text fontSize="xl" fontWeight="bold">
              Event Finalized Successfully!
            </Text>
          </HStack>
        </ModalHeader>

        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Text color="gray.700">
              Calendar invitations have been sent to all selected participants via email.
            </Text>

            {result.meet_link && (
              <Box p={4} bg="blue.50" borderRadius="md" borderWidth="1px" borderColor="blue.200">
                <Text fontWeight="semibold" mb={2} color="blue.800">
                  Google Meet Link:
                </Text>
                <Link
                  href={result.meet_link}
                  isExternal
                  color="blue.600"
                  fontSize="sm"
                  wordBreak="break-all"
                  _hover={{ textDecoration: "underline" }}
                >
                  {result.meet_link}
                </Link>
              </Box>
            )}

            {result.html_link && (
              <Button
                as="a"
                href={result.html_link}
                target="_blank"
                rel="noopener noreferrer"
                colorScheme="blue"
                width="100%"
                rightIcon={<ExternalLinkIcon />}
                size="lg"
              >
                View in Google Calendar
              </Button>
            )}

            <Box p={3} bg="gray.50" borderRadius="md">
              <Text fontSize="sm" color="gray.700" fontWeight="bold">
                Next Steps:
              </Text>
              <Text fontSize="sm" color="gray.600" mt={1}>
                {"\u2022"} Participants will receive email invitations
                <br />
                {"\u2022"} They can accept/decline from their email
                <br />
                {"\u2022"} The event will appear on their calendars
                <br />
                {"\u2022"} You can manage the event from Google Calendar
              </Text>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose} colorScheme="green" width="100%">
            Done
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default SuccessModal;




