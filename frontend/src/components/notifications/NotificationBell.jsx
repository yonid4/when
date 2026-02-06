import { Fragment, useCallback, useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Divider,
  HStack,
  IconButton,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { BellIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";

import { notificationsAPI } from "../../services/apiService.js";
import { supabase } from "../../services/supabaseClient.js";
import NotificationItem from "./NotificationItem.jsx";

/**
 * Notification bell component with badge showing unread count.
 * Always visible in header, shows "Inbox is empty" when no notifications.
 */
function NotificationBell({ currentUserId, isAuthenticated }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    if (!currentUserId || !isAuthenticated) return;

    try {
      setIsLoading(true);
      const data = await notificationsAPI.getAll(false, 50);
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, isAuthenticated]);

  useEffect(() => {
    if (!currentUserId || !isAuthenticated) return;

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [currentUserId, isAuthenticated, fetchNotifications]);

  useEffect(() => {
    if (!currentUserId || !isAuthenticated) return;

    const channelConfig = {
      schema: "public",
      table: "notifications",
      filter: `user_id=eq.${currentUserId}`,
    };

    const subscription = supabase
      .channel("user-notifications")
      .on("postgres_changes", { event: "INSERT", ...channelConfig }, fetchNotifications)
      .on("postgres_changes", { event: "UPDATE", ...channelConfig }, fetchNotifications)
      .on("postgres_changes", { event: "DELETE", ...channelConfig }, fetchNotifications)
      .subscribe();

    return () => subscription.unsubscribe();
  }, [currentUserId, isAuthenticated, fetchNotifications]);

  async function handleMarkAllRead() {
    try {
      await notificationsAPI.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }

  function handleNavigate(path) {
    setIsOpen(false);
    navigate(path);
  }

  function toggleOpen() {
    setIsOpen((prev) => !prev);
  }

  function closePopover() {
    setIsOpen(false);
  }

  function renderPopoverBody() {
    if (!isAuthenticated || !currentUserId) {
      return (
        <Box p={4} textAlign="center" color="gray.500">
          <Text fontSize="sm" fontWeight="medium">
            Inbox is empty
          </Text>
          <Text fontSize="xs" color="gray.400" mt={1}>
            Sign in to view your notifications
          </Text>
        </Box>
      );
    }

    if (isLoading) {
      return (
        <Box p={4} textAlign="center">
          <Spinner size="sm" />
          <Text fontSize="sm" color="gray.500" mt={2}>
            Loading notifications...
          </Text>
        </Box>
      );
    }

    if (notifications.length === 0) {
      return (
        <Box p={4} textAlign="center" color="gray.500">
          <Text fontSize="sm" fontWeight="medium">
            Inbox is empty
          </Text>
          <Text fontSize="xs" color="gray.400" mt={1}>
            You're all caught up!
          </Text>
        </Box>
      );
    }

    return (
      <VStack spacing={0} align="stretch">
        {notifications.map((notification, index) => (
          <Fragment key={notification.id}>
            <NotificationItem
              notification={notification}
              onUpdate={fetchNotifications}
              onNavigate={handleNavigate}
            />
            {index < notifications.length - 1 && <Divider />}
          </Fragment>
        ))}
      </VStack>
    );
  }

  const badgeDisplay = unreadCount > 9 ? "9+" : unreadCount;

  return (
    <Popover isOpen={isOpen} onClose={closePopover} placement="bottom-end">
      <PopoverTrigger>
        <Box position="relative" display="inline-block">
          <IconButton
            icon={<BellIcon />}
            variant="ghost"
            aria-label="Notifications"
            onClick={toggleOpen}
            color="white"
            _hover={{ bg: "whiteAlpha.200", transform: "scale(1.1)" }}
            transition="all 0.3s"
          />
          {unreadCount > 0 && (
            <Badge
              position="absolute"
              top="0"
              right="0"
              bgGradient="linear(to-r, orange.400, red.400)"
              color="white"
              borderRadius="full"
              fontSize="10px"
              minW="18px"
              h="18px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="lg"
              animation="pulse 2s infinite"
            >
              {badgeDisplay}
            </Badge>
          )}
        </Box>
      </PopoverTrigger>

      <PopoverContent
        width="400px"
        maxH="600px"
        overflowY="auto"
        borderRadius="xl"
        boxShadow="2xl"
        border="2px"
        borderColor="purple.200"
      >
        <PopoverHeader
          bgGradient="linear(to-r, purple.50, blue.50)"
          borderTopRadius="xl"
          borderBottom="1px"
          borderColor="purple.100"
        >
          <HStack justify="space-between">
            <Text fontWeight="bold" fontSize="md">
              Notifications
            </Text>
            {isAuthenticated && currentUserId && unreadCount > 0 && (
              <Button
                size="xs"
                variant="ghost"
                color="purple.600"
                _hover={{ bgGradient: "linear(to-r, purple.500, blue.500)", color: "white" }}
                transition="all 0.3s"
                onClick={handleMarkAllRead}
              >
                Mark all read
              </Button>
            )}
          </HStack>
        </PopoverHeader>

        <PopoverBody p={0}>{renderPopoverBody()}</PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationBell;

