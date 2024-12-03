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
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { AddIcon, ChevronDownIcon } from "@chakra-ui/icons";

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

  useEffect(() => {
    loadTickets();

    // Refresh tickets every minute
    const interval = setInterval(() => {
      loadTickets();
    }, 60000); // 60000 milliseconds = 1 minute

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, tickets, searchQuery]);

  // Load tickets from the backend or data source
  const loadTickets = async () => {
    try {
      const ticketsData = await window.cert.getTickets();
      const formattedTickets = ticketsData.map((ticket) => ({
        ...ticket,
        date:
          typeof ticket.date === "string"
            ? ticket.date
            : new Date(ticket.date).toISOString().split("T")[0], // Formatea la fecha como cadena
      }));
      setTickets(formattedTickets);
      setFilteredTickets(formattedTickets);
    } catch (error) {
      console.error("Error loading tickets:", error);
      toast({
        title: "Error",
        description: "Hubo un error al cargar los tickets.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Prevent changing the 'name' field
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data
    const errors = {};
    if (!formData.category) errors.category = "La categoría es obligatoria";
    if (!formData.description)
      errors.description = "La descripción es obligatoria";
    if (!formData.priority) errors.priority = "La prioridad es obligatoria";

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
        title: "Nuevo Ticket Agregado",
        description: `${formData.name} ha enviado un ticket en la categoría "${formData.category}" con prioridad "${formData.priority}".`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error adding ticket:", error);
      toast({
        title: "Error",
        description: "Hubo un error al agregar el ticket.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle status change and update in the database
  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      // Update the ticket in the backend (database)
      await window.cert.updateTicketStatus(ticketId, newStatus);

      // Update local state to reflect the new status
      const updatedTickets = tickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
      );
      setTickets(updatedTickets);
      applyFilters();
      toast({
        title: "Estado Actualizado",
        description: `El estado del ticket ha sido cambiado a "${newStatus}".`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast({
        title: "Error",
        description: "Hubo un error al actualizar el estado del ticket.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Get color based on the ticket count
  const getColorBasedOnCount = (count) => {
    if (count > 10) return "red.500";
    if (count > 5) return "yellow.500";
    return "green.500";
  };

  // Get Badge based on priority
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

  // Calculate statistics
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

  // New state statistics
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

  // Function to filter tickets by category
  const filterByCategory = (category) => {
    return filteredTickets.filter((ticket) => ticket.category === category);
  };

  // Function to get closed tickets for Logs tab
  const getClosedTickets = () => {
    return tickets.filter(
      (ticket) => ticket.status === "Closed" || ticket.status === "Resolved"
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
      >
        <Heading as="h1" size="lg" mb={6}>
          Ticket Manager
        </Heading>

        {/* Search Input */}
        <Input
          placeholder="Buscar tickets..."
          mb={4}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Filters */}
        <Heading as="h2" size="md" mb={4}>
          Filtros
        </Heading>

        <Select
          placeholder="Filtrar por estado"
          name="status"
          onChange={handleFilterChange}
          mb={4}
        >
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          {/* Removed 'Closed' from filter options to prevent displaying closed tickets */}
          <option value="Resolved">Resolved</option>
          {/* New status options */}
          <option value="On Transit">On Transit</option>
          <option value="Delivered">Delivered</option>
          <option value="Storage">Storage</option>
        </Select>

        <Select
          placeholder="Filtrar por prioridad"
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
          placeholder="Filtrar por fecha"
          mb={4}
        />

        <Button
          colorScheme="blue"
          w="full"
          onClick={onOpen}
          leftIcon={<AddIcon />}
        >
          Nuevo Ticket
        </Button>

        {/* Button to navigate to Home */}
        <Button
          colorScheme="gray"
          w="full"
          mt={2}
          onClick={() => navigate("/Home")}
        >
          Ir a Home
        </Button>
      </Box>

      {/* Main Content */}
      <Box flex="1" p={6} bg="gray.50">
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

          {/* New status statistics */}
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

        {/* Tabs for General, Asset Request, Console Movements, and Logs */}
        <Tabs variant="enclosed" colorScheme="blue" isFitted>
          <TabList mb="1em">
            <Tab>General</Tab>
            <Tab>Asset Request</Tab>
            <Tab>Console Movements</Tab>
            <Tab>Logs</Tab> {/* New Logs Tab */}
          </TabList>
          <TabPanels>
            {/* General Tab */}
            <TabPanel>
              <Heading as="h2" size="md" mb={4}>
                Todos los Tickets
              </Heading>
              {/* List of General Tickets */}
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
                      _hover={{ boxShadow: "lg", transition: "all 0.3s ease" }}
                    >
                      <HStack justifyContent="space-between" mb={3}>
                        <Heading as="h3" size="md">
                          {ticket.name}
                        </Heading>
                        {getPriorityBadge(ticket.priority)}
                      </HStack>

                      <Text fontSize="sm">
                        <strong>Categoría:</strong> {ticket.category}
                      </Text>
                      <Text fontSize="sm" noOfLines={2}>
                        <strong>Descripción:</strong> {ticket.description}
                      </Text>
                      <Text fontSize="sm">
                        <strong>Estado:</strong>{" "}
                        <Badge colorScheme="blue">{ticket.status}</Badge>
                      </Text>
                      <Text fontSize="sm">
                        <strong>Fecha:</strong> {ticket.date}
                      </Text>
                      <Text fontSize="sm">
                        <strong>Usuario:</strong> {ticket.username}
                      </Text>

                      {/* Dropdown to change status */}
                      <Menu>
                        <MenuButton
                          as={Button}
                          rightIcon={<ChevronDownIcon />}
                          mt={4}
                          size="sm"
                          colorScheme="blue"
                        >
                          Cambiar Estado
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
                          {/* New status options */}
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
                  <Text>No se encontraron tickets.</Text>
                )}
              </SimpleGrid>
            </TabPanel>

            {/* Asset Request Tab */}
            <TabPanel>
              <Heading as="h2" size="md" mb={4}>
                Tickets de Solicitud de Activos
              </Heading>
              {/* List of Asset Request Tickets */}
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
                      _hover={{ boxShadow: "lg", transition: "all 0.3s ease" }}
                    >
                      <HStack justifyContent="space-between" mb={3}>
                        <Heading as="h3" size="md">
                          {ticket.name}
                        </Heading>
                        {getPriorityBadge(ticket.priority)}
                      </HStack>

                      <Text fontSize="sm">
                        <strong>Categoría:</strong> {ticket.category}
                      </Text>
                      <Text fontSize="sm" noOfLines={2}>
                        <strong>Descripción:</strong> {ticket.description}
                      </Text>
                      <Text fontSize="sm">
                        <strong>Estado:</strong>{" "}
                        <Badge colorScheme="blue">{ticket.status}</Badge>
                      </Text>
                      <Text fontSize="sm">
                        <strong>Fecha:</strong> {ticket.date}
                      </Text>
                      <Text fontSize="sm">
                        <strong>Usuario:</strong> {ticket.username}
                      </Text>

                      {/* Dropdown to change status */}
                      <Menu>
                        <MenuButton
                          as={Button}
                          rightIcon={<ChevronDownIcon />}
                          mt={4}
                          size="sm"
                          colorScheme="blue"
                        >
                          Cambiar Estado
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
                          {/* New status options */}
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
                  <Text>
                    No se encontraron tickets de solicitud de activos.
                  </Text>
                )}
              </SimpleGrid>
            </TabPanel>

            {/* Console Movements Tab */}
            <TabPanel>
              <Heading as="h2" size="md" mb={4}>
                Tickets de Movimientos de Consolas
              </Heading>
              {/* List of Console Movements Tickets */}
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
                      _hover={{ boxShadow: "lg", transition: "all 0.3s ease" }}
                    >
                      <HStack justifyContent="space-between" mb={3}>
                        <Heading as="h3" size="md">
                          {ticket.name}
                        </Heading>
                        {getPriorityBadge(ticket.priority)}
                      </HStack>

                      <Text fontSize="sm">
                        <strong>Categoría:</strong> {ticket.category}
                      </Text>
                      <Text fontSize="sm" noOfLines={2}>
                        <strong>Descripción:</strong> {ticket.description}
                      </Text>
                      <Text fontSize="sm">
                        <strong>Estado:</strong>{" "}
                        <Badge colorScheme="blue">{ticket.status}</Badge>
                      </Text>
                      <Text fontSize="sm">
                        <strong>Fecha:</strong> {ticket.date}
                      </Text>
                      <Text fontSize="sm">
                        <strong>Usuario:</strong> {ticket.username}
                      </Text>

                      {/* Dropdown to change status */}
                      <Menu>
                        <MenuButton
                          as={Button}
                          rightIcon={<ChevronDownIcon />}
                          mt={4}
                          size="sm"
                          colorScheme="blue"
                        >
                          Cambiar Estado
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
                          {/* New status options */}
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
                  <Text>
                    No se encontraron tickets de movimientos de consolas.
                  </Text>
                )}
              </SimpleGrid>
            </TabPanel>

            {/* Logs Tab */}
            <TabPanel>
              <Heading as="h2" size="md" mb={4}>
                Logs
              </Heading>
              {/* List of Closed Tickets in Table Format */}
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Nombre del Ticket</Th>
                      <Th>Categoría</Th>
                      <Th>Prioridad</Th>
                      <Th>Estado</Th>
                      <Th>Fecha</Th>
                      <Th>Usuario</Th>
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
                          No hay logs disponibles.
                        </Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      {/* Form in Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Agregar Ticket</DrawerHeader>

          <DrawerBody>
            <form id="add-ticket-form" onSubmit={handleSubmit}>
              {/* Display 'Name' field as read-only */}
              <FormControl mb={4}>
                <FormLabel>Nombre</FormLabel>
                <Input
                  placeholder="Nombre"
                  name="name"
                  value={formData.name}
                  isReadOnly
                />
              </FormControl>

              <FormControl isInvalid={formErrors.category} mb={4}>
                <FormLabel>Categoría</FormLabel>
                <Select
                  placeholder="Selecciona una categoría"
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

              <FormControl isInvalid={formErrors.description} mb={4}>
                <FormLabel>Descripción</FormLabel>
                <Textarea
                  placeholder="Descripción"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
                {formErrors.description && (
                  <FormErrorMessage>{formErrors.description}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isInvalid={formErrors.priority} mb={4}>
                <FormLabel>Prioridad</FormLabel>
                <Select
                  placeholder="Selecciona la prioridad"
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
                <FormLabel>Estado</FormLabel>
                <Select
                  placeholder="Selecciona un estado"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  {/* Removed 'Closed' from status options to prevent adding closed tickets */}
                  {/* New status options */}
                  <option value="On Transit">On Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Storage">Storage</option>
                </Select>
              </FormControl>

              <FormControl mb={4}>
                <FormLabel>Fecha</FormLabel>
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
              Enviar
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default TicketManager;
