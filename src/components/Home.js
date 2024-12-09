// Home.js
import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Container,
  Button,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Text,
  Input,
  useToast,
  IconButton,
  HStack,
  SimpleGrid,
  Heading,
  Stack,
  Center,
} from "@chakra-ui/react";
import { CopyIcon } from "@chakra-ui/icons"; // Correct import for CopyIcon
import { useNavigate } from "react-router-dom";
import {
  FiExternalLink,
  FiMail,
  FiGrid,
  FiBook,
  FiMap,
  FiClipboard,
  FiLogOut,
} from "react-icons/fi"; // Correct import for Feather icons
import Navbar from "./Navbar";
import Footer from "./Footer";
import NotificationModal from "./NotificationModal";

/**
 * Debounce function to limit the rate at which a function can fire.
 * @param {Function} func - The function to debounce.
 * @param {number} delay - The delay in milliseconds.
 * @returns {Function} - The debounced function.
 */
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
};

/**
 * Main component for the Home page.
 * Displays various tools and services with quick access buttons.
 * Also handles user notifications and session management.
 * @returns {JSX.Element} - The rendered component.
 */
const Home = () => {
  const [username, setUsername] = useState("");
  const [updates, setUpdates] = useState([]); // State to store updates
  const [isModalOpen, setIsModalOpen] = useState(false); // Controls modal visibility
  const [hasSeenUpdates, setHasSeenUpdates] = useState(false); // Tracks if user has seen updates
  const navigate = useNavigate();
  const toast = useToast(); // Initialize useToast hook

  useEffect(() => {
    // Retrieve the stored username
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }

    // Fetch updates from window.cert.getUpdates
    const fetchUpdates = async () => {
      try {
        if (!window.cert || typeof window.cert.getUpdates !== "function") {
          throw new Error("cert.getUpdates is undefined or not a function");
        }

        const updatesData = await window.cert.getUpdates(); // Call getUpdates
        setUpdates(updatesData);

        // Show the modal only if there are new updates and the user hasn't seen them
        if (updatesData.length > 0 && !hasSeenUpdates) {
          setIsModalOpen(true);
        }
      } catch (error) {
        console.error("Error fetching updates:", error);
        toast({
          title: "Error",
          description:
            "There was a problem loading the updates. Please try again later.",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top-right",
        });
      }
    };

    fetchUpdates();
  }, [hasSeenUpdates, toast]);

  /**
   * Closes the notification modal and marks updates as seen.
   */
  const handleModalClose = () => {
    setIsModalOpen(false);
    setHasSeenUpdates(true); // Mark that the user has seen the updates
  };

  /**
   * Handles user logout by clearing local storage and navigating to the auth page.
   */
  const handleLogoutClick = () => {
    localStorage.removeItem("username");
    navigate("/auth");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
      status: "info",
      duration: 3000,
      isClosable: true,
      position: "top-right",
    });
  };

  /**
   * Handles copying text to the clipboard and shows a success toast.
   * @param {string} text - The text to copy.
   */
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Scenario copied to clipboard.",
      status: "success",
      duration: 2000,
      isClosable: true,
      position: "top-right",
    });
  };

  return (
    <Flex direction="column" minH="100vh" bg="primary">
      {/* Notification Modal */}
      <NotificationModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        updates={updates} // Pass updates to the modal
      />

      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <Flex flex="1" p={6} maxW="1200px" mx="auto" direction="column">
        <Center mb={8}>
          <Stack spacing={4} textAlign="center" alignItems="center">
            <Heading size="lg" color="textPrimary">
              Welcome, {username}!
              <IconButton
                ml={4}
                icon={<FiLogOut />}
                colorScheme="red"
                variant="ghost"
                onClick={handleLogoutClick}
                aria-label="Logout"
              />
            </Heading>
            <Text mt={2} fontSize="md" color="textSecondary">
              Explore the available tools and services below.
            </Text>
          </Stack>
        </Center>

        {/* Grid with Cards */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
          {/* Card 1 - My HCL */}
          <Box
            bg="white"
            borderRadius="lg"
            boxShadow="md"
            p={6}
            textAlign="center"
            transition="transform 0.2s"
            _hover={{ transform: "scale(1.05)" }}
          >
            <FiGrid size={36} color="textPrimary" />
            <Text fontWeight="bold" color="textPrimary" mt={4} mb={6}>
              My HCL
            </Text>
            <Button
              as="a"
              href="https://hclo365.sharepoint.com/sites/MYHCLTech"
              target="_blank"
              rel="noopener noreferrer"
              variant="solid"
              rightIcon={<FiExternalLink />}
            >
              Go
            </Button>
          </Box>

          {/* Card 2 - Percipio Academy */}
          <Box
            bg="white"
            borderRadius="lg"
            boxShadow="md"
            p={6}
            textAlign="center"
            transition="transform 0.2s"
            _hover={{ transform: "scale(1.05)" }}
          >
            <FiBook size={36} color="textPrimary" />
            <Text fontWeight="bold" color="textPrimary" mt={4} mb={6}>
              Percipio Academy
            </Text>
            <Button
              as="a"
              href="https://hclcontent.percipio.com/"
              target="_blank"
              rel="noopener noreferrer"
              variant="solid"
              rightIcon={<FiExternalLink />}
            >
              Go
            </Button>
          </Box>

          {/* Card 3 - Xbox Services */}
          <Box
            bg="white"
            borderRadius="lg"
            boxShadow="md"
            p={6}
            textAlign="center"
            transition="transform 0.2s"
            _hover={{ transform: "scale(1.05)" }}
          >
            <FiClipboard size={36} color="textPrimary" />
            <Text fontWeight="bold" color="textPrimary" mt={4} mb={6}>
              Xbox Services
            </Text>
            <Button
              as="a"
              href="https://support.xbox.com/en-US/xbox-live-status"
              target="_blank"
              rel="noopener noreferrer"
              variant="solid"
              rightIcon={<FiExternalLink />}
            >
              Go
            </Button>
          </Box>

          {/* Card 4 - Send Feedback */}
          <Box
            bg="white"
            borderRadius="lg"
            boxShadow="md"
            p={6}
            textAlign="center"
            transition="transform 0.2s"
            _hover={{ transform: "scale(1.05)" }}
          >
            <FiMail size={36} color="textPrimary" />
            <Text fontWeight="bold" color="textPrimary" mt={4} mb={6}>
              Send Feedback
            </Text>
            <Button
              onClick={() => {
                window.location.href =
                  "mailto:v-tomyb@microsoft.com?subject=Feedback CRM XBOX&body=I would like to share my feedback about this feature: ";
              }}
              variant="solid"
              rightIcon={<FiExternalLink />}
            >
              Send Email
            </Button>
          </Box>

          {/* Card 5 - Console Certification */}
          <Box
            bg="white"
            borderRadius="lg"
            boxShadow="md"
            p={6}
            textAlign="center"
            transition="transform 0.2s"
            _hover={{ transform: "scale(1.05)" }}
          >
            <FiClipboard size={36} color="textPrimary" />
            <Text fontWeight="bold" color="textPrimary" mt={4} mb={6}>
              Console Certification
            </Text>
            <Button
              as="a"
              href="https://learn.microsoft.com/en-us/gaming/gdk/_content/gc/policies/console/console-certification-requirements-and-tests"
              target="_blank"
              rel="noopener noreferrer"
              variant="solid"
              rightIcon={<FiExternalLink />}
            >
              View
            </Button>
          </Box>

          {/* Card 6 - Game Guides */}
          <Box
            bg="white"
            borderRadius="lg"
            boxShadow="md"
            p={6}
            textAlign="center"
            transition="transform 0.2s"
            _hover={{ transform: "scale(1.05)" }}
          >
            <FiMap size={36} color="textPrimary" />
            <Text fontWeight="bold" color="textPrimary" mt={4} mb={6}>
              Game Guides
            </Text>
            <Button
              as="a"
              href="https://www.gamerguides.com/"
              target="_blank"
              rel="noopener noreferrer"
              variant="solid"
              rightIcon={<FiExternalLink />}
            >
              View
            </Button>
          </Box>
        </SimpleGrid>
      </Flex>

      {/* Footer */}
      <Footer />
    </Flex>
  );
};

export default Home;
