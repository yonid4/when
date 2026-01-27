import React from "react";
import { HStack, Text, Badge } from "@chakra-ui/react";

/**
 * SectionHeader - Consistent section header with optional count badge
 *
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {number} props.count - Optional count to display in badge
 * @param {string} props.colorScheme - Badge color scheme
 * @param {number} props.mb - Margin bottom
 */
const SectionHeader = ({ title, count, colorScheme = "gray", mb = 4 }) => {
  return (
    <HStack mb={mb} spacing={2}>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        textTransform="uppercase"
        letterSpacing="0.5px"
        color="gray.600"
      >
        {title}
      </Text>
      {count !== undefined && (
        <Badge colorScheme={colorScheme} borderRadius="full" fontSize="xs" px={2}>
          {count}
        </Badge>
      )}
    </HStack>
  );
};

export default SectionHeader;
