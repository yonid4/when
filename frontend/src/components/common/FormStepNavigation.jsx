import React from "react";
import { Flex, Button } from "@chakra-ui/react";
import { FiArrowLeft, FiArrowRight, FiCheck } from "react-icons/fi";

/**
 * FormStepNavigation - Navigation buttons for multi-step forms
 *
 * @param {Object} props
 * @param {number} props.currentStep - Current step index
 * @param {number} props.totalSteps - Total number of steps
 * @param {Function} props.onBack - Handler for back button
 * @param {Function} props.onNext - Handler for next button
 * @param {Function} props.onSubmit - Handler for submit button
 * @param {boolean} props.isLoading - Loading state for submit button
 * @param {string} props.submitLabel - Label for submit button
 * @param {string} props.submitColorScheme - Color scheme for submit button
 */
const FormStepNavigation = ({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  isLoading = false,
  submitLabel = "Submit",
  submitColorScheme = "green"
}) => {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <Flex justify="space-between">
      <Button
        leftIcon={<FiArrowLeft />}
        variant="outline"
        onClick={onBack}
        isDisabled={isFirstStep}
        size="lg"
      >
        Back
      </Button>

      {!isLastStep ? (
        <Button
          rightIcon={<FiArrowRight />}
          colorScheme="purple"
          onClick={onNext}
          size="lg"
        >
          Next
        </Button>
      ) : (
        <Button
          rightIcon={<FiCheck />}
          colorScheme={submitColorScheme}
          onClick={onSubmit}
          isLoading={isLoading}
          size="lg"
          px={8}
        >
          {submitLabel}
        </Button>
      )}
    </Flex>
  );
};

export default FormStepNavigation;
