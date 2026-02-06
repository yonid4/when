import {
  Avatar,
  AvatarGroup,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  VStack
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FiArrowRight, FiCalendar, FiCheck, FiUsers } from "react-icons/fi";

import { colors, gradients } from "../../styles/designSystem";

const MotionBox = motion(Box);

/**
 * Create animation props for framer-motion components.
 * Returns empty object if reduced motion is preferred.
 */
function createAnimationProps(reducedMotion, initial, animate, transition) {
  if (reducedMotion) return {};
  return { initial, animate, transition };
}

/**
 * Hero section with badge, heading, CTA, and social proof.
 * Features subtle entrance animations.
 */
function HeroSection({ onSignIn, reducedMotion }) {
  const animationProps = createAnimationProps(
    reducedMotion,
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0 },
    { duration: 0.8 }
  );

  const scaleAnimationProps = createAnimationProps(
    reducedMotion,
    { opacity: 0, scale: 0.9 },
    { opacity: 1, scale: 1 },
    { duration: 0.8, delay: 0.2 }
  );

  const cardAnimationProps = createAnimationProps(
    reducedMotion,
    { opacity: 0, y: 50 },
    { opacity: 1, y: 0 },
    { duration: 1, delay: 0.4 }
  );

  const fadeAnimationProps = createAnimationProps(
    reducedMotion,
    { opacity: 0 },
    { opacity: 1 },
    { duration: 0.8, delay: 0.6 }
  );

  return (
    <Box
      bgGradient={gradients.ocean}
      color="white"
      position="relative"
      overflow="hidden"
    >
      {/* Background Pattern */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.1}
        bgImage="radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.3) 0%, transparent 50%)"
      />

      <Container maxW="container.xl" position="relative" py={20}>
        <VStack spacing={8} textAlign="center">
          <MotionBox {...animationProps}>
            <Badge
              colorScheme="whiteAlpha"
              fontSize="md"
              px={4}
              py={2}
              borderRadius="full"
              mb={6}
            >
              Scheduling Made Simple
            </Badge>
            <Heading
              size="3xl"
              mb={6}
              lineHeight="1.2"
              fontWeight="extrabold"
            >
              Find the perfect time,
              <br />
              <Text as="span" color="yellow.300">
                together
              </Text>
            </Heading>
            <Text fontSize="xl" maxW="2xl" mx="auto" mb={8} opacity={0.9}>
              Say goodbye to endless email threads and scheduling conflicts.
              When brings people together at the perfect time, every time.
            </Text>
          </MotionBox>

          <MotionBox {...scaleAnimationProps}>
            <HStack spacing={4}>
              <Button
                size="lg"
                bg="white"
                color={colors.primary}
                px={8}
                py={7}
                fontSize="lg"
                fontWeight="bold"
                rightIcon={<FiArrowRight />}
                _hover={{ transform: "translateY(-2px)", shadow: "xl" }}
                transition="all 0.3s"
                onClick={onSignIn}
              >
                Sign in with Google
              </Button>
            </HStack>
          </MotionBox>

          {/* Hero Illustration */}
          <MotionBox {...cardAnimationProps} mt={12}>
            <Card
              bg="whiteAlpha.200"
              backdropFilter="blur(10px)"
              borderRadius="2xl"
              overflow="hidden"
              maxW="900px"
              mx="auto"
              boxShadow="2xl"
            >
              <Box p={8} bg="white" borderRadius="xl">
                <SimpleGrid columns={3} spacing={4}>
                  <Box p={4} bg="purple.50" borderRadius="lg">
                    <Icon as={FiCalendar} boxSize={8} color={colors.primary} mb={2} />
                    <Text color="gray.700" fontWeight="bold">Create Event</Text>
                  </Box>
                  <Box p={4} bg="blue.50" borderRadius="lg">
                    <Icon as={FiUsers} boxSize={8} color="blue.500" mb={2} />
                    <Text color="gray.700" fontWeight="bold">Invite People</Text>
                  </Box>
                  <Box p={4} bg="green.50" borderRadius="lg">
                    <Icon as={FiCheck} boxSize={8} color={colors.secondary} mb={2} />
                    <Text color="gray.700" fontWeight="bold">Find Time</Text>
                  </Box>
                </SimpleGrid>
              </Box>
            </Card>
          </MotionBox>

          {/* Social Proof */}
          <MotionBox {...fadeAnimationProps} mt={8}>
            <VStack spacing={4}>
              <HStack>
                <AvatarGroup size="md" max={5}>
                  <Avatar name="Sarah K" />
                  <Avatar name="Mike R" />
                  <Avatar name="Emma L" />
                  <Avatar name="Alex T" />
                  <Avatar name="Jordan P" />
                </AvatarGroup>
                <Text fontWeight="medium">
                  Join 10,000+ teams using When
                </Text>
              </HStack>
            </VStack>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
}

export default HeroSection;
