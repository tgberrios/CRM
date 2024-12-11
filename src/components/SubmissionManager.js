import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useImperativeHandle,
} from "react";
import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  useDisclosure,
  Grid,
  GridItem,
  VStack,
  HStack,
  Text,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  useToast,
  Progress,
  Badge,
  Tooltip,
  Avatar,
  Flex,
  Skeleton,
  Checkbox,
} from "@chakra-ui/react";
import { useTestModels } from "./TestModelsProvider";
import { useNavigate } from "react-router-dom";
import {
  FaTrophy,
  FaTasks,
  FaHistory,
  FaChartBar,
  FaList,
  FaUserShield,
  FaUserFriends,
  FaBug,
} from "react-icons/fa";
import jsPDF from "jspdf";
import "jspdf-autotable"; // Asegúrate de importar correctamente autoTable
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import debounce from "lodash.debounce";

// Componente TestCaseItem
const TestCaseItem = React.memo(({ testCase, onChange, isHistory }) => {
  const [localTesterName, setLocalTesterName] = useState(testCase.testerName);
  const [localComment, setLocalComment] = useState(testCase.comment);
  const [localStatus, setLocalStatus] = useState(testCase.status);

  useEffect(() => {
    setLocalTesterName(testCase.testerName);
    setLocalComment(testCase.comment);
    setLocalStatus(testCase.status);
  }, [testCase]);

  const debouncedOnChange = useMemo(() => debounce(onChange, 300), [onChange]);

  const handleTesterNameChange = useCallback(
    (e) => {
      const value = e.target.value;
      setLocalTesterName(value);
      debouncedOnChange({ ...testCase, testerName: value });
    },
    [debouncedOnChange, testCase]
  );

  const handleCommentChange = useCallback(
    (e) => {
      const value = e.target.value;
      if (localTesterName === "") {
        const username = localStorage.getItem("username") || "Tester Name";
        setLocalTesterName(username);
      }

      setLocalComment(value);
      debouncedOnChange({
        ...testCase,
        comment: value,
        testerName:
          localTesterName || localStorage.getItem("username") || "Tester Name",
      });
    },
    [debouncedOnChange, testCase, localTesterName]
  );

  const handleStatusChange = useCallback(
    (e) => {
      const value = e.target.value;
      setLocalStatus(value);
      debouncedOnChange({ ...testCase, status: value });
    },
    [debouncedOnChange, testCase]
  );

  return (
    <Grid templateColumns="repeat(3, 1fr)" gap={4} mb={4}>
      <GridItem colSpan={1}>
        <Box fontWeight="bold">{testCase.name}</Box>
      </GridItem>
      <GridItem colSpan={1}>
        {isHistory ? (
          <Box>{testCase.comment}</Box>
        ) : (
          <Input
            placeholder="Comment"
            value={localComment}
            onChange={handleCommentChange}
          />
        )}
      </GridItem>
      <GridItem colSpan={1}>
        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
          <GridItem>
            {isHistory ? (
              <Box>{testCase.testerName}</Box>
            ) : (
              <Input
                placeholder="Tester Name"
                value={localTesterName}
                onChange={handleTesterNameChange}
              />
            )}
          </GridItem>
          <GridItem>
            {isHistory ? (
              <Box>{testCase.status}</Box>
            ) : (
              <Select value={localStatus} onChange={handleStatusChange}>
                <option value="In Progress">In Progress</option>
                <option value="PASS">PASS</option>
                <option value="CNT">CNT</option>
                <option value="N/A">N/A</option>
                <option value="FAIL">FAIL</option>
              </Select>
            )}
          </GridItem>
        </Grid>
      </GridItem>
    </Grid>
  );
});

