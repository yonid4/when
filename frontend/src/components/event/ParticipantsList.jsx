import React from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  AvatarGroup,
  Badge,
  Flex
} from "@chakra-ui/react";
import { shadows } from "../../styles/designSystem";

/**
 * Calculate RSVP percentages for the progress bar
 */
const calculateRsvpPercentages = (rsvpStats) => {
  const totalResponses = rsvpStats.going + rsvpStats.maybe + rsvpStats.declined;
  return {
    going: totalResponses ? (rsvpStats.going / totalResponses) * 100 : 0,
    maybe: totalResponses ? (rsvpStats.maybe / totalResponses) * 100 : 0,
    declined: totalResponses ? (rsvpStats.declined / totalResponses) * 100 : 0
  };
};

/**
 * Get RSVP badge color scheme
 */
const getRsvpColorScheme = (status) => {
  switch (status) {
    case "going":
      return "green";
    case "maybe":
      return "yellow";
    case "not_going":
      return "red";
    default:
      return "gray";
  }
};

/**
 * Get RSVP display label
 */
const getRsvpLabel = (status) => {
  switch (status) {
    case "going":
      return "Going";
    case "maybe":
      return "Maybe";
    case "not_going":
      return "Can't";
    default:
      return "Pending";
  }
};

/**
 * ParticipantsList - Displays event participants with RSVP breakdown
 *
 * @param {Object} props
 * @param {Array} props.participants - Array of participant objects
 * @param {Object} props.rsvpStats - RSVP counts { going, maybe, declined }
 * @param {string} props.cardBg - Card background color
 */
const ParticipantsList = ({ participants, rsvpStats, cardBg }) => {
  const rsvpPercentages = calculateRsvpPercentages(rsvpStats);

  return (
    <Box borderWidth="1px" borderRadius="xl" p={4} bg={cardBg} shadow={shadows.card}>
      <HStack justify="space-between" mb={3}>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          textTransform="uppercase"
          letterSpacing="0.5px"
          color="gray.500"
        >
          Participants
        </Text>
        <Badge colorScheme="purple" borderRadius="full" fontSize="xs">
          {participants.length}
        </Badge>
      </HStack>

      {/* Avatar stack preview */}
      <HStack mb={3}>
        <AvatarGroup size="sm" max={5}>
          {participants.map((p) => (
            <Avatar key={p.id} name={p.name || p.email} src={p.avatar_url} />
          ))}
        </AvatarGroup>
        {participants.length > 5 && (
          <Text fontSize="sm" color="gray.500">
            +{participants.length - 5} more
          </Text>
        )}
      </HStack>

      {/* RSVP breakdown bar */}
      <Box w="full" h={2} bg="gray.100" borderRadius="full" overflow="hidden" mb={2}>
        <Flex h="full">
          <Box w={`${rsvpPercentages.going}%`} bg="green.400" />
          <Box w={`${rsvpPercentages.maybe}%`} bg="yellow.400" />
          <Box w={`${rsvpPercentages.declined}%`} bg="red.400" />
        </Flex>
      </Box>

      {/* Expandable participant list */}
      <VStack align="stretch" spacing={2} maxH="200px" overflowY="auto" mt={3}>
        {participants.map((participant) => (
          <HStack key={participant.id} py={1}>
            <Avatar
              size="xs"
              name={participant.name || participant.email}
              src={participant.avatar_url}
            />
            <Text fontSize="sm" flex={1} noOfLines={1}>
              {participant.name || "User"}
            </Text>
            <Badge
              size="sm"
              colorScheme={getRsvpColorScheme(participant.rsvp_status)}
              variant="subtle"
              fontSize="2xs"
            >
              {getRsvpLabel(participant.rsvp_status)}
            </Badge>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
};

export default ParticipantsList;
