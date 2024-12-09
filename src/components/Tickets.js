// TicketManager.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Heading,
  Input,
  Text,
  Select,
  Textarea,
  SimpleGrid,
  useDisclosure,
  Drawer,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Badge,
  HStack,
  useToast,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Stat,
  StatLabel,
  StatNumber,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Skeleton,
  SkeletonText,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { AddIcon, ChevronDownIcon } from "@chakra-ui/icons";

const CustomPagination = ({ currentPage, totalPages, onPageChange }) => {
  const pageNumbers = [];

  // Generate page numbers
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Limit the number of displayed page buttons
  const maxPageButtons = 5;
  let startPage = 1;
  let endPage = totalPages;

  if (totalPages > maxPageButtons) {
    const middle = Math.floor(maxPageButtons / 2);
    if (currentPage <= middle) {
      startPage = 1;
      endPage = maxPageButtons;
    } else if (currentPage + middle >= totalPages) {
      startPage = totalPages - maxPageButtons + 1;
      endPage = totalPages;
    } else {
      startPage = currentPage - middle;
      endPage = currentPage + middle;
    }
  }

  const visiblePages = pageNumbers.slice(startPage - 1, endPage);

  return (
    <HStack spacing={2} mt={4} justify="center">
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        isDisabled={currentPage === 1}
        size="sm"
        variant="ghost"
      >
        Previous
      </Button>
      {startPage > 1 && (
        <>
          <Button onClick={() => onPageChange(1)} size="sm" variant="ghost">
            1
          </Button>
          {startPage > 2 && <Text>...</Text>}
        </>
      )}
      {visiblePages.map((number) => (
        <Button
          key={number}
          onClick={() => onPageChange(number)}
          variant={number === currentPage ? "solid" : "ghost"}
          colorScheme={number === currentPage ? "blue" : "gray"}
          size="sm"
        >
          {number}
        </Button>
      ))}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <Text>...</Text>}
          <Button
            onClick={() => onPageChange(totalPages)}
            size="sm"
            variant="ghost"
          >
            {totalPages}
          </Button>
        </>
      )}
      <Button
        onClick={() => onPageChange(currentPage + 1)}
        isDisabled={currentPage === totalPages}
        size="sm"
        variant="ghost"
      >
        Next
      </Button>
    </HStack>
  );
};

