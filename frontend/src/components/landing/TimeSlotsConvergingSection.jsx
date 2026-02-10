import { useRef } from "react";

import {
  Avatar,
  Box,
  Container,
  Heading,
  HStack,
  Icon,
  Text,
  VStack
} from "@chakra-ui/react";
import { motion, useScroll, useTransform } from "framer-motion";
import { FiCheck } from "react-icons/fi";

import { colors, gradients, shadows } from "../../styles/designSystem";

const MotionBox = motion(Box);

const PEOPLE = [
  {
    name: "Sarah",
    src: "https://randomuser.me/api/portraits/women/44.jpg",
    slots: [false, true, true, false, true, false, true, true]
  },
  {
    name: "Mike",
    src: "https://randomuser.me/api/portraits/men/32.jpg",
    slots: [true, false, true, true, true, false, false, true]
  },
  {
    name: "Emma",
    src: "https://randomuser.me/api/portraits/women/68.jpg",
    slots: [false, true, true, true, false, true, true, false]
  },
  {
    name: "Alex",
    src: "https://randomuser.me/api/portraits/men/75.jpg",
    slots: [true, true, false, true, true, true, false, true]
  }
];

const TIME_LABELS = ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM"];

// The "perfect" slot where everyone is available (index 2 = 11 AM)
const PERFECT_SLOT_INDEX = 2;

function PersonColumn({ person, index, totalPeople, scrollProgress }) {
  // Calculate spread offset - columns spread out from center
  const centerOffset = index - (totalPeople - 1) / 2;
  const spreadAmount = 100;

  // Transform: spread → converge
  const x = useTransform(
    scrollProgress,
    [0, 0.3, 0.7, 1],
    [centerOffset * spreadAmount, centerOffset * spreadAmount * 0.5, centerOffset * 15, 0]
  );

  // Slight vertical offset for parallax effect
  const y = useTransform(
    scrollProgress,
    [0, 0.5, 1],
    [index % 2 === 0 ? -15 : 15, 0, 0]
  );

  // Scale for merge effect
  const scale = useTransform(
    scrollProgress,
    [0.7, 1],
    [1, 0.95]
  );

  // Perfect slot glow opacity
  const glowOpacity = useTransform(
    scrollProgress,
    [0.6, 0.85],
    [0, 1]
  );

  return (
    <MotionBox
      style={{ x, y, scale }}
      display="flex"
      flexDirection="column"
      alignItems="center"
      minW="80px"
    >
      {/* Avatar */}
      <Avatar
        name={person.name}
        src={person.src}
        size="md"
        mb={3}
        border="3px solid white"
        boxShadow={shadows.md}
      />
      <Text fontSize="xs" fontWeight="medium" color="gray.600" mb={2}>
        {person.name}
      </Text>

      {/* Time slots */}
      <VStack spacing={1}>
        {person.slots.map((available, slotIndex) => {
          const isPerfectSlot = slotIndex === PERFECT_SLOT_INDEX;
          return (
            <MotionBox
              key={slotIndex}
              w="70px"
              h="28px"
              borderRadius="md"
              bg={available ? `${colors.secondary}30` : "gray.100"}
              border="1px solid"
              borderColor={available ? `${colors.secondary}60` : "gray.200"}
              display="flex"
              alignItems="center"
              justifyContent="center"
              position="relative"
              overflow="hidden"
            >
              {/* Glow overlay for perfect slot */}
              {isPerfectSlot && available && (
                <MotionBox
                  position="absolute"
                  inset={0}
                  bg={colors.secondary}
                  style={{ opacity: glowOpacity }}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="md"
                >
                  <Icon as={FiCheck} color="white" boxSize={4} />
                </MotionBox>
              )}
            </MotionBox>
          );
        })}
      </VStack>
    </MotionBox>
  );
}

