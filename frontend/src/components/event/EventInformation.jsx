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

const EventInformation = ({ 
  eventName = "", 
  dateRange = "Oct 6, 2025 - Oct 23, 2025",
  timeWindow = "09:00:00 - 17:00:00",
  duration = "60 minutes",
  onShareEvent 
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const toast = useToast();

  const copyToClipboard = async (text) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers or non-HTTPS
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        textArea.style.opacity = "0";
        textArea.setAttribute("readonly", "");
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        textArea.setSelectionRange(0, 99999); // For mobile devices
        
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        return successful;
      }
    } catch (err) {
      console.error("Failed to copy text: ", err);
      return false;
    }
  };

  const handleShareEvent = async () => {
    if (onShareEvent) {
      console.log("[DEBUG] Using custom onShareEvent handler");
      onShareEvent();
    } else {
      const url = window.location.href;
      console.log("[DEBUG] Copying URL to clipboard:", url);
      const success = await copyToClipboard(url);
      
      if (success) {
        console.log("[DEBUG] Successfully copied to clipboard");
        setIsCopied(true);
        toast({
          title: "Event link copied!",
          description: "The event link has been copied to your clipboard.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        
        // Reset the copied state after 2 seconds
        setTimeout(() => setIsCopied(false), 2000);
      } else {
        console.log("[DEBUG] Failed to copy to clipboard");
        toast({
          title: "Copy failed",
          description: "Unable to copy the link. Please try selecting and copying manually.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  // Use website's color scheme
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("#2B2B2B", "gray.600");
  const primaryColor = "#2B2B2B";
  const textColor = useColorModeValue("gray.600", "gray.300");

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
      {/* Header Section */}
      <Flex justify="space-between" align="flex-start" mb={5}>
        <Text
          fontSize="24px"
          fontWeight="700"
          color={primaryColor}
          lineHeight="1.2"
        >
          {eventName}
        </Text>
        <Button
          leftIcon={isCopied ? <CopyIcon /> : <ExternalLinkIcon />}
          size="sm"
          variant="outline"
          borderColor={isCopied ? "green.300" : "gray.300"}
          color={isCopied ? "green.600" : primaryColor}
          bg={isCopied ? "green.50" : "white"}
          _hover={{
            bg: isCopied ? "green.100" : "gray.50",
            borderColor: isCopied ? "green.400" : "gray.400"
          }}
          onClick={handleShareEvent}
          isLoading={false}
        >
          {isCopied ? "Copied!" : "Share Event"}
        </Button>
      </Flex>

      {/* Main Content Section */}
      <VStack spacing={4} align="stretch" flex="1">
        {/* Date Range */}
        <HStack spacing={3} align="flex-start">
          <Icon as={CalendarIcon} w={4} h={4} color={primaryColor} mt={0.5} />
          <VStack spacing={1} align="flex-start" flex="1">
            <Text fontSize="sm" fontWeight="600" color={primaryColor}>
              Date Range
            </Text>
            <Text fontSize="sm" color={textColor}>
              {dateRange}
            </Text>
          </VStack>
        </HStack>

        {/* Time Window */}
        <HStack spacing={3} align="flex-start">
          <Icon as={TimeIcon} w={4} h={4} color={primaryColor} mt={0.5} />
          <VStack spacing={1} align="flex-start" flex="1">
            <Text fontSize="sm" fontWeight="600" color={primaryColor}>
              Time Window
            </Text>
            <Text fontSize="sm" color={textColor}>
              {timeWindow}
            </Text>
          </VStack>
        </HStack>

        {/* Duration */}
        <Box>
          <Text fontSize="sm" color={textColor}>
            Duration: {duration}
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default EventInformation;
