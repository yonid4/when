import React from "react";
import {
  Box,
  Flex,
  Text,
  Icon,
  useBreakpointValue,
  Tooltip
} from "@chakra-ui/react";
import { FiCheck } from "react-icons/fi";
import { colors, shadows } from "../../styles/designSystem";

/**
 * StepProgressIndicator - Horizontal stepper with connected nodes
 *
 * @param {Object} props
 * @param {Array} props.steps - Array of step objects { id, name, icon }
 * @param {number} props.currentStep - Current step index
 */
const StepProgressIndicator = ({ steps, currentStep }) => {
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Mobile: Collapsed text view
  if (isMobile) {
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

  // Desktop: Full horizontal stepper with icons
  return (
    <Box py={5} px={8}>
      <Flex align="center" justify="center" position="relative">
        {/* Connecting line behind nodes */}
        <Box
          position="absolute"
          top="20px"
          left="12%"
          right="12%"
          height="2px"
          bg="gray.200"
          zIndex={0}
        />
        {/* Progress fill line */}
        <Box
          position="absolute"
          top="20px"
          left="12%"
          width={`${Math.max(0, ((currentStep) / (steps.length - 1)) * 76)}%`}
          height="2px"
          bg={colors.primary}
          zIndex={0}
          transition="width 0.3s ease"
        />

        {/* Step nodes */}
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
                  {/* Node circle with icon */}
                  <Flex
                    w="40px"
                    h="40px"
                    borderRadius="full"
                    justify="center"
                    align="center"
                    bg={
                      isCompleted
                        ? colors.secondary
                        : isCurrent
                        ? colors.primary
                        : "white"
                    }
                    border="2px solid"
                    borderColor={
                      isCompleted
                        ? colors.secondary
                        : isCurrent
                        ? colors.primary
                        : "gray.300"
                    }
                    boxShadow={isCurrent ? shadows.md : shadows.sm}
                    transition="all 0.25s ease"
                    transform={isCurrent ? "scale(1.1)" : "scale(1)"}
                  >
                    {isCompleted ? (
                      <Icon as={FiCheck} color="white" boxSize={5} />
                    ) : StepIcon ? (
                      <Icon
                        as={StepIcon}
                        color={isCurrent ? "white" : "gray.400"}
                        boxSize={5}
                      />
                    ) : (
                      <Text
                        fontSize="sm"
                        fontWeight="bold"
                        color={isCurrent ? "white" : "gray.400"}
                      >
                        {index + 1}
                      </Text>
                    )}
                  </Flex>

                  {/* Label */}
                  <Text
                    mt={2}
                    fontSize="xs"
                    fontWeight="semibold"
                    textTransform="uppercase"
                    letterSpacing="0.5px"
                    color={
                      isCompleted
                        ? colors.secondary
                        : isCurrent
                        ? colors.primary
                        : "gray.400"
                    }
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
};

export default StepProgressIndicator;