// Componente TestCasesTab
const TestCasesTab = React.memo(({ testCases, setTestCases, isHistory }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const handleTestCaseChange = useCallback(
    (updatedTestCase) => {
      setTestCases((prevTestCases) =>
        prevTestCases.map((tc) =>
          tc.id === updatedTestCase.id ? updatedTestCase : tc
        )
      );
    },
    [setTestCases]
  );

  const filteredTestCases = useMemo(() => {
    return testCases.filter((tc) => {
      const matchesSearch = tc.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "" || tc.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [testCases, searchTerm, statusFilter]);

  const Row = useCallback(
    ({ index, style }) => (
      <div style={style}>
        <TestCaseItem
          testCase={filteredTestCases[index]}
          onChange={handleTestCaseChange}
          isHistory={isHistory}
        />
      </div>
    ),
    [filteredTestCases, handleTestCaseChange, isHistory]
  );

  return (
    <Box>
      <HStack mb={4} spacing={4}>
        <Input
          placeholder="Buscar casos de prueba..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          width="300px"
        />
        <Select
          placeholder="Filtrar por estado"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          width="200px"
        >
          <option value="In Progress">In Progress</option>
          <option value="PASS">PASS</option>
          <option value="CNT">CNT</option>
          <option value="N/A">N/A</option>
          <option value="FAIL">FAIL</option>
        </Select>
      </HStack>
      <Box height="500px">
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              itemCount={filteredTestCases.length}
              itemSize={100}
              width={width}
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </Box>
    </Box>
  );
});

// Componente InvitesJoinsTab (Sin cambios)
const InvitesJoinsTab = React.forwardRef(
  ({ selectedTracker, isHistory }, ref) => {
    const [data, setData] = useState(selectedTracker.invitesjoinsdata || []);

    useImperativeHandle(ref, () => ({
      getData: () => data,
    }));

    const handleChange = (index, field, value) => {
      const updatedData = [...data];
      updatedData[index][field] = value;
      setData(updatedData);
    };

    const addRow = () => {
      setData([
        ...data,
        {
          location: "",
          systemInvite: "",
          systemJoin: "",
          gameInvite: "",
          gameJoin: "",
        },
      ]);
    };

    const removeRow = (index) => {
      const updatedData = data.filter((_, i) => i !== index);
      setData(updatedData);
    };

    return (
      <Box>
        {data.map((row, index) => (
          <Grid templateColumns="repeat(5, 1fr)" gap={4} mb={4} key={index}>
            <GridItem>
              <FormControl>
                <FormLabel>Location</FormLabel>
                {isHistory ? (
                  <Box>{row.location}</Box>
                ) : (
                  <Input
                    value={row.location}
                    onChange={(e) =>
                      handleChange(index, "location", e.target.value)
                    }
                  />
                )}
              </FormControl>
            </GridItem>
            <GridItem>
              <FormControl>
                <FormLabel>System Invite</FormLabel>
                {isHistory ? (
                  <Box>{row.systemInvite}</Box>
                ) : (
                  <Input
                    value={row.systemInvite}
                    onChange={(e) =>
                      handleChange(index, "systemInvite", e.target.value)
                    }
                  />
                )}
              </FormControl>
            </GridItem>
            <GridItem>
              <FormControl>
                <FormLabel>System Join</FormLabel>
                {isHistory ? (
                  <Box>{row.systemJoin}</Box>
                ) : (
                  <Input
                    value={row.systemJoin}
                    onChange={(e) =>
                      handleChange(index, "systemJoin", e.target.value)
                    }
                  />
                )}
              </FormControl>
            </GridItem>
            <GridItem>
              <FormControl>
                <FormLabel>Game Invite</FormLabel>
                {isHistory ? (
                  <Box>{row.gameInvite}</Box>
                ) : (
                  <Input
                    value={row.gameInvite}
                    onChange={(e) =>
                      handleChange(index, "gameInvite", e.target.value)
                    }
                  />
                )}
              </FormControl>
            </GridItem>
            <GridItem>
              <FormControl>
                <FormLabel>Game Join</FormLabel>
                {isHistory ? (
                  <Box>{row.gameJoin}</Box>
                ) : (
                  <Input
                    value={row.gameJoin}
                    onChange={(e) =>
                      handleChange(index, "gameJoin", e.target.value)
                    }
                  />
                )}
              </FormControl>
            </GridItem>
            {!isHistory && (
              <GridItem>
                <Button colorScheme="red" onClick={() => removeRow(index)}>
                  Remove
                </Button>
              </GridItem>
            )}
          </Grid>
        ))}
        {!isHistory && (
          <Button onClick={addRow} colorScheme="blue">
            Add Row
          </Button>
        )}
      </Box>
    );
  }
);

// Componente CrashLogsTab (Sin cambios)
const CrashLogsTab = React.forwardRef(({ selectedTracker, isHistory }, ref) => {
  const [data, setData] = useState(selectedTracker.crashlogs || []);

  useImperativeHandle(ref, () => ({
    getData: () => data,
  }));

  const handleChange = (index, field, value) => {
    const updatedData = [...data];
    updatedData[index][field] = value;
    setData(updatedData);
  };

  const addRow = () => {
    setData([
      ...data,
      { timeAndDate: "", details: "", type: "", logged: false },
    ]);
  };

  const removeRow = (index) => {
    const updatedData = data.filter((_, i) => i !== index);
    setData(updatedData);
  };

  return (
    <Box>
      {data.map((row, index) => (
        <Grid templateColumns="repeat(4, 1fr)" gap={4} mb={4} key={index}>
          <GridItem>
            <FormControl>
              <FormLabel>Time and Date of Crash</FormLabel>
              {isHistory ? (
                <Box>
                  {row.timeAndDate
                    ? new Date(row.timeAndDate).toLocaleString()
                    : ""}
                </Box>
              ) : (
                <Input
                  type="datetime-local"
                  value={row.timeAndDate}
                  onChange={(e) =>
                    handleChange(index, "timeAndDate", e.target.value)
                  }
                />
              )}
            </FormControl>
          </GridItem>
          <GridItem>
            <FormControl>
              <FormLabel>Details</FormLabel>
              {isHistory ? (
                <Box>{row.details}</Box>
              ) : (
                <Input
                  value={row.details}
                  onChange={(e) =>
                    handleChange(index, "details", e.target.value)
                  }
                />
              )}
            </FormControl>
          </GridItem>
          <GridItem>
            <FormControl>
              <FormLabel>Type</FormLabel>
              {isHistory ? (
                <Box>{row.type}</Box>
              ) : (
                <Select
                  value={row.type}
                  onChange={(e) => handleChange(index, "type", e.target.value)}
                >
                  <option value="">Select Type</option>
                  <option value="Critical">Critical</option>
                  <option value="Minor">Minor</option>
                </Select>
              )}
            </FormControl>
          </GridItem>
          <GridItem>
            <FormControl display="flex" alignItems="center" mt={6}>
              <Checkbox
                isChecked={row.logged}
                onChange={(e) =>
                  handleChange(index, "logged", e.target.checked)
                }
                isDisabled={isHistory}
              >
                Logged
              </Checkbox>
            </FormControl>
          </GridItem>
          {!isHistory && (
            <GridItem>
              <Button colorScheme="red" onClick={() => removeRow(index)}>
                Remove
              </Button>
            </GridItem>
          )}
        </Grid>
      ))}
      {!isHistory && (
        <Button onClick={addRow} colorScheme="blue">
          Add Row
        </Button>
      )}
    </Box>
  );
});

// Lista de privilegios de cuenta (Sin cambios)
const accountPrivilegesList = [
  {
    category: "Online Status and History",
    settings: [
      { name: "Other can see if you're online", value: "Block" },
      {
        name: "Others can see what you're watching or listening to",
        value: "Block",
      },
      { name: "Others can see your game and app history", value: "Block" },
      {
        name: "Others can see your live TV and on-demand video history",
        value: "Block",
      },
      { name: "Others can see your music history", value: "Block" },
    ],
  },
  {
    category: "Profile",
    settings: [
      { name: "Others can see your Xbox profile details", value: "Block" },
      { name: "See other people's Xbox profiles", value: "Everybody" },
      { name: "Real name", value: "Block" },
      {
        name: "You can share your real name with friends of friends",
        value: "Block",
      },
    ],
  },
  {
    category: "Friends & Clubs",
    settings: [
      { name: "You can add friends", value: "Allow" },
      { name: "Others can see your friends list", value: "Block" },
      { name: "You can create and join clubs", value: "Allow" },
      { name: "Others can see your club memberships", value: "Block" },
    ],
  },
  {
    category: "Communication & Multiplayer",
    settings: [
      { name: "You can join multiplayer games", value: "Allow" },
      { name: "You can join cross-network play", value: "Block" },
      {
        name: "Others can communicate with voice, text, or invites",
        value: "Friends",
      },
      {
        name: "You can communicate outside of Xbox Live with voice & text",
        value: "Block",
      },
      { name: "You can use video for communications", value: "Block" },
      { name: "Others can see your activity feed", value: "Block" },
    ],
  },
  {
    category: "Game Content",
    settings: [
      { name: "You can upload captures to Xbox", value: "Block" },
      { name: "Others can see your captures on Xbox", value: "Only me" },
      { name: "You can see and upload community creations", value: "Block" },
      { name: "Broadcast gameplay", value: "Block" },
      {
        name: "You can share content made using Kinect or another camera",
        value: "Block",
      },
    ],
  },
  {
    category: "Sharing Outside of Xbox Live",
    settings: [
      {
        name: "Others can share your content to social networks",
        value: "Block",
      },
      { name: "You can share outside of Xbox", value: "Block" },
    ],
  },
  {
    category: "Buy and Download",
    settings: [
      { name: "Ask before buying", value: "Off" },
      { name: "Purchase from your account", value: "Allow" },
      { name: "Use of payment methods", value: "Secure" },
      // Agrega más configuraciones según sea necesario'
    ],
  },
  {
    category: "Important Things",
    settings: [
      { name: "Delete All Titles Before Leaving", value: "" },
      { name: "Disable SAL & GEL", value: "" },
      { name: "Download Your Titles Before Departure", value: "" },
      { name: "Return Provided Hardware", value: "" },
    ],
  },
];

const SubmissionManager = () => {
  const [trackers, setTrackers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedTracker, setSelectedTracker] = useState(null);
  const [isHistory, setIsHistory] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDetailsOpen,
    onOpen: onDetailsOpen,
    onClose: onDetailsClose,
  } = useDisclosure();
  const { testModels, testCases } = useTestModels();
  const navigate = useNavigate();
  const toast = useToast();

  const [testCasesState, setTestCases] = useState([]);
  const invitesJoinsTabRef = useRef();
  const crashLogsTabRef = useRef();

  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  // Carga inicial de datos
  useEffect(() => {
    async function fetchData() {
      console.log("Iniciando la carga de datos de trackers...");
      try {
        if (window.cert && window.cert.getTrackers) {
          const data = await window.cert.getTrackers();
          console.log("Datos de trackers obtenidos:", data);
          setTrackers(data);
          console.log("Trackers:", data);

          const logsData = data.map((tracker) => {
            return [
              {
                id: tracker.id,
                title: tracker.titlename,
                action: "Created",
                date: tracker.teststartdate,
              },
              tracker.completedon
                ? {
                    id: tracker.id,
                    title: tracker.titlename,
                    action: "Completed",
                    date: tracker.completedon,
                  }
                : null,
            ].filter(Boolean);
          });

          setLogs(logsData.flat());
          console.log("Logs generados:", logsData.flat());
        } else {
          throw new Error("window.cert is not available");
        }
      } catch (error) {
        console.error("Error al cargar los trackers:", error);
        toast({
          title: "Error al cargar los datos",
          description: error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
        console.log("Estado de carga actualizado. isLoading:", isLoading);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  // Separar Trackers Activos e Históricos
  const activeTrackers = useMemo(() => {
    return trackers.filter((tracker) => !tracker.completedon);
  }, [trackers]);

  const historyTrackers = useMemo(() => {
    return trackers.filter((tracker) => tracker.completedon);
  }, [trackers]);

  // Monitorear cambios en Trackers Activos
  useEffect(() => {
    console.log("Trackers activos actualizados:", activeTrackers);
  }, [activeTrackers]);

  // Monitorear cambios en Trackers Históricos
  useEffect(() => {
    console.log("Historial de trackers actualizado:", historyTrackers);
  }, [historyTrackers]);

  // Monitorear cambios en Logs
  useEffect(() => {
    console.log("Logs actualizados:", logs);
  }, [logs]);

  // Monitorear cambios en isLoading
  useEffect(() => {
    console.log("Estado de carga actualizado. isLoading:", isLoading);
  }, [isLoading]);

  // Manejar la creación de un nuevo tracker
  const handleSaveTracker = async () => {
    console.log("Iniciando la creación de un nuevo tracker...");
    const selectedModel = document.getElementById("testModel").value;
    const modelObj = testModels[selectedModel];
    let testCasesArray = [];

    // Logs para verificar la selección del modelo
    console.log("Modelo seleccionado:", selectedModel);
    console.log("Objeto del modelo:", modelObj);

    if (modelObj) {
      const positionKeys = Object.keys(modelObj).sort((a, b) => {
        const aNum = parseInt(a.replace("p", ""), 10);
        const bNum = parseInt(b.replace("p", ""), 10);
        return aNum - bNum;
      });

      testCasesArray = positionKeys.map((posKey) => {
        const testCaseId = modelObj[posKey];
        return {
          id: testCaseId,
          name: testCases[testCaseId],
          status: "In Progress",
          testerName: "",
          comment: "",
        };
      });

      console.log("Casos de prueba generados:", testCasesArray);
    }

    const newTracker = {
      username: localStorage.getItem("username") || "Tomy Berrios",
      titlename: document.getElementById("titleName").value,
      leadname: document.getElementById("leadName").value,
      teststartdate: document.getElementById("testStartDate").value,
      testenddate: document.getElementById("testEndDate").value,
      sandboxids: document.getElementById("sandboxIds").value,
      recoveryversion: document.getElementById("recoveryVersion").value,
      binaryid: document.getElementById("binaryId").value,
      skuidentifier: document.getElementById("skuIdentifier").value,
      xboxversion: document.getElementById("xboxVersion").value,
      simplifiedusermodel: document.getElementById("simplifiedUserModel").value,
      windowsversion: document.getElementById("windowsVersion").value,
      supportedplatforms: document.getElementById("supportedPlatforms").value,
      testmodel: selectedModel,
      testcases: testCasesArray,
      progress: 0,
      crashlogs: [],
      invitesjoinsdata: [],
    };

    // Logs para verificar los datos capturados
    console.log("Datos del nuevo tracker:", newTracker);
    console.log("Titlename:", newTracker.titlename);
    console.log("Leadname:", newTracker.leadname);
    console.log("Test Start Date:", newTracker.teststartdate);
    console.log("Test End Date:", newTracker.testenddate);
    console.log("Test Model:", newTracker.testmodel);

    try {
      if (window.cert && window.cert.addTracker) {
        toast({
          title: "Guardando Tracker",
          description: "Por favor, espera mientras se guarda el tracker.",
          status: "info",
          duration: 2000,
          isClosable: true,
        });

        // Log antes de llamar al backend
        console.log(
          "Enviando datos al backend para agregar tracker:",
          newTracker
        );

        const addedTracker = await window.cert.addTracker(newTracker);

        // Log después de recibir la respuesta
        console.log("Tracker agregado exitosamente:", addedTracker);

        setTrackers((prevTrackers) => [...prevTrackers, addedTracker]);
        onClose();

        setLogs((prevLogs) => [
          {
            id: addedTracker.id,
            title: addedTracker.titlename,
            action: "Created",
            date: addedTracker.teststartdate,
          },
          ...prevLogs,
        ]);
        console.log("Logs actualizados después de agregar tracker:", [
          {
            id: addedTracker.id,
            title: addedTracker.titlename,
            action: "Created",
            date: addedTracker.teststartdate,
          },
          ...logs, // Usar 'logs' en lugar de 'prevLogs' para reflejar el estado actual
        ]);

        toast({
          title: "Tracker Guardado",
          description: "El tracker se ha guardado correctamente.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error("window.cert.addTracker is not available");
      }
    } catch (error) {
      console.error("Error al guardar el tracker:", error);
      toast({
        title: "Error al guardar",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Manejar la visualización de detalles del tracker
  const handleViewDetails = (tracker, isHistoryFlag = false) => {
    console.log(
      `Abriendo detalles del tracker: ${
        tracker ? tracker.titlename : "null"
      }, isHistory: ${isHistoryFlag}`
    );
    setSelectedTracker(tracker);
    setIsHistory(isHistoryFlag);
    setTestCases(tracker.testcases || []);
    onDetailsOpen();
  };

  const handleSaveChanges = useCallback(async () => {
    if (selectedTracker) {
      console.log(
        "Guardando cambios para el tracker:",
        selectedTracker.titlename
      );
      try {
        toast({
          title: "Guardando Cambios",
          description: "Por favor, espera mientras se guardan los cambios.",
          status: "info",
          duration: 2000,
          isClosable: true,
        });

        const invitesJoinsData = invitesJoinsTabRef.current?.getData();
        const crashLogsData = crashLogsTabRef.current?.getData();

        console.log("Datos Invites & Joins:", invitesJoinsData);
        console.log("Datos Crash Logs:", crashLogsData);

        const updatedTracker = {
          ...selectedTracker,
          teststartdate: new Date(selectedTracker.teststartdate).toISOString(),
          testenddate: new Date(selectedTracker.testenddate).toISOString(),
          testcases: testCasesState,
          invitesjoinsdata: invitesJoinsData,
          crashlogs: crashLogsData,
        };

        console.log(
          "Tracker actualizado antes del cálculo de progreso:",
          updatedTracker
        );

        const totalCases = (testCasesState || []).length;
        const completedCases = (testCasesState || []).filter(
          (tc) => tc.status === "PASS" || tc.status === "FAIL"
        ).length;
        const progress =
          totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0;
        updatedTracker.progress = progress;

        console.log("Progreso calculado:", progress, "%");

        if (window.cert && window.cert.updateTracker) {
          // Log antes de actualizar
          console.log(
            "Enviando datos al backend para actualizar tracker:",
            updatedTracker
          );

          const response = await window.cert.updateTracker(updatedTracker);

          // Log después de actualizar
          console.log(
            "Respuesta del backend después de actualizar tracker:",
            response
          );
          console.log(
            "Tracker actualizado en la base de datos:",
            updatedTracker
          );
          toast({
            title: "Cambios Guardados",
            description: "Tus cambios han sido guardados exitosamente.",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        } else {
          throw new Error("window.cert.updateTracker is not available");
        }

        setTrackers((prevTrackers) =>
          prevTrackers.map((t) =>
            t.id === updatedTracker.id ? updatedTracker : t
          )
        );
      } catch (error) {
        console.error("Error al guardar cambios:", error);
        toast({
          title: "Error al guardar cambios",
          description: error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  }, [selectedTracker, testCasesState, toast]);

  // Verificar si un tracker está completo
  const isTrackerComplete = useCallback((tracker) => {
    return (
      (tracker.testcases || []).length > 0 &&
      (tracker.testcases || []).every(
        (tc) =>
          tc.testerName.trim() !== "" &&
          tc.comment.trim() !== "" &&
          tc.status !== "In Progress"
      )
    );
  }, []);

  // Manejar la completación de un tracker
  const handleCompleteTracker = async (tracker) => {
    console.log(`Iniciando la completación del tracker: ${tracker.titlename}`);
    setIsCompleting(true);
    try {
      const completedTracker = {
        ...tracker,
        completedon: new Date().toISOString().split("T")[0],
      };

      console.log("Tracker a completar:", completedTracker);

      if (window.cert && window.cert.updateTracker) {
        toast({
          title: "Completando Tracker",
          description: "Marcando el tracker como completado.",
          status: "info",
          duration: 2000,
          isClosable: true,
        });

        // Log antes de actualizar
        console.log(
          "Enviando datos al backend para completar tracker:",
          completedTracker
        );

        const response = await window.cert.updateTracker(completedTracker);

        // Log después de actualizar
        console.log(
          "Respuesta del backend después de completar tracker:",
          response
        );
        console.log(
          "Tracker marcado como completado en la base de datos:",
          completedTracker
        );

        // Actualizar el tracker en la lista
        setTrackers((prevTrackers) =>
          prevTrackers.map((t) => (t.id === tracker.id ? completedTracker : t))
        );

        // Actualizar Logs
        setLogs((prevLogs) => [
          {
            id: completedTracker.id,
            title: completedTracker.titlename,
            action: "Completed",
            date: completedTracker.completedon,
          },
          ...prevLogs,
        ]);

        toast({
          title: "Tracker Completado",
          description: `${tracker.titlename} ha sido marcado como completado.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error("window.cert.updateTracker is not available");
      }
    } catch (error) {
      console.error("Error al completar el tracker:", error);
      toast({
        title: "Error al completar",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCompleting(false);
      console.log(
        "Proceso de completación finalizado. isCompleting:",
        isCompleting
      );
    }
  };

  // Manejar la exportación a PDF de un tracker
  const handleExportPDF = async (tracker) => {
    try {
      toast({
        title: "Generando PDF",
        description: "Por favor, espera mientras se genera el PDF.",
        status: "info",
        duration: 2000,
        isClosable: true,
      });

      handleViewDetails(tracker, true);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const pdf = new jsPDF();
      pdf.setFontSize(18);
      pdf.text("Submission Summary", 14, 22);

      pdf.setFontSize(12);
      pdf.text(`Title Name: ${tracker.titlename}`, 14, 32);
      pdf.text(`Lead Name: ${tracker.leadname}`, 14, 40);
      pdf.text(`Test Model: ${tracker.testmodel}`, 14, 48);

      pdf.text(
        `Completed On: ${
          tracker.completedon
            ? new Date(tracker.completedon).toLocaleDateString()
            : ""
        }`,
        14,
        56
      );

      pdf.setLineWidth(0.5);
      pdf.line(14, 60, 200, 60);

      const testCasesData = (tracker.testcases || []).map((tc, index) => [
        index + 1,
        tc.name,
        tc.status,
        tc.comment,
        tc.testerName,
      ]);

      pdf.autoTable({
        startY: 65,
        head: [["#", "Test Case", "Status", "Comment", "Tester Name"]],
        body: testCasesData,
        theme: "grid",
        styles: { fontSize: 8 },
      });

      let yPosition = pdf.lastAutoTable.finalY + 10;
      if (yPosition > pdf.internal.pageSize.height - 20) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.text("Account Privileges", 14, yPosition);

      yPosition += 6;

      accountPrivilegesList.forEach((category) => {
        pdf.setFontSize(12);
        pdf.text(category.category, 14, yPosition);
        yPosition += 6;

        const settingsData = category.settings.map((setting) => [
          setting.name,
          setting.value,
        ]);
        pdf.autoTable({
          startY: yPosition,
          head: [["Setting", "Value"]],
          body: settingsData,
          theme: "grid",
          styles: { fontSize: 8 },
        });

        yPosition = pdf.lastAutoTable.finalY + 10;

        if (yPosition > pdf.internal.pageSize.height - 20) {
          pdf.addPage();
          yPosition = 20;
        }
      });

      pdf.setFontSize(14);
      pdf.text("Invites & Joins", 14, yPosition);

      yPosition += 6;

      const invitesJoinsData = tracker.invitesjoinsdata || [];
      const invitesJoinsTableData = invitesJoinsData.map((row) => [
        row.location,
        row.systemInvite,
        row.systemJoin,
        row.gameInvite,
        row.gameJoin,
      ]);

      pdf.autoTable({
        startY: yPosition,
        head: [
          [
            "Location",
            "System Invite",
            "System Join",
            "Game Invite",
            "Game Join",
          ],
        ],
        body: invitesJoinsTableData,
        theme: "grid",
        styles: { fontSize: 8 },
      });

      yPosition = pdf.lastAutoTable.finalY + 10;
      if (yPosition > pdf.internal.pageSize.height - 20) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.text("Crash Logs", 14, yPosition);

      yPosition += 6;

      const crashLogsData = tracker.crashlogs || [];
      const crashLogsTableData = crashLogsData.map((row) => [
        row.timeAndDate ? new Date(row.timeAndDate).toLocaleString() : "",
        row.details,
        row.type,
        row.logged ? "Yes" : "No",
      ]);

      pdf.autoTable({
        startY: yPosition,
        head: [["Time and Date of Crash", "Details", "Type", "Logged"]],
        body: crashLogsTableData,
        theme: "grid",
        styles: { fontSize: 8 },
      });

      pdf.save(`${tracker.titlename}_Tracker.pdf`);

      toast({
        title: "PDF Exportado",
        description: `${tracker.titlename}_Tracker.pdf ha sido descargado.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      toast({
        title: "Error al exportar PDF",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Cálculos para el Dashboard
  const totalActiveTrackers = activeTrackers.length;
  const totalCompletedTrackers = historyTrackers.length;

  const averageProgress = useMemo(() => {
    if (totalActiveTrackers === 0) return 0;
    const totalProgress = activeTrackers.reduce(
      (sum, tracker) => sum + (tracker.progress || 0),
      0
    );
    return Math.round(totalProgress / totalActiveTrackers);
  }, [activeTrackers, totalActiveTrackers]);

  const passFailRate = useMemo(() => {
    let passCount = 0;
    let failCount = 0;
    (historyTrackers || []).forEach((tracker) => {
      (tracker.testcases || []).forEach((testCase) => {
        if (testCase.status === "PASS") passCount++;
        if (testCase.status === "FAIL") failCount++;
      });
    });
    const total = passCount + failCount;
    const passRate = total ? Math.round((passCount / total) * 100) : 0;
    const failRate = total ? Math.round((failCount / total) * 100) : 0;
    return { passRate, failRate };
  }, [historyTrackers]);

  const topFailingTestCases = useMemo(() => {
    const failCounts = {};
    (historyTrackers || []).forEach((tracker) => {
      (tracker.testcases || []).forEach((testCase) => {
        if (testCase.status === "FAIL") {
          failCounts[testCase.name] = (failCounts[testCase.name] || 0) + 1;
        }
      });
    });
    const sortedFailures = Object.entries(failCounts).sort(
      (a, b) => b[1] - a[1]
    );
    return sortedFailures.slice(0, 5);
  }, [historyTrackers]);

  const trackersOnTimeVsDelayed = useMemo(() => {
    let onTime = 0;
    let delayed = 0;
    (historyTrackers || []).forEach((tracker) => {
      if (
        tracker.completedon &&
        new Date(tracker.completedon) <= new Date(tracker.testenddate)
      ) {
        onTime++;
      } else {
        delayed++;
      }
    });
    return { onTime, delayed };
  }, [historyTrackers]);

  const testModelPerformance = useMemo(() => {
    const modelPassRates = {};
    (historyTrackers || []).forEach((tracker) => {
      let passCount = 0;
      let total = 0;
      (tracker.testcases || []).forEach((testCase) => {
        if (testCase.status === "PASS") passCount++;
        if (testCase.status === "PASS" || testCase.status === "FAIL") total++;
      });
      if (total > 0) {
        const passRate = Math.round((passCount / total) * 100);
        if (!modelPassRates[tracker.testmodel]) {
          modelPassRates[tracker.testmodel] = { passRate, count: 1 };
        } else {
          modelPassRates[tracker.testmodel].passRate += passRate;
          modelPassRates[tracker.testmodel].count += 1;
        }
      }
    });
    Object.keys(modelPassRates).forEach((model) => {
      modelPassRates[model] =
        Math.round(
          modelPassRates[model].passRate / modelPassRates[model].count
        ) || 0;
    });
    return modelPassRates;
  }, [historyTrackers]);

  const leadsWithMostCompletedTrackers = useMemo(() => {
    const leadCompletedCounts = {};
    (historyTrackers || []).forEach((tracker) => {
      leadCompletedCounts[tracker.leadname] =
        (leadCompletedCounts[tracker.leadname] || 0) + 1;
    });
    const sortedLeads = Object.entries(leadCompletedCounts).sort(
      (a, b) => b[1] - a[1]
    );
    return sortedLeads.slice(0, 5);
  }, [historyTrackers]);

  const trackersWithMostDelays = useMemo(() => {
    const delayedTrackers = (historyTrackers || [])
      .map((tracker) => {
        const completed = tracker.completedon
          ? new Date(tracker.completedon).getTime()
          : 0;
        const end = tracker.testenddate
          ? new Date(tracker.testenddate).getTime()
          : 0;
        const delay = completed - end;
        return {
          titleName: tracker.titlename,
          delayDays: Math.max(0, Math.ceil(delay / (1000 * 60 * 60 * 24))),
        };
      })
      .filter((t) => t.delayDays > 0)
      .sort((a, b) => b.delayDays - a.delayDays);
    return delayedTrackers.slice(0, 5);
  }, [historyTrackers]);

  const mostActiveTesters = useMemo(() => {
    const testerCounts = {};
    (historyTrackers || []).forEach((tracker) => {
      (tracker.testcases || []).forEach((testCase) => {
        const testerName = testCase.testerName || "Unknown";
        testerCounts[testerName] = (testerCounts[testerName] || 0) + 1;
      });
    });
    const sortedTesters = Object.entries(testerCounts).sort(
      (a, b) => b[1] - a[1]
    );
    return sortedTesters.slice(0, 5);
  }, [historyTrackers]);

  const averageTimeToCompleteTrackers = useMemo(() => {
    if ((historyTrackers || []).length === 0) return 0;
    const totalDays = (historyTrackers || []).reduce((sum, tracker) => {
      const startDate = tracker.teststartdate
        ? new Date(tracker.teststartdate)
        : null;
      const completedOn = tracker.completedon
        ? new Date(tracker.completedon)
        : null;
      if (!startDate || !completedOn) return sum;
      const days = Math.ceil(
        (completedOn.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);
    return Math.round(totalDays / (historyTrackers || []).length);
  }, [historyTrackers]);

  return (
    <Box width="100%" padding="4rem">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb="4"
      >
        <Box fontSize="2xl" fontWeight="bold">
          Submission Manager
        </Box>
        <Button onClick={() => navigate("/Home")}>Go to Home</Button>
      </Box>
      <Button mb="4" onClick={onOpen}>
        Add New Tracker
      </Button>
      <Tabs variant="enclosed-colored">
        <TabList>
          <Tab>
            <HStack spacing={2}>
              <FaTasks />
              <Text>Active Trackers</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack spacing={2}>
              <FaHistory />
              <Text>History</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack spacing={2}>
              <FaChartBar />
              <Text>Dashboard</Text>
            </HStack>
          </Tab>
          {/* La pestaña de Submission Planner ha sido eliminada */}
        </TabList>
        <TabPanels>
          {/* Active Trackers */}
          <TabPanel>
            <Box>
              {isLoading ? (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Title Name</Th>
                      <Th>Supported Platforms</Th>
                      <Th>Lead</Th>
                      <Th>Test Cases</Th>
                      <Th>Progress</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {[...Array(5)].map((_, index) => (
                      <Tr key={index}>
                        <Td>
                          <Skeleton height="20px" />
                        </Td>
                        <Td>
                          <Skeleton height="20px" />
                        </Td>
                        <Td>
                          <Skeleton height="20px" />
                        </Td>
                        <Td>
                          <Skeleton height="20px" />
                        </Td>
                        <Td>
                          <Skeleton height="20px" />
                        </Td>
                        <Td>
                          <Skeleton height="20px" />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Title Name</Th>
                      <Th>Supported Platforms</Th>
                      <Th>Lead</Th>
                      <Th>Test Cases</Th>
                      <Th>Progress</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {(activeTrackers || []).map((tracker) => (
                      <Tr key={tracker.id}>
                        <Td>{tracker.titlename}</Td>
                        <Td>{tracker.supportedplatforms}</Td>
                        <Td>{tracker.leadname}</Td>
                        <Td>{(tracker.testcases || []).length}</Td>
                        <Td>
                          <Tooltip label={`${tracker.progress}%`}>
                            <Progress
                              value={tracker.progress || 0}
                              size="sm"
                              colorScheme="green"
                              borderRadius="5px"
                            />
                          </Tooltip>
                        </Td>
                        <Td>
                          <Button
                            size="sm"
                            onClick={() => handleViewDetails(tracker)}
                            mr={2}
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleCompleteTracker(tracker)}
                            disabled={
                              !isTrackerComplete(tracker) || isCompleting
                            }
                            isLoading={isCompleting}
                            loadingText="Completando"
                            mr={2}
                          >
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="teal"
                            onClick={() => handleExportPDF(tracker)}
                          >
                            Export to PDF
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </Box>
          </TabPanel>

          {/* History */}
          <TabPanel>
            <Box>
              {isLoading ? (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Title Name</Th>
                      <Th>Lead</Th>
                      <Th>Completed On</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {[...Array(5)].map((_, index) => (
                      <Tr key={index}>
                        <Td>
                          <Skeleton height="20px" />
                        </Td>
                        <Td>
                          <Skeleton height="20px" />
                        </Td>
                        <Td>
                          <Skeleton height="20px" />
                        </Td>
                        <Td>
                          <Skeleton height="20px" />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Title Name</Th>
                      <Th>Lead</Th>
                      <Th>Completed On</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {(historyTrackers || []).map((tracker) => (
                      <Tr key={tracker.id}>
                        <Td>{tracker.titlename}</Td>
                        <Td>{tracker.leadname}</Td>
                        <Td>
                          {tracker.completedon
                            ? new Date(tracker.completedon).toLocaleDateString()
                            : ""}
                        </Td>
                        <Td>
                          <Button
                            size="sm"
                            onClick={() => handleViewDetails(tracker, true)}
                            mr={2}
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="teal"
                            onClick={() => handleExportPDF(tracker)}
                          >
                            Export to PDF
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </Box>
          </TabPanel>

          {/* Dashboard */}
          <TabPanel>
            <Grid templateColumns="1fr 300px" gap={6}>
              <GridItem>
                {isLoading ? (
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                    {[...Array(3)].map((_, index) => (
                      <Skeleton height="80px" key={index} />
                    ))}
                  </SimpleGrid>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                    <Stat p={4} borderRadius="md" shadow="md" bg="white">
                      <StatLabel>Total Active Trackers</StatLabel>
                      <StatNumber>{totalActiveTrackers}</StatNumber>
                    </Stat>
                    <Stat p={4} borderRadius="md" shadow="md" bg="white">
                      <StatLabel>Total Completed Trackers</StatLabel>
                      <StatNumber>{totalCompletedTrackers}</StatNumber>
                    </Stat>
                    <Stat p={4} borderRadius="md" shadow="md" bg="white">
                      <StatLabel>Average Progress</StatLabel>
                      <StatNumber>{averageProgress}%</StatNumber>
                    </Stat>
                  </SimpleGrid>
                )}

                {!isLoading && (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={6}>
                    <Box p={4} borderRadius="md" shadow="md" bg="white">
                      <Text fontSize="lg" fontWeight="bold" mb={4}>
                        Pass/Fail Rate
                      </Text>
                      <Progress
                        value={passFailRate.passRate}
                        colorScheme="green"
                        mb={2}
                      />
                      <Text>{passFailRate.passRate}% Pass</Text>
                      <Progress
                        value={passFailRate.failRate}
                        colorScheme="red"
                        mt={4}
                        mb={2}
                      />
                      <Text>{passFailRate.failRate}% Fail</Text>
                    </Box>

                    <Box p={4} borderRadius="md" shadow="md" bg="white">
                      <Text fontSize="lg" fontWeight="bold" mb={4}>
                        Trackers On Time vs Delayed
                      </Text>
                      <HStack spacing={4}>
                        <Badge
                          colorScheme="green"
                          px={4}
                          py={2}
                          borderRadius="md"
                        >
                          On Time: {trackersOnTimeVsDelayed.onTime}
                        </Badge>
                        <Badge
                          colorScheme="red"
                          px={4}
                          py={2}
                          borderRadius="md"
                        >
                          Delayed: {trackersOnTimeVsDelayed.delayed}
                        </Badge>
                      </HStack>
                    </Box>
                  </SimpleGrid>
                )}

                {!isLoading && (
                  <Box p={4} borderRadius="md" shadow="md" bg="white" mt={6}>
                    <Text fontSize="lg" fontWeight="bold" mb={4}>
                      Top Failing Test Cases
                    </Text>
                    {topFailingTestCases.map(([testCaseName, count]) => (
                      <Flex key={testCaseName} mb={2} alignItems="center">
                        <Text flex="1" fontWeight="medium">
                          {testCaseName}
                        </Text>
                        <Badge colorScheme="red">{count} fails</Badge>
                      </Flex>
                    ))}
                  </Box>
                )}

                {!isLoading && (
                  <Box p={4} borderRadius="md" shadow="md" bg="white" mt={6}>
                    <Text fontSize="lg" fontWeight="bold" mb={4}>
                      Test Model Performance
                    </Text>
                    {Object.entries(testModelPerformance).map(
                      ([model, passRate]) => (
                        <Flex key={model} mb={2} alignItems="center">
                          <Text flex="1" fontWeight="medium">
                            {model}
                          </Text>
                          <Progress
                            value={passRate}
                            colorScheme="green"
                            width="50%"
                            mr={2}
                          />
                          <Text>{passRate}%</Text>
                        </Flex>
                      )
                    )}
                  </Box>
                )}

                {!isLoading && (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={6}>
                    <Box p={4} borderRadius="md" shadow="md" bg="white">
                      <Text fontSize="lg" fontWeight="bold" mb={4}>
                        Leads with Most Completed Trackers
                      </Text>
                      {leadsWithMostCompletedTrackers.map(
                        ([leadName, count]) => (
                          <Flex key={leadName} mb={2} alignItems="center">
                            <Avatar name={leadName} size="sm" mr={2} />
                            <Text flex="1" fontWeight="medium">
                              {leadName}
                            </Text>
                            <Badge colorScheme="purple">{count} trackers</Badge>
                          </Flex>
                        )
                      )}
                    </Box>

                    <Box p={4} borderRadius="md" shadow="md" bg="white">
                      <Text fontSize="lg" fontWeight="bold" mb={4}>
                        Most Active Testers
                      </Text>
                      {mostActiveTesters.map(([testerName, count], index) => (
                        <Flex key={testerName} mb={2} alignItems="center">
                          <Avatar name={testerName} size="sm" mr={2} />
                          <Text flex="1" fontWeight="medium">
                            {testerName}
                          </Text>
                          <Badge colorScheme="blue">{count} test cases</Badge>
                          {index === 0 && <FaTrophy color="gold" size="20px" />}
                        </Flex>
                      ))}
                    </Box>
                  </SimpleGrid>
                )}

                {!isLoading && (
                  <Box p={4} borderRadius="md" shadow="md" bg="white" mt={6}>
                    <Text fontSize="lg" fontWeight="bold" mb={4}>
                      Trackers with Most Delays
                    </Text>
                    {trackersWithMostDelays.map((tracker) => (
                      <Flex key={tracker.titleName} mb={2} alignItems="center">
                        <Text flex="1" fontWeight="medium">
                          {tracker.titleName}
                        </Text>
                        <Badge colorScheme="red">
                          {tracker.delayDays} days delayed
                        </Badge>
                      </Flex>
                    ))}
                  </Box>
                )}

                {!isLoading && (
                  <Box p={4} borderRadius="md" shadow="md" bg="white" mt={6}>
                    <Stat>
                      <StatLabel>Average Time to Complete Trackers</StatLabel>
                      <StatNumber>
                        {averageTimeToCompleteTrackers} days
                      </StatNumber>
                    </Stat>
                  </Box>
                )}
              </GridItem>

              <GridItem>
                {isLoading ? (
                  <Box p={4} borderRadius="md" shadow="md" bg="white">
                    <Skeleton height="30px" mb={4} />
                    {[...Array(5)].map((_, index) => (
                      <Box key={index} w="100%" mb={4}>
                        <Skeleton height="20px" mb={2} />
                        <Skeleton height="15px" width="80%" />
                        <Skeleton height="1px" my={2} />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box p={4} borderRadius="md" shadow="md" bg="white">
                    <Text fontSize="xl" fontWeight="bold" mb={4}>
                      Activity Logs
                    </Text>
                    <VStack align="start" spacing={3}>
                      {logs
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((log) => (
                          <Box
                            key={`${log.id}-${log.action}-${log.date}`}
                            w="100%"
                          >
                            <Text fontWeight="medium">{log.title}</Text>
                            <Text fontSize="sm" color="gray.600">
                              {log.action} on{" "}
                              {log.date
                                ? new Date(log.date).toLocaleDateString()
                                : ""}
                            </Text>
                            <Divider my={2} />
                          </Box>
                        ))}
                    </VStack>
                  </Box>
                )}
              </GridItem>
            </Grid>
          </TabPanel>

          {/* Submission Planner ha sido eliminado */}
        </TabPanels>
      </Tabs>
      {/* Modal para agregar un nuevo tracker */}
      <Modal isOpen={isOpen} onClose={onClose} size="5xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Tracker</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <GridItem>
                <FormControl>
                  <FormLabel>Title Name</FormLabel>
                  <Input type="text" id="titleName" required />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl>
                  <FormLabel>Lead Name</FormLabel>
                  <Input type="text" id="leadName" required />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl>
                  <FormLabel>Test Start Date</FormLabel>
                  <Input type="date" id="testStartDate" required />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl>
                  <FormLabel>Test End Date</FormLabel>
                  <Input type="date" id="testEndDate" required />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl>
                  <FormLabel>Sandbox IDs</FormLabel>
                  <Input type="text" id="sandboxIds" />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl>
                  <FormLabel>Recovery Version</FormLabel>
                  <Input type="text" id="recoveryVersion" />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl>
                  <FormLabel>Binary ID</FormLabel>
                  <Input type="text" id="binaryId" />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl>
                  <FormLabel>SKU Identifier</FormLabel>
                  <Input type="text" id="skuIdentifier" />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl>
                  <FormLabel>Xbox Version</FormLabel>
                  <Input type="text" id="xboxVersion" />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl>
                  <FormLabel>Simplified User Model</FormLabel>
                  <Input type="text" id="simplifiedUserModel" />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl>
                  <FormLabel>Windows Version</FormLabel>
                  <Input type="text" id="windowsVersion" />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl>
                  <FormLabel>Supported Platforms</FormLabel>
                  <Input type="text" id="supportedPlatforms" />
                </FormControl>
              </GridItem>
              <GridItem colSpan={2}>
                <FormControl>
                  <FormLabel>Test Model</FormLabel>
                  <Select id="testModel">
                    <option value="">Select a Test Model</option>
                    {Object.keys(testModels).map((modelKey) => (
                      <option key={modelKey} value={modelKey}>
                        {modelKey}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>
            </Grid>
          </ModalBody>

          <ModalFooter>
            <Button onClick={handleSaveTracker} colorScheme="blue">
              Save
            </Button>
            <Button ml={3} onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {/* Modal para ver detalles del tracker */}
      <Modal isOpen={isDetailsOpen} onClose={onDetailsClose} size="6xl">
        <ModalOverlay />
        <ModalContent maxH="150vh" overflowY="auto">
          <ModalHeader>
            {isHistory ? "Submission Summary" : "Tracker Details"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody id="tracker-details-content">
            {selectedTracker && (
              <Tabs variant="enclosed-colored">
                <TabList>
                  <Tab>
                    <HStack spacing={2}>
                      <FaList />
                      <Text>Test Cases</Text>
                    </HStack>
                  </Tab>
                  <Tab>
                    <HStack spacing={2}>
                      <FaUserShield />
                      <Text>Account Privileges</Text>
                    </HStack>
                  </Tab>
                  <Tab>
                    <HStack spacing={2}>
                      <FaUserFriends />
                      <Text>Invites & Joins</Text>
                    </HStack>
                  </Tab>
                  <Tab>
                    <HStack spacing={2}>
                      <FaBug />
                      <Text>Crash Logs</Text>
                    </HStack>
                  </Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    <Box>
                      <Box mb={4}>
                        <strong>Title Name:</strong> {selectedTracker.titlename}
                        <br />
                        <strong>Lead Name:</strong> {selectedTracker.leadname}
                        <br />
                        <strong>Test Model:</strong> {selectedTracker.testmodel}
                      </Box>
                      <TestCasesTab
                        testCases={testCasesState}
                        setTestCases={setTestCases}
                        isHistory={isHistory}
                      />
                    </Box>
                  </TabPanel>

                  <TabPanel>
                    <Box>
                      {accountPrivilegesList.map((category) => (
                        <Box key={category.category} mb={6}>
                          <Text fontSize="lg" fontWeight="bold" mb={2}>
                            {category.category}
                          </Text>
                          <Table variant="simple" size="sm">
                            <Thead>
                              <Tr>
                                <Th>Setting</Th>
                                <Th>Value</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {category.settings.map((setting, index) => (
                                <Tr key={index}>
                                  <Td>{setting.name}</Td>
                                  <Td>{setting.value}</Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </Box>
                      ))}
                    </Box>
                  </TabPanel>

                  <TabPanel>
                    <InvitesJoinsTab
                      ref={invitesJoinsTabRef}
                      selectedTracker={selectedTracker}
                      isHistory={isHistory}
                    />
                  </TabPanel>

                  <TabPanel>
                    <CrashLogsTab
                      ref={crashLogsTabRef}
                      selectedTracker={selectedTracker}
                      isHistory={isHistory}
                    />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            )}
          </ModalBody>
          <ModalFooter>
            {!isHistory && (
              <Button colorScheme="green" mr={3} onClick={handleSaveChanges}>
                Save
              </Button>
            )}
            <Button onClick={onDetailsClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SubmissionManager;
