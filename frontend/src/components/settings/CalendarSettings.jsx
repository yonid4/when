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

  // ... (unchanged) ...

  return (
    <VStack spacing={6} align="stretch">
      {/* ... (unchanged) ... */}

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
