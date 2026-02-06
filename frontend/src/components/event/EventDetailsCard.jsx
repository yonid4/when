import React from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Avatar,
  Button,
  Badge,
  Divider,
  Link,
  IconButton,
  Skeleton,
  SkeletonCircle,
  SkeletonText
} from "@chakra-ui/react";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiVideo,
  FiExternalLink,
  FiDownload,
  FiPaperclip,
  FiCheck,
  FiMinus,
  FiX,
  FiUsers,
  FiCoffee,
  FiGift,
  FiMoreHorizontal
} from "react-icons/fi";
import { shadows } from "../../styles/designSystem";
import { formatEventDateTime, formatEventDateOnly } from "../../utils/dateUtils";

const EVENT_TYPE_INFO = {
  meeting: { icon: FiUsers, label: "Meeting", color: "blue" },
  social: { icon: FiCoffee, label: "Social", color: "purple" },
  birthday: { icon: FiGift, label: "Birthday", color: "pink" },
  other: { icon: FiMoreHorizontal, label: "Other", color: "gray" }
};

/**
 * EventDetailsCard - Displays event information in the sidebar
 *
 * @param {Object} props
 * @param {Object} props.event - Event data
 * @param {Object} props.host - Host participant data
 * @param {string} props.userRsvp - Current user's RSVP status
 * @param {Function} props.onRsvp - Handler for RSVP changes
 * @param {Object} props.rsvpStats - RSVP counts { going, maybe, declined }
 * @param {string} props.cardBg - Card background color
 * @param {boolean} props.isLoading - Show skeleton loading state
 */
