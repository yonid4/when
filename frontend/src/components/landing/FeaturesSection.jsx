import { useRef } from "react";

import {
  Badge,
  Box,
  Card,
  CardBody,
  Container,
  Grid,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  VStack
} from "@chakra-ui/react";
import { motion, useInView } from "framer-motion";
import {
  FiBell,
  FiCheck,
  FiClock,
  FiGlobe,
  FiTrendingUp,
  FiUsers,
  FiZap
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { BsMicrosoft } from "react-icons/bs";
import { FaApple } from "react-icons/fa";

import { colors } from "../../styles/designSystem";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

function AnimatedSection({ children, delay = 0, reducedMotion }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  if (reducedMotion) {
    return <Box ref={ref}>{children}</Box>;
  }

  const animateState = isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 };

  return (
    <MotionBox
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={animateState}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </MotionBox>
  );
}

const valueProps = [
  {
    icon: FiZap,
    color: colors.featureAmber,
    title: "Lightning Fast",
    description: "Create and share events in seconds, not hours. No more back-and-forth emails."
  },
  {
    icon: FiUsers,
    color: colors.primary,
    title: "Smart Coordination",
    description: "Automatically find times that work for everyone based on real availability."
  },
  {
    icon: FiGlobe,
    color: colors.secondary,
    title: "Timezone Magic",
    description: "Works across timezones seamlessly. Everyone sees times in their local timezone."
  },
  {
    icon: FiBell,
    color: colors.featurePurple,
    title: "Stay Updated",
    description: "Real-time notifications keep everyone in the loop when plans change."
  }
];

const CARD_BG = "white";

/**
 * Features section with value proposition cards.
 * Simple fade-in animations on scroll, no complex pinned scrolling.
 */
