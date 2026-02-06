import {
  Box,
  Flex,
  Icon,
  Text,
  Tooltip,
  useBreakpointValue
} from "@chakra-ui/react";
import { FiCheck } from "react-icons/fi";

import { colors, shadows } from "../../styles/designSystem";

const PROGRESS_LINE_MAX_WIDTH = 76;

function getStepBackground(isCompleted, isCurrent) {
  if (isCompleted) return colors.secondary;
  if (isCurrent) return colors.primary;
  return "white";
}

function getStepBorderColor(isCompleted, isCurrent) {
  if (isCompleted) return colors.secondary;
  if (isCurrent) return colors.primary;
  return "gray.300";
}

function getStepLabelColor(isCompleted, isCurrent) {
  if (isCompleted) return colors.secondary;
  if (isCurrent) return colors.primary;
  return "gray.400";
}

function StepNodeContent({ isCompleted, isCurrent, StepIcon, index }) {
  if (isCompleted) {
    return <Icon as={FiCheck} color="white" boxSize={5} />;
  }

  if (StepIcon) {
    return (
      <Icon
        as={StepIcon}
        color={isCurrent ? "white" : "gray.400"}
        boxSize={5}
      />
    );
  }

  return (
    <Text
      fontSize="sm"
      fontWeight="bold"
      color={isCurrent ? "white" : "gray.400"}
    >
      {index + 1}
    </Text>
  );
}

function MobileStepIndicator({ steps, currentStep }) {
  return (
    <Box py={2}>
      <Text
        fontSize="sm"
        fontWeight="semibold"
        color="gray.600"
        textAlign="center"
        textTransform="uppercase"
        letterSpacing="0.5px"
      >
        Step {currentStep + 1} of {steps.length}: {steps[currentStep].name}
      </Text>
    </Box>
  );
}

function StepProgressIndicator({ steps, currentStep }) {
  const isMobile = useBreakpointValue({ base: true, md: false });

  if (isMobile) {
    return <MobileStepIndicator steps={steps} currentStep={currentStep} />;
  }

  const progressWidth = Math.max(0, (currentStep / (steps.length - 1)) * PROGRESS_LINE_MAX_WIDTH);

  return (
    <Box py={5} px={8}>
      <Flex align="center" justify="center" position="relative">
        <Box
          position="absolute"
          top="20px"
          left="12%"
          right="12%"
          height="2px"
          bg="gray.200"
          zIndex={0}
        />
        <Box
          position="absolute"
          top="20px"
          left="12%"
          width={`${progressWidth}%`}
          height="2px"
          bg={colors.primary}
          zIndex={0}
          transition="width 0.3s ease"
        />

        <Flex w="full" justify="space-between" position="relative" zIndex={1}>
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const StepIcon = step.icon;

            return (
              <Tooltip
                key={step.id}
                label={step.name}
                placement="bottom"
                hasArrow
                isDisabled={!StepIcon}
              >
                <Flex
                  direction="column"
                  align="center"
                  flex={1}
                  cursor="default"
                >
                  <Flex
                    w="40px"
                    h="40px"
                    borderRadius="full"
                    justify="center"
                    align="center"
                    bg={getStepBackground(isCompleted, isCurrent)}
                    border="2px solid"
                    borderColor={getStepBorderColor(isCompleted, isCurrent)}
                    boxShadow={isCurrent ? shadows.md : shadows.sm}
                    transition="all 0.25s ease"
                    transform={isCurrent ? "scale(1.1)" : "scale(1)"}
                  >
                    <StepNodeContent
                      isCompleted={isCompleted}
                      isCurrent={isCurrent}
                      StepIcon={StepIcon}
                      index={index}
                    />
                  </Flex>

                  <Text
                    mt={2}
                    fontSize="xs"
                    fontWeight="semibold"
                    textTransform="uppercase"
                    letterSpacing="0.5px"
                    color={getStepLabelColor(isCompleted, isCurrent)}
                    textAlign="center"
                    transition="color 0.2s ease"
                  >
                    {step.name}
                  </Text>
                </Flex>
              </Tooltip>
            );
          })}
        </Flex>
      </Flex>
    </Box>
  );
}

export default StepProgressIndicator;
