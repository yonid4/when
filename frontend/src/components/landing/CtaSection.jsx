import { useRef } from "react";

import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Grid,
  Heading,
  HStack,
  Text,
  VStack
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";

import { colors, gradients } from "../../styles/designSystem";

const MotionBox = motion(Box);

function getAnimateState(reducedMotion, isInView) {
  if (reducedMotion) return {};
  if (isInView) return { opacity: 1, y: 0 };
  return { opacity: 0, y: 30 };
}

function FooterLink({ children, onClick }) {
  return (
    <Text
      as="a"
      cursor="pointer"
      fontSize="sm"
      color={colors.textFaint}
      _hover={{ color: "white" }}
      onClick={onClick}
    >
      {children}
    </Text>
  );
}

/**
 * Final CTA section with gradient background and footer.
 * Simple fade-up animation on scroll.
 */
function CtaSection({ onSignIn, reducedMotion }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const navigate = useNavigate();

  function scrollToAbout(e) {
    e.preventDefault();
    const target = document.querySelector("#converging-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function goToPrivacy() {
    navigate("/privacy");
  }

  return (
    <>
      {/* CTA Section */}
      <Box bg={gradients.primary} color="white" py={20}>
        <Container maxW="container.md">
          <MotionBox
            ref={ref}
            initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
            animate={getAnimateState(reducedMotion, isInView)}
            transition={{ duration: 0.6 }}
          >
            <VStack spacing={8} textAlign="center">
              <Heading size="2xl">Ready to simplify scheduling?</Heading>
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
                _hover={{ bg: "#F0F0F0", transform: "translateY(-2px)", shadow: "0 6px 20px rgba(0,0,0,0.15)" }}
                transition="all 0.3s"
                onClick={onSignIn}
              >
                Get Started Free
              </Button>
              <Text fontSize="sm" opacity={0.7}>
                No credit card required &bull; Free forever &bull; Takes 30 seconds
              </Text>
            </VStack>
          </MotionBox>
        </Container>
      </Box>

      {/* Footer */}
      <Box bg={colors.gray800} color="white" py={12}>
        <Container maxW="container.xl">
          <Grid
            templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }}
            gap={8}
          >
            <VStack align="start" spacing={4}>
              <Heading size="md" color={colors.primary}>
                When
              </Heading>
              <Text fontSize="sm" color={colors.textFaint}>
                Find the perfect time, together.
              </Text>
            </VStack>

            <VStack align="start" spacing={3}>
              <Text fontWeight="bold">Product</Text>
              <FooterLink>Features</FooterLink>
              <FooterLink>Pricing</FooterLink>
              <FooterLink>Integrations</FooterLink>
            </VStack>

            <VStack align="start" spacing={3}>
              <Text fontWeight="bold">Company</Text>
              <FooterLink onClick={scrollToAbout}>About</FooterLink>
              <FooterLink>Blog</FooterLink>
              <FooterLink>Careers</FooterLink>
            </VStack>

            <VStack align="start" spacing={3}>
              <Text fontWeight="bold">Support</Text>
              <FooterLink>Help Center</FooterLink>
              <FooterLink>Contact</FooterLink>
              <FooterLink onClick={goToPrivacy}>Privacy</FooterLink>
            </VStack>
          </Grid>

          <Divider my={8} borderColor="rgba(148,163,184,0.25)" />

          <Flex
            justify="space-between"
            align="center"
            flexDirection={{ base: "column", md: "row" }}
            gap={4}
          >
            <Text fontSize="sm" color={colors.textFaint}>
              &copy; 2025 When. All rights reserved.
            </Text>
            <HStack spacing={6}>
              <FooterLink>Terms</FooterLink>
              <FooterLink onClick={goToPrivacy}>Privacy</FooterLink>
              <FooterLink>Cookies</FooterLink>
            </HStack>
          </Flex>
        </Container>
      </Box>
    </>
  );
}

export default CtaSection;
