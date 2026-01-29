import React, { useState, useRef, useCallback } from "react";
import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Card,
  CardBody,
  Text,
  Icon,
  Avatar,
  Box,
  Tag,
  TagLabel,
  TagCloseButton,
  Switch,
  Divider,
  Spinner,
  Badge,
  Flex,
  Kbd
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { FiUsers, FiMail, FiUserPlus } from "react-icons/fi";
import { colors, shadows } from "../../../styles/designSystem";

const MotionBox = motion(Box);
const MotionTag = motion(Tag);

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * GuestManagementForm - Third step of event creation
 * Concept B: Chip-Based People Picker with live count
 *
 * @param {Object} props
 * @param {Object} props.formData - Form data containing guests and permissions
 * @param {Function} props.onChange - Handler for input changes
 * @param {string} props.guestSearchQuery - Current search query
 * @param {Function} props.onSearchQueryChange - Handler for search query changes
 * @param {Function} props.onSearch - Handler to trigger search
 * @param {Array} props.searchResults - Search results to display
 * @param {boolean} props.isSearching - Loading state for search
 * @param {Function} props.onAddGuest - Handler to add a guest
 * @param {Function} props.onRemoveGuest - Handler to remove a guest
 */
const GuestManagementForm = ({
  formData,
  onChange,
  guestSearchQuery,
  onSearchQueryChange,
  onSearch,
  searchResults,
  isSearching,
  onAddGuest,
  onRemoveGuest
}) => {
  const inputRef = useRef(null);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");

  const handleInputChange = (field, value) => {
    onChange(field, value);
  };

  // Handle adding email directly (for when user types email manually)
  const handleAddEmail = useCallback((email) => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) return;

    if (!isValidEmail(trimmedEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    // Check if already added
    const alreadyAdded = formData.guests.some(
      g => (g.email || g.email_address)?.toLowerCase() === trimmedEmail
    );

    if (alreadyAdded) {
      setEmailError("This person is already invited");
      return;
    }

    // Add as a new guest object
    const newGuest = {
      id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: trimmedEmail,
      email_address: trimmedEmail,
      name: trimmedEmail.split('@')[0],
      full_name: null,
      avatar_url: null,
      isEmailOnly: true
    };

    onAddGuest(newGuest);
    setEmailInput("");
    setEmailError("");
  }, [formData.guests, onAddGuest]);

  // Handle paste of comma-separated emails
  const handlePaste = useCallback((e) => {
    const pastedText = e.clipboardData.getData('text');

    // Check if it contains commas or newlines (batch paste)
    if (pastedText.includes(',') || pastedText.includes('\n')) {
      e.preventDefault();

      const emails = pastedText
        .split(/[,\n]/)
        .map(email => email.trim().toLowerCase())
        .filter(email => email && isValidEmail(email));

      let addedCount = 0;
      emails.forEach(email => {
        const alreadyAdded = formData.guests.some(
          g => (g.email || g.email_address)?.toLowerCase() === email
        );

        if (!alreadyAdded) {
          const newGuest = {
            id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            email: email,
            email_address: email,
            name: email.split('@')[0],
            full_name: null,
            avatar_url: null,
            isEmailOnly: true
          };
          onAddGuest(newGuest);
          addedCount++;
        }
      });

      setEmailInput("");
      if (addedCount > 0) {
        setEmailError("");
      }
    }
  }, [formData.guests, onAddGuest]);

  // Handle key events
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();

      // If there's text in email input, try to add it
      if (emailInput.trim()) {
        handleAddEmail(emailInput);
      } else if (guestSearchQuery.trim()) {
        // If using search, trigger search
        onSearch();
      }
    }

    // Backspace to remove last chip when input is empty
    if (e.key === "Backspace" && !emailInput && !guestSearchQuery && formData.guests.length > 0) {
      const lastGuest = formData.guests[formData.guests.length - 1];
      onRemoveGuest(lastGuest.id);
    }
  };

  // Combined input handler
  const handleCombinedInput = (value) => {
    setEmailInput(value);
    onSearchQueryChange(value);
    setEmailError("");

    // Auto-search after typing
    if (value.length >= 2) {
      // Debounce would be nice here, but keeping it simple
    }
  };

  const guestCount = formData.guests.length;

  return (
    <VStack spacing={8} align="stretch">
      {/* Step Header */}
      <MotionBox
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <HStack spacing={3} mb={2}>
          <Icon as={FiUsers} color={colors.primary} boxSize={5} />
          <Text
            fontSize="sm"
            fontWeight="semibold"
            textTransform="uppercase"
            letterSpacing="0.5px"
            color={colors.primary}
          >
            Step 3 of 5
          </Text>
        </HStack>
        <Text fontSize="2xl" fontWeight="bold" color={colors.textHeading}>
          Who's invited?
        </Text>
        <Text color={colors.textMuted} mt={1}>
          Add guests by email or search for existing users. They'll receive an invitation when you create the event.
        </Text>
      </MotionBox>

      {/* Chip Input Section */}
      <MotionBox
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <FormControl isInvalid={!!emailError}>
          <HStack justify="space-between" mb={2}>
            <FormLabel
              fontSize="sm"
              fontWeight="semibold"
              textTransform="uppercase"
              letterSpacing="0.5px"
              color="gray.600"
              mb={0}
            >
              Add Guests
            </FormLabel>
            {guestCount > 0 && (
              <Badge colorScheme="purple" borderRadius="full" px={2}>
                {guestCount} invited
              </Badge>
            )}
          </HStack>

          {/* Chip Container with Input */}
          <Box
            borderWidth={2}
            borderColor={emailError ? "red.300" : "gray.200"}
            borderRadius="lg"
            p={3}
            bg="white"
            minH="60px"
            _focusWithin={{
              borderColor: colors.primary,
              boxShadow: `0 0 0 1px ${colors.primary}`
            }}
            transition="all 0.15s ease"
            cursor="text"
            onClick={() => inputRef.current?.focus()}
          >
            <Flex flexWrap="wrap" gap={2} alignItems="center">
              {/* Guest Chips */}
              <AnimatePresence>
                {formData.guests.map((guest) => (
                  <MotionTag
                    key={guest.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    size="lg"
                    colorScheme="purple"
                    borderRadius="full"
                    py={1}
                    px={2}
                  >
                    <Avatar
                      size="xs"
                      name={guest.full_name || guest.name || guest.email}
                      src={guest.avatar_url}
                      ml={-1}
                      mr={2}
                    />
                    <TagLabel fontSize="sm">
                      {guest.full_name || guest.name || guest.email || guest.email_address}
                    </TagLabel>
                    <TagCloseButton onClick={() => onRemoveGuest(guest.id)} />
                  </MotionTag>
                ))}
              </AnimatePresence>

              {/* Input Field */}
              <Input
                ref={inputRef}
                variant="unstyled"
                placeholder={guestCount === 0 ? "Type email or search by name..." : "Add more..."}
                value={emailInput || guestSearchQuery}
                onChange={(e) => handleCombinedInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                flex="1"
                minW="200px"
                fontSize="sm"
              />
            </Flex>
          </Box>

          {emailError ? (
            <Text fontSize="sm" color="red.500" mt={2}>
              {emailError}
            </Text>
          ) : (
            <FormHelperText color="gray.500">
              <HStack spacing={1}>
                <Text>Press</Text>
                <Kbd>Enter</Kbd>
                <Text>or</Text>
                <Kbd>,</Kbd>
                <Text>to add • Paste multiple emails separated by commas</Text>
              </HStack>
            </FormHelperText>
          )}
        </FormControl>
      </MotionBox>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {searchResults.length > 0 && (
          <MotionBox
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card variant="outline" maxH="200px" overflowY="auto" shadow={shadows.card}>
              <CardBody p={2}>
                <VStack align="stretch" spacing={1}>
                  {searchResults.map((user) => (
                    <HStack
                      key={user.id}
                      p={3}
                      cursor="pointer"
                      _hover={{ bg: colors.primarySoft }}
                      borderRadius="lg"
                      onClick={() => {
                        onAddGuest(user);
                        setEmailInput("");
                        onSearchQueryChange("");
                      }}
                      transition="background 0.15s ease"
                    >
                      <Avatar size="sm" name={user.full_name} src={user.avatar_url} />
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontSize="sm" fontWeight="medium">
                          {user.full_name || "User"}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {user.email_address}
                        </Text>
                      </VStack>
                      <Icon as={FiUserPlus} color={colors.primary} />
                    </HStack>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Loading indicator */}
      {isSearching && (
        <HStack justify="center" py={2}>
          <Spinner size="sm" color={colors.primary} />
          <Text fontSize="sm" color="gray.500">Searching...</Text>
        </HStack>
      )}

      {/* Empty State */}
      {guestCount === 0 && !searchResults.length && !isSearching && (
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card variant="outline" bg="gray.50" borderStyle="dashed">
            <CardBody textAlign="center" py={8}>
              <Icon as={FiMail} boxSize={12} color="gray.300" mb={3} />
              <Text color="gray.600" fontWeight="medium" mb={1}>
                No guests added yet
              </Text>
              <Text fontSize="sm" color="gray.500">
                Start typing an email address or search for users above
              </Text>
            </CardBody>
          </Card>
        </MotionBox>
      )}

      {/* Guest Permissions Section */}
      <MotionBox
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Divider mb={6} />

        <FormControl>
          <FormLabel
            fontSize="sm"
            fontWeight="semibold"
            textTransform="uppercase"
            letterSpacing="0.5px"
            color="gray.600"
            mb={4}
          >
            Guest Permissions
          </FormLabel>
          <VStack align="stretch" spacing={4}>
            <Card variant="outline" borderRadius="lg">
              <CardBody py={4}>
                <HStack justify="space-between">
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="medium" color="gray.800">
                      Allow guests to invite others
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Guests can add more people to the event
                    </Text>
                  </VStack>
                  <Switch
                    isChecked={formData.guestPermissions.canInviteOthers}
                    onChange={(e) =>
                      handleInputChange("guestPermissions", {
                        ...formData.guestPermissions,
                        canInviteOthers: e.target.checked
                      })
                    }
                    colorScheme="purple"
                    size="lg"
                  />
                </HStack>
              </CardBody>
            </Card>

            <Card variant="outline" borderRadius="lg">
              <CardBody py={4}>
                <HStack justify="space-between">
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="medium" color="gray.800">
                      Show guest list to everyone
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      All guests can see who else is invited
                    </Text>
                  </VStack>
                  <Switch
                    isChecked={formData.guestPermissions.canSeeGuestList}
                    onChange={(e) =>
                      handleInputChange("guestPermissions", {
                        ...formData.guestPermissions,
                        canSeeGuestList: e.target.checked
                      })
                    }
                    colorScheme="purple"
                    size="lg"
                  />
                </HStack>
              </CardBody>
            </Card>
          </VStack>
        </FormControl>
      </MotionBox>
    </VStack>
  );
};

export default GuestManagementForm;
