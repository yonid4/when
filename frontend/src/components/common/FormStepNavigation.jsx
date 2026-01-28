import React from "react";
import { Flex, Button, Stack, useBreakpointValue } from "@chakra-ui/react";
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
 * @param {string|number} props.mt - Margin top for spacing
 */
const FormStepNavigation = ({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  isLoading = false,
  submitLabel = "Submit",
  submitColorScheme = "green",
  mt
}) => {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const isMobile = useBreakpointValue({ base: true, md: false });

  const buttons = (
    <>
      <Button
        leftIcon={<FiArrowLeft />}
        variant="outline"
        onClick={onBack}
        isDisabled={isFirstStep}
        size="lg"
        w={{ base: "full", md: "auto" }}
      >
        Back
      </Button>

      {!isLastStep ? (
        <Button
          rightIcon={<FiArrowRight />}
          colorScheme="purple"
          onClick={onNext}
          size="lg"
          w={{ base: "full", md: "auto" }}
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
          w={{ base: "full", md: "auto" }}
        >
          {submitLabel}
        </Button>
      )}
    </>
  );

  return (
    <Flex
      borderTop="1px solid"
      borderColor="gray.100"
      pt={6}
      mt={mt}
    >
      {isMobile ? (
        <Stack direction="column-reverse" spacing={3} w="full">
          {buttons}
        </Stack>
      ) : (
        <Flex justify="space-between" w="full">
          {buttons}
        </Flex>
      )}
    </Flex>
  );
};

export default FormStepNavigation;
