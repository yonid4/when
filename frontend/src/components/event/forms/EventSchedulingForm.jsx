import React from "react";
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Grid,
  Card,
  CardBody,
  Text,
  HStack,
  RadioGroup,
  Radio,
  Stack,
  Badge,
  Divider
} from "@chakra-ui/react";
import { colors } from "../../../styles/designSystem";

/**
 * Duration options for events
 */
export const durationOptions = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
  { value: "180", label: "3 hours" },
  { value: "custom", label: "Custom" }
];

/**
 * EventSchedulingForm - Second step of event creation
 * Handles scheduling mode selection, date/time inputs, and duration
 *
 * @param {Object} props
 * @param {Object} props.formData - Form data containing scheduling fields
 * @param {Function} props.onChange - Handler for input changes
 * @param {string} props.borderColor - Border color for cards
 */
const EventSchedulingForm = ({ formData, onChange, borderColor }) => {
  const handleInputChange = (field, value) => {
    onChange(field, value);
  };

  return (
    <VStack spacing={6} align="stretch">
      <FormControl>
        <FormLabel fontSize="lg" fontWeight="bold">
          How do you want to schedule this?
        </FormLabel>
        <RadioGroup
          value={formData.schedulingMode}
          onChange={(value) => handleInputChange("schedulingMode", value)}
        >
          <Stack spacing={4}>
            <Card
              variant="outline"
              cursor="pointer"
              borderWidth={2}
              borderColor={
                formData.schedulingMode === "single" ? colors.primary : borderColor
              }
              bg={formData.schedulingMode === "single" ? "purple.50" : "transparent"}
              onClick={() => handleInputChange("schedulingMode", "single")}
            >
              <CardBody>
                <HStack spacing={4}>
                  <Radio value="single" size="lg" />
                  <VStack align="start" spacing={1} flex={1}>
                    <Text fontWeight="bold">Single Time</Text>
                    <Text fontSize="sm" color="gray.600">
                      I know when the event should be
                    </Text>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>

            <Card
              variant="outline"
              cursor="pointer"
              borderWidth={2}
              borderColor={
                formData.schedulingMode === "multiple" ? colors.primary : borderColor
              }
              bg={formData.schedulingMode === "multiple" ? "purple.50" : "transparent"}
              onClick={() => handleInputChange("schedulingMode", "multiple")}
            >
              <CardBody>
                <HStack spacing={4}>
                  <Radio value="multiple" size="lg" />
                  <VStack align="start" spacing={1} flex={1}>
                    <Text fontWeight="bold">Find Best Time</Text>
                    <Text fontSize="sm" color="gray.600">
                      Let guests vote on multiple time options
                    </Text>
                  </VStack>
                  <Badge colorScheme="purple">Recommended</Badge>
                </HStack>
              </CardBody>
            </Card>
          </Stack>
        </RadioGroup>
      </FormControl>

      {formData.schedulingMode === "single" && (
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
          <FormControl isRequired>
            <FormLabel>Date</FormLabel>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Start Time</FormLabel>
            <Input
              type="time"
              value={formData.time}
              onChange={(e) => handleInputChange("time", e.target.value)}
            />
          </FormControl>
        </Grid>
      )}

      {formData.schedulingMode === "multiple" && (
        <Card variant="outline" bg="blue.50">
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold">Select Date Range</Text>
              <Text fontSize="sm" color="gray.600">
                Choose the range of dates for guests to vote on.
              </Text>

              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                <FormControl isRequired>
                  <FormLabel>Start Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange("startDate", e.target.value)}
                    bg="white"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>End Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange("endDate", e.target.value)}
                    bg="white"
                  />
                </FormControl>
              </Grid>

              <Divider borderColor="blue.200" />

              <Text fontWeight="bold">Daily Time Range</Text>
              <Text fontSize="sm" color="gray.600">
                What hours are available each day?
              </Text>

              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                <FormControl isRequired>
                  <FormLabel>Earliest Start Time</FormLabel>
                  <Select
                    value={formData.earliestHour}
                    onChange={(e) => handleInputChange("earliestHour", e.target.value)}
                    bg="white"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i.toString()}>
                        {i === 0
                          ? "12 AM"
                          : i < 12
                          ? `${i} AM`
                          : i === 12
                          ? "12 PM"
                          : `${i - 12} PM`}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Latest End Time</FormLabel>
                  <Select
                    value={formData.latestHour}
                    onChange={(e) => handleInputChange("latestHour", e.target.value)}
                    bg="white"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i.toString()}>
                        {i === 0
                          ? "12 AM"
                          : i < 12
                          ? `${i} AM`
                          : i === 12
                          ? "12 PM"
                          : `${i - 12} PM`}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </VStack>
          </CardBody>
        </Card>
      )}

      <FormControl isRequired>
        <FormLabel fontSize="lg" fontWeight="bold">
          Duration
        </FormLabel>
        <Select
          value={formData.duration}
          onChange={(e) => handleInputChange("duration", e.target.value)}
          size="lg"
        >
          {durationOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </FormControl>
    </VStack>
  );
};

export default EventSchedulingForm;
