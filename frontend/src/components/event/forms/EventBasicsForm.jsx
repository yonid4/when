import React from "react";
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Grid,
  Card,
  CardBody,
  Text
} from "@chakra-ui/react";

/**
 * Event type options
 */
export const eventTypes = [
  { value: "meeting", label: "Meeting", color: "blue", emoji: "💼" },
  { value: "social", label: "Social", color: "green", emoji: "🎉" },
  { value: "birthday", label: "Birthday", color: "pink", emoji: "🎂" },
  { value: "other", label: "Other", color: "purple", emoji: "📅" }
];

/**
 * EventBasicsForm - First step of event creation
 * Handles event title, type selection, and description
 *
 * @param {Object} props
 * @param {Object} props.formData - Form data containing title, type, description
 * @param {Function} props.onChange - Handler for input changes
 * @param {string} props.borderColor - Border color for cards
 */
const EventBasicsForm = ({ formData, onChange, borderColor }) => {
  const handleInputChange = (field, value) => {
    onChange(field, value);
  };

  return (
    <VStack spacing={6} align="stretch">
      <FormControl isRequired>
        <FormLabel fontSize="lg" fontWeight="bold">
          Event Title
        </FormLabel>
        <Input
          size="lg"
          placeholder="e.g. Team Standup, Coffee Chat, Birthday Party"
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          fontSize="lg"
        />
      </FormControl>

      <FormControl isRequired>
        <FormLabel fontSize="lg" fontWeight="bold">
          Event Type
        </FormLabel>
        <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={3}>
          {eventTypes.map((type) => (
            <Card
              key={type.value}
              variant="outline"
              cursor="pointer"
              borderWidth={2}
              borderColor={
                formData.type === type.value ? `${type.color}.500` : borderColor
              }
              bg={formData.type === type.value ? `${type.color}.50` : "transparent"}
              onClick={() => handleInputChange("type", type.value)}
              _hover={{ shadow: "md" }}
              transition="all 0.2s"
            >
              <CardBody textAlign="center">
                <VStack spacing={2}>
                  <Text fontSize="3xl">{type.emoji}</Text>
                  <Text fontWeight="bold">{type.label}</Text>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </Grid>
      </FormControl>

      <FormControl>
        <FormLabel fontSize="lg" fontWeight="bold">
          Description{" "}
          <Text as="span" fontWeight="normal" color="gray.500">
            (Optional)
          </Text>
        </FormLabel>
        <Textarea
          placeholder="Add any details or context about this event..."
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          rows={5}
          resize="vertical"
        />
      </FormControl>
    </VStack>
  );
};

export default EventBasicsForm;