function StaticVersion() {
  return (
    <Box py={20} bg="gray.50">
      <Container maxW="container.xl">
        <VStack spacing={8} textAlign="center">
          <Heading size="xl" bgGradient={gradients.ocean} bgClip="text">
            Everyone's availability, one view
          </Heading>
          <Text fontSize="lg" color="gray.600" maxW="2xl">
            See when everyone is free and find the perfect meeting time instantly.
          </Text>
          <HStack spacing={4} justify="center" flexWrap="wrap">
            {PEOPLE.map((person, index) => (
              <VStack key={index} spacing={2}>
                <Avatar name={person.name} src={person.src} size="lg" />
                <Text fontSize="sm" color="gray.600">{person.name}</Text>
              </VStack>
            ))}
          </HStack>
          <Box
            bg={colors.secondary}
            color="white"
            px={6}
            py={3}
            borderRadius="xl"
            fontWeight="bold"
          >
            <HStack>
              <Icon as={FiCheck} />
              <Text>Perfect time found: 11 AM</Text>
            </HStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

function AnimatedVersion({ sectionRef, scrollYProgress }) {
  // All transforms defined at top level
  const titleOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.5, 1, 1, 0.5]);
  const findingOpacity = useTransform(scrollYProgress, [0.6, 0.8], [1, 0]);
  const successOpacity = useTransform(scrollYProgress, [0.75, 0.9], [0, 1]);
  const successY = useTransform(scrollYProgress, [0.75, 0.9], [20, 0]);
  const buttonOpacity = useTransform(scrollYProgress, [0.5, 0.65], [0, 1]);
  const buttonScale = useTransform(scrollYProgress, [0.5, 0.65], [0.8, 1]);

  return (
    <Box
      ref={sectionRef}
      h="180vh"
      position="relative"
      bg="gray.50"
    >
      {/* Sticky container */}
      <Box
        position="sticky"
        top={0}
        h="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
      >
        <Container maxW="container.lg">
          <VStack spacing={8}>
            {/* Title area */}
            <Box position="relative" textAlign="center" minH="80px">
              <MotionBox style={{ opacity: titleOpacity }}>
                {/* "Finding..." text */}
                <MotionBox style={{ opacity: findingOpacity }}>
                  <Heading size="xl" mb={4} color={colors.textHeading}>
                    Finding the perfect time...
                  </Heading>
                  <Text fontSize="lg" color="gray.600">
                    Watch as everyone's schedules align
                  </Text>
                </MotionBox>

                {/* Success message */}
                <MotionBox
                  style={{ opacity: successOpacity, y: successY }}
                  position="absolute"
                  left="50%"
                  top={0}
                  transform="translateX(-50%)"
                  w="max-content"
                >
                  <Heading size="xl" mb={4} bgGradient={gradients.forest} bgClip="text">
                    Perfect time found!
                  </Heading>
                  <Text fontSize="lg" color={colors.secondary} fontWeight="medium">
                    Everyone is free at 11 AM
                  </Text>
                </MotionBox>
              </MotionBox>
            </Box>

            {/* Columns area */}
            <HStack spacing={0} align="start" justify="center">
              {/* Time labels */}
              <VStack spacing={1} mr={4} mt="72px">
                {TIME_LABELS.map((time, idx) => (
                  <Box
                    key={idx}
                    h="28px"
                    display="flex"
                    alignItems="center"
                  >
                    <Text fontSize="xs" color="gray.500" whiteSpace="nowrap">
                      {time}
                    </Text>
                  </Box>
                ))}
              </VStack>

              {/* Person columns */}
              <HStack spacing={2}>
                {PEOPLE.map((person, index) => (
                  <PersonColumn
                    key={index}
                    person={person}
                    index={index}
                    totalPeople={PEOPLE.length}
                    scrollProgress={scrollYProgress}
                  />
                ))}
              </HStack>
            </HStack>

            {/* CTA button that appears at end */}
            <MotionBox style={{ opacity: buttonOpacity, scale: buttonScale }}>
              <Box
                bg="white"
                px={6}
                py={3}
                borderRadius="full"
                boxShadow={shadows.lg}
                border="2px solid"
                borderColor={colors.secondary}
                cursor="pointer"
                _hover={{ transform: "scale(1.05)" }}
                transition="transform 0.2s"
              >
                <HStack spacing={2}>
                  <Icon as={FiCheck} color={colors.secondary} boxSize={5} />
                  <Text fontWeight="bold" color={colors.secondary}>
                    Click to confirm this time
                  </Text>
                </HStack>
              </Box>
            </MotionBox>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}

/**
 * Time Slots Converging Section
 * Multiple calendar columns representing different people converge
 * as the user scrolls, highlighting the perfect meeting time.
 */
function TimeSlotsConvergingSection({ reducedMotion, isMobile }) {
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  // For mobile or reduced motion, show static version
  if (isMobile || reducedMotion) {
    return <StaticVersion />;
  }

  return (
    <AnimatedVersion
      sectionRef={sectionRef}
      scrollYProgress={scrollYProgress}
    />
  );
}

export default TimeSlotsConvergingSection;
