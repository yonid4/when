import React, { useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Avatar,
  Badge,
  Divider,
  Alert,
  AlertIcon,
  FormControl,
  FormErrorMessage,
  Heading,
  Card,
  CardBody,
  Flex,
  Spacer,
} from "@chakra-ui/react";

const UserList = ({ participants, onUserSelect, isCoordinator = false, onInviteUser }) => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [inviteStatus, setInviteStatus] = useState("");
  const [pendingInvites, setPendingInvites] = useState([]);

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmail = (email) => {
    if (!email) {
      return "Email is required";
    }
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    // Check if email is already invited or in participants
    const allEmails = [
      ...participants.map(p => p.email),
      ...pendingInvites.map(p => p.email)
    ];
    if (allEmails.includes(email)) {
      return "This email has already been invited or is already a participant";
    }
    return "";
  };

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (emailError) {
      setEmailError(validateEmail(newEmail));
    }
  };

  const handleInvite = async () => {
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }

    try {
      setInviteStatus("sending");
      
      // Add to pending invites (simulate invitation sent)
      const newInvite = {
        id: Date.now(),
        email: email,
        status: "pending",
        sentAt: new Date()
      };
      
      setPendingInvites(prev => [...prev, newInvite]);
      
      // Call parent callback if provided
      if (onInviteUser) {
        await onInviteUser(email);
      }
      
      setEmail("");
      setEmailError("");
      setInviteStatus("sent");
      
      // Clear status after 3 seconds
      setTimeout(() => setInviteStatus(""), 3000);
    } catch (error) {
      setInviteStatus("error");
      console.error("Error sending invite:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleInvite();
    }
  };

  return (
    <Card h="full" w="full" variant="outline" borderWidth={2} borderColor="var(--secondary-color)" display="flex" flexDirection="column">
      <CardBody p={4} flex="1" overflow="hidden" display="flex" flexDirection="column">
        <VStack spacing={4} align="stretch" flex="1" overflow="hidden">
          {/* Coordinator invitation section */}
          {isCoordinator && (
            <Box>
              <Card bg="white" variant="outline" flexShrink={0}>
                <CardBody p={3}>
                  <VStack spacing={4} align="stretch">
                    <Heading size="sm" color="var(--secondary-color)">
                      Invite Participant
                    </Heading>
                    <HStack spacing={3}>
                      <FormControl isInvalid={!!emailError} flex={1}>
                        <Input
                          type="email"
                          placeholder="Enter email address"
                          value={email}
                          onChange={handleEmailChange}
                          onKeyPress={handleKeyPress}
                          size="sm"
                          borderColor={emailError ? "red.300" : "gray.300"}
                          _focus={{
                            borderColor: "var(--secondary-color)",
                            boxShadow: "0 0 0 1px var(--secondary-color)",
                          }}
                        />
                        <FormErrorMessage fontSize="xs">{emailError}</FormErrorMessage>
                      </FormControl>
                      <Button
                        onClick={handleInvite}
                        isDisabled={inviteStatus === "sending" || !email}
                        isLoading={inviteStatus === "sending"}
                        loadingText="Sending"
                        bg="#2B2B2B" color="white" _hover={{ bg: "#6B7280" }}
                        size="sm"
                        minW="80px"
                      >
                        Invite
                      </Button>
                    </HStack>
                    {inviteStatus === "sent" && (
                      <Alert status="success" size="sm" borderRadius="md">
                        <AlertIcon />
                        <Text fontSize="xs">Invitation sent successfully!</Text>
                      </Alert>
                    )}
                    {inviteStatus === "error" && (
                      <Alert status="error" size="sm" borderRadius="md">
                        <AlertIcon />
                        <Text fontSize="xs">Failed to send invitation. Please try again.</Text>
                      </Alert>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </Box>
          )}

          {/* Pending invites section */}
          {isCoordinator && pendingInvites.length > 0 && (
            <Box flexShrink={0}>
              <Heading size="xs" color="var(--secondary-color)" mb={2}>
                Pending Invitations
              </Heading>
              <VStack spacing={1} align="stretch">
                {pendingInvites.map((invite) => (
                  <Card key={invite.id} bg="gray.50" variant="outline" borderColor="gray.300">
                    <CardBody p={2}>
                      <Flex align="center" justify="space-between">
                        <Text fontSize="sm" color="var(--secondary-color)">
                          {invite.email}
                        </Text>
                        <Badge bg="var(--secondary-color)" color="white" size="sm">
                          Pending
                        </Badge>
                      </Flex>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            </Box>
          )}

          {/* Divider between sections */}
          {isCoordinator && (pendingInvites.length > 0 || participants?.length > 0) && (
            <Divider borderColor="gray.300" />
          )}

          {/* Participants list */}
          <Box flex="1" overflow="hidden" display="flex" flexDirection="column">
            <Heading size="xs" color="var(--secondary-color)" mb={2} flexShrink={0}>
              Active Participants
            </Heading>
            {participants?.length === 0 ? (
              <Card variant="outline" borderStyle="dashed" borderColor="gray.300" flexShrink={0}>
                <CardBody p={3} textAlign="center">
                  <Text color="gray.500" fontSize="xs">
                    No participants yet
                  </Text>
                </CardBody>
              </Card>
            ) : (
              <Box flex="1" overflow="auto" pr={1}>
                <VStack spacing={1} align="stretch">
                  {participants?.map((participant) => (
                    <Card
                      key={participant.id}
                      variant="outline"
                      cursor="pointer"
                      _hover={{ bg: "gray.50", borderColor: "var(--secondary-color)" }}
                      onClick={() => onUserSelect(participant)}
                      transition="all 0.2s"
                      flexShrink={0}
                      size="sm"
                    >
                      <CardBody p={2}>
                        <HStack spacing={2}>
                          <Avatar
                            size="sm"
                            name={participant.name}
                            src={participant.avatar_url}
                            bg="gray.100"
                            color="gray.600"
                          />
                          <Box>
                            <Text fontWeight="medium" fontSize="md" lineHeight="1.2">
                              {participant.name}
                            </Text>
                            <Text fontSize="md" color="gray.500" lineHeight="1.1">
                              {participant.email}
                            </Text>
                          </Box>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              </Box>
            )}
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default UserList; 