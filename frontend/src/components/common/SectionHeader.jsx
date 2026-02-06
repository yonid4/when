import { Badge, HStack, Text } from "@chakra-ui/react";

function SectionHeader({ title, count, colorScheme = "gray", mb = 4 }) {
  const showBadge = count !== undefined;

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
      {showBadge && (
        <Badge colorScheme={colorScheme} borderRadius="full" fontSize="xs" px={2}>
          {count}
        </Badge>
      )}
    </HStack>
  );
}

export default SectionHeader;
