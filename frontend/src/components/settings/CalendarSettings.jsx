import { useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Divider,
  Heading,
  HStack,
  Icon,
  Skeleton,
  SkeletonText,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { FiCalendar, FiPlus } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";

import { useCalendarAccounts } from "../../hooks/useCalendarAccounts.js";
import { useCalendarConnection } from "../../hooks/useCalendarConnection.js";
import { colors } from "../../styles/designSystem.js";
import CalendarAccountCard from "./CalendarAccountCard.jsx";

/**
 * CalendarSettings - Main component for managing connected calendars.
 */
function CalendarSettings() {
  const toast = useToast();
  const {
    accounts,
    writeCalendar,
    isLoading,
    isSyncing,
    error,
    hasConnectedAccounts,
    enabledCalendarsCount,
    disconnectAccount,
    toggleSourceEnabled,
    setWriteCalendarSource,
    syncAccountCalendars,
    clearError,
  } = useCalendarAccounts();

  const { connectGoogleCalendar } = useCalendarConnection();

  const [disconnectingAccountId, setDisconnectingAccountId] = useState(null);
  const [syncingAccountId, setSyncingAccountId] = useState(null);

  async function handleConnectGoogle() {
    try {
      await connectGoogleCalendar();
    } catch (err) {
      toast({
        title: "Connection failed",
        description: err.message || "Failed to connect Google Calendar",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }

  async function handleDisconnect(accountId) {
    setDisconnectingAccountId(accountId);
    const success = await disconnectAccount(accountId);
    setDisconnectingAccountId(null);

    toast({
      title: success ? "Account disconnected" : "Disconnect failed",
      description: success
        ? "Calendar account has been removed"
        : "Failed to disconnect account. Please try again.",
      status: success ? "success" : "error",
      duration: success ? 3000 : 5000,
      isClosable: true,
    });
  }

  async function handleSyncCalendars(accountId) {
    setSyncingAccountId(accountId);
    const result = await syncAccountCalendars(accountId);
    setSyncingAccountId(null);

    toast({
      title: result ? "Calendars synced" : "Sync failed",
      description: result
        ? `Found ${result.count} calendars`
        : "Failed to sync calendars. Please try again.",
      status: result ? "success" : "error",
      duration: result ? 3000 : 5000,
      isClosable: true,
    });
  }

  async function handleToggleSource(sourceId, isEnabled) {
    const success = await toggleSourceEnabled(sourceId, isEnabled);
    if (!success) {
      toast({
        title: "Update failed",
        description: "Failed to update calendar. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }

  async function handleSetWriteCalendar(sourceId) {
    const success = await setWriteCalendarSource(sourceId);
    toast({
      title: success ? "Write calendar updated" : "Update failed",
      description: success
        ? "New events will be created on this calendar"
        : "Failed to set write calendar. Please try again.",
      status: success ? "success" : "error",
      duration: success ? 3000 : 5000,
      isClosable: true,
    });
  }

  if (isLoading) {
    return (
      <VStack spacing={6} align="stretch">
        <Skeleton height="24px" width="200px" />
        <SkeletonText noOfLines={2} spacing={2} />
        <Skeleton height="120px" borderRadius="md" />
        <Skeleton height="120px" borderRadius="md" />
      </VStack>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <HStack justify="space-between" align="start">
          <VStack align="start" spacing={1}>
            <Heading size="md" color={colors.textPrimary}>
              Connected Calendars
            </Heading>
            <Text fontSize="sm" color={colors.textMuted}>
              Select which calendars to use for busy time detection
            </Text>
          </VStack>
          <Button
            leftIcon={<Icon as={FcGoogle} />}
            size="sm"
            variant="outline"
            onClick={handleConnectGoogle}
          >
            Add Google Calendar
          </Button>
        </HStack>
      </Box>

      {error && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertDescription flex={1}>{error}</AlertDescription>
          <Button size="sm" variant="ghost" onClick={clearError}>
            Dismiss
          </Button>
        </Alert>
      )}

      {hasConnectedAccounts && (
        <HStack spacing={4} py={2}>
          <HStack spacing={2}>
            <Icon as={FiCalendar} color={colors.primary} />
            <Text fontSize="sm" color={colors.textSecondary}>
              <Text as="span" fontWeight="semibold" color={colors.textPrimary}>
                {enabledCalendarsCount}
              </Text>{" "}
              calendars enabled for busy detection
            </Text>
          </HStack>
          {writeCalendar && (
            <>
              <Divider orientation="vertical" h="20px" />
              <HStack spacing={2}>
                <Badge colorScheme="purple" fontSize="xs">
                  Write
                </Badge>
                <Text fontSize="sm" color={colors.textSecondary} noOfLines={1}>
                  {writeCalendar.calendar_name}
                </Text>
              </HStack>
            </>
          )}
        </HStack>
      )}

      {!hasConnectedAccounts && (
        <Box
          p={8}
          bg={colors.surfaceHover}
          borderRadius="lg"
          textAlign="center"
          border="2px dashed"
          borderColor={colors.borderLight}
        >
          <VStack spacing={4}>
            <Icon as={FcGoogle} boxSize={12} />
            <VStack spacing={1}>
              <Text fontWeight="medium" color={colors.textPrimary}>
                No calendars connected
              </Text>
              <Text fontSize="sm" color={colors.textMuted} maxW="300px">
                Connect your Google Calendar to automatically detect your busy times
              </Text>
            </VStack>
            <Button leftIcon={<FiPlus />} colorScheme="purple" onClick={handleConnectGoogle}>
              Connect Google Calendar
            </Button>
          </VStack>
        </Box>
      )}

      <VStack spacing={4} align="stretch">
        {accounts.map((account) => (
          <CalendarAccountCard
            key={account.id}
            account={account}
            onToggleSource={handleToggleSource}
            onSetWriteCalendar={handleSetWriteCalendar}
            onSyncCalendars={handleSyncCalendars}
            onDisconnect={handleDisconnect}
            isDisconnecting={disconnectingAccountId === account.id}
            isSyncing={syncingAccountId === account.id || isSyncing}
          />
        ))}
      </VStack>

      {hasConnectedAccounts && (
        <Box pt={2}>
          <Text fontSize="xs" color={colors.textFaint}>
            <Text as="span" fontWeight="bold">
              Tip:
            </Text>{" "}
            Enable calendars to include their events in busy time detection. The "Write" calendar
            is where new events will be created when you finalize meeting times.
          </Text>
        </Box>
      )}
    </VStack>
  );
}

export default CalendarSettings;
