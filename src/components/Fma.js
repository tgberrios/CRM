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
import { CopyIcon } from "@chakra-ui/icons"; // Importamos el icono de copiar
import { useNavigate } from "react-router-dom";

// Función para hacer debounce de la búsqueda
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
};

// Componente FMAScenarios optimizado
const FMAScenarios = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Función para cargar y procesar el archivo Excel de manera asincrónica
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
      console.error("Error al cargar el archivo Excel:", error);
      toast({
        title: "Error",
        description:
          "Hubo un problema al cargar los datos. Por favor, intenta más tarde.",
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

  // Función de búsqueda con debounce
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

  // Función para redirigir a /Home
  const goToHome = () => {
    navigate("/Home");
  };

  // Función para copiar texto al portapapeles
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Scenario copied to clipboard.",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Box bg="primary" minH="100vh" py={6}>
      <Container maxW="container.xl">
        {/* Barra de búsqueda con botón de navegación */}
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

        {/* Indicador de carga */}
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
                        bg="transparent" // Fondo transparente
                        border="none" // Sin borde
                        py={4} // Más espacio vertical
                        px={4} // Más espacio horizontal
                        fontSize="sm" // Tamaño de texto un poco más pequeño
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
                              variant="ghost" // Eliminar el fondo verde
                              color="black" // Ícono en negro
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
              No se encontraron resultados.
            </Text>
          </Flex>
        )}
      </Container>
    </Box>
  );
};

export default FMAScenarios;
