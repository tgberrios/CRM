import React, { useState, useEffect } from "react";
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
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { AddIcon, EditIcon, DeleteIcon } from "@chakra-ui/icons";

// Importamos la biblioteca xlsx para manejar Excel
import * as XLSX from "xlsx";

const SGCTracker = () => {
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
  const [stats, setStats] = useState({
    totalSGC: 0,
    recentEntries: [],
    mostActiveUser: "",
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const username = localStorage.getItem("username") || "";
    setFormData((prev) => ({ ...prev, username }));
    loadAllData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [dataList]);

  const calculateStats = () => {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const username = localStorage.getItem("username");
      if (!username) {
        toast({
          title: "Error",
          description: "Username is not defined.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      const updatedFormData = { ...formData, username };

      if (selectedItem) {
        await window.cert.editData(selectedItem.id, updatedFormData);
        toast({
          title: "Entrada actualizada",
          description: "La entrada ha sido actualizada exitosamente.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        await window.cert.saveData(updatedFormData);
        toast({
          title: "Entrada guardada",
          description: "La entrada ha sido guardada exitosamente.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
      loadAllData();
      handleCloseModal();
    } catch (error) {
      console.error("Error al guardar datos:", error);
      toast({
        title: "Error",
        description: "Hubo un error al guardar la entrada.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const loadAllData = async () => {
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
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  };

  const showItemDetails = async (item) => {
    try {
      setSelectedItem(item);
      setFormData(item);
      onOpen();
    } catch (error) {
      console.error("Error al cargar detalles del ítem:", error);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const filteredData = dataList.filter(
    (item) =>
      (item.title_name &&
        item.title_name.toLowerCase().includes(searchQuery)) ||
      (item.date && item.date.toLowerCase().includes(searchQuery))
  );

  const handleCloseModal = () => {
    setSelectedItem(null);
    onClose();
    resetFormData();
  };

  const resetFormData = () => {
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
  };

  const handleDelete = async (itemId) => {
    try {
      await window.cert.deleteData(itemId);
      toast({
        title: "Entrada eliminada",
        description: "La entrada ha sido eliminada exitosamente.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      loadAllData();
    } catch (error) {
      console.error("Error al eliminar datos:", error);
      toast({
        title: "Error",
        description: "Hubo un error al eliminar la entrada.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Función para exportar datos a Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(dataList);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Entradas");
    XLSX.writeFile(workbook, "SGC_Tracker_Data.xlsx");
  };

  // Función para importar datos desde Excel
  const importFromExcel = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Creamos un FileReader
      const reader = new FileReader();
      reader.onload = async (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // Asumimos que la primera hoja es la que queremos
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const importedData = XLSX.utils.sheet_to_json(worksheet);

        // Guardamos cada entrada usando window.cert.saveData
        for (let entry of importedData) {
          // Aseguramos que la fecha esté correctamente formateada
          entry.date =
            typeof entry.date === "string"
              ? entry.date
              : new Date(entry.date).toISOString().split("T")[0];
          await window.cert.saveData(entry);
        }
        toast({
          title: "Datos importados",
          description: "Los datos han sido importados exitosamente.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        loadAllData();
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <Box display="flex" minH="100vh" fontSize="sm">
      {/* Barra lateral */}
      <Box
        w="20%"
        maxW="300px"
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
      >
        <Heading as="h1" size="md" mb={4}>
          SGC Tracker
        </Heading>

        {/* Botones */}
        <VStack spacing={3} mb={4}>
          <Button
            colorScheme="blue"
            w="full"
            onClick={() => {
              resetFormData();
              onOpen();
            }}
            leftIcon={<AddIcon />}
          >
            Agregar Entrada
          </Button>

          <Button colorScheme="gray" w="full" onClick={() => navigate("/Home")}>
            Ir a Inicio
          </Button>

          {/* Botones de Exportar e Importar */}
          <Button colorScheme="green" w="full" onClick={exportToExcel}>
            Exportar a Excel
          </Button>
          <Button as="label" colorScheme="purple" w="full">
            Importar desde Excel
            <Input
              type="file"
              accept=".xlsx, .xls"
              display="none"
              onChange={importFromExcel}
            />
          </Button>
        </VStack>

        {/* Campo de búsqueda */}
        <Input
          placeholder="Buscar por nombre o fecha"
          mb={4}
          value={searchQuery}
          onChange={handleSearch}
        />

        <Divider my={4} />

        <Heading as="h2" size="sm" mb={2}>
          Títulos
        </Heading>

        <Box
          overflowY="auto"
          flex="1"
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
          {filteredData.length > 0 ? (
            filteredData.map((testCase) => (
              <Box
                key={testCase.id}
                p={2}
                bg="white"
                w="100%"
                borderRadius="md"
                boxShadow="sm"
                mb={2}
                _hover={{ boxShadow: "md", cursor: "pointer" }}
                onClick={() => showItemDetails(testCase)}
              >
                <Text fontWeight="bold" isTruncated>
                  {testCase.title_name}
                </Text>
                <Text fontSize="xs" color="gray.600">
                  {testCase.date}
                </Text>
              </Box>
            ))
          ) : (
            <Text>No hay datos</Text>
          )}
        </Box>
      </Box>

      {/* Contenido principal */}
      <Box flex="1" ml="20%" p={4} bg="gray.50">
        {/* Estadísticas */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
          <Stat
            p={3}
            shadow="sm"
            borderRadius="md"
            bg="white"
            borderLeftWidth="4px"
            borderColor="blue.500"
          >
            <StatLabel>Total de Entradas</StatLabel>
            <StatNumber>{stats.totalSGC}</StatNumber>
            <Text fontSize="xs" color="gray.500">
              Total de registros subidos
            </Text>
          </Stat>

          <Stat
            p={3}
            shadow="sm"
            borderRadius="md"
            bg="white"
            borderLeftWidth="4px"
            borderColor="green.500"
          >
            <StatLabel>Usuario Más Activo</StatLabel>
            <StatNumber>{stats.mostActiveUser || "N/A"}</StatNumber>
            <Text fontSize="xs" color="gray.500">
              Usuario con más subidas
            </Text>
          </Stat>

          <Stat
            p={3}
            shadow="sm"
            borderRadius="md"
            bg="white"
            borderLeftWidth="4px"
            borderColor="purple.500"
          >
            <StatLabel>Entradas Recientes</StatLabel>
            <StatNumber>{stats.recentEntries.length}</StatNumber>
            <Text fontSize="xs" color="gray.500">
              Entradas de hoy
            </Text>
          </Stat>
        </SimpleGrid>

        {/* Tabla de datos */}
        <Box bg="white" p={4} borderRadius="md" shadow="sm">
          <Heading as="h2" size="sm" mb={4}>
            Lista de Entradas
          </Heading>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Título</Th>
                <Th>Fecha</Th>
                <Th>Usuario</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <Tr key={item.id}>
                    <Td>{item.title_name}</Td>
                    <Td>{item.date}</Td>
                    <Td>{item.username}</Td>
                    <Td>
                      <HStack spacing={1}>
                        <IconButton
                          icon={<EditIcon />}
                          colorScheme="blue"
                          size="xs"
                          onClick={() => showItemDetails(item)}
                        />
                        <IconButton
                          icon={<DeleteIcon />}
                          colorScheme="red"
                          size="xs"
                          onClick={() => handleDelete(item.id)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan="4">
                    <Text textAlign="center">No hay datos disponibles</Text>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>
      </Box>

      {/* Modal para agregar/editar entrada */}
      <Modal isOpen={isOpen} onClose={handleCloseModal} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedItem ? "Editar Entrada" : "Agregar Nueva Entrada"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form id="sgc-form" onSubmit={handleSubmit}>
              <Accordion allowToggle defaultIndex={[0]}>
                {/* Información General */}
                <AccordionItem>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      Información General
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <VStack spacing={3}>
                      <FormControl>
                        <FormLabel>Fecha</FormLabel>
                        <Input
                          type="date"
                          value={formData.date}
                          onChange={(e) =>
                            setFormData({ ...formData, date: e.target.value })
                          }
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Posición</FormLabel>
                        <Input
                          type="text"
                          value={formData.position}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              position: e.target.value,
                            })
                          }
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Email</FormLabel>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Gamertag</FormLabel>
                        <Input
                          type="text"
                          value={formData.gamertag}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              gamertag: e.target.value,
                            })
                          }
                        />
                      </FormControl>
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>

                {/* Detalles del Título */}
                <AccordionItem>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      Detalles del Título
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <VStack spacing={3}>
                      <FormControl>
                        <FormLabel>Nombre del Título</FormLabel>
                        <Input
                          type="text"
                          value={formData.title_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              title_name: e.target.value,
                            })
                          }
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Versión del Título</FormLabel>
                        <Input
                          type="text"
                          value={formData.title_version}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              title_version: e.target.value,
                            })
                          }
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Iteración de Submisión</FormLabel>
                        <Textarea
                          value={formData.submission_iteration}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              submission_iteration: e.target.value,
                            })
                          }
                          resize="vertical"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Progreso</FormLabel>
                        <Textarea
                          value={formData.progress}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              progress: e.target.value,
                            })
                          }
                          resize="vertical"
                        />
                      </FormControl>
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>

                {/* Información del Publisher */}
                <AccordionItem>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      Información del Publisher
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <VStack spacing={3}>
                      <FormControl>
                        <FormLabel>Opciones</FormLabel>
                        <Textarea
                          value={formData.options}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              options: e.target.value,
                            })
                          }
                          resize="vertical"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Cuentas del Publisher</FormLabel>
                        <Input
                          type="text"
                          value={formData.publisher_accounts}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              publisher_accounts: e.target.value,
                            })
                          }
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Contraseña del Publisher</FormLabel>
                        <Input
                          type="text"
                          value={formData.publisher_password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              publisher_password: e.target.value,
                            })
                          }
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
              size="sm"
            >
              {selectedItem ? "Actualizar" : "Guardar"}
            </Button>
            <Button onClick={handleCloseModal} size="sm">
              Cancelar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SGCTracker;
