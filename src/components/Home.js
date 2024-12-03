import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  SimpleGrid,
  Heading,
  Stack,
  Center,
  IconButton,
} from "@chakra-ui/react";
import {
  FiExternalLink,
  FiMail,
  FiGrid,
  FiBook,
  FiMap,
  FiClipboard,
  FiLogOut,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import NotificationModal from "./NotificationModal";

const Home = () => {
  const [username, setUsername] = useState("");
  const [updates, setUpdates] = useState([]); // Estado para almacenar actualizaciones
  const [isModalOpen, setIsModalOpen] = useState(false); // Controla la apertura del modal
  const [hasSeenUpdates, setHasSeenUpdates] = useState(false); // Nuevo estado para controlar si el usuario ha visto las actualizaciones
  const navigate = useNavigate();

  useEffect(() => {
    // Obtener el nombre de usuario almacenado
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }

    // Cargar las actualizaciones desde window.cert.getUpdates
    const fetchUpdates = async () => {
      try {
        const updatesData = await window.cert.getUpdates(); // Llama a getUpdates
        setUpdates(updatesData);

        // Mostrar el modal solo si hay actualizaciones nuevas y el usuario no las ha visto
        if (updatesData.length > 0 && !hasSeenUpdates) {
          setIsModalOpen(true);
        }
      } catch (error) {
        console.error("Error fetching updates:", error);
      }
    };

    fetchUpdates();
  }, [hasSeenUpdates]);

  // Función para cerrar el modal y marcar las actualizaciones como vistas
  const handleModalClose = () => {
    setIsModalOpen(false);
    setHasSeenUpdates(true); // Marcar que el usuario ya vio las actualizaciones
  };

  // Función para cerrar sesión
  const handleLogoutClick = () => {
    localStorage.removeItem("username");
    navigate("/auth");
  };

  return (
    <Flex direction="column" minH="100vh" bg="primary">
      {/* Notification Modal */}
      <NotificationModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        updates={updates} // Pasa las actualizaciones al modal
      />

      {/* Navbar */}
      <Navbar />

      {/* Contenido principal */}
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

        {/* Grid con tarjetas */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
          {/* Tarjeta 1 */}
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
              variant="solid"
              rightIcon={<FiExternalLink />}
            >
              Go
            </Button>
          </Box>

          {/* Tarjeta 2 - Percipio Academy */}
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
              variant="solid"
              rightIcon={<FiExternalLink />}
            >
              Go
            </Button>
          </Box>

          {/* Tarjeta 3 - Xbox Services */}
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
              variant="solid"
              rightIcon={<FiExternalLink />}
            >
              Go
            </Button>
          </Box>

          {/* Tarjeta de Feedback */}
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

          {/* Tarjeta 5 - Console Certification */}
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
              variant="solid"
              rightIcon={<FiExternalLink />}
            >
              View
            </Button>
          </Box>

          {/* Tarjeta 6 - Game Guides */}
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
