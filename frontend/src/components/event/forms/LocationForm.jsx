import React from "react";
import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Card,
  CardBody,
  Text,
  Icon,
  Switch
} from "@chakra-ui/react";
import { FiVideo, FiMapPin } from "react-icons/fi";

/**
 * LocationForm - Fourth step of event creation
 * Handles virtual event toggle, video link, and physical location
 *
 * @param {Object} props
 * @param {Object} props.formData - Form data containing location fields
 * @param {Function} props.onChange - Handler for input changes
 */
const LocationForm = ({ formData, onChange }) => {
  const handleInputChange = (field, value) => {
    onChange(field, value);
  };

  return (
    <VStack spacing={6} align="stretch">
      <FormControl>
        <HStack justify="space-between" mb={3}>
          <FormLabel fontSize="lg" fontWeight="bold" mb={0}>
            Virtual Event
          </FormLabel>
          <Switch
            isChecked={formData.isVirtual}
            onChange={(e) => {
              handleInputChange("isVirtual", e.target.checked);
              if (e.target.checked) {
                handleInputChange("noLocation", false);
              }
            }}
            colorScheme="purple"
            size="lg"
          />
        </HStack>
        <Text fontSize="sm" color="gray.600">
          Toggle if this is an online meeting
        </Text>
      </FormControl>

      {formData.isVirtual ? (
        <FormControl>
          <FormLabel>Video Call Link</FormLabel>
          <Input
            placeholder="https://zoom.us/j/..."
            value={formData.videoLink}
            onChange={(e) => handleInputChange("videoLink", e.target.value)}
            leftIcon={<Icon as={FiVideo} />}
          />
          <Text fontSize="sm" color="gray.500" mt={2}>
            Add a Zoom, Google Meet, or Teams link
          </Text>
        </FormControl>
      ) : (
        <>
          <FormControl>
            <FormLabel>Location</FormLabel>
            <Input
              placeholder="Enter address or place name..."
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              isDisabled={formData.noLocation}
            />
            <Text fontSize="sm" color="gray.500" mt={2}>
              We'll show this location to all guests
            </Text>
          </FormControl>

          <FormControl>
            <HStack>
              <Switch
                isChecked={formData.noLocation}
                onChange={(e) => {
                  handleInputChange("noLocation", e.target.checked);
                  if (e.target.checked) {
                    handleInputChange("location", "");
                  }
                }}
                colorScheme="purple"
              />
              <Text>No location needed</Text>
            </HStack>
          </FormControl>

          {formData.location && !formData.noLocation && (
            <Card variant="outline" bg="blue.50">
              <CardBody>
                <VStack spacing={2}>
                  <Icon as={FiMapPin} boxSize={8} color="blue.500" />
                  <Text fontWeight="bold">{formData.location}</Text>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Map preview would appear here
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </VStack>
  );
};

export default LocationForm;