function FeaturesSection({ reducedMotion }) {

  return (
    <>
      {/* Value Propositions */}
      <Container maxW="container.xl" py={16}>
        <AnimatedSection reducedMotion={reducedMotion}>
          <VStack spacing={4} textAlign="center" mb={12}>
            <Heading size="2xl">Why teams love When</Heading>
            <Text fontSize="xl" color={colors.gray500} maxW="2xl">
              Everything you need to coordinate schedules and bring people together
            </Text>
          </VStack>
        </AnimatedSection>

        <Grid
          templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
          gap={6}
        >
          {valueProps.map((feature, index) => (
            <AnimatedSection key={index} delay={index * 0.1} reducedMotion={reducedMotion}>
              <MotionCard
                h="full"
                bg={CARD_BG}
                _hover={{ transform: "translateY(-8px)", shadow: "xl" }}
                transition="all 0.3s"
              >
                <CardBody>
                  <VStack spacing={4} align="start">
                    <Box
                      p={3}
                      bg={`${feature.color}15`}
                      borderRadius="lg"
                    >
                      <Icon as={feature.icon} boxSize={8} color={feature.color} />
                    </Box>
                    <Heading size="md">{feature.title}</Heading>
                    <Text color={colors.gray500}>{feature.description}</Text>
                  </VStack>
                </CardBody>
              </MotionCard>
            </AnimatedSection>
          ))}
        </Grid>
      </Container>

      {/* Features Showcase */}
      <Box bg={colors.bgPage} py={16}>
        <Container maxW="container.xl">
          <VStack spacing={16}>
            {/* Feature 1: Scheduling */}
            <AnimatedSection reducedMotion={reducedMotion}>
              <Grid
                templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
                gap={12}
                alignItems="center"
              >
                <VStack align="start" spacing={6}>
                  <Badge colorScheme="brand" fontSize="sm" px={3} py={1}>
                    SCHEDULING
                  </Badge>
                  <Heading size="xl">
                    Stop playing email ping-pong
                  </Heading>
                  <Text fontSize="lg" color={colors.gray500}>
                    Share your availability and let others pick a time that works.
                    Or propose multiple options and vote on the best one together.
                  </Text>
                  <VStack align="start" spacing={3}>
                    {[
                      "Automatic calendar syncing",
                      "Multiple time proposals",
                      "Visual availability view",
                      "One-click scheduling"
                    ].map((item, i) => (
                      <HStack key={i}>
                        <Icon as={FiCheck} color={colors.secondary} boxSize={5} />
                        <Text fontWeight="medium">{item}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>

                <Card bg={CARD_BG} overflow="hidden" boxShadow="xl">
                  <Box p={8} bg={colors.primary}>
                    <VStack spacing={4}>
                      <Card w="full" bg="white">
                        <CardBody>
                          <HStack justify="space-between">
                            <Text fontWeight="bold">Monday, Dec 2</Text>
                            <Badge colorScheme="green">8 available</Badge>
                          </HStack>
                        </CardBody>
                      </Card>
                      <Card w="full" bg="white">
                        <CardBody>
                          <HStack justify="space-between">
                            <Text fontWeight="bold">Tuesday, Dec 3</Text>
                            <Badge colorScheme="green">12 available</Badge>
                          </HStack>
                        </CardBody>
                      </Card>
                      <Card w="full" bg="white">
                        <CardBody>
                          <HStack justify="space-between">
                            <Text fontWeight="bold">Wednesday, Dec 4</Text>
                            <Badge colorScheme="yellow">4 available</Badge>
                          </HStack>
                        </CardBody>
                      </Card>
                    </VStack>
                  </Box>
                </Card>
              </Grid>
            </AnimatedSection>

            {/* Feature 2: Coordination */}
            <AnimatedSection reducedMotion={reducedMotion}>
              <Grid
                templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
                gap={12}
                alignItems="center"
              >
                <Card
                  bg={CARD_BG}
                  overflow="hidden"
                  boxShadow="xl"
                  order={{ base: 2, lg: 1 }}
                >
                  <Box p={8} bg="blue.50">
                    <SimpleGrid columns={2} spacing={4}>
                      <Card>
                        <CardBody>
                          <Icon as={FiUsers} boxSize={6} color={colors.primary} mb={2} />
                          <Text fontSize="sm" fontWeight="bold">24 Participants</Text>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody>
                          <Icon as={FiClock} boxSize={6} color={colors.secondary} mb={2} />
                          <Text fontSize="sm" fontWeight="bold">5 Time Options</Text>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody>
                          <Icon as={FiCheck} boxSize={6} color={colors.success} mb={2} />
                          <Text fontSize="sm" fontWeight="bold">18 Confirmed</Text>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody>
                          <Icon as={FiTrendingUp} boxSize={6} color={colors.accent} mb={2} />
                          <Text fontSize="sm" fontWeight="bold">92% Response</Text>
                        </CardBody>
                      </Card>
                    </SimpleGrid>
                  </Box>
                </Card>

                <VStack
                  align="start"
                  spacing={6}
                  order={{ base: 1, lg: 2 }}
                >
                  <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
                    COORDINATION
                  </Badge>
                  <Heading size="xl">
                    Keep everyone in sync
                  </Heading>
                  <Text fontSize="lg" color={colors.gray500}>
                    Real-time updates, instant notifications, and group discussions
                    make coordination effortless for teams of any size.
                  </Text>
                  <VStack align="start" spacing={3}>
                    {[
                      "Real-time availability updates",
                      "Group chat and discussions",
                      "Automatic reminders",
                      "RSVP tracking"
                    ].map((item, i) => (
                      <HStack key={i}>
                        <Icon as={FiCheck} color={colors.secondary} boxSize={5} />
                        <Text fontWeight="medium">{item}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </Grid>
            </AnimatedSection>

            {/* Feature 3: Integration */}
            <AnimatedSection reducedMotion={reducedMotion}>
              <Grid
                templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
                gap={12}
                alignItems="center"
              >
                <VStack align="start" spacing={6}>
                  <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                    INTEGRATION
                  </Badge>
                  <Heading size="xl">
                    Works with your calendar
                  </Heading>
                  <Text fontSize="lg" color={colors.gray500}>
                    Seamlessly integrates with Google Calendar, Outlook, and more.
                    Your availability is always up-to-date, automatically.
                  </Text>
                  <VStack align="start" spacing={3}>
                    <HStack>
                      <Icon as={FiCheck} color={colors.secondary} boxSize={5} />
                      <Text fontWeight="medium">Google Calendar sync</Text>
                    </HStack>
                  </VStack>
                </VStack>

                <Card bg={CARD_BG} overflow="hidden" boxShadow="xl">
                  <Box p={8}>
                    <VStack spacing={4}>
                      <HStack w="full" p={4} bg="red.50" borderRadius="lg">
                        <Icon as={FcGoogle} boxSize={8} />
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontWeight="bold" fontSize="sm">Google Calendar</Text>
                          <Text fontSize="xs" color={colors.gray500}>Connected</Text>
                        </VStack>
                        <Badge colorScheme="green">Active</Badge>
                      </HStack>
                      <HStack w="full" p={4} bg="blue.50" borderRadius="lg">
                        <Icon as={BsMicrosoft} boxSize={8} color={colors.microsoft} />
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontWeight="bold" fontSize="sm">Outlook Calendar</Text>
                          <Text fontSize="xs" color={colors.gray500}>Connected</Text>
                        </VStack>
                        <Badge colorScheme="green">Active</Badge>
                      </HStack>
                      <HStack w="full" p={4} bg="gray.50" borderRadius="lg">
                        <Icon as={FaApple} boxSize={8} color={colors.gray600} />
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontWeight="bold" fontSize="sm">Apple Calendar</Text>
                          <Text fontSize="xs" color={colors.gray500}>Not connected</Text>
                        </VStack>
                        <Badge colorScheme="yellow">Coming soon</Badge>
                      </HStack>
                    </VStack>
                  </Box>
                </Card>
              </Grid>
            </AnimatedSection>
          </VStack>
        </Container>
      </Box>
    </>
  );
}

export default FeaturesSection;
