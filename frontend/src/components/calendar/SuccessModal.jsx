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
  Box,
  HStack,
  Link,
  VStack,
  Icon,
} from "@chakra-ui/react";
import { CheckCircleIcon, ExternalLinkIcon } from "@chakra-ui/icons";

/**
 * Success modal shown after event finalization
 * Displays confirmation, Google Calendar link, and Google Meet link (if applicable)
 */
const SuccessModal = ({ isOpen, onClose, result, event }) => {
  if (!result) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack spacing={3}>
            <CheckCircleIcon color="green.500" boxSize={8} />
            <Box>
              <Text fontSize="xl" fontWeight="bold">
                Event Finalized Successfully!
              </Text>
            </Box>
          </HStack>
        </ModalHeader>

        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Text color="gray.700">
              Calendar invitations have been sent to all selected participants via email.
            </Text>

            {/* Google Meet Link */}
            {result.meet_link && (
              <Box p={4} bg="blue.50" borderRadius="md" borderWidth="1px" borderColor="blue.200">
                <Text fontWeight="semibold" mb={2} color="blue.800">
                  📹 Google Meet Link:
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

            {/* Google Calendar Link */}
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

            {/* Info Box */}
            <Box p={3} bg="gray.50" borderRadius="md">
              <Text fontSize="sm" color="gray.700">
                <strong>Next Steps:</strong>
              </Text>
              <Text fontSize="sm" color="gray.600" mt={1}>
                • Participants will receive email invitations<br />
                • They can accept/decline from their email<br />
                • The event will appear on their calendars<br />
                • You can manage the event from Google Calendar
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
};

export default SuccessModal;


