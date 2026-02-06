import { useCallback, useState } from "react";

export function useFormStep({ totalSteps, initialStep = 0, onStepChange, validateStep } = {}) {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const goNext = useCallback(async () => {
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
    reset,
  };
}

export default useFormStep;
