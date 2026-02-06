import { useCallback } from "react";

import { useToast } from "@chakra-ui/react";

const RSVP_STATUS_MESSAGES = {
  going: "confirmed your attendance",
  maybe: "marked yourself as tentative",
  not_going: "declined",
};

export function useToastNotifications() {
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
        ...options,
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
        ...options,
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
        ...options,
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
        ...options,
      });
    },
    [toast]
  );

  const showRsvpUpdate = useCallback(
    (status, isDemo = false) => {
      showSuccess(
        isDemo ? "RSVP Updated (Demo)" : "RSVP Updated",
        `You have ${RSVP_STATUS_MESSAGES[status]} for this event.`
      );
    },
    [showSuccess]
  );

  const showInvitationResult = useCallback(
    (successCount, failedCount) => {
      if (successCount > 0) {
        showSuccess("Invitations sent!", `Successfully sent ${successCount} invitation(s)`);
      }
      if (failedCount > 0) {
        showWarning("Some invitations failed", `${failedCount} invitation(s) could not be sent`);
      }
    },
    [showSuccess, showWarning]
  );

  const showCopied = useCallback(
    (itemName = "Link") => {
      showSuccess(`${itemName} copied!`, undefined, { duration: 2000 });
    },
    [showSuccess]
  );

  const showLoading = useCallback(
    (title, description) =>
      toast({
        title,
        description,
        status: "loading",
        duration: null,
        isClosable: false,
        position: "top",
      }),
    [toast]
  );

  const closeToast = useCallback((toastId) => toast.close(toastId), [toast]);

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
    closeToast,
  };
}

export default useToastNotifications;
