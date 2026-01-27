import { useToast } from "@chakra-ui/react";
import { useCallback } from "react";

/**
 * Custom hook for standardized toast notifications
 * Provides consistent toast patterns across the application
 *
 * @example
 * const { showSuccess, showError, showWarning, showInfo } = useToastNotifications();
 *
 * showSuccess("Event created!", "Your event has been saved");
 * showError("Failed to save", error.message);
 */
export const useToastNotifications = () => {
  const toast = useToast();

  const showSuccess = useCallback(
    (title, description, options = {}) => {
      toast({
        title,
        description,
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top",
        ...options
      });
    },
    [toast]
  );

  const showError = useCallback(
    (title, description, options = {}) => {
      toast({
        title: title || "Error",
        description,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
        ...options
      });
    },
    [toast]
  );

  const showWarning = useCallback(
    (title, description, options = {}) => {
      toast({
        title,
        description,
        status: "warning",
        duration: 4000,
        isClosable: true,
        position: "top",
        ...options
      });
    },
    [toast]
  );

  const showInfo = useCallback(
    (title, description, options = {}) => {
      toast({
        title,
        description,
        status: "info",
        duration: 3000,
        isClosable: true,
        position: "top",
        ...options
      });
    },
    [toast]
  );

  /**
   * Show a toast for RSVP status changes
   */
  const showRsvpUpdate = useCallback(
    (status, isDemo = false) => {
      const statusMessages = {
        going: "confirmed your attendance",
        maybe: "marked yourself as tentative",
        not_going: "declined"
      };

      showSuccess(
        isDemo ? "RSVP Updated (Demo)" : "RSVP Updated",
        `You have ${statusMessages[status]} for this event.`
      );
    },
    [showSuccess]
  );

  /**
   * Show a toast for invitation results
   */
  const showInvitationResult = useCallback(
    (successCount, failedCount) => {
      if (successCount > 0) {
        showSuccess(
          "Invitations sent!",
          `Successfully sent ${successCount} invitation(s)`
        );
      }

      if (failedCount > 0) {
        showWarning(
          "Some invitations failed",
          `${failedCount} invitation(s) could not be sent`
        );
      }
    },
    [showSuccess, showWarning]
  );

  /**
   * Show a toast for clipboard operations
   */
  const showCopied = useCallback(
    (itemName = "Link") => {
      showSuccess(`${itemName} copied!`, undefined, { duration: 2000 });
    },
    [showSuccess]
  );

  /**
   * Show a toast for loading states
   */
  const showLoading = useCallback(
    (title, description) => {
      return toast({
        title,
        description,
        status: "loading",
        duration: null,
        isClosable: false,
        position: "top"
      });
    },
    [toast]
  );

  /**
   * Close a specific toast by ID
   */
  const closeToast = useCallback(
    (toastId) => {
      toast.close(toastId);
    },
    [toast]
  );

  return {
    toast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showRsvpUpdate,
    showInvitationResult,
    showCopied,
    showLoading,
    closeToast
  };
};

export default useToastNotifications;
