import { CalendarSettings } from "../components/settings";
import { colors, shadows, animations } from "../styles/designSystem";

import React from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  HStack,
  Icon,
  Card
} from "@chakra-ui/react";
import { FiCalendar, FiUser, FiSettings } from "react-icons/fi";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

const selectedTabStyles = {
  bg: "white",
  borderColor: colors.borderLight,
  borderBottomColor: "white"
};

/**
 * Settings page with tabbed navigation.
 *
 * Tabs:
 * - Calendars: Manage connected calendar accounts and sources
 * - Account: User profile settings (placeholder)
 */
const Settings = () => {
  return (
    <Box minH="100vh" bg={colors.bgPage} py={8}>
      <Container maxW="4xl">
        <MotionBox
          initial={animations.slideUp.initial}
          animate={animations.slideUp.animate}
          transition={animations.slideUp.transition}
        >
          {/* Page Header */}
          <VStack align="start" spacing={1} mb={8}>
            <HStack spacing={3}>
              <Icon as={FiSettings} boxSize={6} color={colors.primary} />
              <Heading size="lg" color={colors.textPrimary}>
                Settings
              </Heading>
            </HStack>
            <Text color={colors.textMuted} pl={9}>
              Manage your calendar connections and account preferences
            </Text>
          </VStack>

          {/* Settings Tabs */}
          <Card shadow={shadows.card} borderRadius="xl" overflow="hidden">
            <Tabs colorScheme="purple" variant="enclosed-colored">
              <TabList bg={colors.surfaceHover} borderBottom="none">
                <Tab _selected={selectedTabStyles} fontWeight="medium">
                  <HStack spacing={2}>
                    <Icon as={FiCalendar} />
                    <Text>Calendars</Text>
                  </HStack>
                </Tab>
                <Tab _selected={selectedTabStyles} fontWeight="medium">
                  <HStack spacing={2}>
                    <Icon as={FiUser} />
                    <Text>Account</Text>
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels>
                <TabPanel p={6}>
                  <CalendarSettings />
                </TabPanel>

                <TabPanel p={6}>
                  <AccountSettings />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Card>
        </MotionBox>
      </Container>
    </Box>
  );
};

/**
 * AccountSettings - Placeholder for account settings.
 */
function AccountSettings() {
  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Heading size="md" color={colors.textPrimary} mb={2}>
          Account Settings
        </Heading>
        <Text fontSize="sm" color={colors.textMuted}>
          Manage your profile and account preferences
        </Text>
      </Box>

      <Box
        p={8}
        bg={colors.surfaceHover}
        borderRadius="lg"
        textAlign="center"
        border="2px dashed"
        borderColor={colors.borderLight}
      >
        <VStack spacing={2}>
          <Icon as={FiUser} boxSize={8} color={colors.textMuted} />
          <Text color={colors.textMuted}>
            Account settings coming soon
          </Text>
        </VStack>
      </Box>
    </VStack>
  );
}

export default Settings;
