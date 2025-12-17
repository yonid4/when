import { useState } from "react";
import { useToast } from "@chakra-ui/react";

/**
 * Custom hook for API calls with loading states and error handling
 * Provides consistent error display via Chakra UI toasts
 * 
 * @example
 * const { execute, loading, error } = useApiCall();
 * 
 * const handleAction = async () => {
 *   await execute(
 *     () => eventsAPI.create(formData),
 *     {
 *       successMessage: "Event created!",
 *       errorMessage: "Failed to create event",
 *       onSuccess: (result) => navigate(`/events/${result.uid}`)
 *     }
 *   );
 * };
 */
export const useApiCall = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const toast = useToast();

    /**
     * Execute an API call with automatic error handling
     * @param {Function} apiFunction - Async function that makes the API call
     * @param {Object} options - Configuration options
     * @param {string} options.successMessage - Toast message on success (optional)
     * @param {string} options.errorMessage - Toast message on error (default: 'An error occurred')
     * @param {Function} options.onSuccess - Callback on success with result (optional)
     * @param {Function} options.onError - Callback on error with error object (optional)
     * @param {boolean} options.showSuccessToast - Show success toast (default: true if successMessage provided)
     * @param {boolean} options.showErrorToast - Show error toast (default: true)
     * @returns {Promise<any>} Result from API function or null on error
     */
    const execute = async (apiFunction, options = {}) => {
        const {
            successMessage,
            errorMessage = "An error occurred",
            onSuccess,
            onError,
            showSuccessToast = !!successMessage,
            showErrorToast = true
        } = options;

        setLoading(true);
        setError(null);

        try {
            const result = await apiFunction();

            // Show success toast if configured
            if (showSuccessToast && successMessage) {
                toast({
                    title: "Success",
                    description: successMessage,
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                    position: "top"
                });
            }

            // Call success callback if provided
            if (onSuccess) {
                onSuccess(result);
            }

            setLoading(false);
            return result;
        } catch (err) {
            console.error("API call error:", err);

            // Extract error message from response
            let displayMessage = errorMessage;
            if (err.response?.data?.message) {
                displayMessage = err.response.data.message;
            } else if (err.response?.data?.error) {
                displayMessage = err.response.data.error;
            } else if (err.message) {
                displayMessage = err.message;
            }

            setError(displayMessage);

            // Show error toast if configured
            if (showErrorToast) {
                toast({
                    title: "Error",
                    description: displayMessage,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "top"
                });
            }

            // Call error callback if provided
            if (onError) {
                onError(err);
            }

            setLoading(false);
            return null;
        }
    };

    /**
     * Reset error state
     */
    const clearError = () => setError(null);

    return {
        execute,
        loading,
        error,
        clearError
    };
};
