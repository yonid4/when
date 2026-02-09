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
  Box,
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
      const result = await eventsAPI.sendInvitations(eventUid, emailList);

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

      setEmails("");
      onClose();
      onSuccess?.();
    } catch (error) {
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
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent borderRadius="xl" overflow="hidden">
        {/* Gradient Header */}
        <Box
          bg="brand.600"
          position="relative"
          overflow="hidden"
        >
          <ModalHeader color="white" position="relative" py={6}>
            <EmailIcon mr={2} />
            Invite Participants
          </ModalHeader>
          <ModalCloseButton color="white" _hover={{ bg: "whiteAlpha.200" }} />
        </Box>

        <ModalBody py={6}>
          <VStack align="stretch" spacing={4}>
            <Text fontSize="sm" color="gray.600">
              Enter email addresses of people you want to invite (one per line or comma-separated)
            </Text>
            <Textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="john@example.com&#10;jane@example.com"
              rows={6}
              isDisabled={isSending}
              borderColor="brand.200"
              _focus={{
                borderColor: "brand.400",
                boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)"
              }}
              _hover={{
                borderColor: "brand.300"
              }}
            />
            <Box
              p={3}
              bg="brand.50"
              borderRadius="md"
              borderLeft="4px"
              borderColor="brand.400"
            >
              <Text fontSize="xs" color="gray.700">
                <strong>Note:</strong> Users must have signed up with When using these email addresses
              </Text>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter bg="gray.50">
          <Button 
            variant="ghost" 
            mr={3} 
            onClick={handleClose} 
            isDisabled={isSending}
            _hover={{ bg: "gray.100" }}
          >
            Cancel
          </Button>
          <Button
            bg="brand.500"
            color="white"
            onClick={handleSendInvites}
            isLoading={isSending}
            loadingText="Sending..."
            leftIcon={<EmailIcon />}
            _hover={{
              bg: "brand.600",
              transform: "translateY(-2px)",
              boxShadow: "lg"
            }}
            transition="all 0.3s"
          >
            Send Invitations
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default InviteModal;

