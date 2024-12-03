import React, { useState, useEffect, useRef } from "react";
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
} from "@chakra-ui/react";
import { EditIcon, DeleteIcon, AddIcon, ArrowBackIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const InventoryManager = () => {
  const [accounts, setAccounts] = useState([]);
  const [hardware, setHardware] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("");
  const [currentView, setCurrentView] = useState("accounts");
  const [editingItem, setEditingItem] = useState({}); // Initialize as empty object
  const [isEditing, setIsEditing] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null); // Referencia para el input de archivo

  // Estados de carga añadidos
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isLoadingHardware, setIsLoadingHardware] = useState(true);

  useEffect(() => {
    loadAccounts();
    loadHardware();
  }, []);

  const loadAccounts = async () => {
    setIsLoadingAccounts(true); // Iniciar carga
    try {
      const accountsData = await window.cert.getAccounts();
      setAccounts(accountsData);
    } catch (err) {
      console.error("Error fetching accounts:", err);
    } finally {
      setIsLoadingAccounts(false); // Finalizar carga
    }
  };

  const loadHardware = async () => {
    setIsLoadingHardware(true); // Iniciar carga
    try {
      const hardwareData = await window.cert.getHardware();
      setHardware(hardwareData);
    } catch (err) {
      console.error("Error fetching hardware:", err);
    } finally {
      setIsLoadingHardware(false); // Finalizar carga
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterByChange = (e) => {
    setFilterBy(e.target.value);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setIsEditing(true);
    onOpen();
  };

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
        id: null, // Nuevo campo id
        serialnumber: "",
        consoleid: "",
        xboxliveid: "",
        assetowner: "",
        projectowner: "",
        type: "",
        classification: "",
        assettag: "",
        location: "",
        status: "",
        owner: "",
      });
    }
    setIsEditing(false);
    setFormErrors({});
    onOpen();
  };

  const handleDeleteItem = async (item) => {
    try {
      if (currentView === "accounts") {
        await window.cert.deleteAccount(item.id);
        loadAccounts();
      } else {
        await window.cert.deleteHardware(item.id); // Cambia a id
        loadHardware();
      }
      toast({
        title: `${
          currentView === "accounts" ? "Cuenta" : "Hardware"
        } eliminado`,
        status: "success",
        duration: 2000,
      });
    } catch (err) {
      console.error("Error deleting item:", err);
      toast({
        title: "Error",
        description: "No se pudo eliminar el elemento.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSaveItem = async () => {
    const username = localStorage.getItem("username");
    if (!username) {
      console.error("Username no encontrado en localStorage");
      toast({
        title: "Error",
        description: "Username no encontrado en localStorage.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const hardwareData = { ...editingItem, username };
    console.log("Datos enviados al backend:", hardwareData);

    try {
      if (isEditing) {
        await window.cert.editHardware(hardwareData);
      } else {
        await window.cert.addHardware(hardwareData);
      }
      loadHardware();
      onClose();
      toast({
        title: `Hardware guardado`,
        status: "success",
        duration: 2000,
      });
    } catch (err) {
      console.error("Error al guardar hardware:", err);
      toast({
        title: "Error",
        description: "No se pudo guardar el hardware.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Función para exportar datos a Excel
  const handleExport = () => {
    const dataToExport = currentView === "accounts" ? accounts : hardware;

    // Mapeamos los datos para eliminar propiedades innecesarias
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

  // Funciones para importar datos desde Excel
  const handleImportClick = () => {
    fileInputRef.current.click();
  };

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
          console.error("Username no encontrado en localStorage");
          toast({
            title: "Error",
            description: "Username no encontrado en localStorage.",
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
          title: "Importación exitosa",
          status: "success",
          duration: 2000,
        });
      } catch (err) {
        console.error("Error importing data:", err);
        toast({
          title: "Error",
          description: "No se pudo importar los datos.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };
    reader.readAsBinaryString(file);
  };

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

  const renderItems = () => {
    const isLoading =
      currentView === "accounts" ? isLoadingAccounts : isLoadingHardware;

    if (isLoading) {
      // Mostrar Skeleton mientras carga
      return (
        <Table variant="simple" colorScheme="gray">
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Número de Serie</Th>
              <Th>Tipo</Th>
              <Th>Propietario del Activo</Th>
              <Th>Estado</Th>
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <Tr key={item.id}>
                  <Td>{item.id}</Td>
                  <Td>{item.serialnumber}</Td>
                  <Td>{item.type}</Td>
                  <Td>{item.assetowner}</Td>
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
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        icon={<EditIcon />}
                        onClick={() => handleEditItem(item)}
                        colorScheme="blue"
                        size="sm"
                        aria-label="Editar"
                      />
                      <IconButton
                        icon={<DeleteIcon />}
                        onClick={() => handleDeleteItem(item)}
                        colorScheme="red"
                        size="sm"
                        aria-label="Eliminar"
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan="6">
                  <Text textAlign="center">No se encontraron resultados</Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      );
    }

    return (
      <Table variant="simple" colorScheme="gray">
        <Thead>
          <Tr>
            {currentView === "accounts" ? (
              <>
                <Th>ID</Th>
                <Th>Email</Th>
                <Th>Posición</Th>
                <Th>Estado</Th>
                <Th>Acciones</Th>
              </>
            ) : (
              <>
                <Th>Número de Serie</Th>
                <Th>Tipo</Th>
                <Th>Propietario del Activo</Th>
                <Th>Estado</Th>
                <Th>Acciones</Th>
              </>
            )}
          </Tr>
        </Thead>
        <Tbody>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <Tr key={item.id || item.serialnumber}>
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
                    <Td>{item.serialnumber}</Td>
                    <Td>{item.type}</Td>
                    <Td>{item.assetowner}</Td>
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
                      aria-label="Editar"
                    />
                    <IconButton
                      icon={<DeleteIcon />}
                      onClick={() => handleDeleteItem(item)}
                      colorScheme="red"
                      size="sm"
                      aria-label="Eliminar"
                    />
                  </HStack>
                </Td>
              </Tr>
            ))
          ) : (
            <Tr>
              <Td colSpan="5">
                <Text textAlign="center">No se encontraron resultados</Text>
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>
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

        {/* Botones de Navegación */}
        <VStack spacing={4} align="stretch">
          <Button
            onClick={() => setCurrentView("accounts")}
            colorScheme={currentView === "accounts" ? "teal" : "gray"}
            variant="solid"
            leftIcon={<EditIcon />}
          >
            Gestionar Cuentas
          </Button>
          <Button
            onClick={() => setCurrentView("hardware")}
            colorScheme={currentView === "hardware" ? "teal" : "gray"}
            variant="solid"
            leftIcon={<EditIcon />}
          >
            Gestionar Hardware
          </Button>
          <Button
            onClick={() => navigate("/Home")}
            colorScheme="gray"
            variant="solid"
            leftIcon={<ArrowBackIcon />}
          >
            Volver al Inicio
          </Button>
        </VStack>

        <Divider my={6} />

        {/* Buscar y Filtrar */}
        <Heading as="h2" size="md" mb={4}>
          Buscar y Filtrar
        </Heading>
        <VStack spacing={4} align="stretch">
          <Input
            placeholder={`Buscar ${
              currentView === "accounts" ? "Cuentas" : "Hardware"
            }...`}
            value={searchTerm}
            onChange={handleSearch}
          />
          <Select
            placeholder="Filtrar por..."
            onChange={handleFilterByChange}
            value={filterBy}
          >
            {currentView === "accounts" ? (
              <>
                <option value="position">Posición</option>
                <option value="state">Estado</option>
                <option value="sandbox">Sandbox</option>
                <option value="subscription">Suscripción</option>
              </>
            ) : (
              <>
                <option value="assetOwner">Propietario del Activo</option>
                <option value="projectOwner">Propietario del Proyecto</option>
                <option value="type">Tipo</option>
                <option value="classification">Clasificación</option>
                <option value="status">Estado</option>
              </>
            )}
          </Select>
        </VStack>

        <Divider my={6} />

        {/* Botones de Importar y Exportar */}
        <Heading as="h2" size="md" mb={4}>
          Importar y Exportar
        </Heading>
        <VStack spacing={4} align="stretch">
          <Button colorScheme="green" onClick={handleExport}>
            Exportar a Excel
          </Button>
          <Button colorScheme="blue" onClick={handleImportClick}>
            Importar desde Excel
          </Button>
          <Input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            style={{ display: "none" }}
          />
        </VStack>
      </Box>

      {/* Contenido Principal */}
      <Box flex="1" ml="20%" p={6} bg="gray.50">
        <Heading as="h2" size="lg" mb={6}>
          {currentView === "accounts" ? "Cuentas" : "Hardware"}
        </Heading>

        {/* Tabla de Elementos */}
        <Box bg="white" p={6} borderRadius="md" shadow="md">
          {renderItems()}
        </Box>
      </Box>

      {/* Botón Flotante de Añadir */}
      <IconButton
        icon={<AddIcon />}
        colorScheme="teal"
        size="lg"
        onClick={handleAddItem}
        position="fixed"
        bottom="40px"
        right="40px"
        borderRadius="full"
        aria-label="Añadir"
      />

      {/* Drawer para Añadir/Editar Elementos */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            {isEditing
              ? `Editar ${currentView === "accounts" ? "Cuenta" : "Hardware"}`
              : `Añadir Nuevo ${
                  currentView === "accounts" ? "Cuenta" : "Hardware"
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
                  <FormLabel>Posición</FormLabel>
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
                  <FormLabel>Estado</FormLabel>
                  <Select
                    value={editingItem?.state || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        state: e.target.value,
                      })
                    }
                  >
                    <option value="">Seleccionar Estado</option>
                    <option value="Active">Activo</option>
                    <option value="Inactive">Inactivo</option>
                    <option value="Suspended">Suspendido</option>
                    <option value="Pending">Pendiente</option>
                    <option value="Deleted">Eliminado</option>
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
                  <FormLabel>Suscripción</FormLabel>
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
                  <FormLabel>Ubicación</FormLabel>
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
                  <FormLabel>Notas</FormLabel>
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
                <FormControl mb={4} isInvalid={formErrors.serialnumber}>
                  <FormLabel>Número de Serie</FormLabel>
                  <Input
                    value={editingItem?.serialnumber || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        serialnumber: e.target.value,
                      })
                    }
                  />
                  {formErrors.serialnumber && (
                    <Text color="red.500" fontSize="sm">
                      {formErrors.serialnumber}
                    </Text>
                  )}
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>ID de Consola</FormLabel>
                  <Input
                    value={editingItem?.consoleid || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        consoleid: e.target.value,
                      })
                    }
                  />
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>ID de Xbox Live</FormLabel>
                  <Input
                    value={editingItem?.xboxliveid || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        xboxliveid: e.target.value,
                      })
                    }
                  />
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>Propietario del Activo</FormLabel>
                  <Input
                    value={editingItem?.assetowner || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        assetowner: e.target.value,
                      })
                    }
                  />
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>Propietario del Proyecto</FormLabel>
                  <Input
                    value={editingItem?.projectowner || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        projectowner: e.target.value,
                      })
                    }
                  />
                </FormControl>
                <FormControl mb={4} isInvalid={formErrors.type}>
                  <FormLabel>Tipo</FormLabel>
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
                  <FormLabel>Clasificación</FormLabel>
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
                  <FormLabel>Estado</FormLabel>
                  <Select
                    value={editingItem?.status || ""}
                    onChange={(e) => {
                      setEditingItem({
                        ...editingItem,
                        status: e.target.value,
                      });
                    }}
                  >
                    <option value="">Seleccionar Estado</option>
                    <option value="Available">Disponible</option>
                    <option value="In Use">En Uso</option>
                    <option value="Maintenance">Mantenimiento</option>
                    <option value="Retired">Retirado</option>
                    <option value="Broken">Roto</option>
                    <option value="Reserved">Reservado</option>
                  </Select>
                  {formErrors.status && (
                    <Text color="red.500" fontSize="sm">
                      {formErrors.status}
                    </Text>
                  )}
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>Etiqueta del Activo</FormLabel>
                  <Input
                    value={editingItem?.assettag || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        assettag: e.target.value,
                      })
                    }
                  />
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>Ubicación</FormLabel>
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
                  <FormLabel>Propietario</FormLabel>
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
              Cancelar
            </Button>
            <Button colorScheme="blue" onClick={handleSaveItem}>
              Guardar
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default InventoryManager;
