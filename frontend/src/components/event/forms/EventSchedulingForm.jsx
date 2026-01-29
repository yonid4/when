import React, { useEffect } from "react";
import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Select,
  Grid,
  Card,
  CardBody,
  Text,
  Icon,
  Box,
  Badge,
  Button,
  ButtonGroup,
  Divider
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FiCalendar, FiClock, FiUsers } from "react-icons/fi";
import { colors } from "../../../styles/designSystem";

const MotionBox = motion(Box);

/**
 * Duration options for events
 */
export const durationOptions = [
  { value: "15", label: "15 min", short: "15m" },
  { value: "30", label: "30 min", short: "30m" },
  { value: "60", label: "1 hour", short: "1h" },
  { value: "90", label: "1.5 hours", short: "1.5h" },
  { value: "120", label: "2 hours", short: "2h" },
  { value: "180", label: "3 hours", short: "3h" }
];

/**
 * Format hour to 12-hour display
 */
const formatHour = (hour) => {
  const h = parseInt(hour);
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
};

/**
 * Get smart defaults for date range
 */
const getDefaultDates = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const twoWeeksOut = new Date();
  twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);

  return {
    startDate: tomorrow.toISOString().split('T')[0],
    endDate: twoWeeksOut.toISOString().split('T')[0]
  };
};

/**
 * EventSchedulingForm - Second step of event creation
 * Concept A: Calendar-Centric with inline date pickers
 *
 * @param {Object} props
 * @param {Object} props.formData - Form data containing scheduling fields
 * @param {Function} props.onChange - Handler for input changes
 */
