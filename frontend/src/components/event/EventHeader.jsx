import React from "react";
import {
  Flex,
  Heading,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from "@chakra-ui/react";
import { FiArrowLeft, FiMoreVertical, FiEdit, FiCopy, FiExternalLink } from "react-icons/fi";
import { shadows } from "../../styles/designSystem";

/**
 * EventHeader - Compact header bar for event page
 *
 * @param {Object} props
 * @param {string} props.eventName - Event name/title
 * @param {string} props.status - Event status (planning, finalized, etc.)
 * @param {boolean} props.isCoordinator - Is current user the coordinator
 * @param {string} props.googleCalendarLink - Link to Google Calendar event
 * @param {Function} props.onBack - Handler for back button
 * @param {Function} props.onEdit - Handler for edit action
 * @param {Function} props.onCopyLink - Handler for copy link action
 */
const EventHeader = ({
  eventName,
  status,
  isCoordinator,
  googleCalendarLink,
  onBack,
  onEdit,
  onCopyLink
}) => {
  return (
    <Flex
      px={4}
      py={3}
      borderBottom="1px"
      borderColor="gray.200"
      align="center"
      bg="white"
      shadow={shadows.card}
    >
      <IconButton
        icon={<FiArrowLeft />}
        variant="ghost"
        size="sm"
        onClick={onBack}
        aria-label="Back to Dashboard"
      />
      <Heading size="md" flex={1} ml={2} noOfLines={1} color="gray.800">
        {eventName}
      </Heading>
      <Badge
        colorScheme={status === "finalized" ? "green" : "blue"}
        mr={2}
        px={2}
        py={0.5}
        borderRadius="full"
        fontSize="xs"
      >
        {status?.toUpperCase()}
      </Badge>
      <Menu>
        <MenuButton
          as={IconButton}
          icon={<FiMoreVertical />}
          variant="ghost"
          size="sm"
          aria-label="More options"
        />
        <MenuList>
          {isCoordinator && (
            <MenuItem icon={<FiEdit />} onClick={onEdit}>
              Edit Event
            </MenuItem>
          )}
          <MenuItem icon={<FiCopy />} onClick={onCopyLink}>
            Copy Link
          </MenuItem>
          {googleCalendarLink && (
            <MenuItem
              icon={<FiExternalLink />}
              as="a"
              href={googleCalendarLink}
              target="_blank"
            >
              View in Google Calendar
            </MenuItem>
          )}
        </MenuList>
      </Menu>
    </Flex>
  );
};

export default EventHeader;
