import { Box, Spinner } from "@chakra-ui/react";

function RouteLoadingFallback() {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minH="60vh"
      bg="gray.50"
    >
      <Spinner size="xl" color="purple.500" thickness="4px" />
    </Box>
  );
}

export default RouteLoadingFallback;
