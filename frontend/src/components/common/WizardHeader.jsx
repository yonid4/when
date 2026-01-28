import React from "react";
import { Flex, Heading, IconButton, Button, Box } from "@chakra-ui/react";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import { shadows } from "../../styles/designSystem";

/**
 * WizardHeader - Minimal header for wizard/multi-step forms
 *
 * @param {Object} props
 * @param {string} props.title - Title to display
 * @param {Function} props.onBack - Handler for back arrow click
 * @param {Function} props.onSaveDraft - Handler for save draft button
 * @param {boolean} props.showSaveDraft - Whether to show save draft button
 */
const WizardHeader = ({
  title = "Create Event",
  onBack,
  onSaveDraft,
  showSaveDraft = true
}) => {
  return (
    <Box
      bg="white"
      borderBottom="1px solid"
      borderColor="gray.200"
      boxShadow={shadows.sm}
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Flex
        maxW="600px"
        mx="auto"
        px={{ base: 4, md: 0 }}
        py={4}
        justify="space-between"
        align="center"
      >
        <Flex align="center" gap={3}>
          <IconButton
            icon={<FiArrowLeft />}
            variant="ghost"
            aria-label="Go back"
            onClick={onBack}
            size="md"
            color="gray.600"
            _hover={{ bg: "gray.100" }}
          />
          <Heading size="md" color="gray.800">
            {title}
          </Heading>
        </Flex>

        {showSaveDraft && onSaveDraft && (
          <Button
            leftIcon={<FiSave />}
            variant="ghost"
            size="sm"
            color="gray.600"
            onClick={onSaveDraft}
            _hover={{ bg: "gray.100" }}
          >
            Save Draft
          </Button>
        )}
      </Flex>
    </Box>
  );
};

export default WizardHeader;
