import {
  Box,
  Card,
  CardBody,
  Container,
  Flex,
  Grid,
  HStack,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  VStack,
} from "@chakra-ui/react";

import { colors, shadows } from "../../styles/designSystem.js";

function HeaderSkeleton() {
  return (
  <Flex
    align="center"
    justify="space-between"
    px={4}
    py={3}
    borderBottom="1px"
    borderColor="gray.200"
    bg="white"
  >
    <HStack spacing={3}>
      <Skeleton height="32px" width="32px" borderRadius="md" />
      <Skeleton height="24px" width="200px" />
      <Skeleton height="20px" width="70px" borderRadius="md" />
    </HStack>
    <HStack spacing={2}>
      <Skeleton height="32px" width="32px" borderRadius="md" />
    </HStack>
  </Flex>
  );
}

function EventDetailsCardSkeleton() {
  return (
  <Card borderRadius="xl" shadow={shadows.card} bg="white">
    <CardBody p={4}>
      {/* Section label */}
      <Skeleton height="12px" width="80px" mb={4} />

      {/* Host row with RSVP buttons */}
      <HStack justify="space-between" mb={4}>
        <HStack spacing={3}>
          <SkeletonCircle size="10" />
          <VStack align="start" spacing={1}>
            <Skeleton height="14px" width="80px" />
            <Skeleton height="12px" width="40px" />
          </VStack>
        </HStack>
        <HStack spacing={2}>
          <Skeleton height="32px" width="70px" borderRadius="md" />
          <Skeleton height="32px" width="60px" borderRadius="md" />
          <Skeleton height="32px" width="70px" borderRadius="md" />
        </HStack>
      </HStack>

      {/* Date row */}
      <HStack spacing={3} mb={3}>
        <SkeletonCircle size="5" />
        <Skeleton height="14px" width="140px" />
      </HStack>

      {/* Duration row */}
      <HStack spacing={3} mb={3}>
        <SkeletonCircle size="5" />
        <Skeleton height="14px" width="80px" />
      </HStack>

      {/* Location row */}
      <HStack spacing={3} mb={4}>
        <SkeletonCircle size="5" />
        <Skeleton height="14px" width="120px" />
      </HStack>

      <SkeletonText noOfLines={3} spacing={2} />
    </CardBody>
  </Card>
  );
}

function ActionsPanelSkeleton() {
  return (
  <Card borderRadius="xl" shadow={shadows.card} bg="white">
    <CardBody p={4}>
      <Skeleton height="12px" width="60px" mb={4} />
      <Skeleton height="40px" width="100%" borderRadius="md" mb={3} />
      <Grid templateColumns="repeat(2, 1fr)" gap={2}>
        <Skeleton height="36px" borderRadius="md" />
        <Skeleton height="36px" borderRadius="md" />
        <Skeleton height="36px" borderRadius="md" />
        <Skeleton height="36px" borderRadius="md" />
      </Grid>
    </CardBody>
  </Card>
  );
}

function ParticipantsListSkeleton() {
  const avatarKeys = [1, 2, 3, 4, 5];
  const participantKeys = [1, 2, 3, 4];

  return (
  <Card borderRadius="xl" shadow={shadows.card} bg="white">
    <CardBody p={4}>
      <HStack justify="space-between" mb={4}>
        <Skeleton height="14px" width="80px" />
        <Skeleton height="20px" width="30px" borderRadius="full" />
      </HStack>

      <HStack spacing={-2} mb={4}>
        {avatarKeys.map((i) => (
          <SkeletonCircle key={i} size="8" />
        ))}
      </HStack>

      <Skeleton height="8px" width="100%" borderRadius="full" mb={4} />

      <VStack align="stretch" spacing={2}>
        {participantKeys.map((i) => (
          <HStack key={i} justify="space-between" py={1}>
            <HStack spacing={2}>
              <SkeletonCircle size="8" />
              <Skeleton height="14px" width="100px" />
            </HStack>
            <Skeleton height="20px" width="50px" borderRadius="md" />
          </HStack>
        ))}
      </VStack>
    </CardBody>
  </Card>
  );
}

function CalendarSkeleton() {
  const legendKeys = [1, 2, 3, 4];
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const timeSlots = ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM"];

  return (
  <Box
    borderWidth="1px"
    borderRadius="xl"
    p={4}
    bg="white"
    shadow={shadows.card}
    flex="1"
    display="flex"
    flexDirection="column"
    minH="0"
  >
    <Flex justify="flex-end" mb={2}>
      <HStack spacing={4}>
        {legendKeys.map((i) => (
          <HStack key={i} spacing={1.5}>
            <Skeleton height="10px" width="10px" borderRadius="sm" />
            <Skeleton height="10px" width="30px" />
          </HStack>
        ))}
      </HStack>
    </Flex>

    <Box flex="1" position="relative">
      <HStack justify="space-around" mb={2} pt={2}>
        {weekDays.map((day) => (
          <Skeleton key={day} height="16px" width="40px" />
        ))}
      </HStack>

      <Grid templateColumns="50px 1fr" gap={2} flex="1">
        <VStack align="end" spacing={4} pt={4}>
          {timeSlots.map((time) => (
            <Skeleton key={time} height="12px" width="35px" />
          ))}
        </VStack>

        <Box borderLeft="1px" borderColor="gray.200" position="relative" minH="300px">
          <Skeleton position="absolute" top="20%" left="10%" height="60px" width="80px" borderRadius="md" opacity={0.5} />
          <Skeleton position="absolute" top="40%" left="30%" height="80px" width="80px" borderRadius="md" opacity={0.5} />
          <Skeleton position="absolute" top="60%" left="60%" height="50px" width="80px" borderRadius="md" opacity={0.5} />
        </Box>
      </Grid>
    </Box>
  </Box>
  );
}

function EventPageSkeleton() {
  return (
    <Box h="calc(100vh - 64px)" bg={colors.bgPage} overflow="hidden">
      <HeaderSkeleton />

      <Container maxW="95%" h="calc(100% - 57px)" py={4}>
        <Grid templateColumns={{ base: "1fr", lg: "65fr 35fr" }} gap={6} h="full">
          <Flex direction="column" h="full" overflow="hidden">
            <CalendarSkeleton />
          </Flex>

          <Box h="full" overflowY="auto" pb={4}>
            <VStack align="stretch" spacing={4}>
              <EventDetailsCardSkeleton />
              <ActionsPanelSkeleton />
              <ParticipantsListSkeleton />
            </VStack>
          </Box>
        </Grid>
      </Container>
    </Box>
  );
}

export default EventPageSkeleton;
