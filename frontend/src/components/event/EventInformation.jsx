import React, { useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Flex,
  useColorModeValue,
  useToast
} from "@chakra-ui/react";
import { CalendarIcon, TimeIcon, ExternalLinkIcon, CopyIcon } from "@chakra-ui/icons";

const PRIMARY_COLOR = "#5E5653";

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.cssText = "position:fixed;left:-999999px;top:-999999px;opacity:0";
  textArea.setAttribute("readonly", "");
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  textArea.setSelectionRange(0, 99999);

  const successful = document.execCommand("copy");
  document.body.removeChild(textArea);
  return successful;
}

const EventInformation = ({
  eventName = "",
  dateRange = "Oct 6, 2025 - Oct 23, 2025",
  timeWindow = "09:00:00 - 17:00:00",
  duration = "60 minutes",
  onShareEvent
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue(PRIMARY_COLOR, "gray.600");
  const textColor = useColorModeValue("gray.600", "gray.300");

  const handleShareEvent = async () => {
    if (onShareEvent) {
      onShareEvent();
      return;
    }

    const success = await copyToClipboard(window.location.href);

    if (success) {
      setIsCopied(true);
      toast({
        title: "Event link copied!",
        description: "The event link has been copied to your clipboard.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setTimeout(() => setIsCopied(false), 2000);
    } else {
      toast({
        title: "Copy failed",
        description: "Unable to copy the link. Please try selecting and copying manually.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      bg={cardBg}
      borderRadius="12px"
      p={6}
      boxShadow="0 2px 8px rgba(0,0,0,0.07)"
      border="2px solid"
      borderColor={borderColor}
      w="100%"
      h="100%"
      display="flex"
      flexDirection="column"
    >
      <Flex justify="space-between" align="flex-start" mb={5}>
        <Text fontSize="24px" fontWeight="700" color={PRIMARY_COLOR} lineHeight="1.2">
          {eventName}
        </Text>
        <Button
          leftIcon={isCopied ? <CopyIcon /> : <ExternalLinkIcon />}
          size="sm"
          variant="outline"
          borderColor={isCopied ? "green.300" : "gray.300"}
          color={isCopied ? "green.600" : PRIMARY_COLOR}
          bg={isCopied ? "green.50" : "white"}
          _hover={{
            bg: isCopied ? "green.100" : "gray.50",
            borderColor: isCopied ? "green.400" : "gray.400"
          }}
          onClick={handleShareEvent}
        >
          {isCopied ? "Copied!" : "Share Event"}
        </Button>
      </Flex>

      <VStack spacing={4} align="stretch" flex="1">
        <HStack spacing={3} align="flex-start">
          <Icon as={CalendarIcon} w={4} h={4} color={PRIMARY_COLOR} mt={0.5} />
          <VStack spacing={1} align="flex-start" flex="1">
            <Text fontSize="sm" fontWeight="600" color={PRIMARY_COLOR}>
              Date Range
            </Text>
            <Text fontSize="sm" color={textColor}>{dateRange}</Text>
          </VStack>
        </HStack>

        <HStack spacing={3} align="flex-start">
          <Icon as={TimeIcon} w={4} h={4} color={PRIMARY_COLOR} mt={0.5} />
          <VStack spacing={1} align="flex-start" flex="1">
            <Text fontSize="sm" fontWeight="600" color={PRIMARY_COLOR}>
              Time Window
            </Text>
            <Text fontSize="sm" color={textColor}>{timeWindow}</Text>
          </VStack>
        </HStack>

        <Text fontSize="sm" color={textColor}>
          Duration: {duration}
        </Text>
      </VStack>
    </Box>
  );
};

export default EventInformation;
