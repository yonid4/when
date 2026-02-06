import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  VStack,
  HStack,
  Text,
  useToast,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Box
} from "@chakra-ui/react";
import { EditIcon } from "@chakra-ui/icons";
import { eventsAPI } from "../../services/apiService";
import {
  getUserTimezone,
  utcToLocalDatetimeInput,
  localDatetimeInputToUtc,
  formatTimezone
} from "../../utils/timezoneUtils";

/**
 * Modal for editing event details
 * Only accessible by event coordinator
 */
const EditEventModal = ({ isOpen, onClose, event, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    earliest_datetime_utc: "",  // Use UTC timestamp fields
    latest_datetime_utc: "",
    duration_minutes: 60,
    event_type: "",
    video_call_link: "",
    location: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [userTimezone] = useState(getUserTimezone());
  const toast = useToast();

  // Initialize form data when event prop changes
  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || "",
        description: event.description || "",
        // Convert UTC timestamps to local datetime-local format for editing
        earliest_datetime_utc: event.earliest_datetime_utc
          ? utcToLocalDatetimeInput(event.earliest_datetime_utc)
          : "",
        latest_datetime_utc: event.latest_datetime_utc
          ? utcToLocalDatetimeInput(event.latest_datetime_utc)
          : "",
        duration_minutes: event.duration_minutes || 60,
        event_type: event.event_type || "",
        video_call_link: event.video_call_link || "",
        location: event.location || ""
      });
    }
  }, [event]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    // Event name is required
    if (!formData.name || formData.name.trim().length === 0) {
      toast({
        title: "Event name required",
        description: "Please enter a name for your event",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    // Datetime range validation
    if (formData.earliest_datetime_utc && formData.latest_datetime_utc) {
      const earliest = new Date(formData.earliest_datetime_utc);
      const latest = new Date(formData.latest_datetime_utc);

      if (latest < earliest) {
        toast({
          title: "Invalid datetime range",
          description: "End time must be after start time",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return false;
      }
    }

    // Video call link validation (if provided)
    if (formData.video_call_link && formData.video_call_link.trim()) {
      const link = formData.video_call_link.trim();
      if (!link.startsWith('http://') && !link.startsWith('https://')) {
        toast({
          title: "Invalid video call link",
          description: "Link must start with http:// or https://",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description || '',
        duration_minutes: parseInt(formData.duration_minutes) || 60,
        event_type: formData.event_type || null,
        video_call_link: formData.video_call_link || null,
        location: formData.location || null,
      };

      if (formData.earliest_datetime_utc && formData.latest_datetime_utc) {
        payload.earliest_datetime_utc = localDatetimeInputToUtc(formData.earliest_datetime_utc);
        payload.latest_datetime_utc = localDatetimeInputToUtc(formData.latest_datetime_utc);
        payload.coordinator_timezone = userTimezone;
      }

      const result = await eventsAPI.update(event.uid, payload);

      toast({
        title: "Event updated!",
        description: "Your event has been successfully updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
      onSuccess?.(result);
    } catch (error) {
      const errorMessage = error.response?.data?.error
        || error.response?.data?.message
        || error.message
        || "An error occurred";

      toast({
        title: "Failed to update event",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent borderRadius="xl" overflow="hidden">
        {/* Gradient Header */}
        <Box
          bgGradient="linear(to-r, purple.600, blue.500)"
          position="relative"
          overflow="hidden"
        >
          {/* Background Pattern */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            opacity={0.1}
            bgImage="radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)"
          />
          <ModalHeader color="white" position="relative" py={6}>
            <EditIcon mr={2} />
            Edit Event
          </ModalHeader>
          <ModalCloseButton color="white" _hover={{ bg: "whiteAlpha.200" }} />
        </Box>
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            {/* Event Name */}
            <FormControl isRequired>
              <FormLabel>Event Name</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Team Meeting"
                isDisabled={isSaving}
              />
            </FormControl>

            {/* Description */}
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Describe your event..."
                rows={3}
                isDisabled={isSaving}
              />
            </FormControl>

            {/* Event Time Range */}
            <FormControl>
              <FormLabel>
                Event Time Range
                <Text fontSize="xs" color="gray.500" fontWeight="normal" ml={2} as="span">
                  (Times shown in {formatTimezone(userTimezone)})
                </Text>
              </FormLabel>
              <VStack align="stretch" spacing={3}>
                <Box>
                  <Text fontSize="xs" color="gray.600" mb={1}>Earliest Time</Text>
                  <Input
                    type="datetime-local"
                    value={formData.earliest_datetime_utc}
                    onChange={(e) => handleChange("earliest_datetime_utc", e.target.value)}
                    isDisabled={isSaving}
                  />
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.600" mb={1}>Latest Time</Text>
                  <Input
                    type="datetime-local"
                    value={formData.latest_datetime_utc}
                    onChange={(e) => handleChange("latest_datetime_utc", e.target.value)}
                    isDisabled={isSaving}
                  />
                </Box>
              </VStack>
            </FormControl>

            {/* Event Type and Duration */}
            <HStack spacing={3}>
              <FormControl flex={1}>
                <FormLabel>Event Type</FormLabel>
                <Select
                  value={formData.event_type}
                  onChange={(e) => handleChange("event_type", e.target.value)}
                  placeholder="Select type..."
                  isDisabled={isSaving}
                >
                  <option value="meeting">Meeting</option>
                  <option value="social">Social</option>
                  <option value="birthday">Birthday</option>
                  <option value="other">Other</option>
                </Select>
              </FormControl>

              <FormControl flex={1}>
                <FormLabel>Duration (minutes)</FormLabel>
                <NumberInput
                  value={formData.duration_minutes}
                  onChange={(valueString) => handleChange("duration_minutes", valueString)}
                  min={15}
                  max={480}
                  step={15}
                  isDisabled={isSaving}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </HStack>

            {/* Video Call Link */}
            <FormControl>
              <FormLabel>Video Call Link (Optional)</FormLabel>
              <Input
                value={formData.video_call_link}
                onChange={(e) => handleChange("video_call_link", e.target.value)}
                placeholder="https://meet.google.com/..."
                type="url"
                isDisabled={isSaving}
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                For virtual meetings (Zoom, Google Meet, Teams, etc.)
              </Text>
            </FormControl>

            {/* Location */}
            <FormControl>
              <FormLabel>Location (Optional)</FormLabel>
              <Input
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="Conference Room A, 123 Main St..."
                isDisabled={isSaving}
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                Physical location or address for in-person events
              </Text>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter bg="gray.50">
          <Button 
            variant="ghost" 
            mr={3} 
            onClick={handleClose} 
            isDisabled={isSaving}
            _hover={{ bg: "gray.100" }}
          >
            Cancel
          </Button>
          <Button
            bgGradient="linear(to-r, purple.500, blue.500)"
            color="white"
            onClick={handleSave}
            isLoading={isSaving}
            loadingText="Saving..."
            leftIcon={<EditIcon />}
            _hover={{
              bgGradient: "linear(to-r, purple.600, blue.600)",
              transform: "translateY(-2px)",
              boxShadow: "lg"
            }}
            transition="all 0.3s"
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditEventModal;
