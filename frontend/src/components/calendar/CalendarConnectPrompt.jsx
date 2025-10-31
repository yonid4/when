import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  Text,
  Box,
  HStack
} from "@chakra-ui/react";

const CalendarConnectPrompt = ({ 
  context, 
  onConnect, 
  onSkip, 
  onClose,
  isVisible = false 
}) => {
  if (!isVisible) return null;

  const getPromptContent = (context) => {
    switch (context) {
      case 'create':
        return {
          title: "🗓️ Create Your First Event",
          description: "To help you find the best time for your event, we'd like to check your Google Calendar availability.",
          benefits: [
            "✓ Automatic availability checking",
            "✓ Smart time suggestions", 
            "✓ No double bookings"
          ]
        };
      case 'view':
        return {
          title: "📅 View Availability",
          description: "Connect your Google Calendar to see when everyone is free for your event.",
          benefits: [
            "✓ See everyone's availability",
            "✓ Find the best meeting time",
            "✓ Avoid scheduling conflicts"
          ]
        };
      default:
        return {
          title: "📅 Connect Your Calendar",
          description: "Connect your Google Calendar to get the most out of your event coordination.",
          benefits: [
            "✓ Smart availability checking",
            "✓ Automatic time suggestions",
            "✓ Seamless scheduling"
          ]
        };
    }
  };

  const content = getPromptContent(context);

  return (
    <Modal isOpen={isVisible} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack spacing={2}>
            <Text fontSize="2xl">{content.title.split(' ')[0]}</Text>
            <Text>{content.title.split(' ').slice(1).join(' ')}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text color="gray.600">{content.description}</Text>
            
            <VStack spacing={2} align="stretch">
              {content.benefits.map((benefit, index) => (
                <Box 
                  key={index}
                  p={2}
                  bg="gray.50"
                  borderRadius="md"
                >
                  <Text>{benefit}</Text>
                </Box>
              ))}
            </VStack>
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <HStack spacing={3}>
            <Button 
              colorScheme="blue"
              onClick={onConnect}
            >
              Connect Google Calendar
            </Button>
            <Button 
              variant="ghost"
              onClick={onSkip}
            >
              Skip for now
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CalendarConnectPrompt;