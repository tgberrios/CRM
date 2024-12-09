// NotificationModal.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Box,
  HStack,
  Text,
  Badge,
  Icon,
  VStack,
  Button,
  Input,
  useColorModeValue,
  Spinner,
  useToast,
  Flex,
  IconButton,
} from "@chakra-ui/react";
import {
  MdUpdate,
  MdMarkEmailRead,
  MdSearch,
  MdArrowBack,
  MdArrowForward,
  MdDelete,
} from "react-icons/md";
import sanitizeHtml from "sanitize-html";

const NotificationModal = ({ isOpen, onClose, updates, isLoading }) => {
  const [unreadUpdates, setUnreadUpdates] = useState([]);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const updatesPerPage = 5;
  const toast = useToast();

  const bg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");

  useEffect(() => {
    const storedReadUpdates =
      JSON.parse(localStorage.getItem("readUpdates")) || [];
    const newUnreadUpdates = updates.filter(
      (update) => !storedReadUpdates.includes(update.id)
    );
    setUnreadUpdates(newUnreadUpdates);
    setCurrentPage(1); // Reset to first page when updates change
    setSelectedUpdate(null); // Reset selected update when updates change
  }, [updates]);

  const handleUpdateClick = useCallback(
    (update) => {
      const storedReadUpdates =
        JSON.parse(localStorage.getItem("readUpdates")) || [];
      const updatedReadUpdates = [...storedReadUpdates, update.id];
      localStorage.setItem("readUpdates", JSON.stringify(updatedReadUpdates));

      setUnreadUpdates((prev) => prev.filter((u) => u.id !== update.id));
      setSelectedUpdate(update);

      toast({
        title: "Update Read",
        description: `"${update.title}" has been marked as read.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    },
    [toast]
  );

  const handleDeleteUpdate = useCallback(
    (id) => {
      // Implement the delete functionality here
      // For example, you might call an API to delete the update
      // After successful deletion, remove it from the state

      // Mock deletion for demonstration purposes
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this update?"
      );
      if (confirmDelete) {
        // Simulate API call delay
        setTimeout(() => {
          // Remove the update from the updates array
          const updatedUpdates = updates.filter((u) => u.id !== id);
          localStorage.setItem("readUpdates", JSON.stringify([])); // Reset read updates
          setUnreadUpdates(updatedUpdates);
          setSelectedUpdate(null);

          toast({
            title: "Update Deleted",
            description: "The update has been successfully deleted.",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        }, 1000);
      }
    },
    [updates, toast]
  );

  const stripHtmlTags = useCallback((html) => {
    return sanitizeHtml(html, {
      allowedTags: [],
      allowedAttributes: {},
    });
  }, []);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    const storedReadUpdates =
      JSON.parse(localStorage.getItem("readUpdates")) || [];
    const allUpdateIds = updates.map((update) => update.id);
    const updatedReadUpdates = Array.from(
      new Set([...storedReadUpdates, ...allUpdateIds])
    );
    localStorage.setItem("readUpdates", JSON.stringify(updatedReadUpdates));
    setUnreadUpdates([]);
    setSelectedUpdate(null); // Reset selected update when marking all as read

    toast({
      title: "All Updates Read",
      description: "All updates have been marked as read.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });

    onClose();
  }, [updates, toast, onClose]);

  const filteredUpdates = useMemo(() => {
    return unreadUpdates.filter((update) =>
      update.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [unreadUpdates, searchQuery]);

  // Pagination logic
  const totalPages = useMemo(() => {
    return Math.ceil(filteredUpdates.length / updatesPerPage);
  }, [filteredUpdates.length]);

  const currentUpdates = useMemo(() => {
    const start = (currentPage - 1) * updatesPerPage;
    return filteredUpdates.slice(start, start + updatesPerPage);
  }, [filteredUpdates, currentPage, updatesPerPage]);

  const handlePageChange = useCallback(
    (direction) => {
      setCurrentPage((prev) => {
        if (direction === "prev") return Math.max(prev - 1, 1);
        if (direction === "next") return Math.min(prev + 1, totalPages);
        return prev;
      });
    },
    [totalPages]
  );

  // Conditional rendering: Render modal only if it's open and there are unread updates or a selected update
  if (!isOpen || (unreadUpdates.length === 0 && !selectedUpdate)) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setSelectedUpdate(null); // Reset selected update when closing modal
        onClose();
      }}
      size="xl" // Increased size for wider modal
      isCentered
      motionPreset="slideInBottom"
    >
      <ModalOverlay />
      <ModalContent bg={bg} color={textColor} maxWidth="800px">
        <ModalHeader>
          <Text fontSize="lg" fontWeight="bold">
            {selectedUpdate ? selectedUpdate.title : "New Updates"}
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="start" spacing={4}>
            {!selectedUpdate ? (
              <>
                <HStack w="100%" spacing={3}>
                  <HStack
                    flex="1"
                    bg={useColorModeValue("gray.100", "gray.700")}
                    borderRadius="md"
                    px={2}
                  >
                    <Icon as={MdSearch} color="gray.500" />
                    <Input
                      placeholder="Search updates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      variant="unstyled"
                      size="sm"
                      flex="1"
                      _placeholder={{ color: "gray.500" }}
                    />
                  </HStack>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={markAllAsRead}
                    leftIcon={<MdMarkEmailRead />}
                    aria-label="Mark all as read"
                  >
                    Mark All as Read
                  </Button>
                </HStack>

                {isLoading ? (
                  <VStack spacing={4} w="100%">
                    {[...Array(3)].map((_, index) => (
                      <Box
                        key={index}
                        p={4}
                        bg={useColorModeValue("gray.50", "gray.700")}
                        borderRadius="md"
                        w="100%"
                      >
                        <HStack mb={2}>
                          <Skeleton circle height="40px" width="40px" />
                          <VStack align="start" spacing={1} flex="1">
                            <Skeleton height="16px" width="60%" />
                            <Skeleton height="12px" width="40%" />
                          </VStack>
                          <Skeleton height="20px" width="80px" />
                        </HStack>
                        <Skeleton height="14px" width="90%" />
                      </Box>
                    ))}
                  </VStack>
                ) : currentUpdates.length > 0 ? (
                  currentUpdates.map((update) => (
                    <Box
                      key={update.id}
                      p={4}
                      bg={useColorModeValue("gray.50", "gray.700")}
                      borderRadius="md"
                      w="100%"
                      cursor="pointer"
                      onClick={() => handleUpdateClick(update)}
                      _hover={{
                        bg: useColorModeValue("gray.100", "gray.600"),
                      }}
                    >
                      <HStack>
                        <Icon as={MdUpdate} w={5} h={5} color="blue.500" />
                        <Text fontWeight="medium" flex="1">
                          {update.title}
                        </Text>
                        <Badge colorScheme="blue" variant="subtle">
                          {update.type}
                        </Badge>
                      </HStack>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        {formatDate(update.date)}
                      </Text>
                    </Box>
                  ))
                ) : (
                  <Text color="gray.500" textAlign="center" w="100%">
                    No updates found.
                  </Text>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <HStack w="100%" justify="space-between" mt={4}>
                    <Button
                      onClick={() => handlePageChange("prev")}
                      isDisabled={currentPage === 1}
                      leftIcon={<MdArrowBack />}
                      variant="ghost"
                      size="sm"
                      aria-label="Previous Page"
                    >
                      Previous
                    </Button>
                    <Text fontSize="sm" color="gray.600">
                      Page {currentPage} of {totalPages}
                    </Text>
                    <Button
                      onClick={() => handlePageChange("next")}
                      isDisabled={currentPage === totalPages}
                      rightIcon={<MdArrowForward />}
                      variant="ghost"
                      size="sm"
                      aria-label="Next Page"
                    >
                      Next
                    </Button>
                  </HStack>
                )}
              </>
            ) : (
              <Box
                p={4}
                bg={useColorModeValue("gray.50", "gray.700")}
                borderRadius="md"
                w="100%"
              >
                <HStack mb={2}>
                  <Icon as={MdUpdate} w={5} h={5} color="blue.500" />
                  <Text fontWeight="medium">{selectedUpdate.title}</Text>
                  <Badge colorScheme="blue" variant="subtle">
                    {selectedUpdate.type}
                  </Badge>
                </HStack>
                {/* Render content as sanitized HTML */}
                <Box
                  mt={2}
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(selectedUpdate.content, {
                      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
                        "img",
                        "h1",
                        "h2",
                        "h3",
                        "h4",
                        "h5",
                        "h6",
                      ]),
                      allowedAttributes: {
                        ...sanitizeHtml.defaults.allowedAttributes,
                        img: ["src", "alt"],
                        a: ["href", "name", "target"],
                      },
                    }),
                  }}
                />
                <Text fontSize="xs" color="gray.500" mt={2}>
                  {formatDate(selectedUpdate.date)}
                </Text>
                <Flex mt={4} justify="flex-end" gap={2}>
                  <Button
                    onClick={() => setSelectedUpdate(null)}
                    leftIcon={<MdArrowBack />}
                    variant="outline"
                    size="sm"
                    aria-label="Back to Updates"
                  >
                    Back
                  </Button>
                  <Button
                    colorScheme="red"
                    leftIcon={<MdDelete />}
                    size="sm"
                    onClick={() => handleDeleteUpdate(selectedUpdate.id)}
                    aria-label="Delete Update"
                  >
                    Delete
                  </Button>
                </Flex>
              </Box>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default React.memo(NotificationModal);
