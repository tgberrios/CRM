// ConsolePrep.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Heading,
  SimpleGrid,
  Divider,
  VStack,
  Text,
  Badge,
  Button,
  useToast,
  List,
  ListItem,
  HStack,
  Checkbox,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Select as ChakraSelect,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  Spinner,
  Icon,
  Stack,
  FormControl,
  FormLabel,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
  IconButton,
  Skeleton,
  SkeletonText,
} from "@chakra-ui/react";
import { format, addDays, parse } from "date-fns";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Select } from "chakra-react-select";
import {
  FaCalendarAlt,
  FaEnvelope,
  FaHome,
  FaSave,
  FaPlus,
  FaEdit,
  FaUserPlus,
  FaTrash,
  FaRandom,
} from "react-icons/fa";

// Utility function to check if the name includes [LEAD]
const isLead = (name) => name.includes("[LEAD]");

// Reusable component to display names with conditional styling
const NameDisplay = React.memo(({ name }) => {
  const isLeadName = isLead(name);
  return (
    <Text
      color={isLeadName ? "teal.500" : "black"}
      fontWeight={isLeadName ? "bold" : "normal"}
    >
      {name}
    </Text>
  );
});

// Available roles definition
const AVAILABLE_ROLES = [
  { value: "Tester", label: "Tester" },
  { value: "Lead", label: "Lead" },
  { value: "Manager", label: "Manager" },
  { value: "W10 Lead", label: "W10 Lead" },
  { value: "Senior Lead", label: "Senior Lead" },
  { value: "LabTech", label: "LabTech" },
  { value: "RML", label: "RML" },
  { value: "QA", label: "QA" },
];

// Helper functions to handle roles
const parseRoles = (roleString) =>
  roleString
    ? roleString
        .split(",")
        .map((role) => role.trim())
        .filter((role) => role)
    : [];

const joinRoles = (rolesArray) => rolesArray.join(", ");

// Function to format the date
const formatDate = (date) => format(date, "MM-dd-yyyy");

