import { colors } from "../styles/designSystem";

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Divider,
  Heading,
  Link,
  ListItem,
  Text,
  UnorderedList,
  VStack
} from "@chakra-ui/react";
import { FiArrowLeft } from "react-icons/fi";

const EFFECTIVE_DATE = "February 5, 2026";
const CONTACT_EMAIL = "whenapp.now@gmail.com";
const SITE_URL = "https://when-now.com";

/**
 * Section heading with consistent styling and an anchor id for deep-linking.
 */
function SectionHeading({ id, children }) {
  return (
    <Heading
      id={id}
      as="h2"
      fontSize={{ base: "xl", md: "2xl" }}
      fontWeight="700"
      color={colors.textHeading}
      letterSpacing="-0.02em"
      mt={10}
      mb={4}
      scrollMarginTop="80px"
    >
      {children}
    </Heading>
  );
}

/**
 * Body paragraph with Medium-style reading typography.
 */
function P({ children, ...rest }) {
  return (
    <Text
      fontSize={{ base: "md", md: "lg" }}
      lineHeight="1.8"
      color={colors.textBody}
      mb={4}
      {...rest}
    >
      {children}
    </Text>
  );
}

/**
 * Inline bold label for definition-style sentences.
 */
function B({ children }) {
  return (
    <Text as="span" fontWeight="600" color={colors.textHeading}>
      {children}
    </Text>
  );
}

/**
 * Styled bullet list matching the reading layout.
 */
function BulletList({ items }) {
  return (
    <UnorderedList
      spacing={2}
      pl={4}
      mb={4}
      styleType="disc"
      color={colors.textBody}
    >
      {items.map((item, i) => (
        <ListItem
          key={i}
          fontSize={{ base: "md", md: "lg" }}
          lineHeight="1.8"
        >
          {item}
        </ListItem>
      ))}
    </UnorderedList>
  );
}

/**
 * Privacy Policy page for When.
 *
 * Covers data collection, processing, third-party services (Render, Supabase),
 * security measures, user rights under GDPR, and account deletion.
 *
 * Designed as a minimalist, Medium-style reading layout with max-width 3xl,
 * high-contrast typography, and a mobile-friendly container.
 */