const EventSchedulingForm = ({ formData, onChange }) => {
  const handleInputChange = (field, value) => {
    onChange(field, value);
  };

  // Set smart defaults on mount if dates are empty
  useEffect(() => {
    if (formData.schedulingMode === "multiple" && !formData.startDate && !formData.endDate) {
      const defaults = getDefaultDates();
      onChange("startDate", defaults.startDate);
      onChange("endDate", defaults.endDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.schedulingMode]);

  const isMultipleMode = formData.schedulingMode === "multiple";
  const isSingleMode = formData.schedulingMode === "single";

  return (
    <VStack spacing={8} align="stretch">
      {/* Step Header */}
      <MotionBox
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <HStack spacing={3} mb={2}>
          <Icon as={FiCalendar} color={colors.primary} boxSize={5} />
          <Text
            fontSize="sm"
            fontWeight="semibold"
            textTransform="uppercase"
            letterSpacing="0.5px"
            color={colors.primary}
          >
            Step 2 of 5
          </Text>
        </HStack>
        <Text fontSize="2xl" fontWeight="bold" color={colors.textHeading}>
          When should it happen?
        </Text>
        <Text color={colors.textMuted} mt={1}>
          Choose a specific time or let participants vote on the best time.
        </Text>
      </MotionBox>

      {/* Scheduling Mode Selection */}
      <MotionBox
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <FormControl>
          <FormLabel
            fontSize="sm"
            fontWeight="semibold"
            textTransform="uppercase"
            letterSpacing="0.5px"
            color="gray.600"
          >
            Scheduling Mode
          </FormLabel>
          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            {/* Single Time Option */}
            <Card
              variant="outline"
              cursor="pointer"
              borderWidth={2}
              borderColor={isSingleMode ? colors.primary : "gray.200"}
              bg={isSingleMode ? colors.primarySoft : "white"}
              onClick={() => handleInputChange("schedulingMode", "single")}
              _hover={{ borderColor: isSingleMode ? colors.primary : "gray.300" }}
              transition="all 0.15s ease"
              borderRadius="lg"
            >
              <CardBody py={5}>
                <VStack align="start" spacing={2}>
                  <HStack spacing={3}>
                    <Box
                      w="40px"
                      h="40px"
                      borderRadius="lg"
                      bg={isSingleMode ? colors.primary : "gray.100"}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icon
                        as={FiCalendar}
                        boxSize={5}
                        color={isSingleMode ? "white" : "gray.500"}
                      />
                    </Box>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold" color={isSingleMode ? colors.primary : "gray.800"}>
                        Fixed Time
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        I know the exact date & time
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Multiple Times Option */}
            <Card
              variant="outline"
              cursor="pointer"
              borderWidth={2}
              borderColor={isMultipleMode ? colors.primary : "gray.200"}
              bg={isMultipleMode ? colors.primarySoft : "white"}
              onClick={() => handleInputChange("schedulingMode", "multiple")}
              _hover={{ borderColor: isMultipleMode ? colors.primary : "gray.300" }}
              transition="all 0.15s ease"
              borderRadius="lg"
              position="relative"
            >
              <Badge
                position="absolute"
                top={-2}
                right={3}
                colorScheme="purple"
                fontSize="xs"
                px={2}
                borderRadius="full"
              >
                Recommended
              </Badge>
              <CardBody py={5}>
                <VStack align="start" spacing={2}>
                  <HStack spacing={3}>
                    <Box
                      w="40px"
                      h="40px"
                      borderRadius="lg"
                      bg={isMultipleMode ? colors.primary : "gray.100"}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icon
                        as={FiUsers}
                        boxSize={5}
                        color={isMultipleMode ? "white" : "gray.500"}
                      />
                    </Box>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold" color={isMultipleMode ? colors.primary : "gray.800"}>
                        Find Best Time
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Let guests vote on options
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </Grid>
        </FormControl>
      </MotionBox>

      {/* Single Mode Fields */}
      {isSingleMode && (
        <MotionBox
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card variant="outline" borderRadius="lg" bg="gray.50">
            <CardBody>
              <VStack spacing={5} align="stretch">
                <Text fontWeight="semibold" color="gray.700">
                  Select Date & Time
                </Text>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" color="gray.600">Date</FormLabel>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      bg="white"
                      borderRadius="lg"
                      size="lg"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" color="gray.600">Start Time</FormLabel>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange("time", e.target.value)}
                      bg="white"
                      borderRadius="lg"
                      size="lg"
                    />
                  </FormControl>
                </Grid>
              </VStack>
            </CardBody>
          </Card>
        </MotionBox>
      )}

      {/* Multiple Mode Fields */}
      {isMultipleMode && (
        <MotionBox
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card variant="outline" borderRadius="lg" bg="purple.50" borderColor="purple.200">
            <CardBody>
              <VStack spacing={6} align="stretch">
                {/* Date Range Section */}
                <Box>
                  <HStack spacing={2} mb={3}>
                    <Icon as={FiCalendar} color={colors.primary} boxSize={4} />
                    <Text fontWeight="semibold" color="gray.700">
                      Date Range
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.600" mb={4}>
                    Guests can vote for times within this window
                  </Text>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <FormControl isRequired>
                      <FormLabel fontSize="sm" color="gray.600">From</FormLabel>
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange("startDate", e.target.value)}
                        bg="white"
                        borderRadius="lg"
                        size="lg"
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel fontSize="sm" color="gray.600">To</FormLabel>
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => handleInputChange("endDate", e.target.value)}
                        bg="white"
                        borderRadius="lg"
                        size="lg"
                      />
                    </FormControl>
                  </Grid>
                </Box>

                <Divider borderColor="purple.200" />

                {/* Daily Hours Section */}
                <Box>
                  <HStack spacing={2} mb={3}>
                    <Icon as={FiClock} color={colors.primary} boxSize={4} />
                    <Text fontWeight="semibold" color="gray.700">
                      Daily Hours
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.600" mb={4}>
                    What hours are you available each day?
                  </Text>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <FormControl isRequired>
                      <FormLabel fontSize="sm" color="gray.600">Earliest</FormLabel>
                      <Select
                        value={formData.earliestHour}
                        onChange={(e) => handleInputChange("earliestHour", e.target.value)}
                        bg="white"
                        borderRadius="lg"
                        size="lg"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i.toString()}>
                            {formatHour(i)}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel fontSize="sm" color="gray.600">Latest</FormLabel>
                      <Select
                        value={formData.latestHour}
                        onChange={(e) => handleInputChange("latestHour", e.target.value)}
                        bg="white"
                        borderRadius="lg"
                        size="lg"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i.toString()}>
                            {formatHour(i)}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </MotionBox>
      )}

      {/* Duration Selection - Pill Style */}
      <MotionBox
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <FormControl isRequired>
          <FormLabel
            fontSize="sm"
            fontWeight="semibold"
            textTransform="uppercase"
            letterSpacing="0.5px"
            color="gray.600"
          >
            Event Duration
          </FormLabel>
          <ButtonGroup spacing={2} flexWrap="wrap">
            {durationOptions.map((option) => {
              const isSelected = formData.duration === option.value;
              return (
                <Button
                  key={option.value}
                  size="md"
                  variant={isSelected ? "solid" : "outline"}
                  colorScheme={isSelected ? "purple" : "gray"}
                  borderRadius="full"
                  onClick={() => handleInputChange("duration", option.value)}
                  px={5}
                  fontWeight={isSelected ? "bold" : "medium"}
                  mb={2}
                >
                  {option.label}
                </Button>
              );
            })}
          </ButtonGroup>
          <FormHelperText color="gray.500">
            How long will your event last?
          </FormHelperText>
        </FormControl>
      </MotionBox>
    </VStack>
  );
};

export default EventSchedulingForm;
