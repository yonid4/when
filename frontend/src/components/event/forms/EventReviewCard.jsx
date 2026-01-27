import React from "react";
import {
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  CardBody,
  Icon,
  IconButton,
  Avatar,
  Badge,
  Wrap,
  WrapItem
} from "@chakra-ui/react";
import { FiCalendar, FiClock, FiMapPin, FiVideo, FiMail, FiEdit } from "react-icons/fi";
import { colors } from "../../../styles/designSystem";
import { eventTypes } from "./EventBasicsForm";

/**
 * EventReviewCard - Fifth step of event creation
 * Displays a summary of all event details for review
 *
 * @param {Object} props
 * @param {Object} props.formData - Complete form data
 * @param {Function} props.onEditStep - Handler to navigate to a specific step
 */
const EventReviewCard = ({ formData, onEditStep }) => {
  const currentEventType = eventTypes.find((t) => t.value === formData.type);

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="md">Review Your Event</Heading>
      <Text color="gray.600">
        Please review all details before sending invitations
      </Text>

      {/* Title and Type */}
      <Card variant="outline">
        <CardBody>
          <VStack align="stretch" spacing={4}>
            <HStack justify="space-between">
              <Text fontWeight="bold">Event Title</Text>
              <IconButton
                icon={<FiEdit />}
                size="sm"
                variant="ghost"
                onClick={() => onEditStep(0)}
                aria-label="Edit"
              />
            </HStack>
            <Heading size="lg">{formData.title || "Untitled Event"}</Heading>
            <Badge w="fit-content" colorScheme={currentEventType?.color}>
              {currentEventType?.emoji} {formData.type}
            </Badge>
            {formData.description && (
              <Text color="gray.700">{formData.description}</Text>
            )}
          </VStack>
        </CardBody>
      </Card>

      {/* When */}
      <Card variant="outline">
        <CardBody>
          <HStack justify="space-between" mb={4}>
            <Text fontWeight="bold">When</Text>
            <IconButton
              icon={<FiEdit />}
              size="sm"
              variant="ghost"
              onClick={() => onEditStep(1)}
              aria-label="Edit"
            />
          </HStack>
          {formData.schedulingMode === "single" ? (
            <VStack align="start" spacing={2}>
              <HStack>
                <Icon as={FiCalendar} color={colors.primary} />
                <Text>{formData.date || "No date selected"}</Text>
              </HStack>
              <HStack>
                <Icon as={FiClock} color={colors.secondary} />
                <Text>{formData.time || "No time selected"}</Text>
              </HStack>
              <Text fontSize="sm" color="gray.600">
                Duration: {formData.duration} minutes
              </Text>
            </VStack>
          ) : (
            <VStack align="start" spacing={2}>
              <Text>Multiple time options:</Text>
              <Text fontWeight="medium">
                Range: {formData.startDate} to {formData.endDate}
              </Text>
              <Text fontSize="sm" color="gray.600">
                Daily: {formData.earliestHour}:00 - {formData.latestHour}:00
              </Text>
              <Text fontSize="sm" color="gray.600">
                Duration: {formData.duration} minutes
              </Text>
            </VStack>
          )}
        </CardBody>
      </Card>

      {/* Guests */}
      <Card variant="outline">
        <CardBody>
          <HStack justify="space-between" mb={4}>
            <Text fontWeight="bold">Guests ({formData.guests.length})</Text>
            <IconButton
              icon={<FiEdit />}
              size="sm"
              variant="ghost"
              onClick={() => onEditStep(2)}
              aria-label="Edit"
            />
          </HStack>
          {formData.guests.length > 0 ? (
            <Wrap spacing={2}>
              {formData.guests.map((guest) => (
                <WrapItem key={guest.id}>
                  <HStack>
                    <Avatar size="sm" name={guest.name} src={guest.avatar} />
                    <Text fontSize="sm">{guest.name}</Text>
                  </HStack>
                </WrapItem>
              ))}
            </Wrap>
          ) : (
            <Text color="gray.500">No guests added</Text>
          )}
        </CardBody>
      </Card>

      {/* Location */}
      <Card variant="outline">
        <CardBody>
          <HStack justify="space-between" mb={4}>
            <Text fontWeight="bold">Location</Text>
            <IconButton
              icon={<FiEdit />}
              size="sm"
              variant="ghost"
              onClick={() => onEditStep(3)}
              aria-label="Edit"
            />
          </HStack>
          <HStack>
            <Icon as={formData.isVirtual ? FiVideo : FiMapPin} color={colors.primary} />
            <Text>
              {formData.isVirtual
                ? formData.videoLink || "Virtual Event"
                : formData.location || "No location specified"}
            </Text>
          </HStack>
        </CardBody>
      </Card>

      {/* Ready to send */}
      <Card bg="purple.50" variant="outline" borderColor="purple.200">
        <CardBody>
          <VStack spacing={3}>
            <Icon as={FiMail} boxSize={8} color={colors.primary} />
            <Text fontWeight="bold" textAlign="center">
              Ready to send invitations?
            </Text>
            <Text fontSize="sm" color="gray.600" textAlign="center">
              All {formData.guests.length} guest
              {formData.guests.length !== 1 ? "s" : ""} will receive an email
              invitation with event details
            </Text>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default EventReviewCard;
