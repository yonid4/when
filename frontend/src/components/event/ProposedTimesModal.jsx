import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Card,
  CardBody,
  Flex,
  Box,
  Text,
  HStack,
  Badge,
  Button,
  Icon,
  useColorModeValue
} from "@chakra-ui/react";
import { FiRefreshCw, FiClock, FiUsers } from "react-icons/fi";
import { motion } from "framer-motion";
import { colors } from "../../styles/designSystem";

const MotionCard = motion(Card);

const ProposedTimesModal = ({
  isOpen,
  onClose,
  timeOptions,
  selectedTimeOption,
  setSelectedTimeOption,
  proposalMetadata,
  isCoordinator,
  isLoadingProposals,
  onRefresh,
  onSelectTime
}) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Convert UTC time to local time for display
  const formatDate = (dateString) => {
    // Parse as UTC and convert to local timezone
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  const formatTime = (timeString) => {
    // Parse as UTC and convert to local timezone
    const date = new Date(timeString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" isCentered>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent borderRadius="xl" overflow="hidden">
        {/* Gradient Header */}
        <Box
          bgGradient="linear(to-r, purple.600, blue.500)"
          position="relative"
          overflow="hidden"
        >
          {/* Background Pattern */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            opacity={0.1}
            bgImage="radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)"
          />
          <ModalHeader color="white" position="relative" py={6}>
            <Flex justify="space-between" align="center" mb={2}>
              <HStack>
                <Icon as={FiClock} boxSize={6} />
                <Text>AI Proposed Times</Text>
              </HStack>
              {isCoordinator && timeOptions.length > 0 && (
                <Button
                  leftIcon={<Icon as={FiRefreshCw} />}
                  size="sm"
                  bg="whiteAlpha.200"
                  color="white"
                  onClick={onRefresh}
                  isLoading={isLoadingProposals}
                  _hover={{
                    bg: "whiteAlpha.300",
                    transform: "translateY(-2px)"
                  }}
                  transition="all 0.3s"
                  backdropFilter="blur(10px)"
                >
                  Refresh
                </Button>
              )}
            </Flex>
            <Flex justify="space-between" align="center">
              {proposalMetadata?.generatedAt && (
                <Text fontSize="xs" color="whiteAlpha.800" fontWeight="normal">
                  Generated {formatTimeAgo(proposalMetadata.generatedAt)}
                </Text>
              )}
            </Flex>
            {proposalMetadata?.allExpired && (
              <Badge
                bgGradient="linear(to-r, red.400, orange.400)"
                color="white"
                fontSize="xs"
                mt={2}
                px={3}
                py={1}
              >
                All proposed times have passed - Please refresh
              </Badge>
            )}
            {proposalMetadata?.needsUpdate && !proposalMetadata?.allExpired && (
              <Badge
                bgGradient="linear(to-r, orange.400, yellow.400)"
                color="white"
                fontSize="xs"
                mt={2}
                px={3}
                py={1}
              >
                Updates available - Refresh to see latest proposals
              </Badge>
            )}
          </ModalHeader>
          <ModalCloseButton color="white" _hover={{ bg: "whiteAlpha.200" }} />
        </Box>
        <ModalBody pb={6}>
          {timeOptions.length === 0 ? (
            <Box textAlign="center" py={8}>
              {proposalMetadata?.allExpired ? (
                <>
                  <Text color="orange.500" fontWeight="semibold">All proposed times have passed.</Text>
                  <Text fontSize="sm" color="gray.500" mt={2}>
                    {isCoordinator
                      ? "Click Refresh to generate new time proposals."
                      : "Ask the coordinator to refresh the proposed times."}
                  </Text>
                  {isCoordinator && (
                    <Button
                      leftIcon={<Icon as={FiRefreshCw} />}
                      colorScheme="purple"
                      size="sm"
                      mt={4}
                      onClick={onRefresh}
                      isLoading={isLoadingProposals}
                    >
                      Generate New Proposals
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Text color="gray.500">No proposed times available yet.</Text>
                  <Text fontSize="sm" color="gray.400" mt={2}>
                    Participants need to select their preferred times first.
                  </Text>
                </>
              )}
            </Box>
          ) : (
            <VStack spacing={3} maxH="600px" overflowY="auto" pr={2}>
              {timeOptions.map((option, index) => {
                const isWinner = index === 0;

                // Convert UTC times to local timezone for display
                const startDate = new Date(option.start_time_utc);
                const endDate = new Date(option.end_time_utc);

                const localDate = formatDate(option.start_time_utc);
                const localTime = `${formatTime(option.start_time_utc)} - ${formatTime(option.end_time_utc)}`;

                return (
                  <MotionCard
                    key={option.id}
                    w="full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ y: -4, boxShadow: "xl" }}
                    bg="white"
                    borderRadius="xl"
                    overflow="hidden"
                    position="relative"
                    boxShadow={selectedTimeOption === option.id ? "xl" : "md"}
                    cursor="pointer"
                    onClick={() => {
                      setSelectedTimeOption(option.id);
                      if (isCoordinator && onSelectTime) {
                        onSelectTime(option);
                      }
                    }}
                  >
                    {/* Gradient Top Border */}
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      right={0}
                      h="4px"
                      bgGradient={
                        selectedTimeOption === option.id
                          ? "linear(to-r, purple.500, blue.500)"
                          : isWinner
                          ? "linear(to-r, green.400, teal.500)"
                          : "linear(to-r, gray.300, gray.400)"
                      }
                    />
                    <CardBody p={4} pt={5}>
                      <Flex justify="space-between" align="center">
                        <Box flex={1}>
                          <HStack mb={2}>
                            <Box
                              p={2}
                              bgGradient={
                                isWinner
                                  ? "linear(to-r, green.400, teal.500)"
                                  : "linear(to-r, purple.500, blue.500)"
                              }
                              borderRadius="lg"
                            >
                              <Icon as={FiClock} color="white" boxSize={4} />
                            </Box>
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="bold" fontSize="md">
                                {localDate}
                              </Text>
                              <Text color="gray.600" fontSize="sm">{localTime}</Text>
                            </VStack>
                            {isWinner && (
                              <Badge 
                                bgGradient="linear(to-r, green.400, teal.500)"
                                color="white"
                                fontSize="xs"
                                px={2}
                                py={1}
                              >
                                Top Choice
                              </Badge>
                            )}
                          </HStack>
                          <HStack spacing={3} mt={2} flexWrap="wrap">
                            <HStack spacing={1}>
                              <Icon as={FiUsers} color="green.500" boxSize={3} />
                              <Text fontSize="sm" color="green.600" fontWeight="semibold">
                                {option.availableCount} available
                              </Text>
                            </HStack>
                            {option.preferredCount > 0 && (
                              <HStack spacing={1}>
                                <Text fontSize="sm" color="gray.400">·</Text>
                                <Text fontSize="sm" color="purple.600" fontWeight="semibold">
                                  {option.preferredCount} prefer
                                </Text>
                              </HStack>
                            )}
                            {option.conflicts > 0 && (
                              <HStack spacing={1}>
                                <Text fontSize="sm" color="gray.400">·</Text>
                                <Text fontSize="sm" color="orange.500" fontWeight="semibold">
                                  {option.conflicts} busy
                                </Text>
                              </HStack>
                            )}
                          </HStack>
                        </Box>
                      </Flex>
                    </CardBody>
                  </MotionCard>
                );
              })}
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ProposedTimesModal;
