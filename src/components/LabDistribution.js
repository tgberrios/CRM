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
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useTable, useFlexLayout, useColumnOrder } from "react-table";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "@chakra-ui/icons";

// Función para hacer debounce de la búsqueda
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
};

// Componente FMAScenarios optimizado con control de columnas y navegación horizontal
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
  ]); // Inicializar con las columnas ocultas por defecto
  const tableRef = useRef(null); // Referencia para controlar el scroll de la tabla

  // Definir las columnas de la tabla
  const columns = React.useMemo(
    () => [
      { Header: "Team", accessor: "Team" },
      { Header: "Position", accessor: "Position" },
      { Header: "Bench", accessor: "Bench" },
      { Header: "Co. Type", accessor: "CoType" }, // Asegúrate que el accessor coincide con el header
      { Header: "Sandbox", accessor: "Sandbox" },
      { Header: "Asset Tag", accessor: "AssetTag" }, // Accesor sin espacio
      { Header: "Console ID", accessor: "ConsoleID" }, // Accesor sin espacio
      { Header: "Primary", accessor: "Primary" },
      { Header: "Secondary", accessor: "Secondary" },
      { Header: "Shared", accessor: "Shared" },
    ],
    []
  );

  // Función para cargar y procesar el archivo Excel de manera asincrónica
  const loadExcel = useCallback(async () => {
    try {
      if (!window.cert || !window.cert.loadConsoleExcel) {
        throw new Error("cert.loadConsoleExcel está indefinido");
      }

      // Reemplaza "ruta/a/tu/archivo.xlsx" con la ruta correcta o lógica para obtener el archivo
      const response = await window.cert.loadConsoleExcel(
        "ruta/a/tu/archivo.xlsx"
      );
      if (response.success) {
        const jsonData = response.data;

        if (jsonData.length === 0) {
          throw new Error("El archivo Excel está vacío.");
        }

        // Estándariza los encabezados eliminando espacios y convirtiendo a camelCase
        const originalHeaders = jsonData[0];
        const standardizedHeaders = originalHeaders.map((header) =>
          header.replace(/\s+/g, "")
        );

        // Procesa las filas de datos
        const rows = jsonData.slice(1).map((row) => {
          const rowData = {};
          standardizedHeaders.forEach((header, index) => {
            rowData[header] = row[index] || "";
          });
          return rowData;
        });

        setData(rows);
        setFilteredData(rows);
      } else {
        throw new Error(response.error || "Error al cargar el archivo Excel.");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          "Hubo un problema al cargar los datos. Por favor, intenta más tarde.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Error al cargar Excel:", error);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadExcel();
  }, [loadExcel]);

  // Función de búsqueda con debounce
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

  // Función para redirigir a /Home
  const goToHome = () => {
    navigate("/Home");
  };

  // React-table hooks
  const tableInstance = useTable(
    {
      columns,
      data: filteredData,
      initialState: { hiddenColumns }, // inicializar con columnas ocultas
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

  // Función para manejar la visibilidad de las columnas
  const toggleColumnVisibility = (columnId) => {
    const isHidden = hiddenColumns.includes(columnId);
    const newHiddenColumns = isHidden
      ? hiddenColumns.filter((col) => col !== columnId)
      : [...hiddenColumns, columnId];

    setHiddenColumns(newHiddenColumns);
    setTableHiddenColumns(newHiddenColumns); // actualiza solo si el estado cambia
  };

  // Función para desplazarse horizontalmente en la tabla
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
            placeholder="Buscar..."
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

          {/* Botón para mostrar/ocultar columnas */}
          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />} ml={4}>
              Editar Vista
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
            <Spinner size="xl" color="green.500" />
          </Flex>
        ) : filteredData.length > 0 ? (
          <Box position="relative" overflow="hidden">
            {/* Flechas para navegar horizontalmente */}
            <Flex justify="space-between" align="center" mb={2}>
              <IconButton
                icon={<ChevronLeftIcon />}
                aria-label="Desplazar a la izquierda"
                onClick={() => scrollTable("left")}
                colorScheme="teal"
                variant="outline"
                borderRadius="full"
              />
              <IconButton
                icon={<ChevronRightIcon />}
                aria-label="Desplazar a la derecha"
                onClick={() => scrollTable("right")}
                colorScheme="teal"
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
              No se encontraron resultados.
            </Text>
          </Flex>
        )}
      </Container>
    </Box>
  );
};

export default FMAScenarios;
