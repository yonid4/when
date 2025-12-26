import React, { useState } from "react";
import {
  Box,
  HStack,
  VStack,
  Text,
  Button,
  IconButton,
  useToast,
  Icon as ChakraIcon,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { FiCalendar, FiCheckCircle, FiXCircle, FiRefreshCw, FiBell } from "react-icons/fi";
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
        return { icon: FiCalendar, gradient: "linear(to-r, purple.500, blue.500)" };
      case "event_finalized":
        return { icon: FiCheckCircle, gradient: "linear(to-r, green.400, teal.500)" };
      case "event_deleted":
        return { icon: FiXCircle, gradient: "linear(to-r, red.400, pink.400)" };
      case "event_time_changed":
        return { icon: FiRefreshCw, gradient: "linear(to-r, orange.400, yellow.400)" };
      default:
        return { icon: FiBell, gradient: "linear(to-r, blue.500, cyan.500)" };
    }
  };

  const iconInfo = getNotificationIcon(notification.notification_type);

  return (
    <Box
      p={3}
      bg={notification.is_read ? "white" : "purple.50"}
      borderLeft="4px"
      borderColor={notification.is_read ? "gray.200" : "purple.400"}
      _hover={{ bg: "gray.50", transform: "translateX(4px)" }}
      transition="all 0.3s"
      position="relative"
    >
      <HStack align="start" spacing={3}>
        {/* Icon with gradient background */}
        <Box
          p={2}
          bgGradient={iconInfo.gradient}
          borderRadius="lg"
          flexShrink={0}
          boxShadow="md"
        >
          <ChakraIcon as={iconInfo.icon} color="white" boxSize={4} />
        </Box>

        {/* Content */}
        <VStack align="stretch" flex="1" spacing={1}>
          {/* Title */}
          <Text fontWeight={notification.is_read ? "medium" : "bold"} fontSize="sm">
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
                bgGradient="linear(to-r, green.400, teal.500)"
                color="white"
                _hover={{
                  bgGradient: "linear(to-r, green.500, teal.600)",
                  transform: "translateY(-2px)",
                  boxShadow: "md"
                }}
                transition="all 0.3s"
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
                variant="outline"
                borderColor="red.400"
                color="red.600"
                _hover={{
                  bg: "red.50",
                  borderColor: "red.500"
                }}
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
                bgGradient="linear(to-r, blue.500, cyan.500)"
                color="white"
                mt={1}
                _hover={{
                  bgGradient: "linear(to-r, blue.600, cyan.600)",
                  transform: "translateY(-2px)"
                }}
                transition="all 0.3s"
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
          _hover={{ 
            bg: "red.50", 
            color: "red.600",
            transform: "scale(1.1)"
          }}
          transition="all 0.2s"
        />
      </HStack>
    </Box>
  );
};

export default NotificationItem;




