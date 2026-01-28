import React from "react";
import {
  Box,
  Flex,
  Text,
  Icon,
  useBreakpointValue
} from "@chakra-ui/react";
import { FiCheck } from "react-icons/fi";
import { colors } from "../../styles/designSystem";

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

  // Desktop: Full horizontal stepper
  return (
    <Box py={4} px={8}>
      <Flex align="center" justify="center" position="relative">
        {/* Connecting line behind nodes */}
        <Box
          position="absolute"
          top="16px"
          left="10%"
          right="10%"
          height="2px"
          bg="gray.200"
          zIndex={0}
        />

        {/* Step nodes */}
        <Flex w="full" justify="space-between" position="relative" zIndex={1}>
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <Flex
                key={step.id}
                direction="column"
                align="center"
                flex={1}
              >
                {/* Node circle */}
                <Flex
                  w="32px"
                  h="32px"
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
                  transition="all 0.2s ease"
                >
                  {isCompleted ? (
                    <Icon as={FiCheck} color="white" boxSize={4} />
                  ) : (
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
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
                >
                  {step.name}
                </Text>
              </Flex>
            );
          })}
        </Flex>
      </Flex>
    </Box>
  );
};

export default StepProgressIndicator;
