import React, { useState } from "react";
import {
  Box,
  HStack,
  VStack,
  Text,
  Button,
  IconButton,
  useToast,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { formatDistanceToNow } from "date-fns";
import { handleNotificationAction, deleteNotification } from "../../services/notificationsService";

/**
 * Individual notification item component
 */
const NotificationItem = ({ notification, onUpdate, onNavigate }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();

  const handleAction = async (action) => {
    setIsProcessing(true);
    try {
      const result = await handleNotificationAction(notification.id, action);

      toast({
        title: action === "accept" ? "Invitation accepted!" : "Invitation declined",
        description: result.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      if (action === "accept" && notification.event_id) {
        // Navigate to event page
        setTimeout(() => {
          if (onNavigate) {
            onNavigate(`/events/${notification.event_id}`);
          } else {
            window.location.href = `/events/${notification.event_id}`;
          }
        }, 1000);
      }

      onUpdate();
    } catch (error) {
      toast({
        title: "Action failed",
        description: error.response?.data?.message || "Failed to process action",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    try {
      await deleteNotification(notification.id);
      toast({
        title: "Notification deleted",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      onUpdate();
    } catch (error) {
      toast({
        title: "Failed to delete notification",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "event_invitation":
        return "📬";
      case "event_finalized":
        return "✅";
      case "event_deleted":
        return "❌";
      case "event_time_changed":
        return "🔄";
      default:
        return "📢";
    }
  };

  return (
    <Box
      p={3}
      bg={notification.is_read ? "white" : "blue.50"}
      _hover={{ bg: "gray.50" }}
      transition="background 0.2s"
    >
      <HStack align="start" spacing={3}>
        {/* Icon */}
        <Box fontSize="20px" flexShrink={0}>
          {getNotificationIcon(notification.notification_type)}
        </Box>

        {/* Content */}
        <VStack align="stretch" flex="1" spacing={1}>
          {/* Title */}
          <Text fontWeight={notification.is_read ? "normal" : "bold"} fontSize="sm">
            {notification.title}
          </Text>

          {/* Message */}
          <Text fontSize="xs" color="gray.600">
            {notification.message}
          </Text>

          {/* Timestamp */}
          <Text fontSize="xs" color="gray.400">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </Text>

          {/* Action buttons for invitations */}
          {notification.notification_type === "event_invitation" && !notification.action_taken && (
            <HStack spacing={2} mt={2}>
              <Button
                size="xs"
                colorScheme="green"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction("accept");
                }}
                isLoading={isProcessing}
              >
                Accept
              </Button>
              <Button
                size="xs"
                colorScheme="red"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction("decline");
                }}
                isLoading={isProcessing}
              >
                Decline
              </Button>
            </HStack>
          )}

          {/* Action taken indicator */}
          {notification.action_taken && (
            <Text fontSize="xs" color="gray.500" fontStyle="italic">
              {notification.action_type === "accept" ? "✓ Accepted" : "✗ Declined"}
            </Text>
          )}

          {/* Link to Google Calendar for finalized events */}
          {notification.notification_type === "event_finalized" &&
            notification.metadata?.google_calendar_link && (
              <Button
                as="a"
                href={notification.metadata.google_calendar_link}
                target="_blank"
                rel="noopener noreferrer"
                size="xs"
                colorScheme="blue"
                variant="link"
                mt={1}
                onClick={(e) => e.stopPropagation()}
              >
                View in Google Calendar →
              </Button>
            )}
        </VStack>

        {/* Delete button */}
        <IconButton
          icon={<CloseIcon />}
          size="xs"
          variant="ghost"
          aria-label="Delete notification"
          onClick={handleDelete}
          _hover={{ bg: "red.50", color: "red.600" }}
        />
      </HStack>
    </Box>
  );
};

export default NotificationItem;




