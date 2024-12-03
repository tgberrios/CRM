import React, { useEffect, useState, useRef, useMemo } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  Input,
  Select,
  Flex,
  useToast,
  Divider,
  CloseButton,
  Avatar,
  HStack,
  Skeleton,
  IconButton,
  Tag,
  Spacer,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  AddIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  DeleteIcon,
} from "@chakra-ui/icons";

// Function to strip HTML tags from content
const stripHtmlTags = (html) => {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || "";
};

// Function to sanitize HTML content
const sanitizeHtml = (html) => {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  const scripts = tempDiv.getElementsByTagName("script");
  for (let i = scripts.length - 1; i >= 0; i--) {
    scripts[i].parentNode.removeChild(scripts[i]);
  }
  return tempDiv.innerHTML;
};

// UpdateCard Component
const UpdateCard = ({ update, onClick }) => (
  <Box
    p={6}
    bg="white"
    borderRadius="md"
    boxShadow="md"
    width="100%"
    _hover={{ boxShadow: "lg", cursor: "pointer" }}
    onClick={() => onClick(update)}
  >
    <Flex justifyContent="space-between" alignItems="center">
      <HStack spacing={4}>
        <Avatar name={update.username} />
        <Box>
          <Text fontWeight="bold">{update.title}</Text>
          <Text fontSize="sm" color="gray.500">
            {update.username}
          </Text>
        </Box>
      </HStack>
      <Tag colorScheme="green" borderRadius="full" px={3} py={1}>
        {update.type}
      </Tag>
    </Flex>
    <Text mt={4} color="gray.700">
      {stripHtmlTags(update.content).slice(0, 150)}...
    </Text>
  </Box>
);

// SidePeek Component for Viewing Update Content
const SidePeek = ({
  isOpen,
  onClose,
  update,
  onNext,
  onPrevious,
  onDelete,
}) => (
  <Box
    position="fixed"
    top={0}
    right={isOpen ? 0 : "-35%"}
    height="100vh"
    width="35%"
    bg="white"
    boxShadow="-2px 0px 5px rgba(0, 0, 0, 0.1)"
    p={6}
    zIndex={1000}
    overflowY="auto"
    transition="right 0.3s ease"
  >
    <Flex alignItems="center" mb={4}>
      <IconButton
        icon={<ChevronLeftIcon />}
        onClick={onPrevious || undefined}
        aria-label="Previous Update"
        isDisabled={!onPrevious}
      />
      <Spacer />
      <Heading size="md">{update.title}</Heading>
      <Spacer />
      <IconButton
        icon={<ChevronRightIcon />}
        onClick={onNext || undefined}
        aria-label="Next Update"
        isDisabled={!onNext}
      />
      <CloseButton onClick={onClose} ml={2} />
    </Flex>
    <Divider mb={4} />
    <Box dangerouslySetInnerHTML={{ __html: sanitizeHtml(update.content) }} />
    <Flex mt={6}>
      <Button
        leftIcon={<DeleteIcon />}
        colorScheme="red"
        onClick={() => onDelete(update.id)}
      >
        Delete
      </Button>
    </Flex>
  </Box>
);

