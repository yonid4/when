import React from "react";
import {
  VStack,
  HStack,
  Grid,
  GridItem,
  Heading,
  Text,
  Card,
  CardBody,
  Icon,
  IconButton,
  Avatar,
  Badge,
  Box,
  Flex
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiVideo,
  FiEdit2,
  FiCheck,
  FiUsers,
  FiSend
} from "react-icons/fi";
import { colors } from "../../../styles/designSystem";
import { eventTypes, getDurationLabel } from "../../../constants/eventConstants";
import { formatHour } from "../../../utils/dateTimeUtils";

const MotionBox = motion(Box);

const MAX_VISIBLE_GUESTS = 8;

function formatDate(dateStr) {
  if (!dateStr) return "Not set";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

const SectionCard = ({ title, icon, onEdit, stepIndex, children }) => (
  <Card variant="outline" borderRadius="lg" bg="white">
    <CardBody>
      <VStack align="stretch" spacing={4}>
        <HStack justify="space-between">
          <HStack spacing={2}>
            <Icon as={icon} color={colors.primary} boxSize={4} />
            <Text fontWeight="semibold" color="gray.700">{title}</Text>
          </HStack>
          <IconButton
            icon={<FiEdit2 />}
            size="sm"
            variant="ghost"
            colorScheme="purple"
            onClick={() => onEdit(stepIndex)}
            aria-label={`Edit ${title}`}
          />
        </HStack>
        {children}
      </VStack>
    </CardBody>
  </Card>
);

const EventReviewCard = ({ formData, onEditStep }) => {
  const currentEventType = eventTypes.find((t) => t.value === formData.type);
  const guestCount = formData.guests?.length || 0;

  return (
    <VStack spacing={6} align="stretch">
      {/* Step Header */}
      <MotionBox
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <HStack spacing={3} mb={2}>
          <Icon as={FiCheck} color={colors.primary} boxSize={5} />
          <Text
            fontSize="sm"
            fontWeight="semibold"
            textTransform="uppercase"
            letterSpacing="0.5px"
            color={colors.primary}
          >
            Step 5 of 5
          </Text>
        </HStack>
        <Text fontSize="2xl" fontWeight="bold" color={colors.textHeading}>
          Review & Create
        </Text>
        <Text color={colors.textMuted} mt={1}>
          Take a moment to review your event details before creating it.
        </Text>
      </MotionBox>

      {/* Two-Column Layout */}
      <Grid templateColumns={{ base: "1fr", lg: "1fr" }} gap={6}>
        {/* Left Column - Summary */}
        <GridItem>
          <VStack spacing={4} align="stretch">
            {/* Event Basics */}
            <MotionBox
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card
                variant="outline"
                borderRadius="lg"
                bg="white"
                borderColor="gray.200"
                overflow="hidden"
              >
                {/* Event Title Hero Section */}
                <Box
                  bg={`linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`}
                  py={6}
                  px={6}
                >
                  <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={2}>
                      <Badge
                        bg="whiteAlpha.200"
                        color="white"
                        fontSize="xs"
                        px={2}
                        py={1}
                        borderRadius="full"
                        display="flex"
                        alignItems="center"
                        gap={1}
                      >
                        {currentEventType?.icon && (
                          <Icon as={currentEventType.icon} boxSize={3} />
                        )}
                        {currentEventType?.label || formData.type}
                      </Badge>
                      <Heading size="lg" color="white">
                        {formData.title || "Untitled Event"}
                      </Heading>
                      {formData.description && (
                        <Text color="whiteAlpha.800" fontSize="sm" noOfLines={2}>
                          {formData.description}
                        </Text>
                      )}
                    </VStack>
                    <IconButton
                      icon={<FiEdit2 />}
                      size="sm"
                      variant="ghost"
                      color="white"
                      _hover={{ bg: "whiteAlpha.200" }}
                      onClick={() => onEditStep(0)}
                      aria-label="Edit basics"
                    />
                  </HStack>
                </Box>

                <CardBody>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    {/* When Section */}
                    <Box>
                      <HStack spacing={2} mb={2}>
                        <Icon as={FiCalendar} color={colors.primary} boxSize={4} />
                        <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                          WHEN
                        </Text>
                        <IconButton
                          icon={<FiEdit2 />}
                          size="xs"
                          variant="ghost"
                          colorScheme="purple"
                          onClick={() => onEditStep(1)}
                          aria-label="Edit when"
                          ml="auto"
                        />
                      </HStack>
                      {formData.schedulingMode === "single" ? (
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">
                            {formatDate(formData.date)}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            at {formData.time || "Time not set"}
                          </Text>
                        </VStack>
                      ) : (
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">
                            {formatDate(formData.startDate)} — {formatDate(formData.endDate)}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {formatHour(formData.earliestHour)} – {formatHour(formData.latestHour)} daily
                          </Text>
                        </VStack>
                      )}
                      <Badge mt={2} colorScheme="gray" fontSize="xs">
                        <Icon as={FiClock} mr={1} />
                        {getDurationLabel(formData.duration)}
                      </Badge>
                    </Box>

                    {/* Where Section */}
                    <Box>
                      <HStack spacing={2} mb={2}>
                        <Icon as={formData.isVirtual ? FiVideo : FiMapPin} color={colors.primary} boxSize={4} />
                        <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                          WHERE
                        </Text>
                        <IconButton
                          icon={<FiEdit2 />}
                          size="xs"
                          variant="ghost"
                          colorScheme="purple"
                          onClick={() => onEditStep(3)}
                          aria-label="Edit where"
                          ml="auto"
                        />
                      </HStack>
                      <VStack align="start" spacing={1}>
                        {formData.isVirtual && (
                          <>
                            <Badge colorScheme="blue" fontSize="xs">
                              <Icon as={FiVideo} mr={1} />
                              Virtual Meeting
                            </Badge>
                            {formData.videoLink && (
                              <Text fontSize="sm" color="gray.600" noOfLines={1}>
                                {formData.videoLink}
                              </Text>
                            )}
                          </>
                        )}
                        {formData.location && (
                          <Text fontWeight="medium" noOfLines={2}>
                            {formData.location}
                          </Text>
                        )}
                        {!formData.isVirtual && !formData.location && (
                          <Text color="gray.500" fontStyle="italic">
                            No location specified
                          </Text>
                        )}
                      </VStack>
                    </Box>
                  </Grid>
                </CardBody>
              </Card>
            </MotionBox>

            {/* Guests Section */}
            <MotionBox
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <SectionCard
                title={`Guests (${guestCount})`}
                icon={FiUsers}
                onEdit={onEditStep}
                stepIndex={2}
              >
                {guestCount > 0 ? (
                  <Flex flexWrap="wrap" gap={2}>
                    {formData.guests.slice(0, MAX_VISIBLE_GUESTS).map((guest) => (
                      <HStack
                        key={guest.id}
                        bg="gray.50"
                        px={3}
                        py={2}
                        borderRadius="full"
                        spacing={2}
                      >
                        <Avatar
                          size="xs"
                          name={guest.full_name || guest.name || guest.email}
                          src={guest.avatar_url}
                        />
                        <Text fontSize="sm">
                          {guest.full_name || guest.name || guest.email}
                        </Text>
                      </HStack>
                    ))}
                    {guestCount > MAX_VISIBLE_GUESTS && (
                      <Badge colorScheme="purple" borderRadius="full" px={3} py={2}>
                        +{guestCount - MAX_VISIBLE_GUESTS} more
                      </Badge>
                    )}
                  </Flex>
                ) : (
                  <Text color="gray.500" fontStyle="italic">
                    No guests added yet
                  </Text>
                )}
              </SectionCard>
            </MotionBox>
          </VStack>
        </GridItem>
      </Grid>

      {/* Ready to Send Card */}
      <MotionBox
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card
          bg={colors.primarySoft}
          variant="outline"
          borderColor={colors.primary}
          borderRadius="lg"
        >
          <CardBody>
            <HStack spacing={4}>
              <Flex
                w="48px"
                h="48px"
                borderRadius="full"
                bg={colors.primary}
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Icon as={FiSend} color="white" boxSize={5} />
              </Flex>
              <VStack align="start" spacing={0} flex={1}>
                <Text fontWeight="bold" color={colors.textHeading}>
                  Ready to create your event?
                </Text>
                <Text fontSize="sm" color={colors.textMuted}>
                  {guestCount > 0
                    ? `${guestCount} guest${guestCount !== 1 ? "s" : ""} will receive an email invitation`
                    : "You can invite guests later from the event page"}
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>
      </MotionBox>
    </VStack>
  );
};

export default EventReviewCard;
