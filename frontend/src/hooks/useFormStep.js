import { useState, useCallback } from "react";

/**
 * Custom hook for multi-step form navigation
 * Manages step state and provides navigation functions
 *
 * @param {Object} options - Configuration options
 * @param {number} options.totalSteps - Total number of steps
 * @param {number} options.initialStep - Starting step (default: 0)
 * @param {Function} options.onStepChange - Callback when step changes
 * @param {Function} options.validateStep - Function to validate current step before advancing
 *
 * @example
 * const {
 *   currentStep,
 *   isFirstStep,
 *   isLastStep,
 *   goNext,
 *   goBack,
 *   goToStep,
 *   progress
 * } = useFormStep({
 *   totalSteps: 5,
 *   validateStep: (step) => validateStepData(step, formData)
 * });
 */
export const useFormStep = ({
  totalSteps,
  initialStep = 0,
  onStepChange,
  validateStep
} = {}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const goNext = useCallback(async () => {
    // Run validation if provided
    if (validateStep) {
      const isValid = await validateStep(currentStep);
      if (!isValid) return false;
    }

    if (currentStep < totalSteps - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep, currentStep);
      return true;
    }
    return false;
  }, [currentStep, totalSteps, validateStep, onStepChange]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep, currentStep);
      return true;
    }
    return false;
  }, [currentStep, onStepChange]);

  const goToStep = useCallback(
    (step) => {
      if (step >= 0 && step < totalSteps) {
        const previousStep = currentStep;
        setCurrentStep(step);
        onStepChange?.(step, previousStep);
        return true;
      }
      return false;
    },
    [totalSteps, currentStep, onStepChange]
  );

  const reset = useCallback(() => {
    setCurrentStep(initialStep);
    onStepChange?.(initialStep, currentStep);
  }, [initialStep, currentStep, onStepChange]);

  return {
    currentStep,
    setCurrentStep,
    isFirstStep,
    isLastStep,
    totalSteps,
    progress,
    goNext,
    goBack,
    goToStep,
    reset
  };
};

export default useFormStep;
