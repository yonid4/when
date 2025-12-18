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
  Progress,
  Button,
  Icon,
  useColorModeValue
} from "@chakra-ui/react";
import { FiRefreshCw } from "react-icons/fi";
import { colors } from "../../styles/designSystem";

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
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Flex justify="space-between" align="center" mb={2}>
            <Text>Proposed Times</Text>
            {isCoordinator && timeOptions.length > 0 && (
              <Button
                leftIcon={<Icon as={FiRefreshCw} />}
                size="sm"
                variant="ghost"
                onClick={onRefresh}
                isLoading={isLoadingProposals}
                colorScheme="purple"
              >
                Refresh
              </Button>
            )}
          </Flex>
          <Flex justify="space-between" align="center">
            {proposalMetadata?.generatedAt && (
              <Text fontSize="xs" color="gray.500" fontWeight="normal">
                Generated {formatTimeAgo(proposalMetadata.generatedAt)}
              </Text>
            )}
          </Flex>
          {proposalMetadata?.needsUpdate && (
            <Badge colorScheme="yellow" fontSize="xs" mt={2}>
              Updates available - Refresh to see latest proposals
            </Badge>
          )}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {timeOptions.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text color="gray.500">No proposed times available yet.</Text>
              <Text fontSize="sm" color="gray.400" mt={2}>
                Participants need to select their preferred times first.
              </Text>
            </Box>
          ) : (
            <VStack spacing={3} maxH="600px" overflowY="auto" pr={2}>
              {timeOptions.map((option, index) => {
                const percentage = (option.availableCount / option.totalParticipants) * 100;
                const isWinner = index === 0;

                // Convert UTC times to local timezone for display
                const startDate = new Date(option.start_time_utc);
                const endDate = new Date(option.end_time_utc);

                const localDate = formatDate(option.start_time_utc);
                const localTime = `${formatTime(option.start_time_utc)} - ${formatTime(option.end_time_utc)}`;

                return (
                  <Card
                    key={option.id}
                    w="full"
                    variant="outline"
                    size="sm"
                    borderWidth={isWinner ? 2 : 1}
                    borderColor={
                      selectedTimeOption === option.id ? colors.primary :
                        isWinner ? colors.secondary : borderColor
                    }
                    cursor="pointer"
                    onClick={() => {
                      setSelectedTimeOption(option.id);
                      if (isCoordinator && onSelectTime) {
                        onSelectTime(option);
                      }
                    }}
                    _hover={{ shadow: "md" }}
                    transition="all 0.2s"
                  >
                    <CardBody p={3}>
                      <Flex justify="space-between" align="center">
                        <Box flex={1}>
                          <HStack mb={1}>
                            <Text fontWeight="bold" fontSize="md">
                              {localDate}
                            </Text>
                            {isWinner && (
                              <Badge colorScheme="green" fontSize="xs">Top Choice</Badge>
                            )}
                          </HStack>
                          <Text color="gray.600" fontSize="sm" mb={2}>{localTime}</Text>
                          <HStack spacing={1}>
                            <Text fontSize="xs" color="gray.500">
                              {option.availableCount} of {option.totalParticipants} available
                            </Text>
                            {option.conflicts > 0 && (
                              <Badge colorScheme="orange" fontSize="xs">
                                {option.conflicts} conflict{option.conflicts > 1 ? "s" : ""}
                              </Badge>
                            )}
                          </HStack>
                        </Box>
                        <Box w="120px" ml={4}>
                          <Text fontSize="sm" textAlign="right" mb={1} fontWeight="bold">
                            {Math.round(percentage)}%
                          </Text>
                          <Progress
                            value={percentage}
                            size="sm"
                            colorScheme={isWinner ? "green" : "blue"}
                            borderRadius="full"
                          />
                        </Box>
                      </Flex>
                    </CardBody>
                  </Card>
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
