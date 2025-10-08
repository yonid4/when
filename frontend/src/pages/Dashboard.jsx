import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Grid,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  Divider,
  Flex,
  Spacer,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from "@chakra-ui/react";
import Layout from "../layout";
import api from "../services/api";
import { useEnsureProfile } from "../hooks/useEnsureProfile";
import { supabase } from "../services/supabaseClient";

function formatDateRange(start, end) {
  const options = { month: "short", day: "numeric" };
  const startStr = start.toLocaleDateString("en-US", options);
  const endStr = end.toLocaleDateString("en-US", options);
  return `${startStr} - ${endStr}`;
}

const initialForm = {
  name: "",
  description: "",
  start_date: "",
  end_date: "",
  earliest_daily_start_time: "",
  latest_daily_end_time: "",
  duration_minutes: ""
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { error: profileError } = useEnsureProfile();
  const [coordinatingEvents, setCoordinatingEvents] = useState([]);
  const [participatingEvents, setParticipatingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Fetch user events on component mount
  useEffect(() => {
    const fetchUserEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get('/api/events/');
        const events = response.data;
        
        // Separate coordinating and participating events
        const coordinating = events.filter(event => event.role === 'coordinator');
        const participating = events.filter(event => event.role === 'participant');
        
        setCoordinatingEvents(coordinating);
        setParticipatingEvents(participating);
        
        console.log('Fetched events:', { coordinating, participating });
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserEvents();
  }, []);

  const [form, setForm] = useState(initialForm);
  const [isCreating, setIsCreating] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in to create an event.');
        setIsCreating(false);
        return;
      }

      const response = await api.post('/api/events/', form);
      console.log('Event created:', response.data);
      
      // Reset form
      setForm(initialForm);
      
      // Refresh events list
      const eventsResponse = await api.get('/api/events/');
      const events = eventsResponse.data;
      const coordinating = events.filter(event => event.role === 'coordinator');
      const participating = events.filter(event => event.role === 'participant');
      setCoordinatingEvents(coordinating);
      setParticipatingEvents(participating);
      
      // Close modal and navigate to the new event
      onClose();
      navigate(`/events/${response.data.uid}`);
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err.response?.data?.message || 'Failed to create event.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (profileError) {
    return (
      <Layout>
        <Center h="100vh">
          <Alert status="error">
            <AlertIcon />
            Error loading profile: {profileError}
          </Alert>
        </Center>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <Center h="100vh">
          <VStack spacing={4}>
            <Spinner size="xl" />
            <Text fontSize="xl">Loading your events...</Text>
          </VStack>
        </Center>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box p={8} maxW="1200px" mx="auto">
        {/* Header */}
        <Flex mb={8} align="center" justify="space-between">
          <Heading size="lg">Your Events</Heading>
          <HStack spacing={4}>
            <Button colorScheme="blue" onClick={onOpen}>
              Create Event
            </Button>
          </HStack>
        </Flex>

        {error && (
          <Alert status="error" mb={6}>
            <AlertIcon />
            {error}
          </Alert>
        )}

        <VStack spacing={8} align="stretch">
          {/* Coordinating Events */}
          <Box>
            <Heading size="md" mb={4}>Events You're Coordinating</Heading>
            {coordinatingEvents.length > 0 ? (
              <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={4}>
                {coordinatingEvents.map((event) => (
                  <Card 
                    key={event.id} 
                    variant="outline" 
                    cursor="pointer"
                    _hover={{ shadow: "md", transform: "translateY(-2px)" }}
                    transition="all 0.2s"
                    onClick={() => navigate(`/events/${event.uid}`)}
                  >
                    <CardHeader>
                      <Heading size="sm">{event.name}</Heading>
                    </CardHeader>
                    <CardBody pt={0}>
                      <VStack align="start" spacing={2}>
                        {event.description && (
                          <Text fontSize="sm" color="gray.600">
                            {event.description}
                          </Text>
                        )}
                        {event.earliest_date && event.latest_date && (
                          <Text fontSize="sm" fontWeight="medium">
                            {formatDateRange(
                              new Date(event.earliest_date),
                              new Date(event.latest_date)
                            )}
                          </Text>
                        )}
                        <HStack spacing={4}>
                          <Text fontSize="sm">Duration: {event.duration_minutes} min</Text>
                          <Badge colorScheme="blue" variant="subtle">
                            {event.status}
                          </Badge>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </Grid>
            ) : (
              <Text color="gray.500">No events you're coordinating yet.</Text>
            )}
          </Box>

          {/* Participating Events */}
          <Box>
            <Heading size="md" mb={4}>Events You're Participating In</Heading>
            {participatingEvents.length > 0 ? (
              <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={4}>
                {participatingEvents.map((event) => (
                  <Card 
                    key={event.id} 
                    variant="outline" 
                    cursor="pointer"
                    _hover={{ shadow: "md", transform: "translateY(-2px)" }}
                    transition="all 0.2s"
                    onClick={() => navigate(`/events/${event.uid}`)}
                  >
                    <CardHeader>
                      <Heading size="sm">{event.name}</Heading>
                    </CardHeader>
                    <CardBody pt={0}>
                      <VStack align="start" spacing={2}>
                        {event.description && (
                          <Text fontSize="sm" color="gray.600">
                            {event.description}
                          </Text>
                        )}
                        {event.earliest_date && event.latest_date && (
                          <Text fontSize="sm" fontWeight="medium">
                            {formatDateRange(
                              new Date(event.earliest_date),
                              new Date(event.latest_date)
                            )}
                          </Text>
                        )}
                        <HStack spacing={4}>
                          <Text fontSize="sm">Duration: {event.duration_minutes} min</Text>
                          <Badge colorScheme="green" variant="subtle">
                            {event.status}
                          </Badge>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </Grid>
            ) : (
              <Text color="gray.500">No events you're participating in yet.</Text>
            )}
          </Box>

        </VStack>

        {/* Create Event Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Create New Event</ModalHeader>
            <ModalCloseButton />
            <form onSubmit={handleSubmit}>
              <ModalBody>
                <VStack spacing={4} align="stretch">
                  <FormControl isRequired>
                    <FormLabel>Event Name</FormLabel>
                    <Input
                      name="name"
                      value={form.name}
                      onChange={handleInputChange}
                      placeholder="Enter event name"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      name="description"
                      value={form.description}
                      onChange={handleInputChange}
                      placeholder="Enter event description"
                      rows={3}
                    />
                  </FormControl>

                  <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                    <FormControl isRequired>
                      <FormLabel>Start Date</FormLabel>
                      <Input
                        type="date"
                        name="start_date"
                        value={form.start_date}
                        onChange={handleInputChange}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>End Date</FormLabel>
                      <Input
                        type="date"
                        name="end_date"
                        value={form.end_date}
                        onChange={handleInputChange}
                      />
                    </FormControl>
                  </Grid>

                  <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                    <FormControl isRequired>
                      <FormLabel>Earliest Start Time</FormLabel>
                      <Input
                        type="time"
                        name="earliest_daily_start_time"
                        value={form.earliest_daily_start_time}
                        onChange={handleInputChange}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Latest End Time</FormLabel>
                      <Input
                        type="time"
                        name="latest_daily_end_time"
                        value={form.latest_daily_end_time}
                        onChange={handleInputChange}
                      />
                    </FormControl>
                  </Grid>

                  <FormControl isRequired>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <Input
                      type="number"
                      name="duration_minutes"
                      value={form.duration_minutes}
                      onChange={handleInputChange}
                      min="15"
                      step="15"
                      placeholder="60"
                    />
                  </FormControl>
                </VStack>
              </ModalBody>

              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  colorScheme="blue"
                  isLoading={isCreating}
                  loadingText="Creating..."
                >
                  Create Event
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      </Box>
    </Layout>
  );
};

export default Dashboard;