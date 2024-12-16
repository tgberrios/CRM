// SGCTracker.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  VStack,
  Heading,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  Textarea,
  useToast,
  HStack,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Spinner,
  Flex,
  Spacer,
  FormErrorMessage,
  useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  DownloadIcon,
  AttachmentIcon,
} from "@chakra-ui/icons";

// Import the xlsx library for handling Excel files
import * as XLSX from "xlsx";

// Pagination Component (Optimizado con React.memo)
const CustomPagination = React.memo(
  ({ currentPage, totalPages, onPageChange }) => {
    const pageNumbers = [];

    // Generar números de página
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

    // Limitar el número de botones de página mostrados para una mejor experiencia de usuario
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
  }
);

// Subcomponente para la Tabla de Entradas (Optimizado con React.memo)
const EntriesTable = React.memo(({ entries, onEdit, onDelete }) => (
  <Table variant="simple" size="md">
    <Thead>
      <Tr>
        <Th>Title</Th>
        <Th>Date</Th>
        <Th>User</Th>
        <Th>Actions</Th>
      </Tr>
    </Thead>
    <Tbody>
      {entries.length > 0 ? (
        entries.map((item) => (
          <Tr key={item.id}>
            <Td>{item.title_name}</Td>
            <Td>{item.date}</Td>
            <Td>{item.username}</Td>
            <Td>
              <HStack spacing={2}>
                <IconButton
                  icon={<EditIcon />}
                  colorScheme="blue"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(item)}
                  aria-label="Edit Entry"
                />
                <IconButton
                  icon={<DeleteIcon />}
                  colorScheme="red"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(item.id)}
                  aria-label="Delete Entry"
                />
              </HStack>
            </Td>
          </Tr>
        ))
      ) : (
        <Tr>
          <Td colSpan="4">
            <Text textAlign="center">No data available</Text>
          </Td>
        </Tr>
      )}
    </Tbody>
  </Table>
));

