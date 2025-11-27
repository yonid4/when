import React, { useState, useEffect } from "react";
import { Box, Heading, Text, Button, VStack, Container, SimpleGrid, Icon, Image } from "@chakra-ui/react";
import { FaCalendarAlt, FaUsers, FaClock } from "react-icons/fa";
import { supabase } from "../services/supabaseClient";

const Feature = ({ title, text, icon }) => {
    return (
        <VStack
            align="center"
            p={8}
            bg="white"
            rounded="xl"
            shadow="md"
            borderWidth="1px"
            borderColor="gray.100"
            spacing={4}
            transition="transform 0.2s"
            _hover={{ transform: "translateY(-5px)" }}
        >
            <Icon as={icon} w={10} h={10} color="gray.700" />
            <Heading size="md" fontWeight="bold" color="gray.800">
                {title}
            </Heading>
            <Text color="gray.600" textAlign="center">
                {text}
            </Text>
        </VStack>
    );
};

const LandingPage = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsAuthenticated(!!session);
        };
        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleGoogleLogin = async () => {
        try {
            await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: window.location.origin + "/dashboard",
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    }
                }
            });
        } catch (error) {
            console.error("Error signing in:", error);
        }
    };

    return (
        <Box bg="#f7f9fb" minH="calc(100vh - 64px)">
            {/* Hero Section */}
            <Container maxW="container.xl" pt={20} pb={16}>
                <VStack spacing={8} textAlign="center">
                    <Heading
                        as="h1"
                        size="2xl"
                        fontWeight="extrabold"
                        color="gray.800"
                        lineHeight="1.2"
                    >
                        Find the perfect time, <br />
                        every time.
                    </Heading>
                    <Text fontSize="xl" color="gray.600" maxW="2xl">
                        Coordinate schedules with friends, colleagues, and groups effortlessly.
                        No more back-and-forth emails or confusing spreadsheets.
                    </Text>

                    {!isAuthenticated && (
                        <Button
                            size="lg"
                            leftIcon={<Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" w="20px" h="20px" />}
                            bg="white"
                            color="gray.700"
                            border="1px solid"
                            borderColor="gray.200"
                            _hover={{ bg: "gray.50" }}
                            onClick={handleGoogleLogin}
                            boxShadow="sm"
                            h="3.5rem"
                            px={8}
                        >
                            Sign in with Google
                        </Button>
                    )}
                </VStack>
            </Container>

            {/* Features Section */}
            <Container maxW="container.xl" py={16}>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
                    <Feature
                        icon={FaCalendarAlt}
                        title="Sync Calendars"
                        text="Connect your Google Calendar to automatically find times when you're free."
                    />
                    <Feature
                        icon={FaUsers}
                        title="Group Coordination"
                        text="Create events and invite others. See everyone's availability in one place."
                    />
                    <Feature
                        icon={FaClock}
                        title="Smart Scheduling"
                        text="Our algorithm suggests the best meeting times based on everyone's preferences."
                    />
                </SimpleGrid>
            </Container>
        </Box>
    );
};

export default LandingPage;
