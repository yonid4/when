import React from "react";
import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  InputGroup,
  InputLeftElement,
  Card,
  CardBody,
  Text,
  Icon,
  Box,
  Button,
  ButtonGroup,
  Checkbox
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FiMapPin, FiVideo, FiGlobe, FiLink } from "react-icons/fi";
import { colors } from "../../../styles/designSystem";
import { LOCATION_TYPES } from "../../../constants/eventConstants";

const MotionBox = motion(Box);

/**
 * LocationForm - Fourth step of event creation
 * Concept A: Simple Form with segmented control
 *
 * @param {Object} props
 * @param {Object} props.formData - Form data containing location fields
 * @param {Function} props.onChange - Handler for input changes
 */
const LocationForm = ({ formData, onChange }) => {
  const handleInputChange = (field, value) => {
    onChange(field, value);
  };

  // Determine location type from form data
  const getLocationType = () => {
    if (formData.isVirtual && formData.location) return LOCATION_TYPES.BOTH;
    if (formData.isVirtual) return LOCATION_TYPES.VIRTUAL;
    return LOCATION_TYPES.IN_PERSON;
  };

  const handleLocationTypeChange = (type) => {
    switch (type) {
      case LOCATION_TYPES.IN_PERSON:
        handleInputChange("isVirtual", false);
        handleInputChange("videoLink", "");
        handleInputChange("noLocation", false);
        break;
      case LOCATION_TYPES.VIRTUAL:
        handleInputChange("isVirtual", true);
        handleInputChange("location", "");
        handleInputChange("noLocation", false);
        break;
      case LOCATION_TYPES.BOTH:
        handleInputChange("isVirtual", true);
        handleInputChange("noLocation", false);
        break;
      default:
        break;
    }
  };

  const locationType = getLocationType();
  const showLocationInput = locationType === LOCATION_TYPES.IN_PERSON || locationType === LOCATION_TYPES.BOTH;
  const showVideoInput = locationType === LOCATION_TYPES.VIRTUAL || locationType === LOCATION_TYPES.BOTH;

  return (
    <VStack spacing={8} align="stretch">
      {/* Step Header */}
      <MotionBox
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <HStack spacing={3} mb={2}>
          <Icon as={FiMapPin} color={colors.primary} boxSize={5} />
          <Text
            fontSize="sm"
            fontWeight="semibold"
            textTransform="uppercase"
            letterSpacing="0.5px"
            color={colors.primary}
          >
            Step 4 of 5
          </Text>
        </HStack>
        <Text fontSize="2xl" fontWeight="bold" color={colors.textHeading}>
          Where will it happen?
        </Text>
        <Text color={colors.textMuted} mt={1}>
          Choose a physical location, virtual meeting, or both.
        </Text>
      </MotionBox>

      {/* Location Type Segmented Control */}
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
            Location Type
          </FormLabel>
          <ButtonGroup
            isAttached
            variant="outline"
            size="lg"
            w="full"
          >
            <Button
              flex={1}
              leftIcon={<FiMapPin />}
              onClick={() => handleLocationTypeChange(LOCATION_TYPES.IN_PERSON)}
              bg={locationType === LOCATION_TYPES.IN_PERSON ? colors.primarySoft : "white"}
              borderColor={locationType === LOCATION_TYPES.IN_PERSON ? colors.primary : "gray.200"}
              color={locationType === LOCATION_TYPES.IN_PERSON ? colors.primary : "gray.600"}
              borderWidth={2}
              _hover={{
                bg: locationType === LOCATION_TYPES.IN_PERSON ? colors.primarySoft : "gray.50"
              }}
            >
              In Person
            </Button>
            <Button
              flex={1}
              leftIcon={<FiVideo />}
              onClick={() => handleLocationTypeChange(LOCATION_TYPES.VIRTUAL)}
              bg={locationType === LOCATION_TYPES.VIRTUAL ? colors.primarySoft : "white"}
              borderColor={locationType === LOCATION_TYPES.VIRTUAL ? colors.primary : "gray.200"}
              color={locationType === LOCATION_TYPES.VIRTUAL ? colors.primary : "gray.600"}
              borderWidth={2}
              _hover={{
                bg: locationType === LOCATION_TYPES.VIRTUAL ? colors.primarySoft : "gray.50"
              }}
            >
              Virtual
            </Button>
            <Button
              flex={1}
              leftIcon={<FiGlobe />}
              onClick={() => handleLocationTypeChange(LOCATION_TYPES.BOTH)}
              bg={locationType === LOCATION_TYPES.BOTH ? colors.primarySoft : "white"}
              borderColor={locationType === LOCATION_TYPES.BOTH ? colors.primary : "gray.200"}
              color={locationType === LOCATION_TYPES.BOTH ? colors.primary : "gray.600"}
              borderWidth={2}
              _hover={{
                bg: locationType === LOCATION_TYPES.BOTH ? colors.primarySoft : "gray.50"
              }}
            >
              Both
            </Button>
          </ButtonGroup>
        </FormControl>
      </MotionBox>

      {/* Physical Location Input */}
      {showLocationInput && (
        <MotionBox
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card variant="outline" borderRadius="lg" bg="gray.50">
            <CardBody>
              <VStack spacing={4} align="stretch">
                <HStack spacing={2}>
                  <Icon as={FiMapPin} color={colors.primary} boxSize={4} />
                  <Text fontWeight="semibold" color="gray.700">
                    Physical Location
                  </Text>
                </HStack>

                <FormControl>
                  <InputGroup size="lg">
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FiMapPin} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder="Enter address or place name..."
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      bg="white"
                      borderRadius="lg"
                      pl={10}
                    />
                  </InputGroup>
                  <FormHelperText color="gray.500">
                    This will be shown to guests and included in calendar invites
                  </FormHelperText>
                </FormControl>

                <Checkbox
                  isChecked={formData.noLocation}
                  onChange={(e) => {
                    handleInputChange("noLocation", e.target.checked);
                    if (e.target.checked) {
                      handleInputChange("location", "");
                    }
                  }}
                  colorScheme="purple"
                >
                  <Text fontSize="sm" color="gray.600">
                    Location to be announced later
                  </Text>
                </Checkbox>
              </VStack>
            </CardBody>
          </Card>
        </MotionBox>
      )}

      {/* Virtual Meeting Input */}
      {showVideoInput && (
        <MotionBox
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card variant="outline" borderRadius="lg" bg="blue.50" borderColor="blue.200">
            <CardBody>
              <VStack spacing={4} align="stretch">
                <HStack spacing={2}>
                  <Icon as={FiVideo} color="blue.500" boxSize={4} />
                  <Text fontWeight="semibold" color="gray.700">
                    Virtual Meeting
                  </Text>
                </HStack>

                <FormControl>
                  <InputGroup size="lg">
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FiLink} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder="https://zoom.us/j/... or meet.google.com/..."
                      value={formData.videoLink}
                      onChange={(e) => handleInputChange("videoLink", e.target.value)}
                      bg="white"
                      borderRadius="lg"
                      pl={10}
                    />
                  </InputGroup>
                  <FormHelperText color="gray.500">
                    Add a Zoom, Google Meet, Teams, or other video call link
                  </FormHelperText>
                </FormControl>

                <Card bg="blue.100" variant="filled" borderRadius="md">
                  <CardBody py={3}>
                    <HStack spacing={3}>
                      <Box
                        w="32px"
                        h="32px"
                        borderRadius="md"
                        bg="white"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text fontSize="lg">📹</Text>
                      </Box>
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontSize="sm" fontWeight="medium" color="blue.800">
                          Google Meet link
                        </Text>
                        <Text fontSize="xs" color="blue.600">
                          A Meet link can be auto-generated when you finalize the event
                        </Text>
                      </VStack>
                    </HStack>
                  </CardBody>
                </Card>
              </VStack>
            </CardBody>
          </Card>
        </MotionBox>
      )}

      {/* No Location Option */}
      {locationType === LOCATION_TYPES.IN_PERSON && formData.noLocation && (
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card variant="outline" bg="yellow.50" borderColor="yellow.200" borderRadius="lg">
            <CardBody py={4}>
              <HStack spacing={3}>
                <Icon as={FiMapPin} color="yellow.600" boxSize={5} />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="medium" color="yellow.800">
                    Location TBA
                  </Text>
                  <Text fontSize="sm" color="yellow.700">
                    You can add the location later before finalizing the event
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
        </MotionBox>
      )}

      {/* Skip Location Info */}
      <MotionBox
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Text fontSize="sm" color="gray.500" textAlign="center">
          Location is optional — you can skip this step and add it later
        </Text>
      </MotionBox>
    </VStack>
  );
};

export default LocationForm;
