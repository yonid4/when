import React, { useState } from "react";
import {
    Box,
    Card,
    CardBody,
    Flex,
    HStack,
    VStack,
    Text,
    Badge,
    Switch,
    Button,
    Icon,
    IconButton,
    Collapse,
    useDisclosure,
    Tooltip,
    Spinner,
} from "@chakra-ui/react";
import {
    FiChevronDown,
    FiChevronUp,
    FiTrash2,
    FiRefreshCw,
    FiCheck,
    FiEdit3,
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { colors, shadows } from "../../styles/designSystem";

/**
 * CalendarAccountCard - Displays a connected calendar account with its sources.
 *
 * Features:
 * - Expandable list of calendars
 * - Toggle switches for each calendar
 * - Write calendar indicator
 * - Sync and disconnect buttons
 */
const CalendarAccountCard = ({
    account,
    onToggleSource,
    onSetWriteCalendar,
    onSyncCalendars,
    onDisconnect,
    isDisconnecting,
    isSyncing,
}) => {
    const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
    const [togglingSourceId, setTogglingSourceId] = useState(null);
    const [settingWriteId, setSettingWriteId] = useState(null);

    const sources = account.calendar_sources || [];
    const enabledCount = sources.filter((s) => s.is_enabled).length;

    const handleToggleSource = async (sourceId, currentEnabled) => {
        setTogglingSourceId(sourceId);
        await onToggleSource(sourceId, !currentEnabled);
        setTogglingSourceId(null);
    };

    const handleSetWriteCalendar = async (sourceId) => {
        setSettingWriteId(sourceId);
        await onSetWriteCalendar(sourceId);
        setSettingWriteId(null);
    };

    const getProviderIcon = (provider) => {
        if (provider === "google") {
            return <Icon as={FcGoogle} boxSize={5} />;
        }
        return null;
    };

    return (
        <Card
            variant="outline"
            borderColor={colors.borderLight}
            shadow={shadows.card}
            _hover={{ shadow: shadows.cardHover }}
            transition="all 0.2s"
        >
            <CardBody p={0}>
                {/* Account Header */}
                <Flex
                    p={4}
                    align="center"
                    justify="space-between"
                    cursor="pointer"
                    onClick={onToggle}
                    _hover={{ bg: colors.surfaceHover }}
                    borderRadius="md"
                >
                    <HStack spacing={3}>
                        {getProviderIcon(account.provider)}
                        <VStack align="start" spacing={0}>
                            <Text fontWeight="medium" color={colors.textPrimary}>
                                {account.provider_email}
                            </Text>
                            <Text fontSize="xs" color={colors.textMuted}>
                                {enabledCount} of {sources.length} calendars enabled
                            </Text>
                        </VStack>
                    </HStack>

                    <HStack spacing={2}>
                        <Tooltip label="Sync calendars from Google">
                            <IconButton
                                icon={isSyncing ? <Spinner size="sm" /> : <FiRefreshCw />}
                                size="sm"
                                variant="ghost"
                                aria-label="Sync calendars"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSyncCalendars(account.id);
                                }}
                                isDisabled={isSyncing}
                            />
                        </Tooltip>
                        <Tooltip label="Disconnect account">
                            <IconButton
                                icon={isDisconnecting ? <Spinner size="sm" /> : <FiTrash2 />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                aria-label="Disconnect account"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDisconnect(account.id);
                                }}
                                isDisabled={isDisconnecting}
                            />
                        </Tooltip>
                        <Icon
                            as={isOpen ? FiChevronUp : FiChevronDown}
                            color={colors.textMuted}
                        />
                    </HStack>
                </Flex>

                {/* Calendar Sources List */}
                <Collapse in={isOpen}>
                    <VStack spacing={0} align="stretch" pb={2}>
                        {sources.length === 0 ? (
                            <Box px={4} py={3}>
                                <Text fontSize="sm" color={colors.textMuted}>
                                    No calendars found. Click sync to refresh.
                                </Text>
                            </Box>
                        ) : (
                            sources.map((source) => (
                                <CalendarSourceRow
                                    key={source.id}
                                    source={source}
                                    isToggling={togglingSourceId === source.id}
                                    isSettingWrite={settingWriteId === source.id}
                                    onToggle={() => handleToggleSource(source.id, source.is_enabled)}
                                    onSetWriteCalendar={() => handleSetWriteCalendar(source.id)}
                                />
                            ))
                        )}
                    </VStack>
                </Collapse>
            </CardBody>
        </Card>
    );
};

/**
 * CalendarSourceRow - Individual calendar source row with toggle and write indicator.
 */
const CalendarSourceRow = ({
    source,
    isToggling,
    isSettingWrite,
    onToggle,
    onSetWriteCalendar,
}) => {
    return (
        <Flex
            px={4}
            py={3}
            align="center"
            justify="space-between"
            borderTop="1px solid"
            borderColor={colors.borderLight}
            _hover={{ bg: colors.surfaceHover }}
        >
            <HStack spacing={3} flex={1}>
                {/* Color dot */}
                <Box
                    w={3}
                    h={3}
                    borderRadius="full"
                    bg={source.color || colors.primary}
                    flexShrink={0}
                />

                {/* Calendar name and badges */}
                <VStack align="start" spacing={0.5} flex={1}>
                    <HStack spacing={2}>
                        <Text
                            fontSize="sm"
                            fontWeight="medium"
                            color={source.is_enabled ? colors.textPrimary : colors.textMuted}
                            noOfLines={1}
                        >
                            {source.calendar_name}
                        </Text>
                        {source.is_write_calendar && (
                            <Badge
                                colorScheme="purple"
                                size="sm"
                                fontSize="xs"
                                px={1.5}
                                py={0.5}
                            >
                                Write
                            </Badge>
                        )}
                    </HStack>
                    <Text fontSize="xs" color={colors.textFaint} noOfLines={1}>
                        {source.calendar_id === "primary" ? "Primary calendar" : source.calendar_id}
                    </Text>
                </VStack>
            </HStack>

            {/* Actions */}
            <HStack spacing={3}>
                {/* Set as write calendar button (only show if not already write calendar) */}
                {!source.is_write_calendar && source.is_enabled && (
                    <Tooltip label="Set as write calendar">
                        <IconButton
                            icon={isSettingWrite ? <Spinner size="xs" /> : <FiEdit3 />}
                            size="xs"
                            variant="ghost"
                            colorScheme="purple"
                            aria-label="Set as write calendar"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSetWriteCalendar();
                            }}
                            isDisabled={isSettingWrite}
                        />
                    </Tooltip>
                )}

                {/* Enable/disable toggle */}
                <Switch
                    size="sm"
                    colorScheme="purple"
                    isChecked={source.is_enabled}
                    onChange={onToggle}
                    isDisabled={isToggling}
                />
            </HStack>
        </Flex>
    );
};

export default CalendarAccountCard;
