import React, { useState, useEffect } from "react";
import {
  IconButton,
  Badge,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  Button,
  VStack,
  Text,
  Box,
  HStack,
  Divider,
  Spinner,
} from "@chakra-ui/react";
import { BellIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { getNotifications, markAllAsRead } from "../../services/notificationsService";
import { supabase } from "../../services/supabaseClient";
import NotificationItem from "./NotificationItem";

/**
 * Notification bell component with badge showing unread count
 * Always visible in header, shows "Inbox is empty" when no notifications
 */
const NotificationBell = ({ currentUserId, isAuthenticated }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!currentUserId || !isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const data = await getNotifications(false, 50);
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    if (!currentUserId || !isAuthenticated) return;

    fetchNotifications();

    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [currentUserId, isAuthenticated]);

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!currentUserId || !isAuthenticated) return;

    const subscription = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          console.log("New notification received:", payload);
          fetchNotifications();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          console.log("Notification updated:", payload);
          fetchNotifications();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          console.log("Notification deleted:", payload);
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUserId]);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleNavigate = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  // Always show the bell icon, even when not authenticated
  try {
    return (
      <Popover isOpen={isOpen} onClose={() => setIsOpen(false)} placement="bottom-end">
        <PopoverTrigger>
          <Box position="relative" display="inline-block">
            <IconButton
              icon={<BellIcon />}
              variant="ghost"
              aria-label="Notifications"
              onClick={() => setIsOpen(!isOpen)}
              color="gray.700"
              _hover={{ bg: "gray.100" }}
            />
            {unreadCount > 0 && (
              <Badge
                position="absolute"
                top="0"
                right="0"
                colorScheme="red"
                borderRadius="full"
                fontSize="10px"
                minW="18px"
                h="18px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Box>
        </PopoverTrigger>

      <PopoverContent width="400px" maxH="600px" overflowY="auto">
        <PopoverHeader>
          <HStack justify="space-between">
            <Text fontWeight="bold">Notifications</Text>
            {isAuthenticated && currentUserId && unreadCount > 0 && (
              <Button size="xs" variant="ghost" onClick={handleMarkAllRead}>
                Mark all read
              </Button>
            )}
          </HStack>
        </PopoverHeader>

        <PopoverBody p={0}>
          {!isAuthenticated || !currentUserId ? (
            <Box p={4} textAlign="center" color="gray.500">
              <Text fontSize="3xl" mb={2}>
                🔔
              </Text>
              <Text fontSize="sm" fontWeight="medium">
                Inbox is empty
              </Text>
              <Text fontSize="xs" color="gray.400" mt={1}>
                Sign in to view your notifications
              </Text>
            </Box>
          ) : isLoading ? (
            <Box p={4} textAlign="center">
              <Spinner size="sm" />
              <Text fontSize="sm" color="gray.500" mt={2}>
                Loading notifications...
              </Text>
            </Box>
          ) : notifications.length === 0 ? (
            <Box p={4} textAlign="center" color="gray.500">
              <Text fontSize="3xl" mb={2}>
                🔔
              </Text>
              <Text fontSize="sm" fontWeight="medium">
                Inbox is empty
              </Text>
              <Text fontSize="xs" color="gray.400" mt={1}>
                You're all caught up!
              </Text>
            </Box>
          ) : (
            <VStack spacing={0} align="stretch">
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <NotificationItem
                    notification={notification}
                    onUpdate={fetchNotifications}
                    onNavigate={handleNavigate}
                  />
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </VStack>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
    );
  } catch (error) {
    console.error("NotificationBell render error:", error);
    // Fallback: show just a basic bell icon
    return (
      <IconButton
        icon={<BellIcon />}
        variant="ghost"
        aria-label="Notifications"
        color="gray.700"
        _hover={{ bg: "gray.100" }}
        onClick={() => console.log("Notification bell clicked")}
      />
    );
  }
};

export default NotificationBell;