const EventDetailsCard = ({
  event,
  host,
  userRsvp,
  onRsvp,
  rsvpStats,
  cardBg,
  isLoading = false
}) => {
  const eventTypeInfo = event?.event_type ? EVENT_TYPE_INFO[event.event_type] : null;

  // Skeleton loading state
  if (isLoading) {
    return (
      <Box borderWidth="1px" borderRadius="xl" p={4} bg={cardBg} shadow={shadows.card}>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          textTransform="uppercase"
          letterSpacing="0.5px"
          color="gray.500"
          mb={3}
        >
          Event Details
        </Text>
        <VStack align="stretch" spacing={3}>
          {/* Host and RSVP skeleton */}
          <HStack justify="space-between" align="center" gap={3}>
            <HStack spacing={3} flex={1}>
              <SkeletonCircle size="8" />
              <VStack align="start" spacing={1}>
                <Skeleton height="10px" width="30px" />
                <Skeleton height="14px" width="80px" />
              </VStack>
            </HStack>
            <HStack spacing={2}>
              <Skeleton height="24px" width="60px" borderRadius="full" />
              <Skeleton height="24px" width="60px" borderRadius="full" />
              <Skeleton height="24px" width="55px" borderRadius="full" />
            </HStack>
          </HStack>

          <Divider />

          {/* Date skeleton */}
          <HStack spacing={2}>
            <Skeleton height="16px" width="16px" />
            <Skeleton height="14px" width="180px" />
          </HStack>

          {/* Duration skeleton */}
          <HStack spacing={2}>
            <Skeleton height="16px" width="16px" />
            <Skeleton height="14px" width="80px" />
          </HStack>

          <Divider />

          {/* Description skeleton */}
          <SkeletonText noOfLines={2} spacing={2} />

          {/* Event type badge skeleton */}
          <Skeleton height="24px" width="80px" borderRadius="md" />
        </VStack>
      </Box>
    );
  }

  return (
    <Box borderWidth="1px" borderRadius="xl" p={4} bg={cardBg} shadow={shadows.card}>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        textTransform="uppercase"
        letterSpacing="0.5px"
        color="gray.500"
        mb={3}
      >
        Event Details
      </Text>
      <VStack align="stretch" spacing={3}>
        {/* Host and RSVP */}
        <HStack justify="space-between" align="center" gap={3}>
          <HStack spacing={3} flex={1}>
            <Avatar size="sm" name={host?.name || "Coordinator"} src={host?.avatar_url} />
            <VStack align="start" spacing={0}>
              <Text fontSize="xs" color="gray.500">Host</Text>
              <Text fontWeight="medium" fontSize="sm">{host?.name || "Coordinator"}</Text>
            </VStack>
          </HStack>

          <VStack align="end" spacing={1}>
            <HStack spacing={2}>
              <Button
                size="xs"
                colorScheme="green"
                variant={userRsvp === "going" ? "solid" : "outline"}
                borderRadius="full"
                onClick={() => onRsvp("going")}
                leftIcon={<FiCheck />}
              >
                Going
              </Button>
              <Button
                size="xs"
                colorScheme="yellow"
                variant={userRsvp === "maybe" ? "solid" : "outline"}
                borderRadius="full"
                onClick={() => onRsvp("maybe")}
                leftIcon={<FiMinus />}
              >
                Maybe
              </Button>
              <Button
                size="xs"
                colorScheme="red"
                variant={userRsvp === "not_going" ? "solid" : "outline"}
                borderRadius="full"
                onClick={() => onRsvp("not_going")}
                leftIcon={<FiX />}
              >
                Can't
              </Button>
            </HStack>
            <Text fontSize="2xs" color="gray.600">
              {rsvpStats.going} going · {rsvpStats.maybe} maybe · {rsvpStats.declined} can't
            </Text>
          </VStack>
        </HStack>

        <Divider />

        {/* Date info */}
        <Box>
          <HStack spacing={2} color="gray.700">
            <Icon as={FiCalendar} boxSize={4} color="gray.500" />
            <Text fontSize="sm">
              {event.status === "finalized" && event.finalized_start_time_utc
                ? formatEventDateTime(event.finalized_start_time_utc, event.coordinator_timezone)
                : event.earliest_datetime_utc && event.latest_datetime_utc
                ? `${formatEventDateOnly(event.earliest_datetime_utc, event.coordinator_timezone)} - ${formatEventDateOnly(event.latest_datetime_utc, event.coordinator_timezone)}`
                : "Date TBD"}
            </Text>
          </HStack>
        </Box>

        {/* Duration */}
        <Box>
          <HStack spacing={2} color="gray.700">
            <Icon as={FiClock} boxSize={4} color="gray.500" />
            <Text fontSize="sm">{event.duration_minutes} minutes</Text>
          </HStack>
        </Box>

        {/* Location */}
        {event.location && (
          <Box>
            <HStack spacing={2} color="gray.700">
              <Icon as={FiMapPin} boxSize={4} color="gray.500" />
              <Text fontSize="sm" noOfLines={2}>{event.location}</Text>
            </HStack>
          </Box>
        )}

        {/* Video Call Link */}
        {event.video_call_link && (
          <Link href={event.video_call_link} isExternal>
            <HStack spacing={2} color="blue.500" _hover={{ color: "blue.600" }}>
              <Icon as={FiVideo} boxSize={4} />
              <Text fontSize="sm">Join Meeting</Text>
              <Icon as={FiExternalLink} boxSize={3} />
            </HStack>
          </Link>
        )}

        <Divider />

        {/* Description */}
        {event.description && (
          <Text color="gray.600" fontSize="sm" lineHeight="tall">
            {event.description}
          </Text>
        )}

        {/* Event Type Badge */}
        {eventTypeInfo && (
          <Badge
            colorScheme={eventTypeInfo.color}
            variant="subtle"
            px={2}
            py={1}
            borderRadius="md"
          >
            <HStack spacing={1}>
              <Icon as={eventTypeInfo.icon} boxSize={3} />
              <Text fontSize="xs">{eventTypeInfo.label}</Text>
            </HStack>
          </Badge>
        )}

        {/* Attachments */}
        {event.attachments && event.attachments.length > 0 && (
          <>
            <Divider />
            <Box>
              <Text fontSize="xs" color="gray.500" mb={2}>Attachments</Text>
              <VStack align="stretch" spacing={1}>
                {event.attachments.map((file) => (
                  <HStack
                    key={file.id}
                    p={2}
                    bg="gray.50"
                    borderRadius="md"
                    justify="space-between"
                  >
                    <HStack>
                      <Icon as={FiPaperclip} boxSize={3} color="gray.500" />
                      <Text fontSize="xs" fontWeight="medium" noOfLines={1}>
                        {file.name}
                      </Text>
                    </HStack>
                    <IconButton
                      icon={<FiDownload />}
                      size="xs"
                      variant="ghost"
                      aria-label="Download"
                    />
                  </HStack>
                ))}
              </VStack>
            </Box>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default EventDetailsCard;