const PrivacyPolicy = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Box bg="white" minH="100vh" py={{ base: 8, md: 16 }}>
      <Container maxW="3xl" px={{ base: 5, md: 8 }}>
        {/* Back navigation */}
        <Link
          display="inline-flex"
          alignItems="center"
          gap={2}
          fontSize="sm"
          fontWeight="500"
          color={colors.primary}
          _hover={{ color: colors.primaryDark, textDecoration: "none" }}
          onClick={() => navigate(-1)}
          cursor="pointer"
          mb={8}
        >
          <FiArrowLeft size={16} />
          Back
        </Link>

        {/* Page title */}
        <VStack align="start" spacing={3} mb={10}>
          <Heading
            as="h1"
            fontSize={{ base: "3xl", md: "4xl" }}
            fontWeight="800"
            color={colors.textHeading}
            letterSpacing="-0.03em"
            lineHeight="1.2"
          >
            Privacy Policy
          </Heading>
          <Text fontSize="sm" color={colors.textMuted}>
            Effective date: {EFFECTIVE_DATE}
          </Text>
        </VStack>

        <Divider borderColor={colors.borderSubtle} mb={8} />

        {/* ── 1. Introduction ─────────────────────────────────── */}
        <SectionHeading id="introduction">1. Introduction</SectionHeading>
        <P>
          When ("<B>we</B>," "<B>our</B>," or "<B>us</B>") operates the website
          at{" "}
          <Link href={SITE_URL} color={colors.primary} isExternal>
            when-now.com
          </Link>{" "}
          and associated services (collectively, the "<B>Service</B>"). This
          Privacy Policy explains what personal data we collect, why we collect
          it, how it is processed and stored, and your rights regarding that
          data.
        </P>
        <P>
          By using the Service, you agree to the collection and use of
          information in accordance with this policy. If you do not agree, please
          discontinue use of the Service.
        </P>

        {/* ── 2. Information We Collect ───────────────────────── */}
        <SectionHeading id="information-we-collect">
          2. Information We Collect
        </SectionHeading>
        <P>
          We designed When to collect the <B>minimum data necessary</B> to
          provide the Service. We do not sell your data, and we do not build
          advertising profiles.
        </P>

        <Heading
          as="h3"
          fontSize="lg"
          fontWeight="600"
          color={colors.textHeading}
          mt={6}
          mb={3}
        >
          2.1 Account Information (via Google Sign-In)
        </Heading>
        <P>
          When you sign in with Google, we receive and store the following from
          your Google account:
        </P>
        <BulletList
          items={[
            <><B>Email address</B> &mdash; used as your unique account identifier and for event notifications.</>,
            <><B>Display name</B> &mdash; shown to other participants in events you join.</>,
            <><B>Profile photo URL</B> &mdash; displayed alongside your name in the app interface.</>
          ]}
        />
        <P>
          We request the OAuth 2.0 scopes{" "}
          <Text as="code" fontSize="sm" bg={colors.bgTertiary} px={1.5} py={0.5} borderRadius="md">
            openid
          </Text>
          ,{" "}
          <Text as="code" fontSize="sm" bg={colors.bgTertiary} px={1.5} py={0.5} borderRadius="md">
            userinfo.email
          </Text>
          ,{" "}
          <Text as="code" fontSize="sm" bg={colors.bgTertiary} px={1.5} py={0.5} borderRadius="md">
            userinfo.profile
          </Text>
          ,{" "}
          <Text as="code" fontSize="sm" bg={colors.bgTertiary} px={1.5} py={0.5} borderRadius="md">
            calendar.readonly
          </Text>
          , and{" "}
          <Text as="code" fontSize="sm" bg={colors.bgTertiary} px={1.5} py={0.5} borderRadius="md">
            calendar.events
          </Text>
          . The calendar scopes allow us to read your free/busy times and create
          finalized events on your behalf.
        </P>

        <Heading
          as="h3"
          fontSize="lg"
          fontWeight="600"
          color={colors.textHeading}
          mt={6}
          mb={3}
        >
          2.2 User-Generated Event Data
        </Heading>
        <P>
          When you create or participate in events, we store the data you
          provide:
        </P>
        <BulletList
          items={[
            "Event titles, descriptions, and date ranges.",
            "Your preferred time slots and availability preferences.",
            "Invitation status and RSVP responses."
          ]}
        />

        <Heading
          as="h3"
          fontSize="lg"
          fontWeight="600"
          color={colors.textHeading}
          mt={6}
          mb={3}
        >
          2.3 Calendar Data
        </Heading>
        <P>
          With your explicit consent, we access your Google Calendar to retrieve
          free/busy information within the date range of an event you are part
          of. We cache this data temporarily as anonymized "busy slots" and
          do <B>not</B> store the titles, descriptions, or attendee lists of
          your calendar events.
        </P>

        <Heading
          as="h3"
          fontSize="lg"
          fontWeight="600"
          color={colors.textHeading}
          mt={6}
          mb={3}
        >
          2.4 What We Do Not Collect
        </Heading>
        <BulletList
          items={[
            "We do not collect payment or financial information.",
            "We do not use secondary tracking cookies or third-party analytics trackers.",
            "We do not collect your location, IP address for profiling, or device fingerprints."
          ]}
        />

        {/* ── 3. How We Use Your Information ──────────────────── */}
        <SectionHeading id="how-we-use-information">
          3. How We Use Your Information
        </SectionHeading>
        <P>We use the data we collect solely to operate and improve the Service:</P>
        <BulletList
          items={[
            <><B>Event coordination</B> &mdash; analyzing participant availability to suggest optimal meeting times using AI.</>,
            <><B>Notifications</B> &mdash; sending in-app and email notifications about event updates, invitations, and finalized times.</>,
            <><B>Calendar integration</B> &mdash; creating finalized events directly on participants' Google Calendars.</>,
            <><B>Service improvement</B> &mdash; understanding aggregate usage patterns to improve the scheduling experience (no individual profiling).</>
          ]}
        />

        {/* ── 4. Data Processing & Third-Party Services ────────── */}
        <SectionHeading id="third-party-services">
          4. Data Processing &amp; Third-Party Services
        </SectionHeading>
        <P>
          Your data is processed by the following third-party service providers.
          Each provider acts as a <B>Data Processor</B> under applicable data
          protection laws, processing your data only on our instructions and
          subject to appropriate contractual safeguards.
        </P>

        <Heading
          as="h3"
          fontSize="lg"
          fontWeight="600"
          color={colors.textHeading}
          mt={6}
          mb={3}
        >
          4.1 Supabase (Database &amp; Authentication)
        </Heading>
        <P>
          Supabase provides our authentication layer (including Google OAuth
          integration) and PostgreSQL database. Supabase acts as a Data
          Processor under its{" "}
          <Link
            href="https://supabase.com/legal/dpa"
            color={colors.primary}
            isExternal
          >
            Data Processing Addendum (DPA)
          </Link>
          , which complies with the GDPR, Swiss Data Protection Laws, and US
          Data Protection Laws. Supabase maintains <B>SOC 2 Type 2</B>{" "}
          compliance with annual third-party assessments covering security,
          availability, processing integrity, confidentiality, and privacy.
        </P>

        <Heading
          as="h3"
          fontSize="lg"
          fontWeight="600"
          color={colors.textHeading}
          mt={6}
          mb={3}
        >
          4.2 Render (Application Hosting)
        </Heading>
        <P>
          Our frontend and backend application services are hosted on{" "}
          <Link
            href="https://render.com/security"
            color={colors.primary}
            isExternal
          >
            Render.com
          </Link>
          . Render maintains <B>SOC 2 Type 2</B> and{" "}
          <B>ISO 27001 (ISO/IEC 27001:2022)</B> certifications and is
          GDPR-compliant with a Data Processing Agreement available to all
          customers. Render is certified under the <B>EU-US Data Privacy
          Framework</B>, including the UK extension and Swiss-US Data Privacy
          Framework.
        </P>

        <Heading
          as="h3"
          fontSize="lg"
          fontWeight="600"
          color={colors.textHeading}
          mt={6}
          mb={3}
        >
          4.3 Google (Calendar API &amp; OAuth 2.0)
        </Heading>
        <P>
          We use Google's OAuth 2.0 for authentication and the Google Calendar
          API to read availability and create calendar events. Your interaction
          with Google's services is additionally governed by{" "}
          <Link
            href="https://policies.google.com/privacy"
            color={colors.primary}
            isExternal
          >
            Google's Privacy Policy
          </Link>
          . We comply with{" "}
          <Link
            href="https://developers.google.com/terms/api-services-user-data-policy"
            color={colors.primary}
            isExternal
          >
            Google API Services User Data Policy
          </Link>
          , including the Limited Use requirements.
        </P>

        <Heading
          as="h3"
          fontSize="lg"
          fontWeight="600"
          color={colors.textHeading}
          mt={6}
          mb={3}
        >
          4.4 Sharing and Disclosure of Google User Data
        </Heading>
        <P>
          We do not share, transfer, or disclose your Google user data (including 
          calendar events or availability) to any third parties, except in the 
          following limited circumstances:
        </P>
        <BulletList
          items={[
            <>
              <B>Service Provision:</B> We transfer data to our service providers 
              (Supabase and Render) solely to host our database and application as 
              described in Sections 4.1 and 4.2. These providers are contractually 
              obligated to keep your data confidential and secure.
            </>,
            <>
              <B>User-Directed Sharing:</B> We share event details (such as your 
              busy/free status) with other participants of a specific "When" event 
              only as explicitly directed by your use of the Service for coordination.
            </>,
            <>
              <B>Legal Requirements:</B> We may disclose data if required to do so by 
              law or in response to valid requests by public authorities.
            </>,
            <>
              <B>No Sale of Data:</B> We strictly do not sell your Google user data 
              to any third parties, including advertisers or data brokers.
            </>
          ]}
        />

        {/* ── 5. Data Security ────────────────────────────────── */}
        <SectionHeading id="data-security">5. Data Security</SectionHeading>
        <P>
          We implement industry-standard security measures to protect your data
          at every layer of the stack:
        </P>
        <BulletList
          items={[
            <><B>Encryption in transit</B> &mdash; All connections to When are encrypted via TLS/SSL, enforced automatically by Render for all hosted services.</>,
            <><B>Encryption at rest</B> &mdash; Your database is hosted on Supabase's managed PostgreSQL infrastructure, which encrypts data at rest using AES-256.</>,
            <><B>Row-Level Security (RLS)</B> &mdash; Supabase enforces row-level security policies on all database tables, ensuring users can only access data they are authorized to view.</>,
            <><B>Authentication tokens</B> &mdash; We use short-lived JWT tokens for session management. Tokens are verified on every API request and are never stored in plain text.</>,
            <><B>Compliance certifications</B> &mdash; Our infrastructure providers maintain SOC 2 Type 2, ISO 27001, and GDPR compliance (see Section 4).</>
          ]}
        />
        <P>
          While no system can guarantee absolute security, we are committed to
          applying and maintaining best practices to protect your information.
        </P>

        {/* ── 6. Data Retention ───────────────────────────────── */}
        <SectionHeading id="data-retention">6. Data Retention</SectionHeading>
        <P>
          We retain your personal data only for as long as necessary to provide
          the Service:
        </P>
        <BulletList
          items={[
            <><B>Account data</B> (name, email) is retained for the lifetime of your account.</>,
            <><B>Event data</B> is retained until the event is deleted by the coordinator or your account is deleted.</>,
            <><B>Calendar busy-slot data</B> is cached temporarily and refreshed via differential sync. Cached slots are purged when they are no longer within an active event's date range.</>,
            <><B>AI-generated time proposals</B> are cached for performance and regenerated when underlying data changes. They are deleted when the associated event is finalized or deleted.</>
          ]}
        />
        <P>
          When you delete your account, all personal data associated with it is
          permanently removed from our systems within 30 days, except where
          retention is required by law.
        </P>

        {/* ── 7. Your Rights ──────────────────────────────────── */}
        <SectionHeading id="your-rights">7. Your Rights</SectionHeading>
        <P>
          Depending on your jurisdiction, you may have the following rights under
          applicable data protection laws (including the GDPR and CCPA):
        </P>
        <BulletList
          items={[
            <><B>Access</B> &mdash; Request a copy of the personal data we hold about you.</>,
            <><B>Rectification</B> &mdash; Request correction of inaccurate personal data.</>,
            <><B>Erasure</B> &mdash; Request deletion of your personal data (see Section 8).</>,
            <><B>Data portability</B> &mdash; Request a machine-readable export of your data.</>,
            <><B>Restriction</B> &mdash; Request that we limit processing of your personal data.</>,
            <><B>Objection</B> &mdash; Object to the processing of your personal data.</>,
            <><B>Withdraw consent</B> &mdash; Revoke consent at any time where processing is based on consent (e.g., calendar access).</>
          ]}
        />
        <P>
          To exercise any of these rights, contact us at{" "}
          <Link href={`mailto:${CONTACT_EMAIL}`} color={colors.primary}>
            {CONTACT_EMAIL}
          </Link>
          . We will respond to your request within 30 days.
        </P>

        {/* ── 8. Account & Data Deletion ──────────────────────── */}
        <SectionHeading id="account-deletion">
          8. Account &amp; Data Deletion
        </SectionHeading>
        <P>
          You can request complete deletion of your account and all associated
          data through either of the following methods:
        </P>
        <BulletList
          items={[
            <><B>In-app</B> &mdash; Navigate to <B>Settings</B> in the When app and select "<B>Delete Account</B>." This will immediately initiate account deletion and permanent removal of all your data.</>,
            <><B>Email</B> &mdash; Send a request to{" "}
              <Link href={`mailto:${CONTACT_EMAIL}`} color={colors.primary}>
                {CONTACT_EMAIL}
              </Link>{" "}
              from the email address associated with your account. We will process
              your request within 30 days.</>
          ]}
        />
        <P>
          Upon deletion, we remove your profile, event participation records,
          preferred time slots, calendar cache data, and notification history. If
          you are the coordinator of an event, that event will be transferred to
          a remaining participant or deleted entirely.
        </P>
        <P>
          You may also revoke When's access to your Google account at any time
          through your{" "}
          <Link
            href="https://myaccount.google.com/permissions"
            color={colors.primary}
            isExternal
          >
            Google Account permissions
          </Link>{" "}
          page.
        </P>

        {/* ── 9. Cookies & Local Storage ──────────────────────── */}
        <SectionHeading id="cookies">
          9. Cookies &amp; Local Storage
        </SectionHeading>
        <P>
          When uses only <B>essential, first-party cookies</B> and browser local
          storage to maintain your authentication session. We do not use
          advertising cookies, third-party tracking cookies, or secondary
          analytics cookies.
        </P>
        <BulletList
          items={[
            <><B>Authentication session</B> &mdash; A secure, HTTP-only cookie or local storage entry manages your signed-in state via Supabase Auth.</>,
            <><B>No third-party trackers</B> &mdash; We do not embed any third-party tracking scripts, pixels, or analytics services that track individual users.</>
          ]}
        />

        {/* ── 10. Children's Privacy ──────────────────────────── */}
        <SectionHeading id="childrens-privacy">
          10. Children's Privacy
        </SectionHeading>
        <P>
          The Service is not directed to individuals under the age of 16. We do
          not knowingly collect personal data from children. If you become aware
          that a child has provided us with personal data, please contact us at{" "}
          <Link href={`mailto:${CONTACT_EMAIL}`} color={colors.primary}>
            {CONTACT_EMAIL}
          </Link>{" "}
          and we will promptly delete such information.
        </P>

        {/* ── 11. Changes to This Policy ──────────────────────── */}
        <SectionHeading id="changes">
          11. Changes to This Policy
        </SectionHeading>
        <P>
          We may update this Privacy Policy from time to time. When we make
          material changes, we will notify you by updating the "Effective date"
          at the top of this page and, where appropriate, through an in-app
          notification. Your continued use of the Service after such changes
          constitutes acceptance of the updated policy.
        </P>

        {/* ── 12. Contact Us ──────────────────────────────────── */}
        <SectionHeading id="contact">12. Contact Us</SectionHeading>
        <P>
          If you have any questions about this Privacy Policy, your data, or
          your rights, please contact us:
        </P>
        <BulletList
          items={[
            <><B>Email:</B>{" "}
              <Link href={`mailto:${CONTACT_EMAIL}`} color={colors.primary}>
                {CONTACT_EMAIL}
              </Link></>,
            <><B>Website:</B>{" "}
              <Link href={SITE_URL} color={colors.primary} isExternal>
                {SITE_URL}
              </Link></>
          ]}
        />

        <Divider borderColor={colors.borderSubtle} my={10} />

        {/* Footer note */}
        <Text fontSize="sm" color={colors.textMuted} textAlign="center" pb={8}>
          &copy; {new Date().getFullYear()} When. All rights reserved.
        </Text>
      </Container>
    </Box>
  );
};

export default PrivacyPolicy;
