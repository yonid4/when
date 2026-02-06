import { useState } from "react";

import { useToast } from "@chakra-ui/react";

function extractErrorMessage(err, fallbackMessage) {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.response?.data?.error) return err.response.data.error;
  if (err.message) return err.message;
  return fallbackMessage;
}

export function useApiCall() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  async function execute(apiFunction, options = {}) {
    const {
      successMessage,
      errorMessage = "An error occurred",
      onSuccess,
      onError,
      showSuccessToast = !!successMessage,
      showErrorToast = true,
    } = options;

    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction();

      if (showSuccessToast && successMessage) {
        toast({
          title: "Success",
          description: successMessage,
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "top",
        });
      }

      onSuccess?.(result);
      setLoading(false);
      return result;
    } catch (err) {
      console.error("API call error:", err);

      const displayMessage = extractErrorMessage(err, errorMessage);
      setError(displayMessage);

      if (showErrorToast) {
        toast({
          title: "Error",
          description: displayMessage,
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top",
        });
      }

      onError?.(err);
      setLoading(false);
      return null;
    }
  }

  function clearError() {
    setError(null);
  }

  return { execute, loading, error, clearError };
}