// SidePeek Component for Adding Updates
const UpdateForm = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: "",
    type: "",
  });
  const quillRef = useRef(null);
  const quillInstanceRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    if (quillRef.current && !quillInstanceRef.current) {
      quillInstanceRef.current = new Quill(quillRef.current, {
        theme: "snow",
        modules: {
          toolbar: [
            [{ header: "1" }, { header: "2" }, { font: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            ["bold", "italic", "underline"],
            ["link", "image"],
            [{ align: [] }],
            ["clean"],
          ],
        },
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen && quillInstanceRef.current) {
      quillInstanceRef.current.root.innerHTML = "";
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const content = quillInstanceRef.current
      ? quillInstanceRef.current.root.innerHTML
      : "";

    if (
      !formData.title ||
      formData.title.length < 5 ||
      !formData.type ||
      !content
    ) {
      toast({
        title: "Please complete all fields.",
        description: "Title must have at least 5 characters.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    onSubmit({ ...formData, content });
    onClose();

    setFormData({
      title: "",
      type: "",
    });

    if (quillInstanceRef.current) {
      quillInstanceRef.current.root.innerHTML = "";
    }
  };

  return (
    <Box
      position="fixed"
      top={0}
      right={isOpen ? 0 : "-35%"}
      height="100vh"
      width="35%"
      bg="white"
      boxShadow="-2px 0px 5px rgba(0, 0, 0, 0.1)"
      p={6}
      zIndex={1000}
      overflowY="auto"
      transition="right 0.3s ease"
    >
      <Flex alignItems="center" mb={4}>
        <Heading size="md">New Update</Heading>
        <Spacer />
        <CloseButton onClick={onClose} />
      </Flex>
      <Divider mb={4} />
      <VStack spacing={4} align="stretch">
        <Select
          placeholder="Select Type"
          value={formData.type}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, type: e.target.value }))
          }
        >
          <option value="News">News</option>
          <option value="App Update">App Update</option>
          <option value="XR Update">XR Update</option>
          <option value="Status">Status</option>
          <option value="Process Update">Process Update</option>
          <option value="Suggestions">Suggestions</option>
          <option value="Xbox Docs">Xbox Docs</option>
          <option value="W10 Docs">W10 Docs</option>
          <option value="BVT">BVT</option>
          <option value="Console Prep">Console Prep</option>
        </Select>
        <Input
          placeholder="Title"
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
        />
        <Box
          ref={quillRef}
          style={{
            height: "200px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
      </VStack>
      <Flex mt={6} justifyContent="flex-end">
        <Button variant="ghost" mr={3} onClick={onClose}>
          Cancel
        </Button>
        <Button colorScheme="teal" onClick={handleSubmit}>
          Submit
        </Button>
      </Flex>
    </Box>
  );
};

const News = () => {
  const [updates, setUpdates] = useState([]);
  const [filteredUpdates, setFilteredUpdates] = useState([]);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidePeekOpen, setIsSidePeekOpen] = useState(false);
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadUpdates = async () => {
      try {
        const loadedUpdates = await window.cert.loadUpdates();
        loadedUpdates.sort((a, b) => new Date(b.date) - new Date(a.date));
        setUpdates(loadedUpdates);
        setFilteredUpdates(loadedUpdates);
      } catch (error) {
        toast({
          title: "Error loading updates.",
          description: error.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadUpdates();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = updates.filter(
        (update) =>
          update.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          update.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUpdates(filtered);
    } else {
      setFilteredUpdates(updates);
    }
    setCurrentPage(1);
  }, [searchTerm, updates]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleOpenSidePeek = (update) => {
    setSelectedUpdate(update);
    setIsSidePeekOpen(true);
  };

  const handleCloseSidePeek = () => {
    setIsSidePeekOpen(false);
    setSelectedUpdate(null);
  };

  const handleNextUpdate = () => {
    const currentIndex = filteredUpdates.findIndex(
      (u) => u.id === selectedUpdate.id
    );
    if (currentIndex < filteredUpdates.length - 1) {
      setSelectedUpdate(filteredUpdates[currentIndex + 1]);
    }
  };

  const handlePreviousUpdate = () => {
    const currentIndex = filteredUpdates.findIndex(
      (u) => u.id === selectedUpdate.id
    );
    if (currentIndex > 0) {
      setSelectedUpdate(filteredUpdates[currentIndex - 1]);
    }
  };

  const handleDeleteUpdate = async (id) => {
    try {
      await window.cert.deleteUpdate(id);
      setUpdates((prev) => prev.filter((u) => u.id !== id));
      setFilteredUpdates((prev) => prev.filter((u) => u.id !== id));
      handleCloseSidePeek();
      toast({
        title: "Update deleted successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error deleting update.",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSubmitUpdate = async (data) => {
    const username = localStorage.getItem("username");
    if (!username) {
      toast({
        title: "User not logged in.",
        description: "Please log in to submit updates.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const updateData = { ...data, username, date: new Date().toISOString() };

    try {
      const result = await window.cert.logUpdate(updateData);
      updateData.id = result.id;
      setUpdates((prev) => [updateData, ...prev]);
      setFilteredUpdates((prev) => [updateData, ...prev]);
      toast({
        title: "Update logged successfully.",
        description: `Update titled "${data.title}" has been added.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error saving update.",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const currentUpdates = useMemo(() => {
    const indexOfLastUpdate = currentPage * itemsPerPage;
    const indexOfFirstUpdate = indexOfLastUpdate - itemsPerPage;
    return filteredUpdates.slice(indexOfFirstUpdate, indexOfLastUpdate);
  }, [filteredUpdates, currentPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredUpdates.length / itemsPerPage);
  }, [filteredUpdates.length]);

  return (
    <Box bg="gray.50" minH="100vh">
      <Flex
        as="header"
        bg="white"
        px={8}
        py={4}
        alignItems="center"
        borderBottom="1px solid"
        borderColor="gray.200"
      >
        <Heading as="h1" size="lg">
          CERT News
        </Heading>
        <Spacer />
        <Button
          leftIcon={<AddIcon />}
          colorScheme="teal"
          onClick={() => {
            setIsUpdateFormOpen(true);
          }}
        >
          Add Update
        </Button>
        <Button
          ml={4}
          colorScheme="gray"
          onClick={() => navigate("/Home")}
          variant="outline"
        >
          Home
        </Button>
      </Flex>

      <Box px={8} py={6}>
        <Input
          placeholder="Search updates..."
          value={searchTerm}
          onChange={handleSearch}
          size="lg"
          mb={6}
        />

        {isLoading ? (
          <VStack spacing={4}>
            <Skeleton height="20px" width="100%" />
            <Skeleton height="20px" width="100%" />
            <Skeleton height="20px" width="100%" />
          </VStack>
        ) : filteredUpdates.length === 0 ? (
          <Text color="gray.600">No updates found</Text>
        ) : (
          <VStack spacing={6}>
            {currentUpdates.map((update) => (
              <UpdateCard
                key={update.id}
                update={update}
                onClick={handleOpenSidePeek}
              />
            ))}
          </VStack>
        )}

        <Flex mt={6} justifyContent="center" alignItems="center">
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            isDisabled={currentPage === 1}
            leftIcon={<ChevronLeftIcon />}
            mr={4}
          >
            Previous
          </Button>
          <Text>
            Page {currentPage} of {totalPages}
          </Text>
          <Button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            isDisabled={currentPage === totalPages}
            rightIcon={<ChevronRightIcon />}
            ml={4}
          >
            Next
          </Button>
        </Flex>
      </Box>

      <Box as="footer" textAlign="center" py={6} bg="gray.100" mt={8}>
        <Text>
          For comments or suggestions, please email me at{" "}
          <a href="mailto:v-tomyb@microsoft.com" style={{ color: "#3182ce" }}>
            v-tomyb@microsoft.com
          </a>
        </Text>
      </Box>

      {selectedUpdate && (
        <SidePeek
          isOpen={isSidePeekOpen}
          onClose={handleCloseSidePeek}
          update={selectedUpdate}
          onNext={
            filteredUpdates.findIndex((u) => u.id === selectedUpdate.id) <
            filteredUpdates.length - 1
              ? handleNextUpdate
              : undefined
          }
          onPrevious={
            filteredUpdates.findIndex((u) => u.id === selectedUpdate.id) > 0
              ? handlePreviousUpdate
              : undefined
          }
          onDelete={handleDeleteUpdate}
        />
      )}

      <UpdateForm
        isOpen={isUpdateFormOpen}
        onClose={() => setIsUpdateFormOpen(false)}
        onSubmit={handleSubmitUpdate}
      />
    </Box>
  );
};

export default News;
