import { useRef } from "react";

import {
  Box,
  Card,
  CardBody,
  Container,
  Heading,
  Icon,
  SimpleGrid,
  Text,
  VStack
} from "@chakra-ui/react";
import { motion, useInView } from "framer-motion";
import { FiArrowRight, FiCalendar, FiCheck, FiUsers } from "react-icons/fi";

import { colors, shadows } from "../../styles/designSystem";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const steps = [
  {
    number: "01",
    icon: FiCalendar,
    iconBg: colors.primarySoft,
    iconColor: colors.primary,
    title: "Create an Event",
    description:
      "Set up your event with a name, duration, and preferred date range. It takes less than 30 seconds."
  },
  {
    number: "02",
    icon: FiUsers,
    iconBg: colors.primarySoft,
    iconColor: colors.primary,
    title: "Invite Participants",
    description:
      "Share a simple link with your team. They can mark their availability without signing up."
  },
  {
    number: "03",
    icon: FiCheck,
    iconBg: "green.50",
    iconColor: colors.secondary,
    title: "Find the Perfect Time",
    description:
      "We show you when everyone is free. Pick a time, confirm, and we'll send calendar invites automatically."
  }
];

function getHeaderAnimateState(reducedMotion, isInView) {
  if (reducedMotion) return {};
  if (isInView) return { opacity: 1, y: 0 };
  return { opacity: 0, y: 20 };
}

function getCardAnimateState(reducedMotion, isInView) {
  if (reducedMotion) return {};
  if (isInView) return { opacity: 1, y: 0 };
  return { opacity: 0, y: 30 };
}

/**
 * How It Works section with 3 staggered step cards.
 * Uses whileInView for entrance animation with 0.15s stagger.
 */
function HowItWorksSection({ reducedMotion }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <Box py={20} bg={colors.bgPage}>
      <Container maxW="container.xl">
        <VStack spacing={4} textAlign="center" mb={16}>
          <MotionBox
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={getHeaderAnimateState(reducedMotion, isInView)}
            transition={{ duration: 0.6 }}
            ref={ref}
          >
            <Heading size="2xl" mb={4}>
              How it works
            </Heading>
            <Text fontSize="xl" color={colors.gray500} maxW="2xl" mx="auto">
              Three simple steps to schedule your next meeting
            </Text>
          </MotionBox>
        </VStack>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
          {steps.map((step, index) => (
            <MotionCard
              key={index}
              initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
              animate={getCardAnimateState(reducedMotion, isInView)}
              transition={{
                duration: 0.5,
                delay: reducedMotion ? 0 : 0.2 + index * 0.15
              }}
              bg="white"
              borderRadius="2xl"
              shadow={shadows.card}
              _hover={{
                shadow: shadows.cardHover,
                transform: "translateY(-4px)"
              }}
              cursor="default"
              position="relative"
              overflow="hidden"
            >
              {/* Step number watermark */}
              <Text
                position="absolute"
                top={-2}
                right={4}
                fontSize="8xl"
                fontWeight="bold"
                color="rgba(79,108,247,0.08)"
                userSelect="none"
              >
                {step.number}
              </Text>

              <CardBody p={8} position="relative">
                <VStack align="start" spacing={4}>
                  <Box p={3} bg={step.iconBg} borderRadius="xl">
                    <Icon as={step.icon} boxSize={7} color={step.iconColor} />
                  </Box>
                  <Heading size="md" color={colors.gray800}>
                    {step.title}
                  </Heading>
                  <Text color={colors.gray500} lineHeight="tall">
                    {step.description}
                  </Text>
                </VStack>
              </CardBody>

              {/* Connector arrow (except last card) */}
              {index < steps.length - 1 && (
                <Box
                  display={{ base: "none", md: "block" }}
                  position="absolute"
                  right={-6}
                  top="50%"
                  transform="translateY(-50%)"
                  zIndex={1}
                  bg="white"
                  borderRadius="full"
                  p={2}
                  shadow="sm"
                >
                  <Icon as={FiArrowRight} color={colors.textFaint} boxSize={4} />
                </Box>
              )}
            </MotionCard>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}

export default HowItWorksSection;
