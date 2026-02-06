import { Card, CardBody, CardHeader, Heading, Text, VStack } from "@chakra-ui/react";

function FormCard({ title, subtitle, children, bg = "white", ...cardProps }) {
  const hasHeader = title || subtitle;
  const headerPaddingBottom = subtitle ? 2 : 4;
  const bodyPaddingTop = hasHeader ? 0 : 4;

  return (
    <Card
      bg={bg}
      borderRadius="xl"
      border="1px solid"
      borderColor="gray.200"
      shadow="sm"
      {...cardProps}
    >
      {hasHeader && (
        <CardHeader pb={headerPaddingBottom}>
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
      <CardBody pt={bodyPaddingTop}>{children}</CardBody>
    </Card>
  );
}

export default FormCard;
