import React from "react";
import {
  Box,
  Grid,
  GridItem,
  Text,
  HStack,
  VStack,
  Icon
} from "@chakra-ui/react";
import { FiCalendar, FiCheck } from "react-icons/fi";
import { colors, shadows } from "../../styles/designSystem";

/**
 * A stylized calendar illustration used in the scroll zoom section.
 * Shows a mock calendar with some time slots marked as available.
 */
const CalendarIllustration = () => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const times = ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM"];

  // Mock availability pattern
  const availableSlots = [
    [false, true, false, true, false],
    [true, true, false, false, true],
    [false, false, true, true, true],
    [true, false, true, false, false],
    [false, true, true, true, false],
    [true, true, false, true, true]
  ];

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      boxShadow={shadows["2xl"]}
      p={6}
      maxW="600px"
      mx="auto"
      border="1px solid"
      borderColor="gray.100"
    >
      {/* Calendar Header */}
      <HStack justify="space-between" mb={6}>
        <HStack spacing={3}>
          <Box
            p={2}
            bg={colors.primarySoft}
            borderRadius="lg"
          >
            <Icon as={FiCalendar} boxSize={5} color={colors.primary} />
          </Box>
          <VStack align="start" spacing={0}>
            <Text fontWeight="bold" color={colors.textPrimary}>
              Team Availability
            </Text>
            <Text fontSize="sm" color={colors.textSecondary}>
              December 2024
            </Text>
          </VStack>
        </HStack>
        <HStack spacing={2}>
          <Box w={3} h={3} bg={colors.secondary} borderRadius="full" />
          <Text fontSize="xs" color={colors.textSecondary}>
            Available
          </Text>
        </HStack>
      </HStack>

      {/* Calendar Grid */}
      <Grid
        templateColumns="60px repeat(5, 1fr)"
        gap={2}
      >
        {/* Day headers */}
        <GridItem />
        {days.map((day) => (
          <GridItem key={day}>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color={colors.textSecondary}
              textAlign="center"
            >
              {day}
            </Text>
          </GridItem>
        ))}

        {/* Time slots */}
        {times.map((time, timeIndex) => (
          <React.Fragment key={time}>
            <GridItem>
              <Text
                fontSize="xs"
                color={colors.textSecondary}
                textAlign="right"
                pr={2}
              >
                {time}
              </Text>
            </GridItem>
            {days.map((day, dayIndex) => {
              const isAvailable = availableSlots[timeIndex][dayIndex];
              return (
                <GridItem key={`${day}-${time}`}>
                  <Box
                    h="36px"
                    borderRadius="md"
                    bg={isAvailable ? `${colors.secondary}20` : "gray.50"}
                    border="1px solid"
                    borderColor={isAvailable ? colors.secondary : "gray.100"}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    transition="all 0.2s"
                  >
                    {isAvailable && (
                      <Icon
                        as={FiCheck}
                        boxSize={3}
                        color={colors.secondary}
                      />
                    )}
                  </Box>
                </GridItem>
              );
            })}
          </React.Fragment>
        ))}
      </Grid>

      {/* Footer */}
      <HStack justify="center" mt={6} spacing={4}>
        <HStack spacing={1}>
          <Text fontSize="2xl" fontWeight="bold" color={colors.primary}>
            12
          </Text>
          <Text fontSize="sm" color={colors.textSecondary}>
            slots available
          </Text>
        </HStack>
        <Box w="1px" h={6} bg="gray.200" />
        <HStack spacing={1}>
          <Text fontSize="2xl" fontWeight="bold" color={colors.secondary}>
            5
          </Text>
          <Text fontSize="sm" color={colors.textSecondary}>
            participants
          </Text>
        </HStack>
      </HStack>
    </Box>
  );
};

export default CalendarIllustration;
