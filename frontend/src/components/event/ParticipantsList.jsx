import React from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  AvatarGroup,
  Badge,
  Flex,
  Skeleton,
  SkeletonCircle
} from "@chakra-ui/react";
import { shadows } from "../../styles/designSystem";

function calculateRsvpPercentages(rsvpStats) {
  const total = rsvpStats.going + rsvpStats.maybe + rsvpStats.declined;
  if (!total) return { going: 0, maybe: 0, declined: 0 };
  return {
    going: (rsvpStats.going / total) * 100,
    maybe: (rsvpStats.maybe / total) * 100,
    declined: (rsvpStats.declined / total) * 100
  };
}

const RSVP_CONFIG = {
  going: { color: "green", label: "Going" },
  maybe: { color: "yellow", label: "Maybe" },
  not_going: { color: "red", label: "Can't" }
};

const getRsvpColorScheme = (status) => RSVP_CONFIG[status]?.color || "gray";
const getRsvpLabel = (status) => RSVP_CONFIG[status]?.label || "Pending";

/**
 * ParticipantsList - Displays event participants with RSVP breakdown
 *
 * @param {Object} props
 * @param {Array} props.participants - Array of participant objects
 * @param {Object} props.rsvpStats - RSVP counts { going, maybe, declined }
 * @param {string} props.cardBg - Card background color
 * @param {boolean} props.isLoading - Show skeleton loading state
 */
const ParticipantsList = ({ participants, rsvpStats, cardBg, isLoading = false }) => {
  const rsvpPercentages = calculateRsvpPercentages(rsvpStats || { going: 0, maybe: 0, declined: 0 });

  if (isLoading) {
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
          <Skeleton height="18px" width="24px" borderRadius="full" />
        </HStack>

        {/* Avatar stack skeleton */}
        <HStack mb={3} spacing={-2}>
          <SkeletonCircle size="8" />
          <SkeletonCircle size="8" />
          <SkeletonCircle size="8" />
          <SkeletonCircle size="8" />
        </HStack>

        {/* RSVP bar skeleton */}
        <Skeleton height="8px" width="100%" borderRadius="full" mb={2} />

        {/* Participant list skeleton */}
        <VStack align="stretch" spacing={2} mt={3}>
          {[1, 2, 3].map((i) => (
            <HStack key={i} py={1}>
              <SkeletonCircle size="6" />
              <Skeleton height="14px" flex={1} />
              <Skeleton height="16px" width="50px" borderRadius="md" />
            </HStack>
          ))}
        </VStack>
      </Box>
    );
  }

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
        <Badge colorScheme="brand" borderRadius="full" fontSize="xs">
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
