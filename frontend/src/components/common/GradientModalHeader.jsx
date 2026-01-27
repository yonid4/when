import React from "react";
import { Box, ModalHeader, ModalCloseButton, Icon } from "@chakra-ui/react";

/**
 * GradientModalHeader - Styled modal header with gradient background
 *
 * @param {Object} props
 * @param {string} props.title - Header title
 * @param {React.ComponentType} props.icon - Optional icon component
 * @param {string} props.gradient - Gradient string (default: purple to blue)
 * @param {boolean} props.showCloseButton - Whether to show close button
 * @param {Function} props.onClose - Close handler for the button
 */
const GradientModalHeader = ({
  title,
  icon,
  gradient = "linear(to-r, purple.600, blue.500)",
  showCloseButton = true,
  onClose
}) => {
  return (
    <Box bgGradient={gradient} position="relative" overflow="hidden">
      {/* Background Pattern */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.1}
        bgImage="radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)"
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
};

export default GradientModalHeader;
