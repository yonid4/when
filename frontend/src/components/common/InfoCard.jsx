import React from "react";
import { Box, VStack, HStack, Text, Icon} from "@chakra-ui/react";
import { shadows } from "../../styles/designSystem";

/**
 * InfoCard - Compact info display card for sidebars
 *
 * @param {Object} props
 * @param {string} props.title - Section title (uppercase label)
 * @param {React.ReactNode} props.children - Card content
 * @param {React.ReactNode} props.headerRight - Optional content for header right side
 * @param {string} props.bg - Background color
 * @param {number} props.p - Padding
 */
const InfoCard = ({
  title,
  children,
  headerRight,
  bg = "white",
  p = 4,
  ...boxProps
}) => {
  return (
    <Box
      borderWidth="1px"
      borderRadius="xl"
      p={p}
      bg={bg}
      shadow={shadows.card}
      {...boxProps}
    >
      {title && (
        <HStack justify="space-between" mb={3}>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            textTransform="uppercase"
            letterSpacing="0.5px"
            color="gray.500"
          >
            {title}
          </Text>
          {headerRight}
        </HStack>
      )}
      {children}
    </Box>
  );
};

export default InfoCard;
