// PurchaseTracker.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Button,
  Input,
  FormControl,
  Skeleton,
  FormLabel,
  useDisclosure,
  Heading,
  Text,
  SimpleGrid,
  Divider,
  VStack,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  useToast,
  FormErrorMessage,
  Stat,
  StatLabel,
  StatNumber,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  DrawerCloseButton,
  IconButton,
  HStack,
  Textarea,
  Spinner,
} from "@chakra-ui/react";
import { CopyIcon, AddIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";

const PurchaseTracker = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [purchases, setPurchases] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false); // Loading state for fetching purchases
  const [submitting, setSubmitting] = useState(false); // Loading state for form submission
  const toast = useToast();
  const navigate = useNavigate();

  const [purchaseForm, setPurchaseForm] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    price: "",
    account: "",
    reason: "",
  });

  // Function to load purchases
  const loadPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedPurchases = await window.cert.getPurchases();

      // Normalize purchases data
      const normalizedPurchases = fetchedPurchases.map((purchase) => ({
        ...purchase,
        date:
          typeof purchase.date === "string"
            ? purchase.date
            : new Date(purchase.date).toISOString().split("T")[0],
      }));

      setPurchases(normalizedPurchases);
      toast({
        title: "Purchases Loaded",
        description: "All purchases have been successfully loaded.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error loading purchases:", error);
      toast({
        title: "Error",
        description:
          "There was an error loading purchases. Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  // Handle input changes in the form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPurchaseForm({ ...purchaseForm, [name]: value });
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = {};
    if (!purchaseForm.title) errors.title = "Title is required";
    if (!purchaseForm.price) errors.price = "Price is required";
    if (!purchaseForm.account) errors.account = "Account is required";
    if (!purchaseForm.reason) errors.reason = "Reason is required";

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await window.cert.addPurchase(purchaseForm);
      setPurchaseForm({
        title: "",
        date: new Date().toISOString().split("T")[0],
        price: "",
        account: "",
        reason: "",
      });
      onClose();
      loadPurchases();
      toast({
        title: "Purchase Added",
        description: "The purchase has been added successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error adding purchase:", error);
      toast({
        title: "Error",
        description:
          "There was an error adding the purchase. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle purchase selection
  const showPurchaseDetails = (purchase) => {
    setSelectedPurchase(purchase);
  };

  // Handle search functionality
  const handleSearch = async (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    try {
      const searchedPurchases = await window.cert.searchPurchases(query);
      setPurchases(searchedPurchases);
      toast({
        title: "Search Completed",
        description: `Found ${searchedPurchases.length} purchase(s) matching your query.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error searching purchases:", error);
      toast({
        title: "Error",
        description:
          "There was an error searching purchases. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Calculate total amount spent
  const calculateTotalSpent = () => {
    return purchases
      .reduce((acc, purchase) => acc + Number(purchase.price || 0), 0)
      .toFixed(2);
  };

  // Memoize current page purchases for performance
  const currentUpdates = useMemo(() => {
    const indexOfLastUpdate = currentPage * itemsPerPage;
    const indexOfFirstUpdate = indexOfLastUpdate - itemsPerPage;
    return purchases.slice(indexOfFirstUpdate, indexOfLastUpdate);
  }, [purchases, currentPage]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = useMemo(() => {
    return Math.ceil(purchases.length / itemsPerPage);
  }, [purchases.length]);

  // Handle pagination
  const handlePageChange = (direction) => {
    setCurrentPage((prev) => {
      if (direction === "prev") return Math.max(prev - 1, 1);
      if (direction === "next") return Math.min(prev + 1, totalPages);
      return prev;
    });
  };

  return (
    <Box display="flex" minH="100vh">
      {/* Sidebar */}
      <Box w="20%" bg="gray.100" p={4} borderRight="1px" borderColor="gray.200">
        <Heading as="h1" size="lg" mb={6}>
          Purchase Tracker
        </Heading>

        <Input
          placeholder="Search purchases..."
          mb={4}
          value={searchQuery}
          onChange={handleSearch}
        />

        <Button
          colorScheme="blue"
          w="full"
          mb={4}
          onClick={onOpen}
          leftIcon={<AddIcon />}
          isDisabled={submitting}
        >
          Add Purchase
        </Button>

        <Button
          colorScheme="gray"
          w="full"
          onClick={() => navigate("/home")} // Navigate to home page
          mb={4}
        >
          Go to Home
        </Button>

        <Divider my={4} />

        <Heading as="h2" size="md" mb={4}>
          Purchases
        </Heading>
        <VStack align="start" spacing={3} overflowY="auto" maxH="60vh">
          {loading ? (
            <>
              <Skeleton height="40px" width="100%" />
              <Skeleton height="40px" width="100%" />
              <Skeleton height="40px" width="100%" />
            </>
          ) : purchases.length > 0 ? (
            purchases.map((purchase) => (
              <Box
                key={purchase.id}
                p={3}
                bg="white"
                w="100%"
                borderRadius="md"
                boxShadow="sm"
                _hover={{ boxShadow: "md", cursor: "pointer" }}
                onClick={() => showPurchaseDetails(purchase)}
              >
                <Text fontWeight="bold">{purchase.title}</Text>
                <Text fontSize="sm" color="gray.600">
                  {purchase.account}
                </Text>
              </Box>
            ))
          ) : (
            <Text>No purchases tracked yet.</Text>
          )}
        </VStack>
      </Box>

      {/* Main Content */}
      <Box flex="1" p={6} bg="gray.50">
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
          <Stat
            p={5}
            shadow="md"
            borderRadius="md"
            bg="white"
            borderLeftWidth="4px"
            borderColor="blue.500"
          >
            <StatLabel>Total Purchases</StatLabel>
            <StatNumber>{purchases.length}</StatNumber>
          </Stat>

          <Stat
            p={5}
            shadow="md"
            borderRadius="md"
            bg="white"
            borderLeftWidth="4px"
            borderColor="green.500"
          >
            <StatLabel>Total Spent</StatLabel>
            <StatNumber>${calculateTotalSpent()}</StatNumber>
          </Stat>
        </SimpleGrid>

        {selectedPurchase ? (
          <Box p={6} bg="white" borderRadius="md" shadow="md" borderWidth="1px">
            <HStack justifyContent="space-between" mb={4}>
              <Heading size="md" color="gray.700">
                {selectedPurchase.title}
              </Heading>
              <IconButton
                icon={<CopyIcon />}
                colorScheme="blue"
                aria-label="Copy details"
                onClick={() =>
                  navigator.clipboard.writeText(
                    JSON.stringify(selectedPurchase, null, 2)
                  )
                }
              />
            </HStack>

            <Tabs variant="enclosed" colorScheme="blue">
              <TabList>
                <Tab>Details</Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box>
                      <Text fontWeight="bold" mb={2}>
                        Date:
                      </Text>
                      <Text>{selectedPurchase.date}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold" mb={2}>
                        Price:
                      </Text>
                      <Text>${selectedPurchase.price}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold" mb={2}>
                        Account:
                      </Text>
                      <Text>{selectedPurchase.account}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold" mb={2}>
                        Reason for Purchase:
                      </Text>
                      <Text>{selectedPurchase.reason}</Text>
                    </Box>
                  </SimpleGrid>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        ) : (
          <Box
            p={6}
            bg="white"
            borderRadius="md"
            shadow="md"
            borderWidth="1px"
            textAlign="center"
          >
            <Text fontSize="lg" color="gray.600">
              Select a purchase to view details
            </Text>
          </Box>
        )}

        {/* Pagination Controls */}
        {purchases.length > itemsPerPage && (
          <Flex mt={6} justifyContent="center" alignItems="center">
            <Button
              onClick={() => handlePageChange("prev")}
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
              onClick={() => handlePageChange("next")}
              isDisabled={currentPage === totalPages}
              rightIcon={<ChevronRightIcon />}
              ml={4}
            >
              Next
            </Button>
          </Flex>
        )}
      </Box>

      {/* Drawer for adding a new purchase */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="lg">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Add New Purchase</DrawerHeader>
          <DrawerBody padding={8} bg="gray.50">
            <VStack spacing={8} align="stretch">
              <FormControl isInvalid={formErrors.title} isRequired>
                <FormLabel>Title</FormLabel>
                <Input
                  type="text"
                  name="title"
                  value={purchaseForm.title}
                  onChange={handleInputChange}
                  placeholder="Enter purchase title"
                />
                {formErrors.title && (
                  <FormErrorMessage>{formErrors.title}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  name="date"
                  value={purchaseForm.date}
                  onChange={handleInputChange}
                />
              </FormControl>

              <FormControl isInvalid={formErrors.price} isRequired>
                <FormLabel>Price</FormLabel>
                <Input
                  type="number"
                  name="price"
                  value={purchaseForm.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="Enter price"
                />
                {formErrors.price && (
                  <FormErrorMessage>{formErrors.price}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isInvalid={formErrors.account} isRequired>
                <FormLabel>Account</FormLabel>
                <Input
                  type="text"
                  name="account"
                  value={purchaseForm.account}
                  onChange={handleInputChange}
                  placeholder="Enter account email"
                />
                {formErrors.account && (
                  <FormErrorMessage>{formErrors.account}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isInvalid={formErrors.reason} isRequired>
                <FormLabel>Reason for Purchase</FormLabel>
                <Textarea
                  name="reason"
                  value={purchaseForm.reason}
                  onChange={handleInputChange}
                  placeholder="Explain why you bought this item"
                  resize="vertical"
                />
                {formErrors.reason && (
                  <FormErrorMessage>{formErrors.reason}</FormErrorMessage>
                )}
              </FormControl>
            </VStack>
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px" bg="gray.100" padding={6}>
            <Button
              w="full"
              colorScheme="blue"
              type="submit"
              onClick={handleSubmit}
              isLoading={submitting}
              loadingText="Submitting"
            >
              Submit
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default PurchaseTracker;
