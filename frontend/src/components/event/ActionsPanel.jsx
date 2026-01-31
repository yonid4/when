import React from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Spinner,
  Skeleton
} from "@chakra-ui/react";
import { FiClock, FiRefreshCw, FiMail, FiCopy, FiCalendar } from "react-icons/fi";
import { shadows } from "../../styles/designSystem";

/**
 * ActionsPanel - Event action buttons in the sidebar
 *
 * @param {Object} props
 * @param {boolean} props.isCoordinator - Is current user the coordinator
 * @param {boolean} props.canInvite - Can current user invite others
 * @param {boolean} props.isFinalized - Is event finalized
 * @param {boolean} props.isLoadingProposals - Loading state for AI proposals
 * @param {number} props.proposalCount - Number of AI proposals
 * @param {boolean} props.isSyncing - Loading state for calendar sync
 * @param {Function} props.onViewProposals - Handler for viewing proposals
 * @param {Function} props.onSync - Handler for calendar sync
 * @param {Function} props.onInvite - Handler for opening invite modal
 * @param {Function} props.onCopyLink - Handler for copying event link
 * @param {Function} props.onReconnect - Handler for reconnecting Google Calendar
 * @param {string} props.cardBg - Card background color
 * @param {boolean} props.isLoading - Show skeleton loading state
 */
const ActionsPanel = ({
  isCoordinator,
  canInvite,
  isFinalized,
  isLoadingProposals,
  proposalCount,
  isSyncing,
  onViewProposals,
  onSync,
  onInvite,
  onCopyLink,
  onReconnect,
  cardBg,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Box borderWidth="1px" borderRadius="xl" p={4} bg={cardBg} shadow={shadows.card}>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          textTransform="uppercase"
          letterSpacing="0.5px"
          color="gray.500"
          mb={3}
        >
          Actions
        </Text>
        <VStack spacing={3}>
          <Skeleton height="40px" width="100%" borderRadius="md" />
          <HStack w="full" spacing={2}>
            <Skeleton height="32px" flex={1} borderRadius="md" />
            <Skeleton height="32px" flex={1} borderRadius="md" />
          </HStack>
          <HStack w="full" spacing={2}>
            <Skeleton height="24px" flex={1} borderRadius="md" />
            <Skeleton height="24px" flex={1} borderRadius="md" />
          </HStack>
        </VStack>
      </Box>
    );
  }

  return (
    <Box borderWidth="1px" borderRadius="xl" p={4} bg={cardBg} shadow={shadows.card}>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        textTransform="uppercase"
        letterSpacing="0.5px"
        color="gray.500"
        mb={3}
      >
        Actions
      </Text>
      <VStack spacing={3}>
        {/* Primary Action - Coordinator: View Proposed Times */}
        {isCoordinator && !isFinalized && (
          <Button
            colorScheme="purple"
            w="full"
            size="md"
            leftIcon={isLoadingProposals ? <Spinner size="sm" /> : <FiClock />}
            onClick={onViewProposals}
            isDisabled={isLoadingProposals}
          >
            {isLoadingProposals ? "Generating..." : "View Proposed Times"}
            {!isLoadingProposals && proposalCount > 0 && (
              <Badge ml={2} colorScheme="whiteAlpha" bg="whiteAlpha.300">
                {proposalCount}
              </Badge>
            )}
          </Button>
        )}

        {/* Secondary Actions Row */}
        <HStack w="full" spacing={2}>
          {isCoordinator && (
            <Button
              flex={1}
              size="sm"
              variant="outline"
              leftIcon={<FiRefreshCw />}
              onClick={onSync}
              isLoading={isSyncing}
              isDisabled={isFinalized}
            >
              Sync
            </Button>
          )}
          {(isCoordinator || canInvite) && (
            <Button
              flex={1}
              size="sm"
              variant="outline"
              leftIcon={<FiMail />}
              onClick={onInvite}
            >
              Invite
            </Button>
          )}
        </HStack>

        {/* Tertiary Actions */}
        <HStack w="full" spacing={2}>
          <Button
            flex={1}
            size="xs"
            variant="ghost"
            leftIcon={<FiCopy />}
            onClick={onCopyLink}
          >
            Copy Link
          </Button>
          <Button
            flex={1}
            size="xs"
            variant="ghost"
            leftIcon={<FiCalendar />}
            onClick={onReconnect}
            data-reconnect-calendar
          >
            Reconnect
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default ActionsPanel;
