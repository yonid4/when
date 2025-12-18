import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../services/supabaseClient";
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  Image,
  useColorModeValue,
  SimpleGrid,
  Card,
  CardBody,
  Avatar,
  AvatarGroup,
  Badge,
  Divider
} from "@chakra-ui/react";
import { motion, useInView } from "framer-motion";
import {
  FiCalendar,
  FiUsers,
  FiClock,
  FiZap,
  FiCheck,
  FiMail,
  FiArrowRight,
  FiGlobe,
  FiSmartphone,
  FiBell,
  FiTrendingUp
} from "react-icons/fi";
import { colors, gradients } from "../styles/designSystem";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const Landing = () => {
  const navigate = useNavigate();
  const { user, session, loading } = useAuth();
  const bgColor = useColorModeValue("white", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const featureBgColor = useColorModeValue("gray.50", "gray.800");
  const footerBgColor = useColorModeValue("gray.900", "gray.950");

  // // Redirect authenticated users to dashboard
  // useEffect(() => {
  //   if (!loading && user && session) {
  //     console.log("User authenticated, redirecting to dashboard...");
  //     navigate("/dashboard", { replace: true });
  //   }
  // }, [user, session, loading, navigate]);

  // Handle Google OAuth sign-in
  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          scopes: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events"
        }
      });

      if (error) {
        console.error("Sign in error:", error);
      }
    } catch (err) {
      console.error("Failed to initiate sign in:", err);
    }
  };

  // Show loading state while checking auth
  if (loading) {
    return null; // Or a loading spinner
  }

  const AnimatedSection = ({ children, delay = 0 }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
      <MotionBox
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.6, delay }}
      >
        {children}
      </MotionBox>
    );
  };

  return (
    <Box bg={bgColor}>
      {/* Hero Section */}
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
            <MotionBox
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Badge
                colorScheme="whiteAlpha"
                fontSize="md"
                px={4}
                py={2}
                borderRadius="full"
                mb={6}
              >
                ✨ Scheduling Made Simple
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

            <MotionBox
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
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
                  onClick={handleSignIn}
                >
                  Sign in with Google
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  borderColor="white"
                  color="white"
                  px={8}
                  py={7}
                  fontSize="lg"
                  fontWeight="bold"
                  _hover={{
                    bg: "whiteAlpha.200",
                    transform: "translateY(-2px)"
                  }}
                  transition="all 0.3s"
                >
                  Watch Demo
                </Button>
              </HStack>
            </MotionBox>

            {/* Hero Image/Illustration Placeholder */}
            <MotionBox
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              mt={12}
            >
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
            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              mt={8}
            >
              <VStack spacing={4}>
                <HStack>
                  <AvatarGroup size="md" max={5}>
                    <Avatar src="https://i.pravatar.cc/150?img=1" />
                    <Avatar src="https://i.pravatar.cc/150?img=5" />
                    <Avatar src="https://i.pravatar.cc/150?img=9" />
                    <Avatar src="https://i.pravatar.cc/150?img=12" />
                    <Avatar src="https://i.pravatar.cc/150?img=15" />
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

      {/* Value Propositions */}
      <Container maxW="container.xl" py={20}>
        <AnimatedSection>
          <VStack spacing={4} textAlign="center" mb={16}>
            <Heading size="2xl">Why teams love When</Heading>
            <Text fontSize="xl" color="gray.600" maxW="2xl">
              Everything you need to coordinate schedules and bring people together
            </Text>
          </VStack>
        </AnimatedSection>

        <Grid
          templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
          gap={8}
        >
          {[
            {
              icon: FiZap,
              color: colors.accent,
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
              color: colors.info,
              title: "Stay Updated",
              description: "Real-time notifications keep everyone in the loop when plans change."
            }
          ].map((feature, index) => (
            <AnimatedSection key={index} delay={index * 0.1}>
              <MotionCard
                h="full"
                bg={cardBg}
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
                    <Text color="gray.600">{feature.description}</Text>
                  </VStack>
                </CardBody>
              </MotionCard>
            </AnimatedSection>
          ))}
        </Grid>
      </Container>

      {/* Features Showcase */}
      <Box bg={featureBgColor} py={20}>
        <Container maxW="container.xl">
          <VStack spacing={20}>
            {/* Feature 1 */}
            <AnimatedSection>
              <Grid
                templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
                gap={12}
                alignItems="center"
              >
                <VStack align="start" spacing={6}>
                  <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
                    SCHEDULING
                  </Badge>
                  <Heading size="xl">
                    Stop playing email ping-pong
                  </Heading>
                  <Text fontSize="lg" color="gray.600">
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

                <Card bg={cardBg} overflow="hidden" boxShadow="xl">
                  <Box p={8} bg={gradients.primary}>
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

            {/* Feature 2 */}
            <AnimatedSection>
              <Grid
                templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
                gap={12}
                alignItems="center"
              >
                <Card
                  bg={cardBg}
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
                  <Text fontSize="lg" color="gray.600">
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

            {/* Feature 3 */}
            <AnimatedSection>
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
                  <Text fontSize="lg" color="gray.600">
                    Seamlessly integrates with Google Calendar, Outlook, and more.
                    Your availability is always up-to-date, automatically.
                  </Text>
                  <VStack align="start" spacing={3}>
                    {[
                      "Google Calendar sync",
                      "Microsoft Outlook support",
                      "Apple Calendar integration",
                      "Two-way synchronization"
                    ].map((item, i) => (
                      <HStack key={i}>
                        <Icon as={FiCheck} color={colors.secondary} boxSize={5} />
                        <Text fontWeight="medium">{item}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>

                <Card bg={cardBg} overflow="hidden" boxShadow="xl">
                  <Box p={8}>
                    <VStack spacing={4}>
                      <HStack w="full" p={4} bg="red.50" borderRadius="lg">
                        <Box w={8} h={8} bg="red.500" borderRadius="md" />
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontWeight="bold" fontSize="sm">Google Calendar</Text>
                          <Text fontSize="xs" color="gray.600">Connected</Text>
                        </VStack>
                        <Badge colorScheme="green">Active</Badge>
                      </HStack>
                      <HStack w="full" p={4} bg="blue.50" borderRadius="lg">
                        <Box w={8} h={8} bg="blue.500" borderRadius="md" />
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontWeight="bold" fontSize="sm">Outlook Calendar</Text>
                          <Text fontSize="xs" color="gray.600">Connected</Text>
                        </VStack>
                        <Badge colorScheme="green">Active</Badge>
                      </HStack>
                      <HStack w="full" p={4} bg="gray.50" borderRadius="lg">
                        <Box w={8} h={8} bg="gray.400" borderRadius="md" />
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontWeight="bold" fontSize="sm">Apple Calendar</Text>
                          <Text fontSize="xs" color="gray.600">Not connected</Text>
                        </VStack>
                        <Button size="xs" colorScheme="blue">Connect</Button>
                      </HStack>
                    </VStack>
                  </Box>
                </Card>
              </Grid>
            </AnimatedSection>
          </VStack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box bg={gradients.ocean} color="white" py={20}>
        <Container maxW="container.md">
          <AnimatedSection>
            <VStack spacing={8} textAlign="center">
              <Heading size="2xl">
                Ready to simplify scheduling?
              </Heading>
              <Text fontSize="xl" opacity={0.9}>
                Join thousands of teams who've ditched the scheduling chaos.
                Get started in seconds - no credit card required.
              </Text>
              <Button
                size="lg"
                bg="white"
                color={colors.primary}
                px={12}
                py={7}
                fontSize="lg"
                fontWeight="bold"
                rightIcon={<FiArrowRight />}
                _hover={{ transform: "translateY(-2px)", shadow: "2xl" }}
                transition="all 0.3s"
                onClick={handleSignIn}
              >
                Get Started Free
              </Button>
              <Text fontSize="sm" opacity={0.8}>
                No credit card required • Free forever • Takes 30 seconds
              </Text>
            </VStack>
          </AnimatedSection>
        </Container>
      </Box>

      {/* Footer */}
      <Box bg={footerBgColor} color="white" py={12}>
        <Container maxW="container.xl">
          <Grid
            templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }}
            gap={8}
          >
            <VStack align="start" spacing={4}>
              <Heading size="md" bgGradient={gradients.ocean} bgClip="text">
                When
              </Heading>
              <Text fontSize="sm" color="gray.400">
                Find the perfect time, together.
              </Text>
            </VStack>

            <VStack align="start" spacing={3}>
              <Text fontWeight="bold">Product</Text>
              <Link fontSize="sm" color="gray.400" _hover={{ color: "white" }}>
                Features
              </Link>
              <Link fontSize="sm" color="gray.400" _hover={{ color: "white" }}>
                Pricing
              </Link>
              <Link fontSize="sm" color="gray.400" _hover={{ color: "white" }}>
                Integrations
              </Link>
            </VStack>

            <VStack align="start" spacing={3}>
              <Text fontWeight="bold">Company</Text>
              <Link fontSize="sm" color="gray.400" _hover={{ color: "white" }}>
                About
              </Link>
              <Link fontSize="sm" color="gray.400" _hover={{ color: "white" }}>
                Blog
              </Link>
              <Link fontSize="sm" color="gray.400" _hover={{ color: "white" }}>
                Careers
              </Link>
            </VStack>

            <VStack align="start" spacing={3}>
              <Text fontWeight="bold">Support</Text>
              <Link fontSize="sm" color="gray.400" _hover={{ color: "white" }}>
                Help Center
              </Link>
              <Link fontSize="sm" color="gray.400" _hover={{ color: "white" }}>
                Contact
              </Link>
              <Link fontSize="sm" color="gray.400" _hover={{ color: "white" }}>
                Privacy
              </Link>
            </VStack>
          </Grid>

          <Divider my={8} borderColor="gray.700" />

          <Flex
            justify="space-between"
            align="center"
            flexDirection={{ base: "column", md: "row" }}
            gap={4}
          >
            <Text fontSize="sm" color="gray.400">
              © 2024 When. All rights reserved.
            </Text>
            <HStack spacing={6}>
              <Link fontSize="sm" color="gray.400" _hover={{ color: "white" }}>
                Terms
              </Link>
              <Link fontSize="sm" color="gray.400" _hover={{ color: "white" }}>
                Privacy
              </Link>
              <Link fontSize="sm" color="gray.400" _hover={{ color: "white" }}>
                Cookies
              </Link>
            </HStack>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

// Missing Link component import
const Link = ({ children, ...props }) => (
  <Text as="a" cursor="pointer" {...props}>
    {children}
  </Text>
);

export default Landing;

