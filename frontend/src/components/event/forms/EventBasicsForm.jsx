import React, { useRef, useEffect } from "react";
import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Textarea,
  Grid,
  Card,
  CardBody,
  Text,
  Icon,
  Box
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FiEdit3 } from "react-icons/fi";
import { colors, shadows } from "../../../styles/designSystem";
import { eventTypes } from "../../../constants/eventConstants";

const MotionBox = motion(Box);

/**
 * EventBasicsForm - First step of event creation
 * Concept A: Focused Single Card with purple accent
 *
 * @param {Object} props
 * @param {Object} props.formData - Form data containing title, type, description
 * @param {Function} props.onChange - Handler for input changes
 */
const EventBasicsForm = ({ formData, onChange }) => {
  const titleInputRef = useRef(null);

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  return (
    <VStack spacing={8} align="stretch">
      {/* Step Header */}
      <MotionBox
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <HStack spacing={3} mb={2}>
          <Icon as={FiEdit3} color={colors.primary} boxSize={5} />
          <Text
            fontSize="sm"
            fontWeight="semibold"
            textTransform="uppercase"
            letterSpacing="0.5px"
            color={colors.primary}
          >
            Step 1 of 5
          </Text>
        </HStack>
        <Text fontSize="2xl" fontWeight="bold" color={colors.textHeading}>
          What's your event about?
        </Text>
        <Text color={colors.textMuted} mt={1}>
          Give your event a clear, memorable name that tells guests what to expect.
        </Text>
      </MotionBox>

      {/* Event Title - Hero Field */}
      <MotionBox
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <FormControl isRequired>
          <FormLabel
            fontSize="sm"
            fontWeight="semibold"
            textTransform="uppercase"
            letterSpacing="0.5px"
            color="gray.600"
          >
            Event Title
          </FormLabel>
          <Input
            ref={titleInputRef}
            size="lg"
            placeholder="e.g. Team Planning Meeting, Coffee Chat, Birthday Party"
            value={formData.title}
            onChange={(e) => onChange("title", e.target.value)}
            fontSize="xl"
            fontWeight="medium"
            h="56px"
            borderRadius="lg"
            borderColor="gray.300"
            _hover={{ borderColor: colors.primary }}
            _focus={{
              borderColor: colors.primary,
              boxShadow: `0 0 0 1px ${colors.primary}`
            }}
          />
          <FormHelperText color="gray.500">
            This will be shown in calendar invites and notifications
          </FormHelperText>
        </FormControl>
      </MotionBox>

      {/* Event Type Selection */}
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
            Event Type
          </FormLabel>
          <Grid templateColumns="repeat(4, 1fr)" gap={3}>
            {eventTypes.map((type) => {
              const isSelected = formData.type === type.value;
              const TypeIcon = type.icon;
              return (
                <Card
                  key={type.value}
                  variant="outline"
                  cursor="pointer"
                  borderWidth={2}
                  borderColor={isSelected ? colors.primary : "gray.200"}
                  bg={isSelected ? colors.primarySoft : "white"}
                  onClick={() => onChange("type", type.value)}
                  _hover={{
                    borderColor: isSelected ? colors.primary : "gray.300",
                    shadow: shadows.card
                  }}
                  transition="all 0.15s ease"
                  borderRadius="lg"
                >
                  <CardBody py={5} px={3} textAlign="center">
                    <VStack spacing={2}>
                      <Icon
                        as={TypeIcon}
                        boxSize={7}
                        color={isSelected ? colors.primary : "gray.500"}
                      />
                      <Text
                        fontSize="sm"
                        fontWeight={isSelected ? "bold" : "medium"}
                        color={isSelected ? colors.primary : "gray.700"}
                      >
                        {type.label}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              );
            })}
          </Grid>
        </FormControl>
      </MotionBox>

      {/* Description - Optional */}
      <MotionBox
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <FormControl>
          <HStack justify="space-between" mb={2}>
            <FormLabel
              fontSize="sm"
              fontWeight="semibold"
              textTransform="uppercase"
              letterSpacing="0.5px"
              color="gray.600"
              mb={0}
            >
              Description
            </FormLabel>
            <Text fontSize="xs" color="gray.400" fontStyle="italic">
              Optional
            </Text>
          </HStack>
          <Textarea
            placeholder="Add any details, agenda items, or context that guests should know..."
            value={formData.description}
            onChange={(e) => onChange("description", e.target.value)}
            rows={4}
            resize="vertical"
            borderRadius="lg"
            borderColor="gray.300"
            _hover={{ borderColor: colors.primary }}
            _focus={{
              borderColor: colors.primary,
              boxShadow: `0 0 0 1px ${colors.primary}`
            }}
          />
          <FormHelperText color="gray.500">
            Markdown formatting is supported
          </FormHelperText>
        </FormControl>
      </MotionBox>
    </VStack>
  );
};

export default EventBasicsForm;
