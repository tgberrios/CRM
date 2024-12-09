// InventoryManager.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Button,
  Input,
  VStack,
  HStack,
  Text,
  useToast,
  useDisclosure,
  IconButton,
  Badge,
  Heading,
  FormControl,
  FormLabel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Divider,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  Fade,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import { EditIcon, DeleteIcon, AddIcon, ArrowBackIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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
    timeout = setTimeout(() => func(...args), delay);
  };
};

/**
 * InventoryManager Component
 * Manages accounts and hardware inventory with functionalities to add, edit, delete, import, and export items.
 * @returns {JSX.Element} - The rendered component.
 */
const InventoryManager = () => {
  const [accounts, setAccounts] = useState([]);
  const [hardware, setHardware] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("");
  const [currentView, setCurrentView] = useState("accounts"); // 'accounts' or 'hardware'
  const [editingItem, setEditingItem] = useState({}); // Initialize as empty object
  const [isEditing, setIsEditing] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null); // Reference for the file input

  // Loading states added
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isLoadingHardware, setIsLoadingHardware] = useState(true);
  const [isSwitchingView, setIsSwitchingView] = useState(false); // New state for switching views
  const [isSearching, setIsSearching] = useState(false); // New state for searching

  // Alert Dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const cancelRef = useRef();

  useEffect(() => {
    loadAccounts();
    loadHardware();
  }, []);

  /**
   * Fetches and loads accounts data.
   */
  const loadAccounts = async () => {
    setIsLoadingAccounts(true); // Start loading
    try {
      const accountsData = await window.cert.getAccounts();
      setAccounts(accountsData);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      toast({
        title: "Error",
        description: "Failed to fetch accounts.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingAccounts(false); // End loading
    }
  };

  /**
   * Fetches and loads hardware data.
   */
  const loadHardware = async () => {
    setIsLoadingHardware(true); // Start loading
    try {
      const hardwareData = await window.cert.getHardware();
      setHardware(hardwareData);
    } catch (err) {
      console.error("Error fetching hardware:", err);
      toast({
        title: "Error",
        description: "Failed to fetch hardware.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingHardware(false); // End loading
    }
  };

  /**
   * Handles search input change with debounce.
   */
  const debouncedSetSearchTerm = useCallback(
    debounce((value) => {
      setIsSearching(true);
      setSearchTerm(value);
      // Simulate a small delay for smoother animation
      setTimeout(() => {
        setIsSearching(false);
      }, 500);
    }, 300),
    []
  );

  /**
   * Event handler for search input changes.
   * Extracts the value and passes it to the debounced function.
   * @param {object} e - The input change event.
   */
  const handleSearch = (e) => {
    const value = e.target.value;
    debouncedSetSearchTerm(value);
  };

  /**
   * Handles filter selection change.
   */
  const handleFilterByChange = (e) => {
    setFilterBy(e.target.value);
  };

  /**
   * Opens the edit modal with the selected item.
   * @param {object} item - The item to edit.
   */
  const handleEditItem = (item) => {
    setEditingItem(item);
    setIsEditing(true);
    onOpen();
  };

  /**
   * Opens the add modal with empty fields.
   */
  const handleAddItem = () => {
    if (currentView === "accounts") {
      setEditingItem({
        email: "",
        position: "",
        state: "",
        sandbox: "",
        subscription: "",
        location: "",
        notes: "",
      });
    } else {
      setEditingItem({
        id: null, // New ID
        serialNumber: "",
        consoleId: "",
        xboxLiveId: "",
        assetOwner: "",
        projectOwner: "",
        type: "",
        classification: "",
        assetTag: "",
        location: "",
        status: "",
        owner: "",
      });
    }
    setIsEditing(false);
    setFormErrors({});
    onOpen();
  };

  /**
   * Opens the delete confirmation dialog with the selected item.
   * @param {object} item - The item to delete.
   */
  const handleDeleteItem = (item) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  /**
   * Confirms the deletion of the selected item.
   */
  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        if (currentView === "accounts") {
          await window.cert.deleteAccount(itemToDelete.id);
          loadAccounts();
        } else {
          await window.cert.deleteHardware(itemToDelete.id); // Change to id
          loadHardware();
        }
        toast({
          title: `${
            currentView === "accounts" ? "Account" : "Hardware"
          } Deleted`,
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      } catch (err) {
        console.error("Error deleting item:", err);
        toast({
          title: "Error",
          description: "Could not delete the item.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsDeleteDialogOpen(false);
        setItemToDelete(null);
      }
    }
  };

  /**
   * Cancels the deletion process.
   */
  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  /**
   * Saves an item (account or hardware) by adding or editing based on the current view.
   */
  const handleSaveItem = async () => {
    const username = localStorage.getItem("username");
    if (!username) {
      console.error("Username not found in localStorage");
      toast({
        title: "Error",
        description: "Username not found in localStorage.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validation can be added here
    let isValid = true;
    let errors = {};

    if (currentView === "accounts") {
      if (!editingItem.email) {
        isValid = false;
        errors.email = "Email is required.";
      }
      if (!editingItem.position) {
        isValid = false;
        errors.position = "Position is required.";
      }
      if (!editingItem.state) {
        isValid = false;
        errors.state = "State is required.";
      }
      if (!editingItem.type) {
        isValid = false;
        errors.type = "Type is required.";
      }
    } else {
      if (!editingItem.serialNumber) {
        isValid = false;
        errors.serialNumber = "Serial Number is required.";
      }
      if (!editingItem.type) {
        isValid = false;
        errors.type = "Type is required.";
      }
      if (!editingItem.status) {
        isValid = false;
        errors.status = "Status is required.";
      }
    }

    setFormErrors(errors);

    if (!isValid) {
      toast({
        title: "Invalid Input",
        description: "Please correct the errors in the form.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      if (currentView === "accounts") {
        if (isEditing) {
          await window.cert.editAccount({ ...editingItem, username });
        } else {
          await window.cert.addAccount({ ...editingItem, username });
        }
        loadAccounts();
      } else {
        if (isEditing) {
          await window.cert.editHardware({ ...editingItem, username });
        } else {
          await window.cert.addHardware({ ...editingItem, username });
        }
        loadHardware();
      }
      onClose();
      toast({
        title: `${currentView === "accounts" ? "Account" : "Hardware"} Saved`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      console.error(`Error saving ${currentView}:`, err);
      toast({
        title: "Error",
        description: `Could not save the ${currentView}.`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  /**
   * Exports current data (accounts or hardware) to an Excel file.
   */
  const handleExport = () => {
    const dataToExport = currentView === "accounts" ? accounts : hardware;

    // Map data to exclude unnecessary properties (e.g., id)
    const data = dataToExport.map(({ id, ...item }) => item);

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, currentView);

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const dataBlob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(
      dataBlob,
      `${currentView === "accounts" ? "accounts" : "hardware"}_export.xlsx`
    );
  };

  /**
   * Triggers the file input click for importing Excel data.
   */
  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  /**
   * Handles importing data from an Excel file.
   * @param {Event} e - The file input change event.
   */
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const binaryStr = evt.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      try {
        const username = localStorage.getItem("username");
        if (!username) {
          console.error("Username not found in localStorage");
          toast({
            title: "Error",
            description: "Username not found in localStorage.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        if (currentView === "accounts") {
          for (const account of data) {
            await window.cert.addAccount({ ...account, username });
          }
          loadAccounts();
        } else {
          for (const hw of data) {
            await window.cert.addHardware({ ...hw, username });
          }
          loadHardware();
        }

        toast({
          title: "Import Successful",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      } catch (err) {
        console.error("Error importing data:", err);
        toast({
          title: "Error",
          description: "Could not import the data.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  /**
   * Filters items based on search term and selected filter.
   */
  const filteredItems = (
    currentView === "accounts" ? accounts : hardware
  ).filter((item) => {
    if (!filterBy) {
      return Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      return (
        item[filterBy] &&
        String(item[filterBy]).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  });

  /**
   * Renders the table rows with either Skeletons or actual data.
   */
  const renderItems = () => {
    const isLoading =
      currentView === "accounts" ? isLoadingAccounts : isLoadingHardware;

    if (isSwitchingView || isSearching || isLoading) {
      // Show Skeletons while loading or switching views
      const skeletonRows = Array.from({ length: 5 });

      return (
        <Table variant="simple" colorScheme="gray">
          <Thead>
            <Tr>
              {currentView === "accounts" ? (
                <>
                  <Th>ID</Th>
                  <Th>Email</Th>
                  <Th>Position</Th>
                  <Th>State</Th>
                  <Th>Actions</Th>
                </>
              ) : (
                <>
                  <Th>Serial Number</Th>
                  <Th>Type</Th>
                  <Th>Asset Owner</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </>
              )}
            </Tr>
          </Thead>
          <Tbody>
            {skeletonRows.map((_, index) => (
              <Tr key={index}>
                {currentView === "accounts" ? (
                  <>
                    <Td>
                      <Skeleton height="20px" width="30px" />
                    </Td>
                    <Td>
                      <Skeleton height="20px" />
                    </Td>
                    <Td>
                      <Skeleton height="20px" />
                    </Td>
                    <Td>
                      <Skeleton height="20px" width="60px" />
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <SkeletonCircle size="24px" />
                        <SkeletonCircle size="24px" />
                      </HStack>
                    </Td>
                  </>
                ) : (
                  <>
                    <Td>
                      <Skeleton height="20px" width="80px" />
                    </Td>
                    <Td>
                      <Skeleton height="20px" />
                    </Td>
                    <Td>
                      <Skeleton height="20px" />
                    </Td>
                    <Td>
                      <Skeleton height="20px" width="80px" />
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <SkeletonCircle size="24px" />
                        <SkeletonCircle size="24px" />
                      </HStack>
                    </Td>
                  </>
                )}
              </Tr>
            ))}
          </Tbody>
        </Table>
      );
    }

    return (
      <Fade in={!isLoading}>
        <Table variant="simple" colorScheme="gray">
          <Thead>
            <Tr>
              {currentView === "accounts" ? (
                <>
                  <Th>ID</Th>
                  <Th>Email</Th>
                  <Th>Position</Th>
                  <Th>State</Th>
                  <Th>Actions</Th>
                </>
              ) : (
                <>
                  <Th>Serial Number</Th>
                  <Th>Type</Th>
                  <Th>Asset Owner</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </>
              )}
            </Tr>
          </Thead>
          <Tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <Tr key={item.id || item.serialNumber}>
                  {currentView === "accounts" ? (
                    <>
                      <Td>{item.id}</Td>
                      <Td>{item.email}</Td>
                      <Td>{item.position}</Td>
                      <Td>
                        <Badge
                          colorScheme={
                            item.state === "Active"
                              ? "green"
                              : item.state === "Inactive"
                              ? "red"
                              : "yellow"
                          }
                        >
                          {item.state}
                        </Badge>
                      </Td>
                    </>
                  ) : (
                    <>
                      <Td>{item.serialNumber}</Td>
                      <Td>{item.type}</Td>
                      <Td>{item.assetOwner}</Td>
                      <Td>
                        <Badge
                          colorScheme={
                            item.status === "Available"
                              ? "green"
                              : item.status === "In Use"
                              ? "blue"
                              : item.status === "Maintenance"
                              ? "orange"
                              : item.status === "Retired"
                              ? "red"
                              : item.status === "Broken"
                              ? "red"
                              : item.status === "Reserved"
                              ? "purple"
                              : "gray"
                          }
                        >
                          {item.status}
                        </Badge>
                      </Td>
                    </>
                  )}
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        icon={<EditIcon />}
                        onClick={() => handleEditItem(item)}
                        colorScheme="blue"
                        size="sm"
                        aria-label="Edit"
                      />
                      <IconButton
                        icon={<DeleteIcon />}
                        onClick={() => handleDeleteItem(item)}
                        colorScheme="red"
                        size="sm"
                        aria-label="Delete"
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={currentView === "accounts" ? "5" : "5"}>
                  <Text textAlign="center">No results found.</Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Fade>
    );
  };

  return (
    <Box display="flex" minH="100vh">
      {/* Sidebar */}
      <Box
        w="20%"
        bg="gray.100"
        p={4}
        borderRight="1px"
        borderColor="gray.200"
        display="flex"
        flexDirection="column"
        position="fixed"
        top={0}
        left={0}
        bottom={0}
        overflowY="auto"
      >
        <Heading as="h1" size="lg" mb={6}>
          Inventory Manager
        </Heading>

        {/* Navigation Buttons */}
        <VStack spacing={4} align="stretch">
          <Button
            onClick={() => {
              if (currentView !== "accounts") {
                setIsSwitchingView(true);
                setCurrentView("accounts");
                // Simulate loading delay
                setTimeout(() => {
                  setIsSwitchingView(false);
                }, 500);
              }
            }}
            colorScheme={currentView === "accounts" ? "teal" : "gray"}
            variant="solid"
            leftIcon={<EditIcon />}
          >
            Manage Accounts
          </Button>
          <Button
            onClick={() => {
              if (currentView !== "hardware") {
                setIsSwitchingView(true);
                setCurrentView("hardware");
                // Simulate loading delay
                setTimeout(() => {
                  setIsSwitchingView(false);
                }, 500);
              }
            }}
            colorScheme={currentView === "hardware" ? "teal" : "gray"}
            variant="solid"
            leftIcon={<EditIcon />}
          >
            Manage Hardware
          </Button>
          <Button
            onClick={() => navigate("/Home")}
            colorScheme="gray"
            variant="solid"
            leftIcon={<ArrowBackIcon />}
          >
            Back to Home
          </Button>
        </VStack>

        <Divider my={6} />

        {/* Search and Filter */}
        <Heading as="h2" size="md" mb={4}>
          Search and Filter
        </Heading>
        <VStack spacing={4} align="stretch">
          <Input
            placeholder={`Search ${
              currentView === "accounts" ? "Accounts" : "Hardware"
            }...`}
            onChange={handleSearch}
          />
          <Select
            placeholder="Filter by..."
            onChange={handleFilterByChange}
            value={filterBy}
          >
            {currentView === "accounts" ? (
              <>
                <option value="position">Position</option>
                <option value="state">State</option>
                <option value="sandbox">Sandbox</option>
                <option value="subscription">Subscription</option>
                <option value="location">Location</option>
              </>
            ) : (
              <>
                <option value="assetOwner">Asset Owner</option>
                <option value="projectOwner">Project Owner</option>
                <option value="type">Type</option>
                <option value="classification">Classification</option>
                <option value="status">Status</option>
                <option value="owner">Owner</option>
                <option value="location">Location</option>
              </>
            )}
          </Select>
        </VStack>

        <Divider my={6} />

        {/* Import and Export Buttons */}
        <Heading as="h2" size="md" mb={4}>
          Import and Export
        </Heading>
        <VStack spacing={4} align="stretch">
          <Button colorScheme="green" onClick={handleExport}>
            Export to Excel
          </Button>
          <Button colorScheme="blue" onClick={handleImportClick}>
            Import from Excel
          </Button>
          <Input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            style={{ display: "none" }}
            accept=".xlsx, .xls, .csv"
          />
        </VStack>
      </Box>

      {/* Main Content */}
      <Box flex="1" ml="20%" p={6} bg="gray.50">
        <Heading as="h2" size="lg" mb={6}>
          {currentView === "accounts" ? "Accounts" : "Hardware"}
        </Heading>

        {/* Items Table */}
        <Box bg="white" p={6} borderRadius="md" shadow="md">
          {renderItems()}
        </Box>
      </Box>

      {/* Floating Add Button */}
      <IconButton
        icon={<AddIcon />}
        colorScheme="teal"
        size="lg"
        onClick={handleAddItem}
        position="fixed"
        bottom="40px"
        right="40px"
        borderRadius="full"
        aria-label="Add Item"
      />

      {/* Drawer for Adding/Editing Items */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            {isEditing
              ? `Edit ${currentView === "accounts" ? "Account" : "Hardware"}`
              : `Add New ${
                  currentView === "accounts" ? "Account" : "Hardware"
                }`}
          </DrawerHeader>

          <DrawerBody>
            {currentView === "accounts" ? (
              <>
                <FormControl mb={4} isInvalid={formErrors.email}>
                  <FormLabel>Email</FormLabel>
                  <Input
                    value={editingItem?.email || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        email: e.target.value,
                      })
                    }
                  />
                  {formErrors.email && (
                    <Text color="red.500" fontSize="sm">
                      {formErrors.email}
                    </Text>
                  )}
                </FormControl>
                <FormControl mb={4} isInvalid={formErrors.position}>
                  <FormLabel>Position</FormLabel>
                  <Input
                    value={editingItem?.position || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        position: e.target.value,
                      })
                    }
                  />
                  {formErrors.position && (
                    <Text color="red.500" fontSize="sm">
                      {formErrors.position}
                    </Text>
                  )}
                </FormControl>
                <FormControl mb={4} isInvalid={formErrors.state}>
                  <FormLabel>State</FormLabel>
                  <Select
                    value={editingItem?.state || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        state: e.target.value,
                      })
                    }
                  >
                    <option value="">Select State</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Pending">Pending</option>
                    <option value="Deleted">Deleted</option>
                  </Select>
                  {formErrors.state && (
                    <Text color="red.500" fontSize="sm">
                      {formErrors.state}
                    </Text>
                  )}
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>Sandbox</FormLabel>
                  <Input
                    value={editingItem?.sandbox || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        sandbox: e.target.value,
                      })
                    }
                  />
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>Subscription</FormLabel>
                  <Input
                    value={editingItem?.subscription || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        subscription: e.target.value,
                      })
                    }
                  />
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>Location</FormLabel>
                  <Input
                    value={editingItem?.location || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        location: e.target.value,
                      })
                    }
                  />
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>Notes</FormLabel>
                  <Input
                    value={editingItem?.notes || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        notes: e.target.value,
                      })
                    }
                  />
                </FormControl>
              </>
            ) : (
              <>
                <FormControl mb={4} isInvalid={formErrors.serialNumber}>
                  <FormLabel>Serial Number</FormLabel>
                  <Input
                    value={editingItem?.serialNumber || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        serialNumber: e.target.value,
                      })
                    }
                  />
                  {formErrors.serialNumber && (
                    <Text color="red.500" fontSize="sm">
                      {formErrors.serialNumber}
                    </Text>
                  )}
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>Console ID</FormLabel>
                  <Input
                    value={editingItem?.consoleId || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        consoleId: e.target.value,
                      })
                    }
                  />
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>Xbox Live ID</FormLabel>
                  <Input
                    value={editingItem?.xboxLiveId || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        xboxLiveId: e.target.value,
                      })
                    }
                  />
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>Asset Owner</FormLabel>
                  <Input
                    value={editingItem?.assetOwner || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        assetOwner: e.target.value,
                      })
                    }
                  />
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>Project Owner</FormLabel>
                  <Input
                    value={editingItem?.projectOwner || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        projectOwner: e.target.value,
                      })
                    }
                  />
                </FormControl>
                <FormControl mb={4} isInvalid={formErrors.type}>
                  <FormLabel>Type</FormLabel>
                  <Input
                    value={editingItem?.type || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        type: e.target.value,
                      })
                    }
                  />
                  {formErrors.type && (
                    <Text color="red.500" fontSize="sm">
                      {formErrors.type}
                    </Text>
                  )}
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>Classification</FormLabel>
                  <Input
                    value={editingItem?.classification || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        classification: e.target.value,
                      })
                    }
                  />
                </FormControl>
                <FormControl mb={4} isInvalid={formErrors.status}>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={editingItem?.status || ""}
                    onChange={(e) => {
                      setEditingItem({
                        ...editingItem,
                        status: e.target.value,
                      });
                    }}
                  >
                    <option value="">Select Status</option>
                    <option value="Available">Available</option>
                    <option value="In Use">In Use</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Retired">Retired</option>
                    <option value="Broken">Broken</option>
                    <option value="Reserved">Reserved</option>
                  </Select>
                  {formErrors.status && (
                    <Text color="red.500" fontSize="sm">
                      {formErrors.status}
                    </Text>
                  )}
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>Asset Tag</FormLabel>
                  <Input
                    value={editingItem?.assetTag || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        assetTag: e.target.value,
                      })
                    }
                  />
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>Location</FormLabel>
                  <Input
                    value={editingItem?.location || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        location: e.target.value,
                      })
                    }
                  />
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>Owner</FormLabel>
                  <Input
                    value={editingItem?.owner || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        owner: e.target.value,
                      })
                    }
                  />
                </FormControl>
              </>
            )}
          </DrawerBody>

          <DrawerFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSaveItem}>
              Save
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={cancelDelete}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete {currentView === "accounts" ? "Account" : "Hardware"}
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this{" "}
              {currentView === "accounts" ? "account" : "hardware"}? This action
              cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={cancelDelete}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );

  /**
   * SkeletonLoading Component
   * Displays Skeletons while data is being loaded.
   * @param {string} view - Current view ('accounts' or 'hardware').
   * @returns {JSX.Element} - The rendered component.
   */
  const SkeletonLoading = ({ view }) => (
    <Table variant="simple" colorScheme="gray">
      <Thead>
        <Tr>
          {view === "accounts" ? (
            <>
              <Th>ID</Th>
              <Th>Email</Th>
              <Th>Position</Th>
              <Th>State</Th>
              <Th>Actions</Th>
            </>
          ) : (
            <>
              <Th>Serial Number</Th>
              <Th>Type</Th>
              <Th>Asset Owner</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </>
          )}
        </Tr>
      </Thead>
      <Tbody>
        {Array.from({ length: 5 }).map((_, index) => (
          <Tr key={index}>
            {view === "accounts" ? (
              <>
                <Td>
                  <Skeleton height="20px" width="30px" />
                </Td>
                <Td>
                  <Skeleton height="20px" />
                </Td>
                <Td>
                  <Skeleton height="20px" />
                </Td>
                <Td>
                  <Skeleton height="20px" width="60px" />
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <SkeletonCircle size="24px" />
                    <SkeletonCircle size="24px" />
                  </HStack>
                </Td>
              </>
            ) : (
              <>
                <Td>
                  <Skeleton height="20px" width="80px" />
                </Td>
                <Td>
                  <Skeleton height="20px" />
                </Td>
                <Td>
                  <Skeleton height="20px" />
                </Td>
                <Td>
                  <Skeleton height="20px" width="80px" />
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <SkeletonCircle size="24px" />
                    <SkeletonCircle size="24px" />
                  </HStack>
                </Td>
              </>
            )}
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default InventoryManager;
