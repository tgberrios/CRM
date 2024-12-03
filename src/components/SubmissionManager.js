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
  useColorModeValue,
  IconButton,
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
  FaSearch,
  FaFilter,
} from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import debounce from "lodash.debounce";

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
    <Grid templateColumns="repeat(4, 1fr)" gap={4} mb={4}>
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
      <GridItem colSpan={1}>
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
  );
});

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
          leftIcon={<FaSearch />}
        />
        <Select
          placeholder="Filtrar por estado"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          width="200px"
          leftIcon={<FaFilter />}
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

const InvitesJoinsTab = React.memo(
  React.forwardRef(({ selectedTracker, isHistory }, ref) => {
    const initialData = useMemo(() => {
      return (
        selectedTracker.invitesJoinsData || [
          {
            location: "Terminated State",
            systemInvite: "",
            systemJoin: "",
            gameInvite: "",
            gameJoin: "",
          },
          {
            location: "Suspended at the main menu",
            systemInvite: "",
            systemJoin: "",
            gameInvite: "",
            gameJoin: "",
          },
          {
            location: "Suspended during single player gameplay",
            systemInvite: "",
            systemJoin: "",
            gameInvite: "",
            gameJoin: "",
          },
          {
            location:
              "Constrained in various Areas (check various menus, and active gameplay)",
            systemInvite: "",
            systemJoin: "",
            gameInvite: "",
            gameJoin: "",
          },
          {
            location: "Main Menu",
            systemInvite: "",
            systemJoin: "",
            gameInvite: "",
            gameJoin: "",
          },
          {
            location: "Active Singleplayer gameplay",
            systemInvite: "",
            systemJoin: "",
            gameInvite: "",
            gameJoin: "",
          },
          {
            location: "Active Multiplayer Gameplay",
            systemInvite: "",
            systemJoin: "",
            gameInvite: "",
            gameJoin: "",
          },
          {
            location: "While Matchmaking",
            systemInvite: "",
            systemJoin: "",
            gameInvite: "",
            gameJoin: "",
          },
          {
            location: "Pre Game Lobby",
            systemInvite: "",
            systemJoin: "",
            gameInvite: "",
            gameJoin: "",
          },
          {
            location: "Options",
            systemInvite: "",
            systemJoin: "",
            gameInvite: "",
            gameJoin: "",
          },
          {
            location: "Credits",
            systemInvite: "",
            systemJoin: "",
            gameInvite: "",
            gameJoin: "",
          },
        ]
      );
    }, [selectedTracker.invitesJoinsData]);

    const [data, setData] = useState(initialData);

    useEffect(() => {
      setData(initialData);
    }, [initialData]);

    useImperativeHandle(ref, () => ({
      getData: () => data,
    }));

    const handleChange = useCallback((index, field, value) => {
      setData((prevData) => {
        const updatedData = [...prevData];
        updatedData[index] = {
          ...updatedData[index],
          [field]: value,
        };
        return updatedData;
      });
    }, []);

    const handleAddRow = useCallback(() => {
      setData((prevData) => [
        ...prevData,
        {
          location: "",
          systemInvite: "",
          systemJoin: "",
          gameInvite: "",
          gameJoin: "",
        },
      ]);
    }, []);

    const handleRemoveRow = useCallback((index) => {
      setData((prevData) => prevData.filter((_, i) => i !== index));
    }, []);

    const getCellStyle = useCallback(
      (value) => {
        if (value.toLowerCase() === "pass") {
          return {
            backgroundColor: useColorModeValue("green.100", "green.700"),
          };
        } else if (value.toLowerCase() === "fail") {
          return { backgroundColor: useColorModeValue("red.100", "red.700") };
        } else {
          return {};
        }
      },
      [useColorModeValue]
    );

    return (
      <Box>
        {!isHistory && (
          <Button mb={4} onClick={handleAddRow}>
            Add Location
          </Button>
        )}
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Location</Th>
              <Th>System Invite</Th>
              <Th>System Join</Th>
              <Th>Game Invite</Th>
              <Th>Game Join</Th>
              {!isHistory && <Th>Actions</Th>}
            </Tr>
          </Thead>
          <Tbody>
            {data.map((row, index) => (
              <Tr key={index}>
                <Td>
                  {isHistory ? (
                    <Text>{row.location}</Text>
                  ) : (
                    <Input
                      value={row.location}
                      onChange={(e) =>
                        handleChange(index, "location", e.target.value)
                      }
                    />
                  )}
                </Td>
                <Td>
                  <Input
                    value={row.systemInvite}
                    onChange={(e) =>
                      handleChange(index, "systemInvite", e.target.value)
                    }
                    style={getCellStyle(row.systemInvite)}
                    isReadOnly={isHistory}
                  />
                </Td>
                <Td>
                  <Input
                    value={row.systemJoin}
                    onChange={(e) =>
                      handleChange(index, "systemJoin", e.target.value)
                    }
                    style={getCellStyle(row.systemJoin)}
                    isReadOnly={isHistory}
                  />
                </Td>
                <Td>
                  <Input
                    value={row.gameInvite}
                    onChange={(e) =>
                      handleChange(index, "gameInvite", e.target.value)
                    }
                    style={getCellStyle(row.gameInvite)}
                    isReadOnly={isHistory}
                  />
                </Td>
                <Td>
                  <Input
                    value={row.gameJoin}
                    onChange={(e) =>
                      handleChange(index, "gameJoin", e.target.value)
                    }
                    style={getCellStyle(row.gameJoin)}
                    isReadOnly={isHistory}
                  />
                </Td>
                {!isHistory && (
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleRemoveRow(index)}
                    >
                      Delete
                    </Button>
                  </Td>
                )}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    );
  })
);

const CrashLogsTab = React.memo(
  React.forwardRef(({ selectedTracker, isHistory }, ref) => {
    const initialData = useMemo(() => {
      return selectedTracker.crashLogs || [];
    }, [selectedTracker.crashLogs]);

    const [data, setData] = useState(initialData);

    useEffect(() => {
      setData(initialData);
    }, [initialData]);

    useImperativeHandle(ref, () => ({
      getData: () => data,
    }));

    const handleAddRow = useCallback(() => {
      setData((prevData) => [
        ...prevData,
        {
          timeAndDate: "",
          details: "",
          type: "",
          logged: false,
        },
      ]);
    }, []);

    const handleRemoveRow = useCallback((index) => {
      setData((prevData) => prevData.filter((_, i) => i !== index));
    }, []);

    const handleChange = useCallback((index, field, value) => {
      setData((prevData) => {
        const updatedData = [...prevData];
        updatedData[index] = {
          ...updatedData[index],
          [field]: value,
        };
        return updatedData;
      });
    }, []);

    return (
      <Box>
        {!isHistory && (
          <Button mb={4} onClick={handleAddRow}>
            Add Crash Log
          </Button>
        )}
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Time and Date of Crash</Th>
              <Th>Details</Th>
              <Th>Type</Th>
              <Th>Logged?</Th>
              {!isHistory && <Th>Actions</Th>}
            </Tr>
          </Thead>
          <Tbody>
            {data.map((row, index) => (
              <Tr key={index}>
                <Td>
                  {isHistory ? (
                    <Text>{row.timeAndDate}</Text>
                  ) : (
                    <Input
                      type="datetime-local"
                      value={row.timeAndDate}
                      onChange={(e) =>
                        handleChange(index, "timeAndDate", e.target.value)
                      }
                    />
                  )}
                </Td>
                <Td>
                  {isHistory ? (
                    <Text>{row.details}</Text>
                  ) : (
                    <Input
                      value={row.details}
                      onChange={(e) =>
                        handleChange(index, "details", e.target.value)
                      }
                    />
                  )}
                </Td>
                <Td>
                  {isHistory ? (
                    <Text>{row.type}</Text>
                  ) : (
                    <Input
                      value={row.type}
                      onChange={(e) =>
                        handleChange(index, "type", e.target.value)
                      }
                    />
                  )}
                </Td>
                <Td>
                  {isHistory ? (
                    <Text>{row.logged ? "Yes" : "No"}</Text>
                  ) : (
                    <Select
                      value={row.logged}
                      onChange={(e) =>
                        handleChange(index, "logged", e.target.value === "true")
                      }
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </Select>
                  )}
                </Td>
                {!isHistory && (
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleRemoveRow(index)}
                    >
                      Delete
                    </Button>
                  </Td>
                )}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    );
  })
);

// Datos para Privilegios de Cuenta
const accountPrivilegesList = [
  {
    category: "Online status and History",
    settings: [
      { name: "Others can see if you're online", value: "Block" },
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
      {
        name: "See other people's Xbox profiles",
        value: "Everybody",
      },
      { name: "Real name", value: "Block" },
      {
        name: "You can share your real name with friends of friends",
        value: "Block",
      },
    ],
  },
  {
    category: "Friends & clubs",
    settings: [
      { name: "You can add friends", value: "Allow" },
      { name: "Others can see your friends list", value: "Block" },
      { name: "You can create and join clubs", value: "Allow" },
      { name: "Others can see your club memberships", value: "Block" },
    ],
  },
  {
    category: "Communication & multiplayer",
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
    category: "Game content",
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
    category: "Sharing outside of Xbox Live",
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
    settings: [{ name: "Ask before buying", value: "Off" }],
  },
];

const SubmissionManager = () => {
  const [trackers, setTrackers] = useState([]);
  const [historyTrackers, setHistoryTrackers] = useState([]);
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

  useEffect(() => {
    async function fetchData() {
      if (window.cert && window.cert.getTrackers) {
        const data = await window.cert.getTrackers();
        setTrackers(data.filter((tracker) => !tracker.completedOn));
        setHistoryTrackers(data.filter((tracker) => tracker.completedOn));

        const logsData = data.map((tracker) => {
          return {
            id: tracker.id,
            title: tracker.titleName,
            action: tracker.completedOn ? "Completed" : "Created",
            date: tracker.completedOn || tracker.testStartDate,
          };
        });
        setLogs(logsData);
      } else {
        console.error("window.cert is not available");
      }
    }
    fetchData();
  }, []);

  const handleSaveTracker = async () => {
    const selectedModel = document.getElementById("testModel").value;
    const newTracker = {
      username: localStorage.getItem("username") || "Tomy Berrios",
      titleName: document.getElementById("titleName").value,
      leadName: document.getElementById("leadName").value,
      testStartDate: document.getElementById("testStartDate").value,
      testEndDate: document.getElementById("testEndDate").value,
      sandboxIds: document.getElementById("sandboxIds").value,
      recoveryVersion: document.getElementById("recoveryVersion").value,
      binaryId: document.getElementById("binaryId").value,
      skuIdentifier: document.getElementById("skuIdentifier").value,
      xboxVersion: document.getElementById("xboxVersion").value,
      simplifiedUserModel: document.getElementById("simplifiedUserModel").value,
      windowsVersion: document.getElementById("windowsVersion").value,
      supportedPlatforms: document.getElementById("supportedPlatforms").value,
      testModel: selectedModel,
      testCases:
        testModels[selectedModel]?.map((testCaseId) => ({
          id: testCaseId,
          name: testCases[testCaseId],
          status: "In Progress", // Default status is now "In Progress"
          testerName: "",
          comment: "",
        })) || [],
      progress: 0,
      crashLogs: [], // Initialize crashLogs
      invitesJoinsData: [], // Initialize Invites & Joins data
    };

    if (window.cert && window.cert.addTracker) {
      const addedTracker = await window.cert.addTracker(newTracker);
      setTrackers((prevTrackers) => [...prevTrackers, addedTracker]);
      onClose();

      setLogs((prevLogs) => [
        {
          id: addedTracker.id,
          title: addedTracker.titleName,
          action: "Created",
          date: addedTracker.testStartDate,
        },
        ...prevLogs,
      ]);
    } else {
      console.error("window.cert.addTracker is not available");
    }
  };

  const handleViewDetails = (tracker, isHistory = false) => {
    setSelectedTracker(tracker);
    setIsHistory(isHistory);
    setTestCases(tracker.testCases || []);
    onDetailsOpen();
  };

  const handleSaveChanges = useCallback(async () => {
    if (selectedTracker) {
      const invitesJoinsData = invitesJoinsTabRef.current?.getData();
      const crashLogsData = crashLogsTabRef.current?.getData();

      const updatedTracker = {
        ...selectedTracker,
        testCases: testCasesState,
        invitesJoinsData,
        crashLogs: crashLogsData,
      };

      const totalCases = testCasesState.length;
      const completedCases = testCasesState.filter(
        (tc) => tc.status === "PASS" || tc.status === "FAIL"
      ).length;
      const progress = Math.round((completedCases / totalCases) * 100);
      updatedTracker.progress = progress;

      if (window.cert && window.cert.updateTracker) {
        await window.cert.updateTracker(updatedTracker);
        toast({
          title: "Changes Saved",
          description: "Your changes have been saved successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        console.error("window.cert.updateTracker is not available");
      }

      setSelectedTracker(updatedTracker);

      if (isHistory) {
        setHistoryTrackers((prevHistory) =>
          prevHistory.map((t) =>
            t.id === updatedTracker.id ? updatedTracker : t
          )
        );
      } else {
        setTrackers((prevTrackers) =>
          prevTrackers.map((t) =>
            t.id === updatedTracker.id ? updatedTracker : t
          )
        );
      }
    }
  }, [selectedTracker, testCasesState, isHistory, toast]);

  const isTrackerComplete = useCallback((tracker) => {
    return (
      tracker.testCases.length > 0 &&
      tracker.testCases.every(
        (tc) =>
          tc.testerName.trim() !== "" &&
          tc.comment.trim() !== "" &&
          tc.status !== "In Progress"
      )
    );
  }, []);

  const handleCompleteTracker = async (tracker) => {
    const completedTracker = {
      ...tracker,
      completedOn: new Date().toISOString().split("T")[0],
    };

    if (window.cert && window.cert.updateTracker) {
      await window.cert.updateTracker(completedTracker);
    } else {
      console.error("window.cert.updateTracker is not available");
    }

    setTrackers((prevTrackers) =>
      prevTrackers.filter((t) => t.id !== tracker.id)
    );
    setHistoryTrackers((prevHistory) => [...prevHistory, completedTracker]);

    setLogs((prevLogs) => [
      {
        id: completedTracker.id,
        title: completedTracker.titleName,
        action: "Completed",
        date: completedTracker.completedOn,
      },
      ...prevLogs,
    ]);

    toast({
      title: "Tracker Completed",
      description: `${tracker.titleName} has been marked as completed.`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  // Función corregida para exportar a PDF sin el resumen de Test Cases
  const handleExportPDF = async (tracker) => {
    // Abre el modal de detalles en modo historial
    handleViewDetails(tracker, true);

    // Espera a que el modal se renderice
    await new Promise((resolve) => setTimeout(resolve, 500));

    const pdf = new jsPDF();

    // Añade el título
    pdf.setFontSize(18);
    pdf.text("Submission Summary", 14, 22);

    // Añade información básica
    pdf.setFontSize(12);
    pdf.text(`Title Name: ${tracker.titleName}`, 14, 32);
    pdf.text(`Lead Name: ${tracker.leadName}`, 14, 40);
    pdf.text(`Test Model: ${tracker.testModel}`, 14, 48);
    pdf.text(`Completed On: ${tracker.completedOn}`, 14, 56);

    // Añade una línea separadora
    pdf.setLineWidth(0.5);
    pdf.line(14, 60, 200, 60);

    // Añade la tabla de Casos de Prueba
    const testCasesData = tracker.testCases.map((tc, index) => [
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

    // Añade Privilegios de Cuenta
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

    // Añade Datos de Invites & Joins
    pdf.setFontSize(14);
    pdf.text("Invites & Joins", 14, yPosition);

    yPosition += 6;

    const invitesJoinsData = tracker.invitesJoinsData || [];
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

    // Añade Logs de Crash
    pdf.setFontSize(14);
    pdf.text("Crash Logs", 14, yPosition);

    yPosition += 6;

    const crashLogsData = tracker.crashLogs || [];
    const crashLogsTableData = crashLogsData.map((row) => [
      row.timeAndDate,
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

    // Guarda el PDF
    pdf.save(`${tracker.titleName}_Tracker.pdf`);
  };

  const totalActiveTrackers = trackers.length;
  const totalCompletedTrackers = historyTrackers.length;

  // Calculate average progress
  const averageProgress = useMemo(() => {
    if (totalActiveTrackers === 0) return 0;
    const totalProgress = trackers.reduce(
      (sum, tracker) => sum + tracker.progress,
      0
    );
    return Math.round(totalProgress / totalActiveTrackers);
  }, [trackers, totalActiveTrackers]);

  // Pass/Fail rate
  const passFailRate = useMemo(() => {
    let passCount = 0;
    let failCount = 0;
    historyTrackers.forEach((tracker) => {
      tracker.testCases.forEach((testCase) => {
        if (testCase.status === "PASS") passCount++;
        if (testCase.status === "FAIL") failCount++;
      });
    });
    const total = passCount + failCount;
    const passRate = total ? Math.round((passCount / total) * 100) : 0;
    const failRate = total ? Math.round((failCount / total) * 100) : 0;
    return { passRate, failRate };
  }, [historyTrackers]);

  // Top failing test cases
  const topFailingTestCases = useMemo(() => {
    const failCounts = {};
    historyTrackers.forEach((tracker) => {
      tracker.testCases.forEach((testCase) => {
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

  // Trackers on time vs delayed
  const trackersOnTimeVsDelayed = useMemo(() => {
    let onTime = 0;
    let delayed = 0;
    historyTrackers.forEach((tracker) => {
      if (new Date(tracker.completedOn) <= new Date(tracker.testEndDate)) {
        onTime++;
      } else {
        delayed++;
      }
    });
    return { onTime, delayed };
  }, [historyTrackers]);

  // Test model performance
  const testModelPerformance = useMemo(() => {
    const modelPassRates = {};
    historyTrackers.forEach((tracker) => {
      let passCount = 0;
      let total = 0;
      tracker.testCases.forEach((testCase) => {
        if (testCase.status === "PASS") passCount++;
        if (testCase.status === "PASS" || testCase.status === "FAIL") total++;
      });
      if (total > 0) {
        const passRate = Math.round((passCount / total) * 100);
        if (!modelPassRates[tracker.testModel]) {
          modelPassRates[tracker.testModel] = { passRate, count: 1 };
        } else {
          modelPassRates[tracker.testModel].passRate += passRate;
          modelPassRates[tracker.testModel].count += 1;
        }
      }
    });
    // Average the pass rates
    Object.keys(modelPassRates).forEach((model) => {
      modelPassRates[model] =
        Math.round(
          modelPassRates[model].passRate / modelPassRates[model].count
        ) || 0;
    });
    return modelPassRates;
  }, [historyTrackers]);

  // Leads with most completed trackers
  const leadsWithMostCompletedTrackers = useMemo(() => {
    const leadCompletedCounts = {};
    historyTrackers.forEach((tracker) => {
      leadCompletedCounts[tracker.leadName] =
        (leadCompletedCounts[tracker.leadName] || 0) + 1;
    });
    const sortedLeads = Object.entries(leadCompletedCounts).sort(
      (a, b) => b[1] - a[1]
    );
    return sortedLeads.slice(0, 5);
  }, [historyTrackers]);

  // Trackers with most delays
  const trackersWithMostDelays = useMemo(() => {
    const delayedTrackers = historyTrackers
      .map((tracker) => {
        const delay =
          new Date(tracker.completedOn) - new Date(tracker.testEndDate);
        return {
          titleName: tracker.titleName,
          delayDays: Math.max(0, Math.ceil(delay / (1000 * 60 * 60 * 24))),
        };
      })
      .filter((t) => t.delayDays > 0)
      .sort((a, b) => b.delayDays - a.delayDays);
    return delayedTrackers.slice(0, 5);
  }, [historyTrackers]);

  // Most active testers
  const mostActiveTesters = useMemo(() => {
    const testerCounts = {};
    historyTrackers.forEach((tracker) => {
      tracker.testCases.forEach((testCase) => {
        const testerName = testCase.testerName || "Unknown";
        testerCounts[testerName] = (testerCounts[testerName] || 0) + 1;
      });
    });
    const sortedTesters = Object.entries(testerCounts).sort(
      (a, b) => b[1] - a[1]
    );
    return sortedTesters.slice(0, 5);
  }, [historyTrackers]);

  // Average time to complete trackers
  const averageTimeToCompleteTrackers = useMemo(() => {
    if (historyTrackers.length === 0) return 0;
    const totalDays = historyTrackers.reduce((sum, tracker) => {
      const startDate = new Date(tracker.testStartDate);
      const completedOn = new Date(tracker.completedOn);
      const days = Math.ceil(
        (completedOn.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);
    return Math.round(totalDays / historyTrackers.length);
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
        </TabList>
        <TabPanels>
          {/* Active Trackers */}
          <TabPanel>
            <Box>
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
                  {trackers.map((tracker) => (
                    <Tr key={tracker.id}>
                      <Td>{tracker.titleName}</Td>
                      <Td>{tracker.supportedPlatforms}</Td>
                      <Td>{tracker.leadName}</Td>
                      <Td>{tracker.testCases.length}</Td>
                      <Td>
                        <Tooltip label={`${tracker.progress}%`}>
                          <Progress
                            value={tracker.progress}
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
                          disabled={!isTrackerComplete(tracker)}
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
            </Box>
          </TabPanel>

          {/* History */}
          <TabPanel>
            <Box>
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
                  {historyTrackers.map((tracker) => (
                    <Tr key={tracker.id}>
                      <Td>{tracker.titleName}</Td>
                      <Td>{tracker.leadName}</Td>
                      <Td>{tracker.completedOn}</Td>
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
            </Box>
          </TabPanel>

          {/* Dashboard */}
          <TabPanel>
            <Grid templateColumns="1fr 300px" gap={6}>
              {/* Dashboard Main */}
              <GridItem>
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
                      <Badge colorScheme="red" px={4} py={2} borderRadius="md">
                        Delayed: {trackersOnTimeVsDelayed.delayed}
                      </Badge>
                    </HStack>
                  </Box>
                </SimpleGrid>

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

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={6}>
                  <Box p={4} borderRadius="md" shadow="md" bg="white">
                    <Text fontSize="lg" fontWeight="bold" mb={4}>
                      Leads with Most Completed Trackers
                    </Text>
                    {leadsWithMostCompletedTrackers.map(([leadName, count]) => (
                      <Flex key={leadName} mb={2} alignItems="center">
                        <Avatar name={leadName} size="sm" mr={2} />
                        <Text flex="1" fontWeight="medium">
                          {leadName}
                        </Text>
                        <Badge colorScheme="purple">{count} trackers</Badge>
                      </Flex>
                    ))}
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

                <Box p={4} borderRadius="md" shadow="md" bg="white" mt={6}>
                  <Stat>
                    <StatLabel>Average Time to Complete Trackers</StatLabel>
                    <StatNumber>
                      {averageTimeToCompleteTrackers} days
                    </StatNumber>
                  </Stat>
                </Box>
              </GridItem>

              {/* Logs Sidebar */}
              <GridItem>
                <Box p={4} borderRadius="md" shadow="md" bg="white">
                  <Text fontSize="xl" fontWeight="bold" mb={4}>
                    Activity Logs
                  </Text>
                  <VStack align="start" spacing={3}>
                    {logs
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((log) => (
                        <Box key={`${log.id}-${log.action}`} w="100%">
                          <Text fontWeight="medium">{log.title}</Text>
                          <Text fontSize="sm" color="gray.600">
                            {log.action} on {log.date}
                          </Text>
                          <Divider my={2} />
                        </Box>
                      ))}
                  </VStack>
                </Box>
              </GridItem>
            </Grid>
          </TabPanel>
        </TabPanels>
      </Tabs>
      {/* Modal to add a new tracker */}
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
              {/* Test Model Field */}
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
            <Button onClick={handleSaveTracker}>Save</Button>
            <Button ml={3} onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {/* Modal to view tracker details */}
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
                  {/* Test Cases Tab */}
                  <TabPanel>
                    <Box>
                      {/* Display relevant tracker data */}
                      <Box mb={4}>
                        <strong>Title Name:</strong> {selectedTracker.titleName}
                        <br />
                        <strong>Lead Name:</strong> {selectedTracker.leadName}
                        <br />
                        <strong>Test Model:</strong> {selectedTracker.testModel}
                      </Box>
                      {/* Test Cases Tab Component */}
                      <TestCasesTab
                        testCases={testCasesState}
                        setTestCases={setTestCases}
                        isHistory={isHistory}
                      />
                    </Box>
                  </TabPanel>

                  {/* Account Privileges Tab */}
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

                  {/* Invites & Joins Tab */}
                  <TabPanel>
                    <InvitesJoinsTab
                      ref={invitesJoinsTabRef}
                      selectedTracker={selectedTracker}
                      isHistory={isHistory}
                    />
                  </TabPanel>

                  {/* Crash Logs Tab */}
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
