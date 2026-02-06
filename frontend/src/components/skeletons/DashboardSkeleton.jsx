import {
  Box,
  Card,
  CardBody,
  Grid,
  HStack,
  Skeleton,
  SkeletonCircle,
  VStack,
} from "@chakra-ui/react";

import { colors, components, shadows } from "../../styles/designSystem.js";

function EventCardSkeleton() {
  return (
  <Card
    borderRadius="xl"
    border="1px solid"
    borderColor="gray.200"
    bg="white"
    shadow={shadows.card}
  >
    <CardBody p={4}>
      <HStack justify="space-between" mb={2}>
        <Skeleton height="20px" width="60px" borderRadius="md" />
        <Skeleton height="14px" width="50px" />
      </HStack>
      <Skeleton height="20px" width="80%" mb={2} />
      <HStack fontSize="xs" mb={3}>
        <SkeletonCircle size="4" />
        <Skeleton height="14px" width="100px" />
      </HStack>
      <HStack fontSize="xs" mb={3}>
        <SkeletonCircle size="4" />
        <Skeleton height="14px" width="60px" />
      </HStack>
      <Skeleton height="32px" width="100%" borderRadius="md" />
    </CardBody>
  </Card>
  );
}

function StatRowSkeleton() {
  return (
  <HStack
    py={3}
    borderLeft="3px solid"
    borderColor="gray.200"
    pl={3}
    bg="gray.50"
    borderRadius="md"
  >
    <SkeletonCircle size="4" />
    <Skeleton height="14px" width="60px" flex={1} />
    <Skeleton height="20px" width="24px" />
  </HStack>
  );
}

function InvitationCardSkeleton() {
  return (
  <Card
    size="sm"
    borderLeft="3px solid"
    borderColor="gray.200"
    bg="white"
    shadow={shadows.card}
  >
    <CardBody py={3} px={3}>
      <HStack justify="space-between" align="start">
        <VStack align="start" spacing={1} flex={1}>
          <Skeleton height="16px" width="120px" />
          <Skeleton height="12px" width="150px" />
        </VStack>
        <HStack spacing={1}>
          <Skeleton height="24px" width="24px" borderRadius="md" />
          <Skeleton height="24px" width="24px" borderRadius="md" />
        </HStack>
      </HStack>
    </CardBody>
  </Card>
  );
}

function SectionHeaderSkeleton() {
  return (
    <HStack mb={4} spacing={2}>
      <Skeleton height="12px" width="100px" />
      <Skeleton height="18px" width="24px" borderRadius="full" />
    </HStack>
  );
}

function DashboardSkeleton() {
  const eventCardKeys = [1, 2, 3];

  return (
    <Box h="calc(100vh - 64px)" bg={colors.bgPage} overflow="hidden">
      <Grid
        templateColumns={{ base: "1fr", lg: `1fr ${components.sidebar.width}` }}
        gap={0}
        h="100%"
      >
        <Box overflowY="auto" py={6} px={{ base: 4, md: 6 }} h="100%">
          <Box mb={6}>
            <HStack justify="space-between" align="baseline">
              <Skeleton height="32px" width="280px" />
              <Skeleton height="14px" width="150px" />
            </HStack>
          </Box>

          <Box mb={6}>
            <SectionHeaderSkeleton />
            <Grid
              templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" }}
              gap={4}
            >
              {eventCardKeys.map((i) => (
                <EventCardSkeleton key={i} />
              ))}
            </Grid>
          </Box>

          <Box mb={6}>
            <SectionHeaderSkeleton />
            <Grid
              templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" }}
              gap={4}
            >
              {eventCardKeys.map((i) => (
                <EventCardSkeleton key={i} />
              ))}
            </Grid>
          </Box>
        </Box>

        <Box
          borderLeft="1px"
          borderColor="gray.200"
          bg="white"
          p={5}
          position="relative"
          h="100%"
          overflowY="auto"
          display={{ base: "none", lg: "block" }}
          shadow={shadows.sidebar}
        >
          <VStack align="stretch" spacing={3} mb={6}>
            <Skeleton height="12px" width="80px" mb={1} />
            <StatRowSkeleton />
            <StatRowSkeleton />
            <StatRowSkeleton />
          </VStack>

          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between">
              <Skeleton height="12px" width="70px" />
              <Skeleton height="18px" width="24px" borderRadius="full" />
            </HStack>
            <VStack align="stretch" spacing={2}>
              <InvitationCardSkeleton />
              <InvitationCardSkeleton />
            </VStack>
          </VStack>
        </Box>
      </Grid>
    </Box>
  );
}

export default DashboardSkeleton;
