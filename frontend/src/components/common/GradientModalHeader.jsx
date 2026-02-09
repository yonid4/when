import { Box, Icon, ModalCloseButton, ModalHeader } from "@chakra-ui/react";

function GradientModalHeader({
  title,
  icon,
  bg = "brand.600",
  gradient,
  showCloseButton = true,
  onClose
}) {
  const bgProps = gradient ? { bgGradient: gradient } : { bg };

  return (
    <Box {...bgProps} position="relative" overflow="hidden">
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
