import { Box, Icon, ModalCloseButton, ModalHeader } from "@chakra-ui/react";

const DEFAULT_GRADIENT = "linear(to-r, purple.600, blue.500)";
const BACKGROUND_PATTERN = "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)";

function GradientModalHeader({
  title,
  icon,
  gradient = DEFAULT_GRADIENT,
  showCloseButton = true,
  onClose
}) {
  return (
    <Box bgGradient={gradient} position="relative" overflow="hidden">
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.1}
        bgImage={BACKGROUND_PATTERN}
      />
      <ModalHeader color="white" position="relative" py={6}>
        {icon && <Icon as={icon} mr={2} />}
        {title}
      </ModalHeader>
      {showCloseButton && (
        <ModalCloseButton
          color="white"
          _hover={{ bg: "whiteAlpha.200" }}
          onClick={onClose}
        />
      )}
    </Box>
  );
}

export default GradientModalHeader;
