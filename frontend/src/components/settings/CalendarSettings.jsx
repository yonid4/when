import React, { useState } from "react";
import {
    Box,
    VStack,
    HStack,
    Heading,
    Text,
    Button,
    Icon,
    Alert,
    AlertIcon,
    AlertDescription,
    Skeleton,
    SkeletonText,
    useToast,
    Divider,
    Badge,
} from "@chakra-ui/react";
import { FiPlus, FiCalendar, FiRefreshCw } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { useCalendarAccounts } from "../../hooks/useCalendarAccounts";
import { useCalendarConnection } from "../../hooks/useCalendarConnection";
import CalendarAccountCard from "./CalendarAccountCard";
import { colors } from "../../styles/designSystem";

/**
 * CalendarSettings - Main component for managing connected calendars.
 *
 * Features:
 * - List connected calendar accounts
 * - Add new Google Calendar account
 * - Toggle calendars on/off for busy time detection
 * - Set write calendar for event creation
 */
const CalendarSettings = () => {
    const toast = useToast();
    const {
        accounts,
        writeCalendar,
        isLoading,
        isSyncing,
        error,
        hasConnectedAccounts,
        enabledCalendarsCount,
        refetch,
        disconnectAccount,
        toggleSourceEnabled,
        setWriteCalendarSource,
        syncAccountCalendars,
        clearError,
    } = useCalendarAccounts();

    const { connectGoogleCalendar } = useCalendarConnection();

    const [disconnectingAccountId, setDisconnectingAccountId] = useState(null);
    const [syncingAccountId, setSyncingAccountId] = useState(null);

    const handleConnectGoogle = async () => {
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
    };

    const handleDisconnect = async (accountId) => {
        setDisconnectingAccountId(accountId);
        const success = await disconnectAccount(accountId);
        setDisconnectingAccountId(null);

        if (success) {
            toast({
                title: "Account disconnected",
                description: "Calendar account has been removed",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } else {
            toast({
                title: "Disconnect failed",
                description: "Failed to disconnect account. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleSyncCalendars = async (accountId) => {
        setSyncingAccountId(accountId);
        const result = await syncAccountCalendars(accountId);
        setSyncingAccountId(null);

        if (result) {
            toast({
                title: "Calendars synced",
                description: `Found ${result.count} calendars`,
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } else {
            toast({
                title: "Sync failed",
                description: "Failed to sync calendars. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleToggleSource = async (sourceId, isEnabled) => {
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
    };

    const handleSetWriteCalendar = async (sourceId) => {
        const success = await setWriteCalendarSource(sourceId);
        if (success) {
            toast({
                title: "Write calendar updated",
                description: "New events will be created on this calendar",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } else {
            toast({
                title: "Update failed",
                description: "Failed to set write calendar. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    // Loading state
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
            {/* Header */}
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

            {/* Error Alert */}
            {error && (
                <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription flex={1}>{error}</AlertDescription>
                    <Button size="sm" variant="ghost" onClick={clearError}>
                        Dismiss
                    </Button>
                </Alert>
            )}

            {/* Stats Summary */}
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

            {/* No Accounts State */}
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
                        <Button
                            leftIcon={<FiPlus />}
                            colorScheme="purple"
                            onClick={handleConnectGoogle}
                        >
                            Connect Google Calendar
                        </Button>
                    </VStack>
                </Box>
            )}

            {/* Account Cards */}
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

            {/* Help Text */}
            {hasConnectedAccounts && (
                <Box pt={2}>
                    <Text fontSize="xs" color={colors.textFaint}>
                        <strong>Tip:</strong> Enable calendars to include their events in busy time
                        detection. The "Write" calendar is where new events will be created when you
                        finalize meeting times.
                    </Text>
                </Box>
            )}
        </VStack>
    );
};

export default CalendarSettings;