const SGCTracker = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    position: "",
    email: "",
    gamertag: "",
    title_name: "",
    title_version: "",
    submission_iteration: "",
    progress: "",
    options: "",
    publisher_accounts: "",
    publisher_password: "",
    username: "",
  });

  const [dataList, setDataList] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false); // Estado de carga para la obtención de datos
  const [submitting, setSubmitting] = useState(false); // Estado de carga para el envío del formulario
  const toast = useToast();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [stats, setStats] = useState({
    totalSGC: 0,
    recentEntries: [],
    mostActiveUser: "",
  });

  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' o 'desc'

  // Estado para el ancho de la barra lateral
  const [sidebarWidth, setSidebarWidth] = useState(350); // Ancho inicial en px
  const [isResizing, setIsResizing] = useState(false);

  // Funciones para manejar el redimensionamiento de la barra lateral
  const startResizing = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resizeSidebar = useCallback(
    (e) => {
      if (isResizing) {
        const newWidth = e.clientX;
        // Establecer límites mínimos y máximos
        if (newWidth >= 250 && newWidth <= 600) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resizeSidebar);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", resizeSidebar);
      window.removeEventListener("mouseup", stopResizing);
    }

    return () => {
      window.removeEventListener("mousemove", resizeSidebar);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resizeSidebar, stopResizing]);

  // Cargar todos los datos al montar el componente
  useEffect(() => {
    const username = localStorage.getItem("username") || "";
    setFormData((prev) => ({ ...prev, username }));
    loadAllData();
  }, [loadAllData]);

  // Calcular estadísticas cada vez que cambia dataList
  useEffect(() => {
    calculateStats();
  }, [dataList, calculateStats]);

  // Función para calcular estadísticas
  const calculateStats = useCallback(() => {
    const totalSGC = dataList.length;
    const today = new Date().toISOString().split("T")[0];
    const recentEntries = dataList.filter((entry) => entry.date === today);

    const uploaderCount = dataList.reduce((acc, entry) => {
      acc[entry.username] = (acc[entry.username] || 0) + 1;
      return acc;
    }, {});

    const uploaderKeys = Object.keys(uploaderCount);
    let mostActiveUser = "";

    if (uploaderKeys.length > 0) {
      mostActiveUser = uploaderKeys.reduce((a, b) =>
        uploaderCount[a] > uploaderCount[b] ? a : b
      );
    }

    setStats({
      totalSGC,
      recentEntries,
      mostActiveUser,
    });
  }, [dataList]);

  // Función para cargar todos los datos
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await window.cert.loadAllData();
      const formattedData = data.map((item) => ({
        ...item,
        date:
          typeof item.date === "string"
            ? item.date
            : new Date(item.date).toISOString().split("T")[0],
      }));
      setDataList(formattedData);
      toast({
        title: "Data Loaded",
        description: "All entries have been successfully loaded.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description:
          "There was an error loading the data. Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Manejar cambios en los inputs del formulario
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Manejar el envío del formulario para agregar/editar entradas
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    if (!formData.title_name) errors.title_name = "Title name is required";
    if (!formData.date) errors.date = "Date is required";
    if (!formData.position) errors.position = "Position is required";
    if (!formData.email) errors.email = "Email is required";
    if (!formData.gamertag) errors.gamertag = "Gamertag is required";
    if (!formData.publisher_accounts)
      errors.publisher_accounts = "Publisher account is required";
    if (!formData.publisher_password)
      errors.publisher_password = "Publisher password is required";

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const updatedFormData = { ...formData, username: formData.username };

      if (selectedItem) {
        await window.cert.editData(selectedItem.id, updatedFormData);
        toast({
          title: "Entry Updated",
          description: "The entry has been successfully updated.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        await window.cert.saveData(updatedFormData);
        toast({
          title: "Entry Saved",
          description: "The entry has been successfully saved.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
      loadAllData();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving data:", error);
      toast({
        title: "Error",
        description: "There was an error saving the entry.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Función para abrir el modal y cargar detalles de una entrada
  const showItemDetails = useCallback(
    async (item) => {
      try {
        setSelectedItem(item);
        setFormData(item);
        onOpen();
      } catch (error) {
        console.error("Error loading item details:", error);
        toast({
          title: "Error",
          description: "There was an error loading the item details.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [onOpen, toast]
  );

  // Manejar la búsqueda
  const handleSearch = useCallback((e) => {
    setSearchQuery(e.target.value.toLowerCase());
    setCurrentPage(1); // Reiniciar a la primera página en una nueva búsqueda
  }, []);

  // Filtrar y ordenar los datos basados en la búsqueda y el orden seleccionado
  const filteredData = useMemo(() => {
    let data = dataList.filter(
      (item) =>
        (item.title_name &&
          item.title_name.toLowerCase().includes(searchQuery)) ||
        (item.date && item.date.toLowerCase().includes(searchQuery))
    );

    data.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (sortOrder === "asc") {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });

    return data;
  }, [dataList, searchQuery, sortOrder]);

  // Cerrar el modal y reiniciar el formulario
  const handleCloseModal = useCallback(() => {
    setSelectedItem(null);
    onClose();
    resetFormData();
  }, [onClose]);

  // Reiniciar los datos del formulario a los valores por defecto
  const resetFormData = useCallback(() => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      position: "",
      email: "",
      gamertag: "",
      title_name: "",
      title_version: "",
      submission_iteration: "",
      progress: "",
      options: "",
      publisher_accounts: "",
      publisher_password: "",
      username: localStorage.getItem("username") || "",
    });
    setFormErrors({});
  }, []);

  // Manejar la eliminación de una entrada
  const handleDelete = useCallback(
    async (itemId) => {
      try {
        await window.cert.deleteData(itemId);
        toast({
          title: "Entry Deleted",
          description: "The entry has been successfully deleted.",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        loadAllData();
      } catch (error) {
        console.error("Error deleting data:", error);
        toast({
          title: "Error",
          description: "There was an error deleting the entry.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [loadAllData, toast]
  );

  // Función para exportar datos a Excel
  const exportToExcel = useCallback(() => {
    const worksheet = XLSX.utils.json_to_sheet(dataList);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SGC_Tracker_Data");
    XLSX.writeFile(workbook, "SGC_Tracker_Data.xlsx");
    toast({
      title: "Data Exported",
      description: "The data has been exported to Excel successfully.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  }, [dataList, toast]);

  // Función para importar datos desde Excel
  const importFromExcel = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (file) {
        // Crear un FileReader
        const reader = new FileReader();
        reader.onload = async (event) => {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: "array" });

          // Asumir que la primera hoja es la que queremos
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const importedData = XLSX.utils.sheet_to_json(worksheet);

          // Guardar cada entrada usando window.cert.saveData
          try {
            setLoading(true);
            for (let entry of importedData) {
              // Asegurar que la fecha esté correctamente formateada
              entry.date =
                typeof entry.date === "string"
                  ? entry.date
                  : new Date(entry.date).toISOString().split("T")[0];
              await window.cert.saveData(entry);
            }
            toast({
              title: "Data Imported",
              description: "The data has been imported successfully.",
              status: "success",
              duration: 3000,
              isClosable: true,
            });
            loadAllData();
          } catch (error) {
            console.error("Error importing data:", error);
            toast({
              title: "Error",
              description: "There was an error importing the data.",
              status: "error",
              duration: 3000,
              isClosable: true,
            });
          } finally {
            setLoading(false);
          }
        };
        reader.readAsArrayBuffer(file);
      }
    },
    [loadAllData, toast]
  );

  // Determinar las entradas a mostrar en la página actual
  const currentEntries = useMemo(() => {
    const indexOfLastEntry = currentPage * itemsPerPage;
    const indexOfFirstEntry = indexOfLastEntry - itemsPerPage;
    return filteredData.slice(indexOfFirstEntry, indexOfLastEntry);
  }, [filteredData, currentPage]);

  // Calcular el número total de páginas
  const totalPages = useMemo(() => {
    return Math.ceil(filteredData.length / itemsPerPage);
  }, [filteredData.length]);

  // Función para alternar el orden de clasificación
  const toggleSortOrder = useCallback(() => {
    setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
  }, []);

  return (
    <Box display="flex" minH="100vh" fontSize="sm">
      {/* Sidebar */}
      <Box
        w={`${sidebarWidth}px`}
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
        transition="width 0.2s"
      >
        <Heading as="h1" size="lg" mb={6} color="gray.700" textAlign="center">
          SGC Tracker
        </Heading>

        {/* Botones */}
        <VStack spacing={4} mb={6} align="stretch">
          <Button
            colorScheme="blue"
            w="full"
            onClick={() => {
              resetFormData();
              onOpen();
            }}
            leftIcon={<AddIcon />}
            isLoading={submitting}
          >
            Add Entry
          </Button>

          <Button colorScheme="gray" w="full" onClick={() => navigate("/Home")}>
            Go to Home
          </Button>

          {/* Botones de Exportar e Importar */}
          <Button
            colorScheme="green"
            w="full"
            onClick={exportToExcel}
            leftIcon={<DownloadIcon />}
          >
            Export to Excel
          </Button>
          <Button
            as="label"
            colorScheme="purple"
            w="full"
            cursor="pointer"
            leftIcon={<AttachmentIcon />}
          >
            Import from Excel
            <Input
              type="file"
              accept=".xlsx, .xls"
              display="none"
              onChange={importFromExcel}
            />
          </Button>
        </VStack>

        {/* Campo de búsqueda */}
        <FormControl mb={6}>
          <FormLabel>Search by Title or Date</FormLabel>
          <Input
            placeholder="Search by Title or Date"
            value={searchQuery}
            onChange={handleSearch}
          />
        </FormControl>

        <Divider my={4} />

        <Heading as="h2" size="md" mb={4} color="gray.700" textAlign="center">
          Titles
        </Heading>

        {/* Lista de Títulos */}
        <Box
          flex="1"
          overflowY="auto"
          pr={2}
          css={{
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#c1c1c1",
              borderRadius: "3px",
            },
          }}
        >
          {loading ? (
            <VStack spacing={3}>
              <Spinner size="lg" color="blue.500" />
              <Text>Loading titles...</Text>
            </VStack>
          ) : filteredData.length > 0 ? (
            currentEntries.map((item) => (
              <Box
                key={item.id}
                p={4}
                bg="white"
                w="100%"
                borderRadius="md"
                boxShadow="sm"
                mb={4}
                _hover={{ boxShadow: "md", cursor: "pointer", bg: "blue.50" }}
                onClick={() => showItemDetails(item)}
              >
                <HStack justifyContent="space-between">
                  <Text fontWeight="bold" isTruncated>
                    {item.title_name}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {item.date}
                  </Text>
                </HStack>
              </Box>
            ))
          ) : (
            <Text textAlign="center">No data available</Text>
          )}
        </Box>

        {/* Controles de Paginación */}
        {totalPages > 1 && (
          <Box mt={4}>
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </Box>
        )}
      </Box>

      {/* Resizer Handle */}
      <Box
        width="5px"
        cursor="col-resize"
        bg="gray.300"
        position="fixed"
        top={0}
        left={`${sidebarWidth}px`}
        bottom={0}
        zIndex={100}
        onMouseDown={startResizing}
        _hover={{ bg: "gray.400" }}
        transition="background-color 0.2s"
      />

      {/* Contenido Principal */}
      <Box
        ml={`${sidebarWidth + 5}px`} // Ajustar margen izquierdo según el ancho de la barra lateral y el handle
        p={8}
        bg="gray.50"
        w="100%"
        transition="margin-left 0.2s"
      >
        {/* Encabezado con Ordenamiento */}
        <Flex align="center" mb={4}>
          <Heading as="h2" size="lg" color="gray.700">
            Dashboard
          </Heading>
          <Spacer />
          <Button
            onClick={toggleSortOrder}
            leftIcon={<DownloadIcon />}
            size="sm"
          >
            Ordenar: {sortOrder === "asc" ? "Más Antiguas" : "Más Nuevas"}
          </Button>
        </Flex>

        {/* Estadísticas */}
        <SimpleGrid columns={[1, 2, 3]} spacing={6} mb={8}>
          <Stat
            p={5}
            bg="white"
            borderRadius="md"
            boxShadow="sm"
            borderLeftWidth="4px"
            borderColor="blue.500"
          >
            <StatLabel>Total Entries</StatLabel>
            <StatNumber>{stats.totalSGC}</StatNumber>
            <Text fontSize="xs" color="gray.500">
              Total records uploaded
            </Text>
          </Stat>

          <Stat
            p={5}
            bg="white"
            borderRadius="md"
            boxShadow="sm"
            borderLeftWidth="4px"
            borderColor="green.500"
          >
            <StatLabel>Most Active User</StatLabel>
            <StatNumber>{stats.mostActiveUser || "N/A"}</StatNumber>
            <Text fontSize="xs" color="gray.500">
              User with most uploads
            </Text>
          </Stat>

          <Stat
            p={5}
            bg="white"
            borderRadius="md"
            boxShadow="sm"
            borderLeftWidth="4px"
            borderColor="purple.500"
          >
            <StatLabel>Recent Entries</StatLabel>
            <StatNumber>{stats.recentEntries.length}</StatNumber>
            <Text fontSize="xs" color="gray.500">
              Today's entries
            </Text>
          </Stat>
        </SimpleGrid>

        {/* Tabla de Datos */}
        <Box bg="white" p={6} borderRadius="md" boxShadow="sm">
          <Heading as="h2" size="md" mb={4} color="gray.700">
            Entries List
          </Heading>
          {loading ? (
            <Flex justify="center" align="center" height="200px">
              <Spinner size="lg" color="blue.500" />
            </Flex>
          ) : (
            <EntriesTable
              entries={currentEntries}
              onEdit={showItemDetails}
              onDelete={handleDelete}
            />
          )}

          {/* Controles de Paginación */}
          {totalPages > 1 && !loading && (
            <Box mt={6}>
              <CustomPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* Modal para Agregar/Editar Entrada */}
      <Modal isOpen={isOpen} onClose={handleCloseModal} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedItem ? "Edit Entry" : "Add New Entry"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form id="sgc-form" onSubmit={handleSubmit}>
              <Accordion allowToggle defaultIndex={[0]}>
                {/* General Information */}
                <AccordionItem>
                  <AccordionButton>
                    <Box flex="1" textAlign="left" fontWeight="bold">
                      General Information
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <VStack spacing={4}>
                      <FormControl isInvalid={formErrors.date} isRequired>
                        <FormLabel>Date</FormLabel>
                        <Input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                        />
                        {formErrors.date && (
                          <FormErrorMessage>{formErrors.date}</FormErrorMessage>
                        )}
                      </FormControl>

                      <FormControl isInvalid={formErrors.position} isRequired>
                        <FormLabel>Position</FormLabel>
                        <Input
                          type="text"
                          name="position"
                          value={formData.position}
                          onChange={handleInputChange}
                          placeholder="Enter position"
                        />
                        {formErrors.position && (
                          <FormErrorMessage>
                            {formErrors.position}
                          </FormErrorMessage>
                        )}
                      </FormControl>

                      <FormControl isInvalid={formErrors.email} isRequired>
                        <FormLabel>Email</FormLabel>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Enter email"
                          autoComplete="email"
                        />
                        {formErrors.email && (
                          <FormErrorMessage>
                            {formErrors.email}
                          </FormErrorMessage>
                        )}
                      </FormControl>

                      <FormControl isInvalid={formErrors.gamertag} isRequired>
                        <FormLabel>Gamertag</FormLabel>
                        <Input
                          type="text"
                          name="gamertag"
                          value={formData.gamertag}
                          onChange={handleInputChange}
                          placeholder="Enter gamertag"
                        />
                        {formErrors.gamertag && (
                          <FormErrorMessage>
                            {formErrors.gamertag}
                          </FormErrorMessage>
                        )}
                      </FormControl>
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>

                {/* Title Details */}
                <AccordionItem>
                  <AccordionButton>
                    <Box flex="1" textAlign="left" fontWeight="bold">
                      Title Details
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <VStack spacing={4}>
                      <FormControl isInvalid={formErrors.title_name} isRequired>
                        <FormLabel>Title Name</FormLabel>
                        <Input
                          type="text"
                          name="title_name"
                          value={formData.title_name}
                          onChange={handleInputChange}
                          placeholder="Enter title name"
                        />
                        {formErrors.title_name && (
                          <FormErrorMessage>
                            {formErrors.title_name}
                          </FormErrorMessage>
                        )}
                      </FormControl>

                      <FormControl>
                        <FormLabel>Title Version</FormLabel>
                        <Input
                          type="text"
                          name="title_version"
                          value={formData.title_version}
                          onChange={handleInputChange}
                          placeholder="Enter title version"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Submission Iteration</FormLabel>
                        <Textarea
                          name="submission_iteration"
                          value={formData.submission_iteration}
                          onChange={handleInputChange}
                          placeholder="Explain submission iteration"
                          resize="vertical"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Progress</FormLabel>
                        <Textarea
                          name="progress"
                          value={formData.progress}
                          onChange={handleInputChange}
                          placeholder="Describe progress"
                          resize="vertical"
                        />
                      </FormControl>
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>

                {/* Publisher Information */}
                <AccordionItem>
                  <AccordionButton>
                    <Box flex="1" textAlign="left" fontWeight="bold">
                      Publisher Information
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <VStack spacing={4}>
                      <FormControl
                        isInvalid={formErrors.publisher_accounts}
                        isRequired
                      >
                        <FormLabel>Publisher Accounts</FormLabel>
                        <Input
                          type="text"
                          name="publisher_accounts"
                          value={formData.publisher_accounts}
                          onChange={handleInputChange}
                          placeholder="Enter publisher accounts"
                        />
                        {formErrors.publisher_accounts && (
                          <FormErrorMessage>
                            {formErrors.publisher_accounts}
                          </FormErrorMessage>
                        )}
                      </FormControl>

                      <FormControl
                        isInvalid={formErrors.publisher_password}
                        isRequired
                      >
                        <FormLabel>Publisher Password</FormLabel>
                        <Input
                          type="password"
                          name="publisher_password"
                          value={formData.publisher_password}
                          onChange={handleInputChange}
                          placeholder="Enter publisher password"
                        />
                        {formErrors.publisher_password && (
                          <FormErrorMessage>
                            {formErrors.publisher_password}
                          </FormErrorMessage>
                        )}
                      </FormControl>

                      <FormControl>
                        <FormLabel>Options</FormLabel>
                        <Textarea
                          name="options"
                          value={formData.options}
                          onChange={handleInputChange}
                          placeholder="Enter options"
                          resize="vertical"
                        />
                      </FormControl>
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </form>
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              type="submit"
              form="sgc-form"
              isLoading={submitting}
              loadingText={selectedItem ? "Updating..." : "Saving..."}
            >
              {selectedItem ? "Update" : "Save"}
            </Button>
            <Button onClick={handleCloseModal}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SGCTracker;
