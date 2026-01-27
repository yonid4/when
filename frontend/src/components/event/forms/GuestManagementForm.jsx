import React from "react";
import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Card,
  CardBody,
  Text,
  Icon,
  IconButton,
  Avatar,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagCloseButton,
  Switch,
  Divider,
  Spinner
} from "@chakra-ui/react";
import { FiSearch, FiPlus, FiUsers } from "react-icons/fi";

/**
 * GuestManagementForm - Third step of event creation
 * Handles guest search, list management, and permissions
 *
 * @param {Object} props
 * @param {Object} props.formData - Form data containing guests and permissions
 * @param {Function} props.onChange - Handler for input changes
 * @param {string} props.guestSearchQuery - Current search query
 * @param {Function} props.onSearchQueryChange - Handler for search query changes
 * @param {Function} props.onSearch - Handler to trigger search
 * @param {Array} props.searchResults - Search results to display
 * @param {boolean} props.isSearching - Loading state for search
 * @param {Function} props.onAddGuest - Handler to add a guest
 * @param {Function} props.onRemoveGuest - Handler to remove a guest
 */
const GuestManagementForm = ({
  formData,
  onChange,
  guestSearchQuery,
  onSearchQueryChange,
  onSearch,
  searchResults,
  isSearching,
  onAddGuest,
  onRemoveGuest
}) => {
  const handleInputChange = (field, value) => {
    onChange(field, value);
  };

  return (
    <VStack spacing={6} align="stretch">
      <FormControl>
        <FormLabel fontSize="lg" fontWeight="bold">
          Add Guests
        </FormLabel>
        <HStack mb={3}>
          <Input
            placeholder="Search by email..."
            value={guestSearchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
          <IconButton
            icon={isSearching ? <Spinner size="sm" /> : <FiSearch />}
            onClick={onSearch}
            aria-label="Search users"
          />
        </HStack>
        {searchResults.length > 0 && (
          <Card variant="outline" maxH="200px" overflowY="auto" mb={3}>
            <CardBody p={2}>
              <VStack align="stretch" spacing={1}>
                {searchResults.map((user) => (
                  <HStack
                    key={user.id}
                    p={2}
                    cursor="pointer"
                    _hover={{ bg: "gray.50" }}
                    borderRadius="md"
                    onClick={() => onAddGuest(user)}
                  >
                    <Avatar size="sm" name={user.full_name} src={user.avatar_url} />
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontSize="sm" fontWeight="medium">
                        {user.full_name || "User"}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {user.email_address}
                      </Text>
                    </VStack>
                    <Icon as={FiPlus} color="gray.400" />
                  </HStack>
                ))}
              </VStack>
            </CardBody>
          </Card>
        )}
      </FormControl>

      <FormControl>
        <FormLabel fontSize="lg" fontWeight="bold">
          Invited Guests ({formData.guests.length})
        </FormLabel>
        {formData.guests.length > 0 ? (
          <Wrap spacing={2}>
            {formData.guests.map((guest) => (
              <WrapItem key={guest.id}>
                <Tag size="lg" colorScheme="blue" borderRadius="full">
                  <Avatar
                    size="xs"
                    name={guest.name}
                    src={guest.avatar}
                    ml={-2}
                    mr={2}
                  />
                  <TagLabel>
                    {guest.name || guest.full_name || guest.email}
                  </TagLabel>
                  <TagCloseButton onClick={() => onRemoveGuest(guest.id)} />
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        ) : (
          <Card variant="outline">
            <CardBody textAlign="center" py={8}>
              <Icon as={FiUsers} boxSize={12} color="gray.300" mb={2} />
              <Text color="gray.500">No guests added yet</Text>
              <Text fontSize="sm" color="gray.400">
                Search above to add people to this event
              </Text>
            </CardBody>
          </Card>
        )}
      </FormControl>

      <Divider />

      <FormControl>
        <FormLabel fontSize="lg" fontWeight="bold">
          Guest Permissions
        </FormLabel>
        <VStack align="stretch" spacing={3}>
          <HStack justify="space-between">
            <VStack align="start" spacing={0}>
              <Text fontWeight="medium">Allow guests to invite others</Text>
              <Text fontSize="sm" color="gray.600">
                Guests can add more people to the event
              </Text>
            </VStack>
            <Switch
              isChecked={formData.guestPermissions.canInviteOthers}
              onChange={(e) =>
                handleInputChange("guestPermissions", {
                  ...formData.guestPermissions,
                  canInviteOthers: e.target.checked
                })
              }
              colorScheme="purple"
            />
          </HStack>
          <HStack justify="space-between">
            <VStack align="start" spacing={0}>
              <Text fontWeight="medium">Show guest list</Text>
              <Text fontSize="sm" color="gray.600">
                All guests can see who else is invited
              </Text>
            </VStack>
            <Switch
              isChecked={formData.guestPermissions.canSeeGuestList}
              onChange={(e) =>
                handleInputChange("guestPermissions", {
                  ...formData.guestPermissions,
                  canSeeGuestList: e.target.checked
                })
              }
              colorScheme="purple"
            />
          </HStack>
        </VStack>
      </FormControl>
    </VStack>
  );
};

export default GuestManagementForm;
