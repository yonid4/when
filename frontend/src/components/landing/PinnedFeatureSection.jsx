import React, { useRef, useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  Badge,
  Card,
  CardBody
} from "@chakra-ui/react";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { FiZap, FiClock, FiCalendar, FiCheck } from "react-icons/fi";
import { colors, gradients, shadows } from "../../styles/designSystem";

const MotionBox = motion(Box);

// Feature slide data
const slides = [
  {
    badge: "AI-POWERED",
    badgeColor: "purple",
    title: "Smart Time Proposals",
    description:
      "Our AI analyzes everyone's calendars and suggests the best meeting times automatically. No more manual comparison.",
    icon: FiZap,
    iconColor: colors.primary,
    highlights: [
      "Learns your scheduling preferences",
      "Considers time zones automatically",
      "Avoids busy periods intelligently"
    ],
    visual: {
      type: "proposals",
      items: [
        { time: "Tuesday, 2:00 PM", score: 98, label: "Best match" },
        { time: "Wednesday, 10:00 AM", score: 85, label: "Good option" },
        { time: "Thursday, 3:30 PM", score: 72, label: "Alternative" }
      ]
    }
  },
  {
    badge: "REAL-TIME",
    badgeColor: "blue",
    title: "Live Availability Sync",
    description:
      "Connect your calendar once and your availability updates automatically. Always accurate, always current.",
    icon: FiClock,
    iconColor: colors.info,
    highlights: [
      "Google Calendar integration",
      "Instant availability updates",
      "Two-way sync support"
    ],
    visual: {
      type: "calendar",
      items: [
        { day: "Mon", slots: [true, false, true, true] },
        { day: "Tue", slots: [false, true, true, false] },
        { day: "Wed", slots: [true, true, false, true] },
        { day: "Thu", slots: [true, false, true, true] },
        { day: "Fri", slots: [false, true, true, true] }
      ]
    }
  },
  {
    badge: "ONE-CLICK",
    badgeColor: "green",
    title: "Instant Scheduling",
    description:
      "Once everyone has voted, finalize your event with a single click. Calendar invites are sent automatically.",
    icon: FiCalendar,
    iconColor: colors.secondary,
    highlights: [
      "Automatic calendar invites",
      "Email notifications",
      "iCal export support"
    ],
    visual: {
      type: "confirm",
      event: {
        name: "Team Standup",
        time: "Tuesday, Dec 10 at 2:00 PM",
        attendees: 8,
        duration: "30 min"
      }
    }
  }
];

// Visual component for proposals
const ProposalsVisual = ({ items }) => (
  <VStack spacing={3} w="full">
    {items.map((item, index) => (
      <Card key={index} w="full" shadow={shadows.card}>
        <CardBody py={3} px={4}>
          <HStack justify="space-between">
            <VStack align="start" spacing={0}>
              <Text fontWeight="medium" fontSize="sm">
                {item.time}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {item.label}
              </Text>
            </VStack>
            <Badge
              colorScheme={index === 0 ? "green" : "gray"}
              fontSize="sm"
              px={2}
            >
              {item.score}% match
            </Badge>
          </HStack>
        </CardBody>
      </Card>
    ))}
  </VStack>
);

// Visual component for calendar
const CalendarVisual = ({ items }) => (
  <HStack spacing={2} justify="center">
    {items.map((day, dayIndex) => (
      <VStack key={dayIndex} spacing={1}>
        <Text fontSize="xs" fontWeight="semibold" color="gray.500">
          {day.day}
        </Text>
        {day.slots.map((available, slotIndex) => (
          <Box
            key={slotIndex}
            w={8}
            h={6}
            borderRadius="sm"
            bg={available ? `${colors.secondary}30` : "gray.100"}
            border="1px solid"
            borderColor={available ? colors.secondary : "gray.200"}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {available && (
              <Icon as={FiCheck} boxSize={3} color={colors.secondary} />
            )}
          </Box>
        ))}
      </VStack>
    ))}
  </HStack>
);

// Visual component for confirmation
const ConfirmVisual = ({ event }) => (
  <Card shadow={shadows.cardHover} borderRadius="xl" overflow="hidden">
    <Box h={2} bgGradient={gradients.forest} />
    <CardBody p={5}>
      <VStack spacing={3} align="start">
        <HStack>
          <Icon as={FiCheck} color={colors.secondary} boxSize={5} />
          <Text fontWeight="bold" color={colors.secondary}>
            Event Confirmed!
          </Text>
        </HStack>
        <Heading size="md">{event.name}</Heading>
        <HStack spacing={4} fontSize="sm" color="gray.600">
          <HStack>
            <Icon as={FiCalendar} />
            <Text>{event.time}</Text>
          </HStack>
        </HStack>
        <HStack spacing={4} fontSize="sm" color="gray.600">
          <HStack>
            <Icon as={FiClock} />
            <Text>{event.duration}</Text>
          </HStack>
          <Text>{event.attendees} attendees</Text>
        </HStack>
      </VStack>
    </CardBody>
  </Card>
);

