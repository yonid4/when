import { useRef } from "react";

import { Box, Container, Heading, Text, VStack } from "@chakra-ui/react";
import { motion, useScroll, useTransform } from "framer-motion";

import { gradients } from "../../styles/designSystem";
import CalendarIllustration from "./CalendarIllustration";

const MotionBox = motion(Box);

/**
 * Apple-style scroll zoom section.
 * The calendar scales from 0.6 to 1.2 as user scrolls through the section.
 * Falls back to a static display on mobile or when reduced motion is preferred.
 */
function ScrollZoomSection({ reducedMotion, isMobile }) {
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  // Transform scroll progress to scale values: 0.6 -> 1.0 -> 1.2
  const scale = useTransform(scrollYProgress, [0, 0.4, 1], [0.6, 1.0, 1.2]);
  // Opacity: starts faded, fully visible in middle, fades slightly at end
  const opacity = useTransform(scrollYProgress, [0, 0.4, 1], [0.3, 1, 0.5]);

  // For mobile or reduced motion, render a simplified static version
  if (isMobile || reducedMotion) {
    return (
      <Box py={20} bg="gray.50">
        <Container maxW="container.xl">
          <VStack spacing={8} textAlign="center">
            <Heading size="xl" bgGradient={gradients.ocean} bgClip="text">
              See everyone's availability at a glance
            </Heading>
            <Text fontSize="lg" color="gray.600" maxW="2xl">
              Our intuitive calendar view shows you exactly when everyone is free,
              making it easy to find the perfect meeting time.
            </Text>
            <Box maxW="600px" w="full">
              <CalendarIllustration />
            </Box>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      ref={sectionRef}
      h="200vh"
      position="relative"
      bg="gray.50"
    >
      {/* Sticky container that stays in view while scrolling */}
      <Box
        position="sticky"
        top={0}
        h="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
      >
        <Container maxW="container.xl">
          <VStack spacing={8}>
            {/* Title - fades in and stays */}
            <MotionBox
              style={{ opacity }}
              textAlign="center"
            >
              <Heading size="xl" bgGradient={gradients.ocean} bgClip="text" mb={4}>
                See everyone's availability at a glance
              </Heading>
              <Text fontSize="lg" color="gray.600" maxW="2xl" mx="auto">
                Our intuitive calendar view shows you exactly when everyone is free,
                making it easy to find the perfect meeting time.
              </Text>
            </MotionBox>

            {/* Calendar that zooms */}
            <MotionBox
              style={{ scale, opacity }}
              w="full"
              maxW="600px"
            >
              <CalendarIllustration />
            </MotionBox>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}

export default ScrollZoomSection;
