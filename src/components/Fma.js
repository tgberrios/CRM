// FMAScenarios.js
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
} from "@chakra-ui/react";
import { CopyIcon } from "@chakra-ui/icons"; // Correct import for CopyIcon
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaBug,
  FaClipboardList,
  FaTools,
  FaTicketAlt,
} from "react-icons/fa"; // Corrected icon imports

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
 * Main component for managing FMA Scenarios.
 * @returns {JSX.Element} - The rendered component.
 */
const FMAScenarios = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  /**
   * Fetches and processes the Excel file data asynchronously.
   */
  const loadExcel = useCallback(async () => {
    try {
      if (!window.cert || !window.cert.loadExcel) {
        throw new Error("cert.loadExcel is undefined");
      }

      console.log("Attempting to load Excel via IPC");
      const response = await window.cert.loadExcel();
      if (response.success) {
        console.log("Excel data received:", response.data);
        const jsonData = response.data;
        const headers = jsonData[0];
        const rows = jsonData.slice(1).map((row) => {
          const rowData = {};
          headers.forEach((header, index) => {
            rowData[header] = row[index] || "";
          });
          return rowData;
        });

        setData(rows);
        setFilteredData(rows);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error("Error loading Excel file:", error);
      toast({
        title: "Error",
        description:
          "There was a problem loading the data. Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadExcel();
  }, [loadExcel]);

  useEffect(() => {
    setFilteredData(
      searchTerm
        ? data.filter((row) =>
            Object.values(row).some((cell) =>
              cell.toString().toLowerCase().includes(searchTerm)
            )
          )
        : data
    );
  }, [searchTerm, data]);

  /**
   * Handles toast notifications.
   * @param {string} description - The message to display.
   * @param {string} status - The status of the toast (e.g., "success", "error").
   */
  const handleToast = (description, status) => {
    toast({
      title: description,
      status: status,
      duration: 2000,
      isClosable: true,
      position: "top-right",
    });
  };

  /**
   * Handles the search input change with debounce.
   * @param {Event} e - The input change event.
   */
  const onSearchInputChange = (e) => {
    handleSearch(e.target.value.toLowerCase());
  };

  /**
   * Debounced search handler to optimize performance.
   */
  const handleSearch = debounce((value) => {
    const filtered = data.filter((row) =>
      Object.values(row).some((cell) =>
        cell.toString().toLowerCase().includes(value)
      )
    );
    setFilteredData(filtered);
  }, 300);

  /**
   * Navigates to the Home page.
   */
  const goToHome = () => {
    navigate("/Home");
  };

  /**
   * Copies the given text to the clipboard and shows a toast notification.
   * @param {string} text - The text to copy.
   */
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    handleToast("Scenario copied to clipboard.", "success");
  };

  return (
    <Box bg="primary" minH="100vh" py={6}>
      <Container maxW="container.xl">
        {/* Search bar with navigation button */}
        <Flex mb={4} align="center">
          <Input
            id="search-input"
            placeholder="Search..."
            size="lg"
            onChange={onSearchInputChange}
            style={{
              padding: "10px",
              fontSize: "18px",
              flex: "1",
              marginRight: "10px",
              borderColor: "#ccc",
              transition: "all 0.3s ease",
            }}
          />
          <Button colorScheme="green" size="lg" onClick={goToHome}>
            Home
          </Button>
        </Flex>

        {/* Loading indicator */}
        {loading ? (
          <Flex justify="center" align="center" minH="200px">
            <Spinner size="xl" color="accent" />
          </Flex>
        ) : filteredData.length > 0 ? (
          <Box overflowX="auto" borderRadius="md" boxShadow="md">
            <Table variant="simple">
              <Thead bg="accent">
                <Tr>
                  {Object.keys(filteredData[0]).map((header, index) => (
                    <Th
                      key={index}
                      color="white"
                      textTransform="capitalize"
                      fontSize="md"
                      py={4}
                    >
                      {header}
                    </Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {filteredData.map((row, rowIndex) => (
                  <Tr
                    key={rowIndex}
                    _hover={{ bg: "hover" }}
                    transition="background-color 0.3s"
                  >
                    {Object.keys(row).map((key, cellIndex) => (
                      <Td
                        key={cellIndex}
                        bg="transparent"
                        border="none"
                        py={4}
                        px={4}
                        fontSize="sm"
                        color="textPrimary"
                      >
                        {key === "Scenario" ? (
                          <Flex
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Text>{row[key]}</Text>
                            <IconButton
                              aria-label="Copy Scenario"
                              icon={<CopyIcon />}
                              size="sm"
                              variant="ghost"
                              color="black"
                              onClick={() => handleCopy(row[key])}
                            />
                          </Flex>
                        ) : (
                          row[key]
                        )}
                      </Td>
                    ))}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        ) : (
          <Flex justify="center" align="center" minH="200px">
            <Text fontSize="xl" color="textSecondary">
              No results found.
            </Text>
          </Flex>
        )}
      </Container>
    </Box>
  );
};

/**
 * Export the FMAScenarios component as default.
 */
export default FMAScenarios;
