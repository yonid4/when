import React from "react";
import { Card, CardBody, CardHeader, Heading, Text, VStack } from "@chakra-ui/react";

/**
 * FormCard - Styled card container for form sections
 *
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {string} props.subtitle - Optional subtitle/description
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.bg - Background color
 * @param {Object} props.cardProps - Additional props for Card component
 */
const FormCard = ({ title, subtitle, children, bg = "white", ...cardProps }) => {
  return (
    <Card
      bg={bg}
      borderRadius="xl"
      border="1px solid"
      borderColor="gray.200"
      shadow="sm"
      {...cardProps}
    >
      {(title || subtitle) && (
        <CardHeader pb={subtitle ? 2 : 4}>
          <VStack align="start" spacing={1}>
            {title && (
              <Heading size="md" color="gray.800">
                {title}
              </Heading>
            )}
            {subtitle && (
              <Text fontSize="sm" color="gray.600">
                {subtitle}
              </Text>
            )}
          </VStack>
        </CardHeader>
      )}
      <CardBody pt={title || subtitle ? 0 : 4}>{children}</CardBody>
    </Card>
  );
};

export default FormCard;
