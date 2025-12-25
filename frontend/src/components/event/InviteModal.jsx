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
  Textarea,
  Text,
  VStack,
  useToast
} from "@chakra-ui/react";
import { EmailIcon } from "@chakra-ui/icons";
import { eventsAPI } from "../../services/apiService";

/**
 * Modal for inviting participants to an event
 */
const InviteModal = ({ isOpen, onClose, eventUid, onSuccess }) => {
  const [emails, setEmails] = useState("");
  const [isSending, setIsSending] = useState(false);
  const toast = useToast();

  const handleSendInvites = async () => {
    // Parse emails (comma or newline separated)
    const emailList = emails
      .split(/[,\n]/)
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (emailList.length === 0) {
      toast({
        title: "No emails entered",
        description: "Please enter at least one email address",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSending(true);

    try {
      console.log(`[INVITE] Sending invitations to event ${eventUid}:`, emailList);

      const result = await eventsAPI.sendInvitations(eventUid, emailList);

      console.log("[INVITE] Result:", result);

      if (result.summary.success > 0) {
        toast({
          title: "Invitations sent!",
          description: `Successfully sent ${result.summary.success} invitation(s)`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }

      if (result.summary.failed > 0) {
        toast({
          title: "Some invitations failed",
          description: `${result.summary.failed} invitation(s) could not be sent`,
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }

      // Show detailed results in console for debugging
      result.results.forEach(r => {
        if (r.status === "error") {
          console.error(`[INVITE] Failed to invite ${r.email}: ${r.message}`);
        } else {
          console.log(`[INVITE] Successfully invited ${r.email}`);
        }
      });

      setEmails("");
      onClose();

      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error("[INVITE] Error sending invitations:", error);

      // Extract more detailed error information
      const errorMessage = error.response?.data?.error
        || error.response?.data?.message
        || error.message
        || "An error occurred";

      toast({
        title: "Failed to send invitations",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      setEmails("");
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <EmailIcon mr={2} />
          Invite Participants
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={3}>
            <Text fontSize="sm" color="gray.600">
              Enter email addresses of people you want to invite (one per line or comma-separated)
            </Text>
            <Textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="john@example.com&#10;jane@example.com"
              rows={6}
              isDisabled={isSending}
            />
            <Text fontSize="xs" color="gray.500">
              <strong>Note:</strong> Users must have signed up with When using these email addresses
            </Text>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose} isDisabled={isSending}>
            Cancel
          </Button>
          <Button
            colorScheme="purple"
            onClick={handleSendInvites}
            isLoading={isSending}
            loadingText="Sending..."
            leftIcon={<EmailIcon />}
          >
            Send Invitations
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default InviteModal;