// Render the appropriate visual based on slide type
const SlideVisual = ({ visual }) => {
  switch (visual.type) {
    case "proposals":
      return <ProposalsVisual items={visual.items} />;
    case "calendar":
      return <CalendarVisual items={visual.items} />;
    case "confirm":
      return <ConfirmVisual event={visual.event} />;
    default:
      return null;
  }
};

/**
 * Pinned feature section with sticky container and content crossfade.
 * Three slides that switch based on scroll progress.
 * Falls back to stacked cards on mobile or with reduced motion.
 */
const PinnedFeatureSection = ({ reducedMotion, isMobile }) => {
  const sectionRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"]
  });

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    // Divide scroll into 3 sections
    const newSlide = Math.min(Math.floor(progress * 3), 2);
    if (newSlide !== activeSlide) {
      setActiveSlide(newSlide);
    }
  });

  // For mobile or reduced motion, render stacked cards
  if (isMobile || reducedMotion) {
    return (
      <Box py={20} bg="white">
        <Container maxW="container.xl">
          <VStack spacing={4} textAlign="center" mb={12}>
            <Heading size="2xl">Powerful features, simple experience</Heading>
            <Text fontSize="xl" color="gray.600" maxW="2xl">
              Everything you need to coordinate schedules effortlessly
            </Text>
          </VStack>

          <VStack spacing={8}>
            {slides.map((slide, index) => (
              <Card
                key={index}
                w="full"
                maxW="800px"
                mx="auto"
                shadow={shadows.lg}
                borderRadius="2xl"
                overflow="hidden"
              >
                <CardBody p={8}>
                  <HStack spacing={8} flexDir={{ base: "column", md: "row" }} align="start">
                    <VStack align="start" spacing={4} flex={1}>
                      <Badge colorScheme={slide.badgeColor} fontSize="sm" px={3} py={1}>
                        {slide.badge}
                      </Badge>
                      <Heading size="lg">{slide.title}</Heading>
                      <Text color="gray.600">{slide.description}</Text>
                      <VStack align="start" spacing={2} mt={2}>
                        {slide.highlights.map((item, i) => (
                          <HStack key={i}>
                            <Icon as={FiCheck} color={colors.secondary} boxSize={4} />
                            <Text fontSize="sm" fontWeight="medium">
                              {item}
                            </Text>
                          </HStack>
                        ))}
                      </VStack>
                    </VStack>
                    <Box flex={1} w="full">
                      <SlideVisual visual={slide.visual} />
                    </Box>
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        </Container>
      </Box>
    );
  }

  const currentSlide = slides[activeSlide];

  return (
    <Box
      ref={sectionRef}
      h="300vh"
      position="relative"
      bg="white"
    >
      {/* Sticky container */}
      <Box
        position="sticky"
        top={0}
        h="100vh"
        display="flex"
        alignItems="center"
        overflow="hidden"
      >
        <Container maxW="container.xl">
          {/* Progress indicators */}
          <HStack
            position="absolute"
            left="50%"
            transform="translateX(-50%)"
            top={8}
            spacing={2}
          >
            {slides.map((_, index) => (
              <Box
                key={index}
                w={index === activeSlide ? 8 : 2}
                h={2}
                borderRadius="full"
                bg={index === activeSlide ? colors.primary : "gray.300"}
                transition="all 0.3s"
              />
            ))}
          </HStack>

          <AnimatePresence mode="wait">
            <MotionBox
              key={activeSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <HStack spacing={12} align="center" flexWrap={{ base: "wrap", lg: "nowrap" }}>
                {/* Content side */}
                <VStack align="start" spacing={6} flex={1} minW="300px">
                  <Badge
                    colorScheme={currentSlide.badgeColor}
                    fontSize="sm"
                    px={3}
                    py={1}
                  >
                    {currentSlide.badge}
                  </Badge>
                  <Heading size="2xl" lineHeight="1.2">
                    {currentSlide.title}
                  </Heading>
                  <Text fontSize="lg" color="gray.600" maxW="lg">
                    {currentSlide.description}
                  </Text>
                  <VStack align="start" spacing={3} mt={2}>
                    {currentSlide.highlights.map((item, i) => (
                      <HStack key={i}>
                        <Icon as={FiCheck} color={colors.secondary} boxSize={5} />
                        <Text fontWeight="medium">{item}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>

                {/* Visual side */}
                <Box flex={1} minW="300px" maxW="400px">
                  <SlideVisual visual={currentSlide.visual} />
                </Box>
              </HStack>
            </MotionBox>
          </AnimatePresence>
        </Container>
      </Box>
    </Box>
  );
};

export default PinnedFeatureSection;
