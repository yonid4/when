import { Box, Button, Flex, Heading, IconButton } from "@chakra-ui/react";
import { FiArrowLeft, FiSave } from "react-icons/fi";

import { shadows } from "../../styles/designSystem";

const GHOST_HOVER_STYLE = { bg: "gray.100" };

function WizardHeader({
  title = "Create Event",
  onBack,
  onSaveDraft,
  showSaveDraft = true
}) {
  const canShowSaveDraft = showSaveDraft && onSaveDraft;

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
            _hover={GHOST_HOVER_STYLE}
          />
          <Heading size="md" color="gray.800">
            {title}
          </Heading>
        </Flex>

        {canShowSaveDraft && (
          <Button
            leftIcon={<FiSave />}
            variant="ghost"
            size="sm"
            color="gray.600"
            onClick={onSaveDraft}
            _hover={GHOST_HOVER_STYLE}
          >
            Save Draft
          </Button>
        )}
      </Flex>
    </Box>
  );
}

export default WizardHeader;
