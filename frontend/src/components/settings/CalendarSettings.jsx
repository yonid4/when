import { useState, useEffect } from "react";
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
import { BsMicrosoft } from "react-icons/bs";

import { useCalendarAccounts } from "../../hooks/useCalendarAccounts.js";
import { useCalendarConnection } from "../../hooks/useCalendarConnection.js";
import { busySlotsAPI } from "../../services/apiService.js";
import api from "../../services/api.js";
import { colors } from "../../styles/designSystem.js";
import CalendarAccountCard from "./CalendarAccountCard.jsx";

/**
 * CalendarSettings - Main component for managing connected calendars.
 */
function CalendarSettings() {
  const toast = useToast();
  const {
    accounts,
    writeCalendars,
    isLoading,
    isSyncing,
    error,
    hasConnectedAccounts,
    disconnectAccount,
    toggleSourceEnabled,
    setWriteCalendarSource,
    syncAccountCalendars,
    clearError,
    refetch,
  } = useCalendarAccounts();

  const { connectGoogleCalendar, connectMicrosoftCalendar } = useCalendarConnection();

  const [disconnectingAccountId, setDisconnectingAccountId] = useState(null);
  const [syncingAccountId, setSyncingAccountId] = useState(null);
  const [pendingToggles, setPendingToggles] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [primaryProvider, setPrimaryProvider] = useState("google");
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch user profile to get primary provider preference
  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: { user } } = await import("../services/supabaseClient.js").then(m => m.supabase.auth.getUser());
        if (user) {
          const res = await api.get(`/api/users/${user.id}`);
          if (res.data?.primary_calendar_provider) {
            setPrimaryProvider(res.data.primary_calendar_provider);
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile settings", err);
      } finally {
        setProfileLoading(false);
      }
    }
    fetchProfile();
  }, []);

  async function handleSetPrimaryProvider(provider) {
    setPrimaryProvider(provider);
    try {
      const { data: { user } } = await import("../services/supabaseClient.js").then(m => m.supabase.auth.getUser());
      if (user) {
        await api.put(`/api/users/${user.id}`, { primary_calendar_provider: provider });
        toast({
          title: "Preference updated",
          description: `Primary calendar set to ${provider === "google" ? "Google" : "Microsoft"}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      toast({
        title: "Update failed",
        description: "Failed to save preference. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }

  const hasPendingChanges = Object.keys(pendingToggles).length > 0;

  const effectiveEnabledCount = accounts.reduce(
    (count, account) =>
      count +
      (account.calendar_sources?.filter((source) => {
        const effective = pendingToggles[source.id] ?? source.is_enabled;
        return effective;
      })?.length || 0),
    0
  );

  const allWouldBeDisabled = hasPendingChanges && effectiveEnabledCount === 0;

  function handleToggleSource(sourceId, newEnabled) {
    setPendingToggles((prev) => {
      const savedState = accounts
        .flatMap((a) => a.calendar_sources || [])
        .find((s) => s.id === sourceId)?.is_enabled;

      // If toggling back to saved state, remove from pending
      if (savedState === newEnabled) {
        const next = { ...prev };
        delete next[sourceId];
        return next;
      }
      return { ...prev, [sourceId]: newEnabled };
    });
  }

  function getPendingUpdates() {
    return Object.entries(pendingToggles).map(([sourceId, isEnabled]) => {
      const allSources = accounts.flatMap((a) => a.calendar_sources || []);
      const source = allSources.find((s) => String(s.id) === String(sourceId));
      return { sourceId: source ? source.id : sourceId, isEnabled };
    });
  }

  function handleCancel() {
    setPendingToggles({});
  }

  async function handleConfirm() {
    setIsSaving(true);
    try {
      const updates = getPendingUpdates();
      const results = await Promise.all(
        updates.map(({ sourceId, isEnabled }) => toggleSourceEnabled(sourceId, isEnabled))
      );

      const allSucceeded = results.every(Boolean);
      if (!allSucceeded) {
        await refetch();
        toast({
          title: "Some updates failed",
          description: "Not all calendar changes could be saved. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setIsSaving(false);
        return;
      }

      try {
        await busySlotsAPI.syncCalendar();
        toast({
          title: "Calendars updated and availability synced",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch {
        toast({
          title: "Calendars updated but sync failed",
          description: "Availability will update on next automatic sync.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }

      setPendingToggles({});
      await refetch();
    } catch {
      await refetch();
      toast({
        title: "Update failed",
        description: "Failed to update calendars. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  }

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

  async function handleConnectMicrosoft() {
    try {
      await connectMicrosoftCalendar();
    } catch (err) {
      toast({
        title: "Connection failed",
        description: err.message || "Failed to connect Microsoft Calendar",
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
          <HStack spacing={2}>
            <Button
              leftIcon={<Icon as={FcGoogle} />}
              size="sm"
              variant="outline"
              onClick={handleConnectGoogle}
            >
              Add Google
            </Button>
            <Button
              leftIcon={<Icon as={BsMicrosoft} color={colors.microsoft} />}
              size="sm"
              variant="outline"
              onClick={handleConnectMicrosoft}
            >
              Add Microsoft
            </Button>
          </HStack>
        </HStack>
      </Box>

      {/* Primary Provider Selection - only show when both providers are connected */}
      {accounts.some(a => a.provider === 'google' && a.calendar_sources?.length > 0) &&
       accounts.some(a => a.provider === 'microsoft' && a.calendar_sources?.length > 0) && (
        <Box p={4} bg={colors.surface} borderWidth="1px" borderColor={colors.border} borderRadius="lg">
          <VStack align="start" spacing={3}>
            <Box>
              <Heading size="sm" color={colors.textPrimary}>Primary Calendar used for Inviting Guests</Heading>
              <Text fontSize="sm" color={colors.textMuted}>
                When you finalize an event, invites will be sent from this calendar.
              </Text>
            </Box>
            <HStack spacing={4}>
              {accounts.some(a => a.provider === 'google' && a.calendar_sources?.length > 0) && (
                <Button
                  size="sm"
                  variant={primaryProvider === "google" ? "solid" : "outline"}
                  colorScheme={primaryProvider === "google" ? "blue" : "gray"}
                  leftIcon={<Icon as={FcGoogle} />}
                  onClick={() => handleSetPrimaryProvider("google")}
                  isDisabled={profileLoading}
                >
                  Google Calendar
                </Button>
              )}
              {accounts.some(a => a.provider === 'microsoft' && a.calendar_sources?.length > 0) && (
                <Button
                  size="sm"
                  variant={primaryProvider === "microsoft" ? "solid" : "outline"}
                  colorScheme={primaryProvider === "microsoft" ? "blue" : "gray"}
                  leftIcon={<Icon as={BsMicrosoft} color={primaryProvider === "microsoft" ? "white" : colors.microsoft} />}
                  bg={primaryProvider === "microsoft" ? colors.microsoft : undefined}
                  _hover={primaryProvider === "microsoft" ? { bg: colors.microsoftHover } : undefined}
                  onClick={() => handleSetPrimaryProvider("microsoft")}
                  isDisabled={profileLoading}
                >
                  Microsoft Outlook
                </Button>
              )}
            </HStack>
          </VStack>
        </Box>
      )}

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
        <HStack spacing={4} py={2} wrap="wrap">
          <HStack spacing={2}>
            <Icon as={FiCalendar} color={colors.primary} />
            <Text fontSize="sm" color={colors.textSecondary}>
              <Text as="span" fontWeight="semibold" color={colors.textPrimary}>
                {effectiveEnabledCount}
              </Text>{" "}
              calendars enabled for busy detection
            </Text>
          </HStack>
          {writeCalendars.map((cal) => (
            <HStack key={cal.id} spacing={2}>
              <Divider orientation="vertical" h="20px" />
              {cal.account?.provider === 'google' ? <Icon as={FcGoogle} /> : <Icon as={BsMicrosoft} color={colors.microsoft} />}
              <Badge colorScheme="brand" fontSize="xs">
                Write
              </Badge>
              <Text fontSize="sm" color={colors.textSecondary} noOfLines={1} maxW="150px">
                {cal.calendar_name}
              </Text>
            </HStack>
          ))}
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
            <Icon as={FiCalendar} boxSize={12} color={colors.primary} />
            <VStack spacing={1}>
              <Text fontWeight="medium" color={colors.textPrimary}>
                No calendars connected
              </Text>
              <Text fontSize="sm" color={colors.textMuted} maxW="300px">
                Connect your calendar to automatically detect your busy times
              </Text>
            </VStack>
            <HStack spacing={3}>
              <Button
                leftIcon={<Icon as={FcGoogle} />}
                colorScheme="brand"
                onClick={handleConnectGoogle}
              >
                Google Calendar
              </Button>
              <Button
                leftIcon={<Icon as={BsMicrosoft} />}
                bg={colors.microsoft}
                color="white"
                _hover={{ bg: colors.microsoftHover }}
                onClick={handleConnectMicrosoft}
              >
                Microsoft Calendar
              </Button>
            </HStack>
          </VStack>
        </Box>
      )}

      <VStack spacing={4} align="stretch">
        {accounts.map((account) => (
          <CalendarAccountCard
            key={account.id}
            account={account}
            pendingToggles={pendingToggles}
            onToggleSource={handleToggleSource}
            onSetWriteCalendar={handleSetWriteCalendar}
            onSyncCalendars={handleSyncCalendars}
            onDisconnect={handleDisconnect}
            isDisconnecting={disconnectingAccountId === account.id}
            isSyncing={syncingAccountId === account.id || isSyncing}
          />
        ))}
      </VStack>

      {hasPendingChanges && (
        <Box
          p={4}
          bg={colors.surfaceHover}
          borderRadius="lg"
          border="1px solid"
          borderColor="brand.200"
        >
          <VStack spacing={3} align="stretch">
            {allWouldBeDisabled && (
              <Alert status="warning" borderRadius="md" size="sm">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  At least one calendar must remain enabled
                </AlertDescription>
              </Alert>
            )}
            <HStack justify="flex-end" spacing={3}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                isDisabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                colorScheme="brand"
                size="sm"
                onClick={handleConfirm}
                isDisabled={allWouldBeDisabled || isSaving}
                isLoading={isSaving}
                loadingText="Saving..."
              >
                Confirm Changes
              </Button>
            </HStack>
          </VStack>
        </Box>
      )}

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
