import {
  Box,
  Button,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FcGoogle } from "react-icons/fc";
import { BsMicrosoft } from "react-icons/bs";
import { colors } from "../../styles/designSystem";

const PROMPT_CONTENT = {
  create: {
    title: "Create Your First Event",
    description:
      "To help you find the best time for your event, we'd like to check your calendar availability.",
    benefits: [
      "Automatic availability checking",
      "Smart time suggestions",
      "No double bookings",
    ],
  },
  view: {
    title: "View Availability",
    description: "Connect your calendar to see when everyone is free for your event.",
    benefits: [
      "See everyone's availability",
      "Find the best meeting time",
      "Avoid scheduling conflicts",
    ],
  },
  default: {
    title: "Connect Your Calendar",
    description: "Connect your calendar to get the most out of your event coordination.",
    benefits: [
      "Smart availability checking",
      "Automatic time suggestions",
      "Seamless scheduling",
    ],
  },
};

function CalendarConnectPrompt({ context, onConnect, onConnectMicrosoft, onSkip, onClose, isVisible = false }) {
  if (!isVisible) return null;

  const content = PROMPT_CONTENT[context] || PROMPT_CONTENT.default;

  return (
    <Modal isOpen={isVisible} onClose={onClose} isCentered size="lg">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent borderRadius="xl" overflow="hidden">
        <Box bgGradient="linear(to-r, blue.500, cyan.400)" position="relative" overflow="hidden">
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            opacity={0.1}
            bgImage="radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.3) 0%, transparent 50%)"
          />
          <ModalHeader color="white" position="relative" py={8}>
            <Text fontSize="3xl" fontWeight="bold" textAlign="center">
              {content.title}
            </Text>
          </ModalHeader>
          <ModalCloseButton color="white" _hover={{ bg: "whiteAlpha.200" }} />
        </Box>

        <ModalBody py={6} px={6}>
          <VStack spacing={5} align="stretch">
            <Text color="gray.700" fontSize="md" fontWeight="medium" textAlign="center">
              {content.description}
            </Text>

            <VStack spacing={3} align="stretch">
              {content.benefits.map((benefit, index) => (
                <Box
                  key={index}
                  p={4}
                  bg="blue.50"
                  borderRadius="lg"
                  borderLeft="4px"
                  borderColor="blue.400"
                  transition="all 0.2s"
                  _hover={{
                    bg: "blue.100",
                    transform: "translateX(4px)",
                    boxShadow: "md",
                  }}
                >
                  <Text fontWeight="medium" color="gray.700">
                    {benefit}
                  </Text>
                </Box>
              ))}
            </VStack>
          </VStack>
        </ModalBody>

        <ModalFooter bg="gray.50" py={6} justifyContent="center">
          <VStack spacing={3} w="full">
            <HStack spacing={3} w="full">
              <Button
                bgGradient="linear(to-r, blue.500, cyan.400)"
                color="white"
                size="lg"
                flex={1}
                onClick={onConnect}
                leftIcon={<Icon as={FcGoogle} boxSize={5} />}
                _hover={{
                  bgGradient: "linear(to-r, blue.600, cyan.500)",
                  transform: "translateY(-2px)",
                  boxShadow: "xl",
                }}
                transition="all 0.3s"
                py={6}
                fontSize="md"
                fontWeight="bold"
              >
                Google
              </Button>
              <Button
                bg={colors.microsoft}
                color="white"
                size="lg"
                flex={1}
                onClick={onConnectMicrosoft}
                leftIcon={<Icon as={BsMicrosoft} boxSize={5} />}
                _hover={{
                  bg: colors.microsoftHover,
                  transform: "translateY(-2px)",
                  boxShadow: "xl",
                }}
                transition="all 0.3s"
                py={6}
                fontSize="md"
                fontWeight="bold"
              >
                Microsoft
              </Button>
            </HStack>
            <Button variant="ghost" size="sm" onClick={onSkip} color="gray.600" _hover={{ bg: "gray.100" }}>
              Skip for now
            </Button>
          </VStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default CalendarConnectPrompt;
