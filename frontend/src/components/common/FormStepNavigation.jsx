import { Button, Flex, Stack, useBreakpointValue } from "@chakra-ui/react";
import { FiArrowLeft, FiArrowRight, FiCheck } from "react-icons/fi";

function FormStepNavigation({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  isLoading = false,
  submitLabel = "Submit",
  submitColorScheme = "green",
  mt
}) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const isMobile = useBreakpointValue({ base: true, md: false });

  const responsiveWidth = { base: "full", md: "auto" };

  function renderForwardButton() {
    if (isLastStep) {
      return (
        <Button
          rightIcon={<FiCheck />}
          colorScheme={submitColorScheme}
          onClick={onSubmit}
          isLoading={isLoading}
          size="lg"
          px={8}
          w={responsiveWidth}
        >
          {submitLabel}
        </Button>
      );
    }

    return (
      <Button
        rightIcon={<FiArrowRight />}
        colorScheme="purple"
        onClick={onNext}
        size="lg"
        w={responsiveWidth}
      >
        Next
      </Button>
    );
  }

  const buttons = (
    <>
      <Button
        leftIcon={<FiArrowLeft />}
        variant="outline"
        onClick={onBack}
        isDisabled={isFirstStep}
        size="lg"
        w={responsiveWidth}
      >
        Back
      </Button>
      {renderForwardButton()}
    </>
  );

  const Container = isMobile ? Stack : Flex;
  const containerProps = isMobile
    ? { direction: "column-reverse", spacing: 3, w: "full" }
    : { justify: "space-between", w: "full" };

  return (
    <Flex borderTop="1px solid" borderColor="gray.100" pt={6} mt={mt}>
      <Container {...containerProps}>{buttons}</Container>
    </Flex>
  );
}

export default FormStepNavigation;
