import { useState, useEffect } from "react";
import {
  AlertIcon,
  Avatar,
  Box,
  Button,
  Checkbox,
  Heading,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { differenceInMinutes, format } from "date-fns";

/**
 * Modal for finalizing an event with participant selection.
 * Coordinator selects which participants to invite and whether to include Google Meet.
 */
function FinalizationModal({
  isOpen,
  onClose,
  event,
  selectedSlot,
  participants,
  onFinalize,
  isLoading,
}) {
  const [selectedParticipants, setSelectedParticipants] = useState(
    participants.map((p) => p.user_id || p.id)
  );
  const [includeGoogleMeet, setIncludeGoogleMeet] = useState(true);
  const [error, setError] = useState(null);
  const [primaryProvider, setPrimaryProvider] = useState("google");
  const [syncToSecondary, setSyncToSecondary] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Fetch user profile to get default primary provider
  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: { user } } = await import("../../services/supabaseClient.js").then(m => m.supabase.auth.getUser());
        if (user) {
          const res = await import("../../services/api.js").then(m => m.default.get(`/api/users/${user.id}`));
          if (res.data?.primary_calendar_provider) {
            setPrimaryProvider(res.data.primary_calendar_provider);
          }
          // Default syncToSecondary to true if user has both accounts connected? 
          // For now default to false or we could check accounts. 
          // Let's default to true if we can detect it, but simple false is safer for MVP unless we check connected accounts.
        }
      } catch (err) {
        console.error("Failed to fetch profile settings", err);
      } finally {
        setLoadingProfile(false);
      }
    }
    fetchProfile();
  }, []);

  if (!selectedSlot || !event) return null;

  const duration = differenceInMinutes(selectedSlot.end, selectedSlot.start);

  function getParticipantId(participant) {
    return participant.user_id || participant.id;
  }

  function handleParticipantToggle(participantId, checked) {
    if (checked) {
      setSelectedParticipants([...selectedParticipants, participantId]);
    } else {
      setSelectedParticipants(selectedParticipants.filter((id) => id !== participantId));
    }
    setError(null);
  }

  function handleCreate() {
    if (selectedParticipants.length === 0) {
      setError("Please select at least one participant");
      return;
    }

    onFinalize({
      start_time_utc: selectedSlot.start.toISOString(),
      end_time_utc: selectedSlot.end.toISOString(),
      participant_ids: selectedParticipants,
      include_google_meet: includeGoogleMeet,
      primary_calendar_provider: primaryProvider,
      sync_to_secondary: syncToSecondary
    });
  }

  function handleClose() {
    setError(null);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" closeOnOverlayClick={!isLoading}>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent borderRadius="xl" overflow="hidden">
        {/* Gradient Header */}
        <Box
          bgGradient="linear(to-r, green.500, teal.500)"
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
          <ModalHeader color="white" position="relative" py={6} fontSize="2xl" fontWeight="bold">
            Finalize Event
          </ModalHeader>
        </Box>
        <ModalBody py={6}>
          {error && (
            <Box
              mb={4}
              p={4}
              bg="red.50"
              borderRadius="lg"
              borderLeft="4px"
              borderColor="red.400"
            >
              <HStack>
                <Box
                  p={2}
                  bgGradient="linear(to-r, red.400, pink.400)"
                  borderRadius="lg"
                >
                  <AlertIcon color="white" />
                </Box>
                <Text fontWeight="medium" color="red.700">{error}</Text>
              </HStack>
            </Box>
          )}

          {/* Event Details Section - Gradient Card */}
          <Box
            mb={6}
            p={5}
            position="relative"
            borderRadius="xl"
            overflow="hidden"
            bgGradient="linear(to-r, green.500, teal.500)"
            boxShadow="lg"
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
            <VStack align="start" spacing={2} position="relative">
              <Heading size="md" color="white" fontWeight="bold">
                {event.name}
              </Heading>
              <Text fontSize="lg" fontWeight="semibold" color="white">
                {format(selectedSlot.start, "EEEE, MMMM d, yyyy")}
              </Text>
              <HStack spacing={3}>
                <Text fontSize="md" color="whiteAlpha.900" fontWeight="medium">
                  {format(selectedSlot.start, "h:mm a")} - {format(selectedSlot.end, "h:mm a")}
                </Text>
                <Box
                  px={3}
                  py={1}
                  bg="whiteAlpha.300"
                  borderRadius="full"
                  backdropFilter="blur(10px)"
                >
                  <Text color="white" fontSize="sm" fontWeight="semibold">
                    {duration} min
                  </Text>
                </Box>
              </HStack>
            </VStack>
          </Box>

          <Box mb={5}>
            <Heading size="sm" mb={2} fontWeight="bold">
              Select Participants to Invite
            </Heading>
            <Text fontSize="sm" color="gray.600" mb={3}>
              Calendar invitations will be sent to selected participants via email
            </Text>

            <VStack align="stretch" spacing={2} maxH="300px" overflowY="auto" pr={2}>
              {participants.map((participant) => {
                const participantId = getParticipantId(participant);
                const isSelected = selectedParticipants.includes(participantId);
                return (
                  <Box
                    key={participantId}
                    p={3}
                    borderWidth="2px"
                    borderRadius="lg"
                    borderColor={isSelected ? "green.300" : "gray.200"}
                    bg={isSelected ? "green.50" : "white"}
                    transition="all 0.3s"
                    cursor="pointer"
                    _hover={{
                      borderColor: "green.400",
                      bg: "green.50",
                      transform: "translateX(4px)",
                      boxShadow: "md",
                    }}
                    onClick={() => handleParticipantToggle(participantId, !isSelected)}
                  >
                    <Checkbox
                      isChecked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleParticipantToggle(participantId, e.target.checked);
                      }}
                      width="100%"
                      colorScheme="green"
                    >
                      <HStack spacing={3}>
                        <Avatar size="sm" name={participant.name || participant.email} />
                        <Box>
                          <Text fontWeight="semibold">{participant.name || "Unknown User"}</Text>
                          <Text fontSize="xs" color="gray.600">
                            {participant.email}
                          </Text>
                        </Box>
                      </HStack>
                    </Checkbox>
                  </Box>
                );
              })}
            </VStack>

            <Box
              mt={3}
              p={2}
              bg="green.50"
              borderRadius="md"
              borderLeft="3px"
              borderColor="green.400"
            >
              <Text fontSize="sm" color="green.700" fontWeight="semibold">
                {selectedParticipants.length} of {participants.length} participant(s) selected
              </Text>
            </Box>
          </Box>

          {/* Primary Sender Logic */}
          {!loadingProfile && (
            <Box mb={4} p={4} bg="gray.50" borderRadius="lg" borderLeft="4px" borderColor="purple.400">
              <VStack align="start" spacing={3}>
                <Box>
                  <Text fontWeight="semibold">Primary Sender (Invites Guests)</Text>
                  <Text fontSize="xs" color="gray.600">
                    Which calendar should invite guests?
                  </Text>
                </Box>
                <HStack spacing={4}>
                  <Button
                    size="xs"
                    variant={primaryProvider === "google" ? "solid" : "outline"}
                    colorScheme={primaryProvider === "google" ? "blue" : "gray"}
                    onClick={() => setPrimaryProvider("google")}
                  >
                    Google
                  </Button>
                  <Button
                    size="xs"
                    variant={primaryProvider === "microsoft" ? "solid" : "outline"}
                    colorScheme={primaryProvider === "microsoft" ? "blue" : "gray"}
                    onClick={() => setPrimaryProvider("microsoft")}
                  >
                    Microsoft
                  </Button>
                </HStack>
                <Checkbox
                  isChecked={syncToSecondary}
                  onChange={(e) => setSyncToSecondary(e.target.checked)}
                  colorScheme="purple"
                  size="sm"
                >
                  <Text fontSize="sm">Also block time on {primaryProvider === "google" ? "Microsoft" : "Google"}</Text>
                  <Text fontSize="xs" color="gray.500" display="block">
                    (No invites sent, just blocks your calendar)
                  </Text>
                </Checkbox>
              </VStack>
            </Box>
          )}

          <Box mb={4} p={4} bg="blue.50" borderRadius="lg" borderLeft="4px" borderColor="blue.400">
            <Checkbox
              isChecked={includeGoogleMeet}
              onChange={(e) => setIncludeGoogleMeet(e.target.checked)}
              colorScheme="blue"
            >
              <HStack spacing={3}>
                <Box>
                  <Text fontWeight="semibold">Include Google Meet video link</Text>
                  <Text fontSize="xs" color="gray.600">
                    Automatically add a video conference link to the calendar event
                  </Text>
                </Box>
              </HStack>
            </Checkbox>
          </Box>

          <Box p={4} bg="yellow.50" borderRadius="lg" borderLeft="4px" borderColor="yellow.400">
            <HStack align="start" spacing={3}>
              <Box p={2} bgGradient="linear(to-r, yellow.400, orange.400)" borderRadius="lg">
                <AlertIcon color="white" />
              </Box>
              <Box flex="1">
                <Text fontWeight="bold" fontSize="sm" color="yellow.900" mb={1}>
                  This action cannot be undone
                </Text>
                <Text fontSize="xs" color="yellow.800">
                  The event will be finalized and calendar invitations will be sent immediately. No
                  further changes can be made to preferred times.
                </Text>
              </Box>
            </HStack>
          </Box>
        </ModalBody>

        <ModalFooter bg="gray.50" py={5}>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={handleClose} isDisabled={isLoading} _hover={{ bg: "gray.100" }}>
              Cancel
            </Button>
            <Button
              bgGradient="linear(to-r, green.500, teal.500)"
              color="white"
              onClick={handleCreate}
              isLoading={isLoading}
              loadingText="Creating event..."
              isDisabled={selectedParticipants.length === 0}
              size="lg"
              px={8}
              _hover={{
                bgGradient: "linear(to-r, green.600, teal.600)",
                transform: "translateY(-2px)",
                boxShadow: "xl",
              }}
              _disabled={{
                opacity: 0.6,
                cursor: "not-allowed",
              }}
              transition="all 0.3s"
            >
              Create & Send Invitations
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default FinalizationModal;




