import { useState } from "react";
import {
  Badge,
  Box,
  Card,
  CardBody,
  Collapse,
  Flex,
  HStack,
  Icon,
  IconButton,
  Spinner,
  Switch,
  Text,
  Tooltip,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { FiChevronDown, FiChevronUp, FiEdit3, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";

import { colors, shadows } from "../../styles/designSystem.js";

/**
 * CalendarAccountCard - Displays a connected calendar account with its sources.
 */
function CalendarAccountCard({
  account,
  pendingToggles,
  onToggleSource,
  onSetWriteCalendar,
  onSyncCalendars,
  onDisconnect,
  isDisconnecting,
  isSyncing,
}) {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
  const [settingWriteId, setSettingWriteId] = useState(null);

  const sources = account.calendar_sources || [];
  const enabledCount = sources.filter((s) => {
    const effective = pendingToggles[s.id] ?? s.is_enabled;
    return effective;
  }).length;

  function handleToggleSource(sourceId, currentEffectiveEnabled) {
    onToggleSource(sourceId, !currentEffectiveEnabled);
  }

  async function handleSetWriteCalendar(sourceId) {
    setSettingWriteId(sourceId);
    await onSetWriteCalendar(sourceId);
    setSettingWriteId(null);
  }

  const providerIcon = account.provider === "google" ? <Icon as={FcGoogle} boxSize={5} /> : null;
  const chevronIcon = isOpen ? FiChevronUp : FiChevronDown;

  function handleSyncClick(e) {
    e.stopPropagation();
    onSyncCalendars(account.id);
  }

  function handleDisconnectClick(e) {
    e.stopPropagation();
    onDisconnect(account.id);
  }

  return (
    <Card
      variant="outline"
      borderColor={colors.borderLight}
      shadow={shadows.card}
      _hover={{ shadow: shadows.cardHover }}
      transition="all 0.2s"
    >
      <CardBody p={0}>
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
            {providerIcon}
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
                onClick={handleSyncClick}
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
                onClick={handleDisconnectClick}
                isDisabled={isDisconnecting}
              />
            </Tooltip>
            <Icon as={chevronIcon} color={colors.textMuted} />
          </HStack>
        </Flex>

        <Collapse in={isOpen}>
          <VStack spacing={0} align="stretch" pb={2}>
            {sources.length === 0 ? (
              <Box px={4} py={3}>
                <Text fontSize="sm" color={colors.textMuted}>
                  No calendars found. Click sync to refresh.
                </Text>
              </Box>
            ) : (
              sources.map((source) => {
                const effectiveEnabled = pendingToggles[source.id] ?? source.is_enabled;
                const isPending = source.id in pendingToggles;
                return (
                  <CalendarSourceRow
                    key={source.id}
                    source={source}
                    isEnabled={effectiveEnabled}
                    isPending={isPending}
                    isSettingWrite={settingWriteId === source.id}
                    onToggle={() => handleToggleSource(source.id, effectiveEnabled)}
                    onSetWriteCalendar={() => handleSetWriteCalendar(source.id)}
                  />
                );
              })
            )}
          </VStack>
        </Collapse>
      </CardBody>
    </Card>
  );
}

function CalendarSourceRow({ source, isEnabled, isPending, isSettingWrite, onToggle, onSetWriteCalendar }) {
  const calendarLabel = source.calendar_id === "primary" ? "Primary calendar" : source.calendar_id;
  const showWriteButton = !source.is_write_calendar && isEnabled;

  function handleSetWriteClick(e) {
    e.stopPropagation();
    onSetWriteCalendar();
  }

  return (
    <Flex
      px={4}
      py={3}
      align="center"
      justify="space-between"
      borderTop="1px solid"
      borderColor={colors.borderLight}
      _hover={{ bg: colors.surfaceHover }}
      bg={isPending ? "purple.50" : "transparent"}
    >
      <HStack spacing={3} flex={1}>
        <Box w={3} h={3} borderRadius="full" bg={source.color || colors.primary} flexShrink={0} />

        <VStack align="start" spacing={0.5} flex={1}>
          <HStack spacing={2}>
            <Text
              fontSize="sm"
              fontWeight="medium"
              color={isEnabled ? colors.textPrimary : colors.textMuted}
              noOfLines={1}
            >
              {source.calendar_name}
            </Text>
            {source.is_write_calendar && (
              <Badge colorScheme="purple" size="sm" fontSize="xs" px={1.5} py={0.5}>
                Write
              </Badge>
            )}
            {isPending && (
              <Box w={1.5} h={1.5} borderRadius="full" bg="purple.400" flexShrink={0} />
            )}
          </HStack>
          <Text fontSize="xs" color={colors.textFaint} noOfLines={1}>
            {calendarLabel}
          </Text>
        </VStack>
      </HStack>

      <HStack spacing={3}>
        {showWriteButton && (
          <Tooltip label="Set as write calendar">
            <IconButton
              icon={isSettingWrite ? <Spinner size="xs" /> : <FiEdit3 />}
              size="xs"
              variant="ghost"
              colorScheme="purple"
              aria-label="Set as write calendar"
              onClick={handleSetWriteClick}
              isDisabled={isSettingWrite}
            />
          </Tooltip>
        )}

        <Switch
          size="sm"
          colorScheme="purple"
          isChecked={isEnabled}
          onChange={onToggle}
        />
      </HStack>
    </Flex>
  );
}

export default CalendarAccountCard;
