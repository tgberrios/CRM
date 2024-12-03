// TrackersComments.jsx
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
} from "@chakra-ui/react";
import { CopyIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";

// Function to debounce the search
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
};

// Optimized TrackersComments component
const TrackersComments = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to load and process the Excel file asynchronously
  const loadExcel = useCallback(async () => {
    try {
      console.log("Attempting to load Excel via IPC");
      const response = await window.cert.loadCommentsExcel();
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

        // Normalize data and filter duplicates based on key fields
        const uniqueRows = [];
        const seenKeys = new Set();

        // Define the key fields to identify duplicates
        const keyFields = ["XR #", "Case #", "Comments", "N/A Scenario"];

        rows.forEach((row) => {
          // Normalize and concatenate key fields to create a unique key
          const key = keyFields
            .map((field) => {
              let value = row[field] || "";
              // Remove line breaks, trim spaces, and convert to lowercase
              value = value.replace(/\s+/g, " ").trim().toLowerCase();
              return value;
            })
            .join("|");

          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueRows.push(row);
          }
        });

        setData(uniqueRows);
        setFilteredData(uniqueRows);
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

  // Debounced search function
  const handleSearch = debounce((value) => {
    const filtered = data.filter((row) =>
      Object.values(row).some((cell) =>
        cell.toString().toLowerCase().includes(value)
      )
    );
    setFilteredData(filtered);
  }, 300);

  const onSearchInputChange = (e) => {
    handleSearch(e.target.value.toLowerCase());
  };

  // Function to copy text to clipboard
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard.",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  // Function to navigate to /Home
  const goToHome = () => {
    navigate("/Home");
  };

  return (
    <Box bg="gray.50" minH="100vh" py={6}>
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
            <Spinner size="xl" color="green.500" />
          </Flex>
        ) : filteredData.length > 0 ? (
          <Box overflowX="auto" borderRadius="md" boxShadow="md">
            <Table variant="simple">
              <Thead bg="#A5BFA1">
                {/* Use background color for header */}
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
                    _hover={{ bg: "green.50" }}
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
                        color="black"
                      >
                        {key === "Comments" || key === "N/A Scenario" ? (
                          <Flex
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Text whiteSpace="pre-wrap">{row[key]}</Text>
                            <IconButton
                              aria-label={`Copy ${key}`}
                              icon={<CopyIcon />}
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopy(row[key])}
                            />
                          </Flex>
                        ) : (
                          <Text whiteSpace="pre-wrap">{row[key]}</Text>
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
            <Text fontSize="xl" color="gray.500">
              No results found.
            </Text>
          </Flex>
        )}
      </Container>
    </Box>
  );
};

export default TrackersComments;