// Optimized PersonnelBox component
const PersonnelBox = React.memo(
  ({
    person,
    isEditing,
    team_id,
    index,
    handleInputChange,
    handleRemoveMember,
  }) => {
    const onNameChange = useCallback(
      (e) => {
        handleInputChange(team_id, index, "name", e.target.value);
      },
      [handleInputChange, team_id, index]
    );

    const onRoleChange = useCallback(
      (e) => {
        handleInputChange(team_id, index, "role", e.target.value);
      },
      [handleInputChange, team_id, index]
    );

    return (
      <Box
        p={2}
        bg="gray.50"
        borderRadius="md"
        w="100%"
        boxShadow="sm"
        position="relative"
      >
        {isEditing ? (
          <>
            <Input
              placeholder="Name"
              value={person.name}
              onChange={onNameChange}
              mb={1}
              size="sm"
              focusBorderColor="teal.400"
            />
            <Input
              placeholder="Title"
              value={person.role}
              onChange={onRoleChange}
              size="sm"
              focusBorderColor="teal.400"
            />
            {/* Button to remove member */}
            <IconButton
              icon={<FaTrash />}
              colorScheme="red"
              variant="ghost"
              aria-label="Remove Member"
              position="absolute"
              top="5px"
              right="5px"
              size="sm"
              onClick={() => handleRemoveMember(team_id, index)}
            />
          </>
        ) : (
          <>
            <NameDisplay name={person.name || "Unassigned"} />
            <Wrap>
              {parseRoles(person.role).map((role, idx) => (
                <WrapItem key={idx}>
                  <Tag colorScheme="teal" size="sm">
                    <TagLabel>{role}</TagLabel>
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          </>
        )}
      </Box>
    );
  }
);

// Optimized TeamCard component
const TeamCard = React.memo(
  ({
    team,
    isEditing,
    handleInputChange,
    handleAddMember,
    handleRemoveMember,
  }) => {
    return (
      <Box
        border="1px"
        borderColor="gray.300"
        borderRadius="lg"
        p={4}
        bg="white"
        boxShadow="md"
        transition="all 0.3s"
        _hover={{ transform: "scale(1.01)", boxShadow: "lg" }}
      >
        <Heading
          as="h2"
          size="md"
          mb={2}
          textAlign="center"
          color="teal.600"
          fontSize="lg"
        >
          {team.name}
        </Heading>

        <Badge
          colorScheme={
            team.category === "Xbox"
              ? "green"
              : team.category === "BVT"
              ? "blue"
              : "orange"
          }
          mb={2}
          alignSelf="center"
          fontSize="sm"
          p={1}
          borderRadius="md"
        >
          {team.category}
        </Badge>
        <Divider mb={2} />

        <VStack align="start" spacing={2}>
          <Text fontWeight="bold" color="gray.700" fontSize="sm">
            Personnel and Titles:
          </Text>
          {team.personnel.map((person, index) => (
            <PersonnelBox
              key={person.id || index}
              person={person}
              isEditing={isEditing}
              team_id={team.id}
              index={index}
              handleInputChange={handleInputChange}
              handleRemoveMember={handleRemoveMember}
            />
          ))}
          {isEditing && (
            <Button
              leftIcon={<FaPlus />}
              colorScheme="blue"
              variant="outline"
              size="sm"
              onClick={() => handleAddMember(team.id)}
            >
              Add Member
            </Button>
          )}
        </VStack>
      </Box>
    );
  }
);

const ConsolePrep = () => {
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date())); // Ensure using `formatDate` here
  const [currentTeams, setCurrentTeams] = useState([]);
  const [history, setHistory] = useState([]);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Initialized as false
  const [personnelList, setPersonnelList] = useState([]);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [newPersonnel, setNewPersonnel] = useState({ name: "", roles: [] });
  const [editPersonnel, setEditPersonnel] = useState({
    id: null,
    name: "",
    roles: [],
  });
  const [workDays, setWorkDays] = useState({});
  const [loading, setLoading] = useState(true);
  const [newConfigDate, setNewConfigDate] = useState(new Date());
  const [absentPersonnel, setAbsentPersonnel] = useState([]);
  const [isPersonnelModalOpen, setIsPersonnelModalOpen] = useState(false);
  const [isAddPersonnelModalOpen, setIsAddPersonnelModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const toast = useToast();
  const navigate = useNavigate();

  // New states for password modal and authentication
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [passwordInput, setPasswordInput] = useState("");

  // New state for entry to delete
  const [entryToDelete, setEntryToDelete] = useState(null);

  // Define mapping of workdays
  const workDaysMapping = useMemo(
    () => ({
      "mon-fri": [1, 2, 3, 4, 5],
      "sun-thu": [0, 1, 2, 3, 4],
      "tue-sat": [2, 3, 4, 5, 6],
    }),
    []
  );

  // Parse selectedDate and get the day of the week
  const parsedSelectedDate = useMemo(() => {
    if (typeof selectedDate !== "string") {
      console.error("selectedDate is not a string:", selectedDate);
      return new Date(); // Default value in case of error
    }
    return parse(selectedDate, "MM-dd-yyyy", new Date());
  }, [selectedDate]);

  const dayOfWeek = useMemo(
    () => parsedSelectedDate.getDay(),
    [parsedSelectedDate]
  );

  // Load data when the component mounts or selectedDate changes
  useEffect(() => {
    loadData(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const loadData = useCallback(
    async (date) => {
      console.log(`Loading data for date: ${date}`);
      setLoading(true);
      try {
        const [teams, personnel, historyData, workdaysData] = await Promise.all(
          [
            window.cert.getTeams(),
            window.cert.getPersonnel(),
            window.cert.getConfigHistory(),
            window.cert.getWorkDays(),
          ]
        );

        console.log("Teams data:", teams);
        console.log("Personnel data:", personnel);
        console.log("History data:", historyData);
        console.log("Workdays data:", workdaysData);

        // Remove duplicates in historyData
        const dateToEntryMap = {};
        historyData.forEach((entry) => {
          if (!dateToEntryMap[entry.date]) {
            dateToEntryMap[entry.date] = entry;
          } else {
            // Keep the most recent entry based on ID
            if (entry.id > dateToEntryMap[entry.date].id) {
              dateToEntryMap[entry.date] = entry;
            }
          }
        });
        const uniqueHistoryData = Object.values(dateToEntryMap);
        console.log("Unique History Data:", uniqueHistoryData);
        setHistory(uniqueHistoryData);

        // Get absent personnel for the selected date from localStorage
        const absentData =
          JSON.parse(localStorage.getItem("absent_personnel")) || {};
        const absentPersonnelForDate = absentData[date] || [];
        console.log(`Absent personnel for ${date}:`, absentPersonnelForDate);

        // Filter available personnel who are not absent
        const availablePersonnel = personnel.filter((person) => {
          const workDaysEntry = workdaysData.find(
            (wd) => wd.personnel_id === person.id
          );
          const workDaysArray = workDaysEntry
            ? workDaysMapping[workDaysEntry.work_days]
            : [];
          const isAvailable = workDaysArray.includes(dayOfWeek);
          return !absentPersonnelForDate.includes(person.id) && isAvailable;
        });

        console.log("Available Personnel:", availablePersonnel);
        setPersonnelList(availablePersonnel);

        // Correct date comparison
        const validHistoryEntries = uniqueHistoryData.filter(
          (entry) =>
            format(new Date(entry.date), "MM-dd-yyyy") === date &&
            entry.data &&
            entry.data !== "[]"
        );

        const historyEntry = validHistoryEntries.pop();
        console.log("History Entry for selected date:", historyEntry);

        if (historyEntry) {
          // Validate and parse historyEntry.data
          let parsedData;
          try {
            parsedData = JSON.parse(historyEntry.data);
            console.log("Parsed Data:", parsedData);

            // Check if parsedData is a string (indicating double serialization)
            if (typeof parsedData === "string") {
              parsedData = JSON.parse(parsedData);
              console.log("Double serialization detected. Data corrected.");
            }
          } catch (error) {
            console.error("Error parsing historyEntry.data:", error);
            toast({
              title: "Parsing Error",
              description: "Could not parse the stored configuration.",
              status: "error",
              duration: 3000,
              isClosable: true,
            });
            parsedData = null;
          }

          if (Array.isArray(parsedData)) {
            const parsedTeams = parsedData.map((team) => ({
              ...team,
              personnel: team.personnel.map((person) => ({
                ...person,
                role: person.role || "",
              })),
            }));
            console.log("Parsed Teams:", parsedTeams);
            setCurrentTeams(parsedTeams);
            setIsEditing(false); // Ensure not in edit mode
          } else {
            console.error("Parsed data is not an array:", parsedData);
            // Handle case where data is not an array
            toast({
              title: "Invalid Data",
              description: "The stored configuration is invalid.",
              status: "error",
              duration: 3000,
              isClosable: true,
            });
            // Optionally, set a default value or take other actions
            setCurrentTeams([]);
          }
        } else {
          // If no previous configuration, initialize teams with unassigned personnel
          const initialTeamsData = teams.map((team) => ({
            ...team,
            personnel: Array(5).fill({ name: "", role: "" }),
          }));
          console.log(
            "Initial Teams Data (No history found):",
            initialTeamsData
          );
          setCurrentTeams(initialTeamsData);
          // setIsEditing(true); // REMOVED to prevent opening in edit mode
        }

        // Map workDays
        const workDaysMap = {};
        workdaysData.forEach((wd) => {
          workDaysMap[wd.personnel_id] = wd.work_days;
        });
        console.log("Work Days Map:", workDaysMap);
        setWorkDays(workDaysMap);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "There was a problem loading the data.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    },
    [toast, workDaysMapping, dayOfWeek]
  );

  // Handle input changes
  const handleInputChange = useCallback((team_id, index, field, value) => {
    console.log(
      `Input Change - Team ID: ${team_id}, Index: ${index}, Field: ${field}, Value: ${value}`
    );
    setCurrentTeams((prevTeams) =>
      prevTeams.map((team) => {
        if (team.id === team_id) {
          const newPersonnel = [...team.personnel];
          const person = { ...newPersonnel[index] };
          person[field] = value;
          newPersonnel[index] = person;
          return { ...team, personnel: newPersonnel };
        } else {
          return team;
        }
      })
    );
  }, []);

  // Add a member to the team
  const handleAddMember = useCallback((team_id) => {
    console.log(`Adding member to Team ID: ${team_id}`);
    setCurrentTeams((prevTeams) =>
      prevTeams.map((team) => {
        if (team.id === team_id) {
          return {
            ...team,
            personnel: [...team.personnel, { name: "", role: "" }],
          };
        }
        return team;
      })
    );
  }, []);

  // Remove a member from the team
  const handleRemoveMember = useCallback((team_id, index) => {
    console.log(`Removing member from Team ID: ${team_id}, Index: ${index}`);
    setCurrentTeams((prevTeams) =>
      prevTeams.map((team) => {
        if (team.id === team_id) {
          const updatedPersonnel = team.personnel.filter(
            (_, idx) => idx !== index
          );
          return {
            ...team,
            personnel: updatedPersonnel,
          };
        }
        return team;
      })
    );
  }, []);

  // Handle role changes in the Personnel Editing Modal
  const handleRoleChange = useCallback((selectedOptions) => {
    console.log("Roles changed:", selectedOptions);
    setEditPersonnel((prev) => ({
      ...prev,
      roles: selectedOptions
        ? selectedOptions.map((option) => option.value)
        : [],
    }));
  }, []);

  // Save to history
  const saveToHistory = useCallback(async () => {
    console.log("Saving current configuration to history...");
    try {
      // Get current history
      const historyData = await window.cert.getConfigHistory();
      const existingEntry = historyData.find(
        (entry) => format(new Date(entry.date), "MM-dd-yyyy") === selectedDate
      );

      // Ensure currentTeams is an array
      if (!Array.isArray(currentTeams)) {
        throw new Error("currentTeams is not an array.");
      }

      const historyEntry = {
        id: existingEntry ? existingEntry.id : undefined,
        date: selectedDate,
        data: JSON.stringify(currentTeams), // Serialize once
      };

      if (existingEntry) {
        console.log("Updating existing history entry:", historyEntry);
        // Update existing entry
        await window.cert.updateConfigHistory(historyEntry);
      } else {
        console.log("Adding new history entry:", historyEntry);
        // Add a new entry
        await window.cert.addConfigHistory(historyEntry);
      }

      toast({
        title: "Configuration Saved",
        description: `The configuration for ${selectedDate} has been saved.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast({
        title: "Error",
        description: "There was a problem saving the configuration.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [selectedDate, currentTeams, toast]);

  // Handle new configuration
  const handleNewConfig = useCallback(() => {
    console.log("Initiating creation of new configuration...");
    setPendingAction("new");
    setIsPasswordModalOpen(true);
  }, []);

  const createNewConfig = useCallback(async () => {
    const formattedDate = formatDate(newConfigDate);
    console.log(`Creating new configuration for date: ${formattedDate}`);
    try {
      await window.cert.initializeTeams();

      const teams = await window.cert.getTeams();
      const initialTeamsData = teams.map((team) => ({
        ...team,
        personnel: Array(5).fill({ name: "", role: "" }),
      }));
      console.log("Initial Teams Data for New Config:", initialTeamsData);
      await window.cert.addConfigHistory({
        date: formattedDate,
        data: JSON.stringify(initialTeamsData), // Serialize once
      });
      setSelectedDate(formattedDate);
      setIsDateModalOpen(false);
      // setIsEditing(true); // REMOVED to prevent opening in edit mode

      // Store absent personnel in localStorage
      const absentData =
        JSON.parse(localStorage.getItem("absent_personnel")) || {};
      absentData[formattedDate] = absentPersonnel;
      localStorage.setItem("absent_personnel", JSON.stringify(absentData));

      toast({
        title: "New Configuration",
        description: `A new configuration has been started for ${formattedDate}.`,
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error creating new configuration:", error);
      toast({
        title: "Error",
        description: "There was a problem starting a new configuration.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [newConfigDate, absentPersonnel, toast]);

  const [newPersonnelWorkDays, setNewPersonnelWorkDays] = useState("");

  const handleAddPersonnel = useCallback(async () => {
    console.log("Adding new personnel:", newPersonnel);
    if (newPersonnel.name && newPersonnel.roles.length > 0) {
      try {
        const addedPerson = await window.cert.addPersonnel({
          name: newPersonnel.name,
          role: joinRoles(newPersonnel.roles),
        });
        console.log("Added Personnel:", addedPerson);
        setPersonnelList((prev) => [...prev, addedPerson]);
        setNewPersonnel({ name: "", roles: [] });
        setIsAddPersonnelModalOpen(false);
        // After adding personnel, set workdays if selected
        if (newPersonnelWorkDays) {
          await handleWorkDayChange(addedPerson.id, newPersonnelWorkDays);
        }
        setNewPersonnelWorkDays("");
        toast({
          title: "Personnel Added",
          description: `${addedPerson.name} has been successfully added.`,
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      } catch (error) {
        console.error("Error adding personnel:", error);
        toast({
          title: "Error",
          description: "There was a problem adding the personnel.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } else {
      toast({
        title: "Incomplete Information",
        description: "Please provide a name and at least one role.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [newPersonnel, toast, handleWorkDayChange, newPersonnelWorkDays]);

  const handleDateSelect = useCallback((date) => {
    const formattedDate = formatDate(date); // Convert to consistent format
    console.log(`Date selected: ${formattedDate}`);
    setSelectedDate(formattedDate); // Save as formatted string
  }, []);

  const handleEditPersonnel = useCallback((person) => {
    console.log("Editing personnel:", person);
    setSelectedPersonnel(person);
    setEditPersonnel({
      id: person.id,
      name: person.name,
      roles: parseRoles(person.role),
    });
    setIsPersonnelModalOpen(true);
  }, []);

  const handleDeletePersonnel = useCallback(
    async (id) => {
      console.log(`Deleting personnel with ID: ${id}`);
      try {
        const result = await window.cert.deletePersonnel(id);
        if (result.deleted) {
          console.log(`Personnel with ID ${id} deleted successfully.`);
          setPersonnelList((prev) => prev.filter((person) => person.id !== id));
          toast({
            title: "Personnel Removed",
            description: "The personnel has been removed.",
            status: "info",
            duration: 2000,
            isClosable: true,
          });
        } else {
          console.warn(`Personnel with ID ${id} was not deleted.`);
        }
      } catch (error) {
        console.error("Error deleting personnel:", error);
        toast({
          title: "Error",
          description: "There was a problem removing the personnel.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [toast]
  );

  const handleSaveEdit = useCallback(async () => {
    console.log("Saving edits for personnel:", editPersonnel);
    if (editPersonnel.id) {
      try {
        const updatedPerson = {
          id: editPersonnel.id,
          name: editPersonnel.name,
          role: joinRoles(editPersonnel.roles),
        };
        const result = await window.cert.updatePersonnel(updatedPerson);
        console.log("Updated Personnel:", result);
        setPersonnelList((prev) =>
          prev.map((person) => (person.id === result.id ? result : person))
        );
        setSelectedPersonnel(null);
        setEditPersonnel({ id: null, name: "", roles: [] });
        setIsPersonnelModalOpen(false);
        toast({
          title: "Personnel Updated",
          description: "The personnel information has been updated.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error("Error saving personnel edits:", error);
        toast({
          title: "Error",
          description: "There was a problem updating the personnel.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  }, [editPersonnel, toast]);

  const handleWorkDayChange = useCallback(
    async (person_id, days) => {
      console.log(
        `Updating work days for Personnel ID: ${person_id}, Days: ${days}`
      );
      try {
        const existingWorkDay = workDays[person_id];
        if (existingWorkDay) {
          console.log(
            `Updating existing work days for Personnel ID: ${person_id}`
          );
          await window.cert.updateWorkDay({
            personnel_id: person_id,
            work_days: days,
          });
        } else {
          console.log(`Adding new work days for Personnel ID: ${person_id}`);
          await window.cert.addWorkDay({
            personnel_id: person_id,
            work_days: days,
          });
        }

        setWorkDays((prev) => ({ ...prev, [person_id]: days }));
        toast({
          title: "Work Days Updated",
          description: "The work days have been successfully updated.",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      } catch (error) {
        console.error("Error updating work days:", error);
        toast({
          title: "Error",
          description: "There was a problem updating the work days.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [workDays, toast]
  );

  // Handle sending email
  const handleSendEmail = useCallback(() => {
    console.log("Sending email with current configuration.");
    // Filter teams that have at least one assigned member
    const assignedTeams = currentTeams.filter((team) =>
      team.personnel.some(
        (person) => person.name && person.role && person.role !== "No role"
      )
    );

    // Check if there are assigned teams
    if (assignedTeams.length === 0) {
      toast({
        title: "No Assignments",
        description: "There is no personnel assigned to send in the email.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Define fixed column widths
    const nameColumnWidth = 20;
    const roleColumnWidth = 30;

    // Helper function to format text with alignment
    const formatText = (text, width, align = "left") => {
      if (text.length > width) {
        // If text is longer than specified width, leave it as is.
        return text;
      } else {
        // If text is shorter than specified width, add padding for alignment.
        const padding = width - text.length;
        if (align === "left") {
          return text + " ".repeat(padding);
        } else if (align === "right") {
          return " ".repeat(padding) + text;
        } else {
          const padStart = Math.floor(padding / 2);
          const padEnd = padding - padStart;
          return " ".repeat(padStart) + text + " ".repeat(padEnd);
        }
      }
    };

    // Array of colored circle emojis
    const coloredCircles = ["🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪"];

    // Build the summary of teams and assigned personnel with better formatting
    let teamSummary = `Console Preparation Distribution for ${selectedDate} \n\n`;

    assignedTeams.forEach((team, index) => {
      const colorEmoji = coloredCircles[index % coloredCircles.length];

      teamSummary += `════════════════════════════════════════\n`;
      teamSummary += `${colorEmoji} Team: ${team.name} (${team.category})\n`;
      teamSummary += `════════════════════════════════════════\n`;

      teamSummary += `┌${"─".repeat(nameColumnWidth)}┬${"─".repeat(
        roleColumnWidth
      )}┐\n`;
      teamSummary += `│${formatText(
        "Name",
        nameColumnWidth,
        "center"
      )}│${formatText("Titles", roleColumnWidth, "center")}│\n`;
      teamSummary += `├${"─".repeat(nameColumnWidth)}┼${"─".repeat(
        roleColumnWidth
      )}┤\n`;

      team.personnel
        .filter(
          (person) => person.name && person.role && person.role !== "No role"
        )
        .forEach((person) => {
          const name = formatText(person.name, nameColumnWidth);
          const role = formatText(person.role, roleColumnWidth);
          teamSummary += `│${name}│${role}│\n`;
        });

      teamSummary += `└${"─".repeat(nameColumnWidth)}┴${"─".repeat(
        roleColumnWidth
      )}┘\n\n`;
    });

    teamSummary += `Best regards,\nCR Team`;

    console.log("Email Body:", teamSummary);

    // Encode the email body
    const emailBody = encodeURIComponent(teamSummary);

    // Generate the mailto link
    const mailtoLink = `mailto:?subject=${encodeURIComponent(
      `Console Preparation Distribution for ${selectedDate}`
    )}&body=${emailBody}`;

    // Open the default email client
    window.location.href = mailtoLink;
  }, [currentTeams, selectedDate, toast]);

  const handlePersonnelClick = useCallback(
    (person) => {
      console.log("Personnel clicked:", person);
      handleEditPersonnel(person);
    },
    [handleEditPersonnel]
  );

  // Handle password submission
  const handlePasswordSubmit = useCallback(() => {
    console.log("Submitting password for pending action:", pendingAction);
    const adminPassword = "!! abc 123"; // Ensure to store this securely
    if (passwordInput === adminPassword) {
      console.log("Password correct. Proceeding with action:", pendingAction);
      setIsPasswordModalOpen(false);
      setPasswordInput("");
      switch (pendingAction) {
        case "edit":
          setIsEditing(true);
          console.log("Entering edit mode.");
          break;
        case "new":
          setIsDateModalOpen(true);
          setAbsentPersonnel([]);
          console.log("Opening New Configuration modal.");
          break;
        case "add":
          setIsAddPersonnelModalOpen(true);
          console.log("Opening Add Personnel modal.");
          break;
        case "delete":
          if (entryToDelete) {
            console.log("Proceeding to delete date:", entryToDelete);
            proceedToDeleteDate(entryToDelete);
          }
          break;
        default:
          break;
      }
      setPendingAction(null);
    } else {
      console.warn("Incorrect password entered.");
      toast({
        title: "Incorrect Password",
        description: "The password you entered is incorrect.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setPasswordInput("");
    }
  }, [
    passwordInput,
    pendingAction,
    toast,
    setIsPasswordModalOpen,
    setPasswordInput,
    setIsEditing,
    setIsDateModalOpen,
    setAbsentPersonnel,
    setIsAddPersonnelModalOpen,
    entryToDelete,
    proceedToDeleteDate,
  ]);

  const proceedToDeleteDate = useCallback(
    async (entry) => {
      console.log(`Proceeding to delete configuration for date: ${entry.date}`);
      try {
        // Confirm deletion
        const confirmed = window.confirm(
          `Are you sure you want to delete the configuration for ${formatDate(
            new Date(entry.date)
          )}?`
        );
        if (confirmed) {
          await window.cert.deleteConfigHistory(entry.date);
          console.log(`Configuration for date ${entry.date} deleted.`);

          // Update history after deletion
          const historyData = await window.cert.getConfigHistory();
          // Remove duplicates
          const dateToEntryMap = {};
          historyData.forEach((entry) => {
            if (!dateToEntryMap[entry.date]) {
              dateToEntryMap[entry.date] = entry;
            } else {
              if (entry.id > dateToEntryMap[entry.date].id) {
                dateToEntryMap[entry.date] = entry;
              }
            }
          });
          const uniqueHistoryData = Object.values(dateToEntryMap);
          console.log(
            "Updated Unique History Data after deletion:",
            uniqueHistoryData
          );
          setHistory(uniqueHistoryData);

          // If the deleted date is the selected date, reset the selection
          if (formatDate(new Date(entry.date)) === selectedDate) {
            const tomorrow = formatDate(addDays(new Date(), 1));
            console.log(
              `Selected date was deleted. Setting new selected date to tomorrow: ${tomorrow}`
            );
            setSelectedDate(tomorrow);
            // Load data for the new selected date
            loadData(tomorrow);
          }

          toast({
            title: "Date Deleted",
            description: `The configuration for ${formatDate(
              new Date(entry.date)
            )} has been deleted.`,
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error("Error deleting date:", error);
        toast({
          title: "Error",
          description: "There was a problem deleting the date.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        // Reset the entryToDelete state after attempting to delete
        setEntryToDelete(null);
      }
    },
    [toast, selectedDate, loadData]
  );

  // Memoize teams and filtered personnel list
  const memoizedTeams = useMemo(() => currentTeams, [currentTeams]);

  const filteredPersonnelList = useMemo(
    () =>
      personnelList.filter((person) =>
        person.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [personnelList, searchQuery]
  );

  // Function to randomize personnel assignments (without validations)
  const handleRandomize = useCallback(() => {
    console.log("Randomizing personnel assignments.");
    // Filter available personnel by specific roles
    const availableManagers = personnelList.filter((person) =>
      parseRoles(person.role).includes("Manager")
    );
    const availableSeniorLeads = personnelList.filter((person) =>
      parseRoles(person.role).includes("Senior Lead")
    );
    const availableRMLs = personnelList.filter((person) =>
      parseRoles(person.role).includes("RML")
    );
    const availableLabTechs = personnelList.filter((person) =>
      parseRoles(person.role).includes("LabTech")
    );
    const availableLeads = personnelList.filter((person) =>
      parseRoles(person.role).includes("Lead")
    );
    const availableTesters = personnelList.filter((person) =>
      parseRoles(person.role).includes("Tester")
    );

    // Shuffle function
    const shuffle = (array) => array.sort(() => Math.random() - 0.5);

    // Shuffle Leads and Testers
    const shuffledManagers = shuffle([...availableManagers]);
    const shuffledSeniorLeads = shuffle([...availableSeniorLeads]);
    const shuffledRMLs = shuffle([...availableRMLs]);
    const shuffledLabTechs = shuffle([...availableLabTechs]);
    const shuffledLeads = shuffle([...availableLeads]);
    const shuffledTesters = shuffle([...availableTesters]);

    // Track assigned IDs to avoid duplicates
    const assignedIds = new Set();

    // Create new team configurations with random assignments
    const newTeams = currentTeams.map((team) => {
      const newPersonnel = team.personnel.map((person, index) => {
        if (person.role && person.role.trim() !== "") {
          // Assign based on specific role
          if (parseRoles(person.role).includes("Manager")) {
            // Assign a Manager
            const Manager = shuffledManagers.find(
              (p) => !assignedIds.has(p.id)
            );
            if (Manager) {
              assignedIds.add(Manager.id);
              return { ...person, name: Manager.name };
            } else {
              return { ...person, name: "No Manager Available" };
            }
          } else if (parseRoles(person.role).includes("Senior Lead")) {
            // Assign a Senior Lead
            const seniorLead = shuffledSeniorLeads.find(
              (p) => !assignedIds.has(p.id)
            );
            if (seniorLead) {
              assignedIds.add(seniorLead.id);
              return { ...person, name: seniorLead.name };
            } else {
              return { ...person, name: "No Senior Lead Available" };
            }
          } else if (parseRoles(person.role).includes("RML")) {
            // Assign an RML
            const RML = shuffledRMLs.find((p) => !assignedIds.has(p.id));
            if (RML) {
              assignedIds.add(RML.id);
              return { ...person, name: RML.name };
            } else {
              return { ...person, name: "No RML Available" };
            }
          } else if (parseRoles(person.role).includes("LabTech")) {
            // Assign a LabTech
            const labTech = shuffledLabTechs.find(
              (p) => !assignedIds.has(p.id)
            );
            if (labTech) {
              assignedIds.add(labTech.id);
              return { ...person, name: labTech.name };
            } else {
              return { ...person, name: "No LabTech Available" };
            }
          } else if (parseRoles(person.role).includes("Lead")) {
            // Assign a Lead
            const Lead = shuffledLeads.find((p) => !assignedIds.has(p.id));
            if (Lead) {
              assignedIds.add(Lead.id);
              return { ...person, name: Lead.name };
            } else {
              return { ...person, name: "No Lead Available" };
            }
          } else {
            // Assign a Tester
            const Tester = shuffledTesters.find((p) => !assignedIds.has(p.id));
            if (Tester) {
              assignedIds.add(Tester.id);
              return { ...person, name: Tester.name };
            } else {
              return { ...person, name: "No Tester Available" };
            }
          }
        } else {
          return person;
        }
      });
      return { ...team, personnel: newPersonnel };
    });

    // Update state with new teams
    setCurrentTeams(newTeams);
    console.log("Randomized Teams:", newTeams);
    toast({
      title: "Randomization Complete",
      description: "Personnel has been randomly assigned to teams.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  }, [personnelList, currentTeams, toast]);

  const handleDeleteDate = useCallback((entry) => {
    console.log("Deleting date entry:", entry);
    // Save the entry to delete and open the password modal
    setEntryToDelete(entry);
    setPendingAction("delete");
    setIsPasswordModalOpen(true);
  }, []);

  return (
    <Box display="flex" flexDirection={{ base: "column", lg: "row" }}>
      {/* Main Area */}
      <Box flex="1" p={4} bg="gray.100" minHeight="100vh">
        <Heading as="h1" size="lg" mb={4} color="teal.700">
          Console Preparation
        </Heading>

        <Text fontSize="md" mb={2} color="gray.800">
          Configuration for:{" "}
          <strong>{formatDate(new Date(selectedDate))}</strong>
        </Text>

        <HStack spacing={2} mb={4} flexWrap="wrap">
          <Button
            onClick={() => setIsDrawerOpen(true)}
            colorScheme="blue"
            leftIcon={<Icon as={FaCalendarAlt} />}
            size="sm"
          >
            Select Date
          </Button>
          <Button
            colorScheme="teal"
            onClick={handleSendEmail}
            leftIcon={<Icon as={FaEnvelope} />}
            size="sm"
          >
            Send Email
          </Button>
          <Button
            colorScheme="purple"
            onClick={() => navigate("/home")}
            leftIcon={<Icon as={FaHome} />}
            size="sm"
          >
            Home
          </Button>
          <Button
            colorScheme="green"
            onClick={saveToHistory}
            leftIcon={<Icon as={FaSave} />}
            isDisabled={!isEditing}
            size="sm"
          >
            Save
          </Button>
          <Button
            colorScheme="orange"
            onClick={handleNewConfig}
            leftIcon={<Icon as={FaPlus} />}
            size="sm"
          >
            New
          </Button>
          {!isEditing && (
            <Button
              colorScheme="teal"
              onClick={() => {
                setPendingAction("edit");
                setIsPasswordModalOpen(true);
              }}
              leftIcon={<Icon as={FaEdit} />}
              size="sm"
            >
              Edit
            </Button>
          )}
          <Button
            colorScheme="teal"
            onClick={() => {
              setPendingAction("add");
              setIsPasswordModalOpen(true);
            }}
            leftIcon={<Icon as={FaUserPlus} />}
            size="sm"
          >
            Add
          </Button>
          {isEditing && (
            <Button
              colorScheme="purple"
              onClick={handleRandomize}
              leftIcon={<Icon as={FaRandom} />}
              size="sm"
            >
              Randomize
            </Button>
          )}
          <Input
            placeholder="Search Personnel"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            width={{ base: "100%", md: "150px" }}
            size="sm"
            focusBorderColor="teal.400"
          />
        </HStack>

        {loading ? (
          <Box textAlign="center" mt={10}>
            <Skeleton height="40px" mb={4} />
            <SkeletonText mt="4" noOfLines={4} spacing="4" />
          </Box>
        ) : currentTeams.length === 0 ? (
          <Text textAlign="center" color="gray.600" fontSize="md">
            There are no teams to display.
          </Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 3, lg: 4 }} spacing={4}>
            {memoizedTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                isEditing={isEditing}
                handleInputChange={handleInputChange}
                handleAddMember={handleAddMember}
                handleRemoveMember={handleRemoveMember}
              />
            ))}
          </SimpleGrid>
        )}

        <Divider my={4} />

        {/* Password Modal */}
        <Modal
          isOpen={isPasswordModalOpen}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setPasswordInput("");
            setPendingAction(null);
            setEntryToDelete(null);
          }}
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Administrator Authentication</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>Please enter the administrator password:</Text>
              <Input
                type="password"
                placeholder="Enter password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                mt={2}
                focusBorderColor="teal.400"
              />
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" onClick={handlePasswordSubmit} mr={2}>
                Submit
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setPasswordInput("");
                  setPendingAction(null);
                  setEntryToDelete(null);
                }}
              >
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* New Configuration Modal */}
        <Modal
          isOpen={isDateModalOpen}
          onClose={() => setIsDateModalOpen(false)}
          size="lg"
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>New Configuration</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={2} align="start">
                <Text fontSize="md" color="gray.700">
                  Please select the date for the new console preparation:
                </Text>
                <DatePicker
                  selected={new Date(newConfigDate)} // Convert to Date object if necessary
                  onChange={(date) => setNewConfigDate(formatDate(date))} // Convert to readable string
                  dateFormat="MM-dd-yyyy"
                  minDate={new Date()} // Ensure using a valid Date
                  customInput={<Input size="sm" />}
                />
                <Divider />
                <Text fontSize="md" color="gray.700">
                  Select personnel who will be absent:
                </Text>
                <Stack maxH="200px" overflowY="auto" w="100%" spacing={1}>
                  {personnelList
                    .filter((person) =>
                      person.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                    )
                    .map((person) => (
                      <Checkbox
                        key={person.id}
                        value={person.id}
                        isChecked={absentPersonnel.includes(person.id)}
                        onChange={(e) => {
                          const { checked } = e.target;
                          setAbsentPersonnel((prev) => {
                            if (checked) {
                              return [...prev, person.id];
                            } else {
                              return prev.filter((id) => id !== person.id);
                            }
                          });
                        }}
                        colorScheme="teal"
                        size="sm"
                      >
                        {person.name} - {parseRoles(person.role).join(", ")}
                      </Checkbox>
                    ))}
                </Stack>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" onClick={createNewConfig} mr={2}>
                Create
              </Button>
              <Button variant="ghost" onClick={() => setIsDateModalOpen(false)}>
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Add Personnel Modal */}
        <Modal
          isOpen={isAddPersonnelModalOpen}
          onClose={() => setIsAddPersonnelModalOpen(false)}
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Add Personnel</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl mb={2}>
                <FormLabel>Name</FormLabel>
                <Input
                  placeholder="Name"
                  value={newPersonnel.name}
                  onChange={(e) =>
                    setNewPersonnel({ ...newPersonnel, name: e.target.value })
                  }
                  size="sm"
                  focusBorderColor="teal.400"
                />
              </FormControl>
              {/* Multi-Select for Roles */}
              <FormControl mb={2}>
                <FormLabel>Select Roles</FormLabel>
                <Select
                  isMulti
                  name="roles"
                  options={AVAILABLE_ROLES}
                  placeholder="Select roles"
                  closeMenuOnSelect={false}
                  value={AVAILABLE_ROLES.filter((option) =>
                    newPersonnel.roles.includes(option.value)
                  )}
                  onChange={(selectedOptions) =>
                    setNewPersonnel({
                      ...newPersonnel,
                      roles: selectedOptions
                        ? selectedOptions.map((option) => option.value)
                        : [],
                    })
                  }
                  styles={{
                    menu: (provided) => ({ ...provided, zIndex: 9999 }),
                  }}
                  size="sm"
                />
              </FormControl>
              <FormControl mb={2}>
                <FormLabel>Set Work Days</FormLabel>
                <ChakraSelect
                  placeholder="Set work days"
                  value={newPersonnelWorkDays}
                  onChange={(e) => setNewPersonnelWorkDays(e.target.value)}
                  focusBorderColor="teal.400"
                  size="sm"
                >
                  <option value="mon-fri">Mon-Fri</option>
                  <option value="sun-thu">Sun-Thu</option>
                  <option value="tue-sat">Tue-Sat</option>
                </ChakraSelect>
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="teal" onClick={handleAddPersonnel} mr={2}>
                Add
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsAddPersonnelModalOpen(false)}
              >
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Date Selection Drawer */}
        <Drawer
          isOpen={isDrawerOpen}
          placement="left"
          onClose={() => setIsDrawerOpen(false)}
          size="xs"
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Select a Date</DrawerHeader>
            <DrawerBody>
              <List spacing={1}>
                {history
                  .sort((a, b) => new Date(b.date) - new Date(a.date)) // Ensure date is a valid Date
                  .map((entry) => (
                    <ListItem
                      key={entry.id}
                      p={2}
                      bg={
                        format(new Date(entry.date), "MM-dd-yyyy") ===
                        selectedDate
                          ? "teal.100"
                          : "gray.50"
                      }
                      borderRadius="md"
                      _hover={{ bg: "teal.200" }}
                      transition="background-color 0.2s"
                      fontSize="sm"
                    >
                      <HStack
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Box
                          flex="1"
                          cursor="pointer"
                          onClick={() =>
                            handleDateSelect(formatDate(new Date(entry.date)))
                          }
                        >
                          {formatDate(new Date(entry.date))}{" "}
                          {/* Ensure to convert to string */}
                        </Box>
                        <IconButton
                          icon={<FaTrash />}
                          colorScheme="red"
                          variant="ghost"
                          aria-label="Delete Date"
                          size="sm"
                          onClick={() => handleDeleteDate(entry)}
                        />
                      </HStack>
                    </ListItem>
                  ))}
              </List>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Box>

      {/* Personnel Sidebar */}
      <Box
        w={{ base: "100%", lg: "300px" }}
        p={2}
        bg="white"
        boxShadow="lg"
        borderLeft="1px solid"
        borderColor="gray.200"
        minHeight="100vh"
        position="sticky"
        top="0"
        overflowY="auto"
        h="100vh"
      >
        <Heading as="h2" size="md" mb={4} color="teal.700">
          Personnel
        </Heading>
        <List spacing={2}>
          {filteredPersonnelList.map((person) => {
            const personWorkDays = workDays[person.id];
            const workDaysArray = workDaysMapping[personWorkDays];
            const isAvailable = workDaysArray?.includes(dayOfWeek);
            const isAssigned =
              currentTeams.some((team) =>
                team.personnel.some((p) => p.name === person.name)
              ) || isLead(person.name); // Consider [LEAD] as assigned

            return (
              <ListItem
                key={person.id}
                p={2}
                onClick={() => handlePersonnelClick(person)}
                cursor="pointer"
                bg={isAssigned ? "gray.200" : "white"}
                color={isAssigned ? "gray.600" : "black"}
                borderRadius="md"
                boxShadow="sm"
                _hover={{ bg: "teal.50" }}
                transition="background-color 0.2s"
              >
                <NameDisplay name={person.name} />
                <Wrap>
                  {parseRoles(person.role).map((role, idx) => (
                    <WrapItem key={idx}>
                      <Badge colorScheme="teal" size="sm">
                        {role}
                      </Badge>
                    </WrapItem>
                  ))}
                  {isAssigned && (
                    <WrapItem>
                      <Badge colorScheme="purple" size="sm">
                        Assigned
                      </Badge>
                    </WrapItem>
                  )}
                </Wrap>
                {isAvailable ? (
                  <Badge ml={1} colorScheme="green" fontSize="xs">
                    Available
                  </Badge>
                ) : (
                  <Badge ml={1} colorScheme="red" fontSize="xs">
                    Out of Service
                  </Badge>
                )}
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Personnel Modal */}
      {selectedPersonnel && (
        <Modal
          isOpen={isPersonnelModalOpen}
          onClose={() => setIsPersonnelModalOpen(false)}
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Edit Personnel</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {/* Name Field */}
              <FormControl mb={2}>
                <FormLabel>Name</FormLabel>
                <Input
                  placeholder="Name"
                  value={editPersonnel.name}
                  onChange={(e) =>
                    setEditPersonnel((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  size="sm"
                  focusBorderColor="teal.400"
                />
              </FormControl>

              {/* Multi-Select for Roles */}
              <FormControl mb={2}>
                <FormLabel>Select Roles</FormLabel>
                <Select
                  isMulti
                  name="roles"
                  options={AVAILABLE_ROLES}
                  placeholder="Select roles"
                  closeMenuOnSelect={false}
                  value={AVAILABLE_ROLES.filter((option) =>
                    editPersonnel.roles.includes(option.value)
                  )}
                  onChange={handleRoleChange}
                  styles={{
                    menu: (provided) => ({ ...provided, zIndex: 9999 }),
                  }}
                  size="sm"
                />
              </FormControl>

              {/* Work Days Selection */}
              <FormControl>
                <FormLabel>Set Work Days</FormLabel>
                <ChakraSelect
                  placeholder="Set work days"
                  value={workDays[editPersonnel.id] || ""}
                  onChange={(e) =>
                    handleWorkDayChange(editPersonnel.id, e.target.value)
                  }
                  focusBorderColor="teal.400"
                  size="sm"
                >
                  <option value="mon-fri">Mon-Fri</option>
                  <option value="sun-thu">Sun-Thu</option>
                  <option value="tue-sat">Tue-Sat</option>
                </ChakraSelect>
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" onClick={handleSaveEdit} mr={2}>
                Save Changes
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsPersonnelModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={() => {
                  handleDeletePersonnel(editPersonnel.id);
                  setIsPersonnelModalOpen(false);
                }}
              >
                Delete
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
};

// Export the component
export default ConsolePrep;
