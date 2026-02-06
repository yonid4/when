import { Box, HStack, Text } from "@chakra-ui/react";

import { shadows } from "../../styles/designSystem";

function InfoCard({
  title,
  children,
  headerRight,
  bg = "white",
  p = 4,
  ...boxProps
}) {
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
}

export default InfoCard;