const TicketManager = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const toast = useToast();
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const username = localStorage.getItem("username") || "Guest";

  const [formData, setFormData] = useState({
    name: username,
    category: "",
    description: "",
    priority: "",
    status: "Open",
    date: new Date().toISOString().split("T")[0],
    username: username,
  });
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    date: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();

    // Update tickets every minute
    const interval = setInterval(() => {
      loadTickets();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, tickets, searchQuery]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const ticketsData = await window.cert.getTickets();
      const formattedTickets = ticketsData.map((ticket) => ({
        ...ticket,
        date:
          typeof ticket.date === "string"
            ? ticket.date
            : new Date(ticket.date).toISOString().split("T")[0],
      }));
      setTickets(formattedTickets);
      setFilteredTickets(formattedTickets);
      setLoading(false);
    } catch (error) {
      console.error("Error loading tickets:", error);
      toast({
        title: "Error",
        description: "There was an error loading the tickets.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Prevent changing 'name'
    if (name === "name") return;

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    const { status, priority, date } = filters;
    const filtered = tickets.filter((ticket) => {
      // Exclude closed and resolved tickets from filters
      if (ticket.status === "Closed" || ticket.status === "Resolved")
        return false;

      const matchesStatus = status ? ticket.status === status : true;
      const matchesPriority = priority ? ticket.priority === priority : true;
      const matchesDate = date ? ticket.date === date : true;
      const matchesSearch = searchQuery
        ? ticket.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchesStatus && matchesPriority && matchesDate && matchesSearch;
    });

    setFilteredTickets(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    if (!formData.category) errors.category = "Category is required";
    if (!formData.description) errors.description = "Description is required";
    if (!formData.priority) errors.priority = "Priority is required";

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    try {
      await window.cert.addTicket(formData);
      loadTickets();
      setFormData({
        name: username,
        category: "",
        description: "",
        priority: "",
        status: "Open",
        date: new Date().toISOString().split("T")[0],
        username: username,
      });
      onClose();
      toast({
        title: "New Ticket Added",
        description: `${formData.name} submitted a ticket in the "${formData.category}" category with "${formData.priority}" priority.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error adding ticket:", error);
      toast({
        title: "Error",
        description: "There was an error adding the ticket.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await window.cert.updateTicketStatus(ticketId, newStatus);

      const updatedTickets = tickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
      );
      setTickets(updatedTickets);
      applyFilters();
      toast({
        title: "Status Updated",
        description: `The ticket status has been changed to "${newStatus}".`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast({
        title: "Error",
        description: "There was an error updating the ticket status.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getColorBasedOnCount = (count) => {
    if (count > 10) return "red.500";
    if (count > 5) return "yellow.500";
    return "green.500";
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "Critical":
        return <Badge colorScheme="red">Critical</Badge>;
      case "High":
        return <Badge colorScheme="orange">High</Badge>;
      case "Medium":
        return <Badge colorScheme="yellow">Medium</Badge>;
      case "Low":
        return <Badge colorScheme="green">Low</Badge>;
      default:
        return <Badge colorScheme="gray">Unknown</Badge>;
    }
  };

  const totalTickets = tickets.length;
  const openTickets = tickets.filter(
    (ticket) => ticket.status === "Open"
  ).length;
  const inProgressTickets = tickets.filter(
    (ticket) => ticket.status === "In Progress"
  ).length;
  const closedTickets = tickets.filter(
    (ticket) => ticket.status === "Closed"
  ).length;
  const resolvedTickets = tickets.filter(
    (ticket) => ticket.status === "Resolved"
  ).length;

  const onTransitTickets = tickets.filter(
    (ticket) => ticket.status === "On Transit"
  ).length;
  const deliveredTickets = tickets.filter(
    (ticket) => ticket.status === "Delivered"
  ).length;
  const storageTickets = tickets.filter(
    (ticket) => ticket.status === "Storage"
  ).length;

  const criticalTickets = tickets.filter(
    (ticket) => ticket.priority === "Critical"
  ).length;
  const highTickets = tickets.filter(
    (ticket) => ticket.priority === "High"
  ).length;
  const mediumTickets = tickets.filter(
    (ticket) => ticket.priority === "Medium"
  ).length;
  const lowTickets = tickets.filter(
    (ticket) => ticket.priority === "Low"
  ).length;

  const filterByCategory = (category) => {
    return filteredTickets.filter((ticket) => ticket.category === category);
  };

  const getClosedTickets = () => {
    return tickets.filter(
      (ticket) => ticket.status === "Closed" || ticket.status === "Resolved"
    );
  };

  return (
    <Box display="flex" minH="100vh" fontSize="sm">
      {/* Sidebar */}
      <Box
        w="300px"
        bg="gray.100"
        p={6}
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
        <Heading as="h1" size="lg" mb={6} color="gray.700" textAlign="center">
          Ticket Manager
        </Heading>

        {/* Search Input */}
        <Input
          placeholder="Search tickets..."
          mb={4}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Filters */}
        <Heading as="h2" size="md" mb={4}>
          Filters
        </Heading>

        <Select
          placeholder="Filter by status"
          name="status"
          onChange={handleFilterChange}
          mb={4}
        >
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="On Transit">On Transit</option>
          <option value="Delivered">Delivered</option>
          <option value="Storage">Storage</option>
        </Select>

        <Select
          placeholder="Filter by priority"
          name="priority"
          onChange={handleFilterChange}
          mb={4}
        >
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </Select>

        <Input
          type="date"
          name="date"
          onChange={handleFilterChange}
          placeholder="Filter by date"
          mb={4}
        />

        <Button
          colorScheme="blue"
          w="full"
          onClick={onOpen}
          leftIcon={<AddIcon />}
        >
          New Ticket
        </Button>

        <Button
          colorScheme="gray"
          w="full"
          mt={2}
          onClick={() => navigate("/Home")}
        >
          Go to Home
        </Button>
      </Box>

      {/* Main Content */}
      <Box ml="300px" p={6} bg="gray.50" w="100%">
        {/* Statistics */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={6}>
          <Stat
            p={5}
            shadow="md"
            borderRadius="md"
            bg="white"
            borderLeftWidth="4px"
            borderColor={getColorBasedOnCount(openTickets)}
          >
            <StatLabel>Open Tickets</StatLabel>
            <StatNumber>{openTickets}</StatNumber>
          </Stat>

          <Stat
            p={5}
            shadow="md"
            borderRadius="md"
            bg="white"
            borderLeftWidth="4px"
            borderColor={getColorBasedOnCount(inProgressTickets)}
          >
            <StatLabel>In Progress</StatLabel>
            <StatNumber>{inProgressTickets}</StatNumber>
          </Stat>

          <Stat
            p={5}
            shadow="md"
            borderRadius="md"
            bg="white"
            borderLeftWidth="4px"
            borderColor={getColorBasedOnCount(onTransitTickets)}
          >
            <StatLabel>On Transit</StatLabel>
            <StatNumber>{onTransitTickets}</StatNumber>
          </Stat>

          <Stat
            p={5}
            shadow="md"
            borderRadius="md"
            bg="white"
            borderLeftWidth="4px"
            borderColor="blue.500"
          >
            <StatLabel>Total Tickets</StatLabel>
            <StatNumber>{totalTickets}</StatNumber>
          </Stat>
        </SimpleGrid>

        {/* Tabs */}
        <Tabs variant="enclosed" colorScheme="blue" isFitted>
          <TabList mb="1em">
            <Tab>General</Tab>
            <Tab>Asset Request</Tab>
            <Tab>Console Movements</Tab>
            <Tab>Logs</Tab>
          </TabList>
          <TabPanels>
            {/* General Tab */}
            <TabPanel>
              <Heading as="h2" size="md" mb={4}>
                All Tickets
              </Heading>
              {loading ? (
                <SimpleGrid columns={[1, 2, 3]} spacing={4}>
                  {[...Array(6)].map((_, i) => (
                    <Box
                      key={i}
                      p={4}
                      borderWidth="1px"
                      borderRadius="lg"
                      boxShadow="md"
                      bg="white"
                    >
                      <Skeleton height="20px" mb={3} />
                      <SkeletonText noOfLines={4} spacing="4" />
                      <Skeleton height="30px" mt={4} />
                    </Box>
                  ))}
                </SimpleGrid>
              ) : (
                <SimpleGrid columns={[1, 2, 3]} spacing={4}>
                  {filteredTickets.length > 0 ? (
                    filteredTickets.map((ticket) => (
                      <Box
                        key={ticket.id}
                        p={4}
                        borderWidth="1px"
                        borderRadius="lg"
                        boxShadow="md"
                        bg="white"
                        _hover={{
                          boxShadow: "lg",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <HStack justifyContent="space-between" mb={3}>
                          <Heading as="h3" size="md">
                            {ticket.name}
                          </Heading>
                          {getPriorityBadge(ticket.priority)}
                        </HStack>

                        <Text fontSize="sm">
                          <strong>Category:</strong> {ticket.category}
                        </Text>
                        <Text fontSize="sm" noOfLines={2}>
                          <strong>Description:</strong> {ticket.description}
                        </Text>
                        <Text fontSize="sm">
                          <strong>Status:</strong>{" "}
                          <Badge colorScheme="blue">{ticket.status}</Badge>
                        </Text>
                        <Text fontSize="sm">
                          <strong>Date:</strong> {ticket.date}
                        </Text>
                        <Text fontSize="sm">
                          <strong>User:</strong> {ticket.username}
                        </Text>

                        <Menu>
                          <MenuButton
                            as={Button}
                            rightIcon={<ChevronDownIcon />}
                            mt={4}
                            size="sm"
                            colorScheme="blue"
                          >
                            Change Status
                          </MenuButton>
                          <MenuList>
                            <MenuItem
                              onClick={() =>
                                handleStatusChange(ticket.id, "Open")
                              }
                            >
                              Open
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                handleStatusChange(ticket.id, "In Progress")
                              }
                            >
                              In Progress
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                handleStatusChange(ticket.id, "Closed")
                              }
                            >
                              Closed
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                handleStatusChange(ticket.id, "Resolved")
                              }
                            >
                              Resolved
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                handleStatusChange(ticket.id, "On Transit")
                              }
                            >
                              On Transit
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                handleStatusChange(ticket.id, "Delivered")
                              }
                            >
                              Delivered
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                handleStatusChange(ticket.id, "Storage")
                              }
                            >
                              Storage
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Box>
                    ))
                  ) : (
                    <Text>No tickets found.</Text>
                  )}
                </SimpleGrid>
              )}
            </TabPanel>

            {/* Asset Request Tab */}
            <TabPanel>
              <Heading as="h2" size="md" mb={4}>
                Asset Request Tickets
              </Heading>
              {loading ? (
                <SimpleGrid columns={[1, 2, 3]} spacing={4}>
                  {[...Array(6)].map((_, i) => (
                    <Box
                      key={i}
                      p={4}
                      borderWidth="1px"
                      borderRadius="lg"
                      boxShadow="md"
                      bg="white"
                    >
                      <Skeleton height="20px" mb={3} />
                      <SkeletonText noOfLines={4} spacing="4" />
                      <Skeleton height="30px" mt={4} />
                    </Box>
                  ))}
                </SimpleGrid>
              ) : (
                <SimpleGrid columns={[1, 2, 3]} spacing={4}>
                  {filterByCategory("Asset Request").length > 0 ? (
                    filterByCategory("Asset Request").map((ticket) => (
                      <Box
                        key={ticket.id}
                        p={4}
                        borderWidth="1px"
                        borderRadius="lg"
                        boxShadow="md"
                        bg="white"
                        _hover={{
                          boxShadow: "lg",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <HStack justifyContent="space-between" mb={3}>
                          <Heading as="h3" size="md">
                            {ticket.name}
                          </Heading>
                          {getPriorityBadge(ticket.priority)}
                        </HStack>

                        <Text fontSize="sm">
                          <strong>Category:</strong> {ticket.category}
                        </Text>
                        <Text fontSize="sm" noOfLines={2}>
                          <strong>Description:</strong> {ticket.description}
                        </Text>
                        <Text fontSize="sm">
                          <strong>Status:</strong>{" "}
                          <Badge colorScheme="blue">{ticket.status}</Badge>
                        </Text>
                        <Text fontSize="sm">
                          <strong>Date:</strong> {ticket.date}
                        </Text>
                        <Text fontSize="sm">
                          <strong>User:</strong> {ticket.username}
                        </Text>

                        <Menu>
                          <MenuButton
                            as={Button}
                            rightIcon={<ChevronDownIcon />}
                            mt={4}
                            size="sm"
                            colorScheme="blue"
                          >
                            Change Status
                          </MenuButton>
                          <MenuList>
                            <MenuItem
                              onClick={() =>
                                handleStatusChange(ticket.id, "Open")
                              }
                            >
                              Open
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                handleStatusChange(ticket.id, "In Progress")
                              }
                            >
                              In Progress
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                handleStatusChange(ticket.id, "Closed")
                              }
                            >
                              Closed
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                handleStatusChange(ticket.id, "Resolved")
                              }
                            >
                              Resolved
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                handleStatusChange(ticket.id, "On Transit")
                              }
                            >
                              On Transit
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                handleStatusChange(ticket.id, "Delivered")
                              }
                            >
                              Delivered
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                handleStatusChange(ticket.id, "Storage")
                              }
                            >
                              Storage
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Box>
                    ))
                  ) : (
                    <Text>No asset request tickets found.</Text>
                  )}
                </SimpleGrid>
              )}
            </TabPanel>

            {/* Console Movements Tab */}
            <TabPanel>
              <Heading as="h2" size="md" mb={4}>
                Console Movement Tickets
              </Heading>
              {loading ? (
                <SimpleGrid columns={[1, 2, 3]} spacing={4}>
                  {[...Array(6)].map((_, i) => (
                    <Box
                      key={i}
                      p={4}
                      borderWidth="1px"
                      borderRadius="lg"
                      boxShadow="md"
                      bg="white"
                    >
                      <Skeleton height="20px" mb={3} />
                      <SkeletonText noOfLines={4} spacing="4" />
                      <Skeleton height="30px" mt={4} />
                    </Box>
                  ))}
                </SimpleGrid>
              ) : (
                <SimpleGrid columns={[1, 2, 3]} spacing={4}>
                  {filterByCategory("Console Movement").length > 0 ? (
                    filterByCategory("Console Movement").map((ticket) => (
                      <Box
                        key={ticket.id}
                        p={4}
                        borderWidth="1px"
                        borderRadius="lg"
                        boxShadow="md"
                        bg="white"
                        _hover={{
                          boxShadow: "lg",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <HStack justifyContent="space-between" mb={3}>
                          <Heading as="h3" size="md">
                            {ticket.name}
                          </Heading>
                          {getPriorityBadge(ticket.priority)}
                        </HStack>

                        <Text fontSize="sm">
                          <strong>Category:</strong> {ticket.category}
                        </Text>
                        <Text fontSize="sm" noOfLines={2}>
                          <strong>Description:</strong> {ticket.description}
                        </Text>
                        <Text fontSize="sm">
                          <strong>Status:</strong>{" "}
                          <Badge colorScheme="blue">{ticket.status}</Badge>
                        </Text>
                        <Text fontSize="sm">
                          <strong>Date:</strong> {ticket.date}
                        </Text>
                        <Text fontSize="sm">
                          <strong>User:</strong> {ticket.username}
                        </Text>

                        <Menu>
                          <MenuButton
                            as={Button}
                            rightIcon={<ChevronDownIcon />}
                            mt={4}
                            size="sm"
                            colorScheme="blue"
                          >
                            Change Status
                          </MenuButton>
                          <MenuList>
                            <MenuItem
                              onClick={() =>
                                handleStatusChange(ticket.id, "Open")
                              }
                            >
                              Open
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                handleStatusChange(ticket.id, "In Progress")
                              }
                            >
                              In Progress
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                handleStatusChange(ticket.id, "Closed")
                              }
                            >
                              Closed
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                handleStatusChange(ticket.id, "Resolved")
                              }
                            >
                              Resolved
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                handleStatusChange(ticket.id, "On Transit")
                              }
                            >
                              On Transit
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                handleStatusChange(ticket.id, "Delivered")
                              }
                            >
                              Delivered
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                handleStatusChange(ticket.id, "Storage")
                              }
                            >
                              Storage
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Box>
                    ))
                  ) : (
                    <Text>No console movement tickets found.</Text>
                  )}
                </SimpleGrid>
              )}
            </TabPanel>

            {/* Logs Tab */}
            <TabPanel>
              <Heading as="h2" size="md" mb={4}>
                Logs
              </Heading>
              {loading ? (
                <SimpleGrid columns={[1]} spacing={4}>
                  {[...Array(3)].map((_, i) => (
                    <Box
                      key={i}
                      p={4}
                      borderWidth="1px"
                      borderRadius="lg"
                      boxShadow="md"
                      bg="white"
                    >
                      <Skeleton height="20px" mb={3} />
                      <Skeleton height="20px" mb={3} />
                      <Skeleton height="20px" mb={3} />
                      <Skeleton height="20px" mb={3} />
                    </Box>
                  ))}
                </SimpleGrid>
              ) : (
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Ticket Name</Th>
                        <Th>Category</Th>
                        <Th>Priority</Th>
                        <Th>Status</Th>
                        <Th>Date</Th>
                        <Th>User</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {getClosedTickets().length > 0 ? (
                        getClosedTickets().map((ticket) => (
                          <Tr key={ticket.id}>
                            <Td>{ticket.name}</Td>
                            <Td>{ticket.category}</Td>
                            <Td>
                              <Badge
                                colorScheme={
                                  ticket.priority === "Critical"
                                    ? "red"
                                    : ticket.priority === "High"
                                    ? "orange"
                                    : ticket.priority === "Medium"
                                    ? "yellow"
                                    : "green"
                                }
                              >
                                {ticket.priority}
                              </Badge>
                            </Td>
                            <Td>
                              <Badge colorScheme="green">{ticket.status}</Badge>
                            </Td>
                            <Td>{ticket.date}</Td>
                            <Td>{ticket.username}</Td>
                          </Tr>
                        ))
                      ) : (
                        <Tr>
                          <Td colSpan={6} textAlign="center">
                            No logs available.
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      {/* Drawer for Adding Tickets */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Add Ticket</DrawerHeader>

          <DrawerBody>
            <form id="add-ticket-form" onSubmit={handleSubmit}>
              <FormControl mb={4}>
                <FormLabel>Name</FormLabel>
                <Input
                  placeholder="Name"
                  name="name"
                  value={formData.name}
                  isReadOnly
                />
              </FormControl>

              <FormControl isInvalid={formErrors.category} mb={4} isRequired>
                <FormLabel>Category</FormLabel>
                <Select
                  placeholder="Select a category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="Hardware">Hardware</option>
                  <option value="Software">Software</option>
                  <option value="Network">Network</option>
                  <option value="Database">Database</option>
                  <option value="Accounts">Accounts</option>
                  <option value="Sandbox Change">Sandbox Change</option>
                  <option value="Console Movement">Console Movement</option>
                  <option value="Asset Request">Asset Request</option>
                  <option value="Other">Other</option>
                </Select>
                {formErrors.category && (
                  <FormErrorMessage>{formErrors.category}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isInvalid={formErrors.description} mb={4} isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
                {formErrors.description && (
                  <FormErrorMessage>{formErrors.description}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isInvalid={formErrors.priority} mb={4} isRequired>
                <FormLabel>Priority</FormLabel>
                <Select
                  placeholder="Select a priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </Select>
                {formErrors.priority && (
                  <FormErrorMessage>{formErrors.priority}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl mb={4}>
                <FormLabel>Status</FormLabel>
                <Select
                  placeholder="Select a status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="On Transit">On Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Storage">Storage</option>
                </Select>
              </FormControl>

              <FormControl mb={4}>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                />
              </FormControl>
            </form>
          </DrawerBody>

          <DrawerFooter>
            <Button
              w="full"
              colorScheme="blue"
              type="submit"
              form="add-ticket-form"
            >
              Submit
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default TicketManager;
