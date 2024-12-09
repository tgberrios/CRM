// FMAScenarios.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
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
  Checkbox,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useToast,
  Skeleton,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useTable, useFlexLayout, useColumnOrder } from "react-table";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "@chakra-ui/icons";

// Debounce function for search input
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
};

// FMAScenarios Component with enhanced features
const FMAScenarios = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hiddenColumns, setHiddenColumns] = useState([
    "CoType",
    "Sandbox",
    "Bench",
  ]); // Initialize with default hidden columns
  const tableRef = useRef(null); // Reference for table scrolling

  // Define table columns
  const columns = React.useMemo(
    () => [
      { Header: "Team", accessor: "Team" },
      { Header: "Position", accessor: "Position" },
      { Header: "Bench", accessor: "Bench" },
      { Header: "Co. Type", accessor: "CoType" }, // Ensure accessor matches the header
      { Header: "Sandbox", accessor: "Sandbox" },
      { Header: "Asset Tag", accessor: "AssetTag" }, // Accessor without space
      { Header: "Console ID", accessor: "ConsoleID" }, // Accessor without space
      { Header: "Primary", accessor: "Primary" },
      { Header: "Secondary", accessor: "Secondary" },
      { Header: "Shared", accessor: "Shared" },
    ],
    []
  );

  // Function to load and process the Excel file asynchronously
  const loadExcel = useCallback(async () => {
    try {
      if (!window.cert || !window.cert.loadConsoleExcel) {
        throw new Error("cert.loadConsoleExcel is undefined");
      }

      // Replace "path/to/your/file.xlsx" with the correct path or logic to obtain the file
      const response = await window.cert.loadConsoleExcel(
        "path/to/your/file.xlsx"
      );
      if (response.success) {
        const jsonData = response.data;

        if (jsonData.length === 0) {
          throw new Error("The Excel file is empty.");
        }

        // Standardize headers by removing spaces and converting to camelCase
        const originalHeaders = jsonData[0];
        const standardizedHeaders = originalHeaders.map((header) =>
          header.replace(/\s+/g, "")
        );

        // Process data rows
        const rows = jsonData.slice(1).map((row) => {
          const rowData = {};
          standardizedHeaders.forEach((header, index) => {
            rowData[header] = row[index] || "";
          });
          return rowData;
        });

        setData(rows);
        setFilteredData(rows);
        toast({
          title: "Data Loaded",
          description: "Console scenarios have been successfully loaded.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(response.error || "Error loading the Excel file.");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          "There was a problem loading the data. Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Error loading Excel:", error);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadExcel();
  }, [loadExcel]);

  // Debounced search function
  const handleSearch = debounce((value) => {
    if (value === "") {
      setFilteredData(data);
      return;
    }

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

  // Function to navigate to /Home
  const goToHome = () => {
    navigate("/Home");
  };

  // React-table hooks
  const tableInstance = useTable(
    {
      columns,
      data: filteredData,
      initialState: { hiddenColumns }, // Initialize with hidden columns
    },
    useFlexLayout,
    useColumnOrder
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    allColumns,
    setHiddenColumns: setTableHiddenColumns,
  } = tableInstance;

  // Function to toggle column visibility
  const toggleColumnVisibility = (columnId) => {
    const isHidden = hiddenColumns.includes(columnId);
    const newHiddenColumns = isHidden
      ? hiddenColumns.filter((col) => col !== columnId)
      : [...hiddenColumns, columnId];

    setHiddenColumns(newHiddenColumns);
    setTableHiddenColumns(newHiddenColumns); // Update only if the state changes
  };

  // Function to scroll the table horizontally
  const scrollTable = (direction) => {
    if (tableRef.current) {
      tableRef.current.scrollBy({
        left: direction === "left" ? -200 : 200,
        behavior: "smooth",
      });
    }
  };

  return (
    <Box bg="gray.50" minH="100vh" py={6}>
      <Container maxW="container.xl">
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

          {/* Button to show/hide columns */}
          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />} ml={4}>
              Edit View
            </MenuButton>
            <MenuList>
              {allColumns.map((column) => (
                <MenuItem key={column.id}>
                  <Checkbox
                    isChecked={!hiddenColumns.includes(column.id)}
                    onChange={() => toggleColumnVisibility(column.id)}
                  >
                    {column.render("Header")}
                  </Checkbox>
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </Flex>

        {loading ? (
          <Flex justify="center" align="center" minH="200px">
            <Spinner size="xl" color="#A5BFA1" />{" "}
            {/* Preserved original green color */}
          </Flex>
        ) : filteredData.length > 0 ? (
          <Box position="relative" overflow="hidden">
            {/* Arrows for horizontal navigation */}
            <Flex justify="space-between" align="center" mb={2}>
              <IconButton
                icon={<ChevronLeftIcon />}
                aria-label="Scroll Left"
                onClick={() => scrollTable("left")}
                colorScheme="green" // Preserved original green color scheme
                variant="outline"
                borderRadius="full"
              />
              <IconButton
                icon={<ChevronRightIcon />}
                aria-label="Scroll Right"
                onClick={() => scrollTable("right")}
                colorScheme="green" // Preserved original green color scheme
                variant="outline"
                borderRadius="full"
              />
            </Flex>

            <Box
              ref={tableRef}
              overflowX="auto"
              borderRadius="md"
              boxShadow="md"
              display="flex"
            >
              <Table {...getTableProps()} variant="striped" colorScheme="gray">
                <Thead bg="#A5BFA1">
                  {" "}
                  {/* Preserved original green background */}
                  {headerGroups.map((headerGroup) => (
                    <Tr {...headerGroup.getHeaderGroupProps()}>
                      {headerGroup.headers.map((column) => (
                        <Th {...column.getHeaderProps()} color="white">
                          {column.render("Header")}
                        </Th>
                      ))}
                    </Tr>
                  ))}
                </Thead>
                <Tbody {...getTableBodyProps()}>
                  {rows.map((row) => {
                    prepareRow(row);
                    return (
                      <Tr {...row.getRowProps()} _hover={{ bg: "green.50" }}>
                        {" "}
                        {/* Preserved hover color */}
                        {row.cells.map((cell) => (
                          <Td {...cell.getCellProps()}>
                            {cell.render("Cell")}
                          </Td>
                        ))}
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>
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

export default FMAScenarios;
