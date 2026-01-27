import React from "react";
import {
  VStack,
  HStack,
  Card,
  CardBody,
  Text,
  Icon,
  Progress
} from "@chakra-ui/react";
import { FiCheck } from "react-icons/fi";
import { colors } from "../../styles/designSystem";

/**
 * StepProgressIndicator - Visual progress indicator for multi-step forms
 *
 * @param {Object} props
 * @param {Array} props.steps - Array of step objects { id, name, icon }
 * @param {number} props.currentStep - Current step index
 * @param {string} props.cardBg - Background color for the card
 */
const StepProgressIndicator = ({ steps, currentStep, cardBg }) => {
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <Card bg={cardBg}>
      <CardBody>
        <VStack spacing={4}>
          <Progress
            value={progressPercentage}
            w="full"
            colorScheme="purple"
            borderRadius="full"
            size="sm"
          />
          <HStack w="full" justify="space-between" flexWrap="wrap">
            {steps.map((step, index) => (
              <VStack
                key={step.id}
                spacing={1}
                flex={1}
                minW="80px"
                opacity={index <= currentStep ? 1 : 0.5}
              >
                <Icon
                  as={step.icon}
                  boxSize={6}
                  color={
                    index < currentStep
                      ? colors.secondary
                      : index === currentStep
                      ? colors.primary
                      : "gray.400"
                  }
                />
                <Text fontSize="xs" fontWeight="medium" textAlign="center">
                  {step.name}
                </Text>
                {index < currentStep && (
                  <Icon as={FiCheck} color={colors.secondary} boxSize={4} />
                )}
              </VStack>
            ))}
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default StepProgressIndicator;
