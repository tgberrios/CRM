// Docs.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import {
  Box,
  Button,
  Input,
  Textarea,
  List,
  ListItem,
  Heading,
  Text,
  useToast,
  Skeleton,
  Stack,
} from "@chakra-ui/react";
import {
  FaUser,
  FaBug,
  FaClipboardList,
  FaTools,
  FaTicketAlt,
} from "react-icons/fa"; // Corrected icon imports
import { MdUpdate } from "react-icons/md";
import { GiAchievement } from "react-icons/gi";
import sanitizeHtml from "sanitize-html";

/**
 * Custom hook to initialize and manage the Quill editor instance.
 * @param {boolean} isOpen - Determines if the editor should be initialized.
 * @param {string} content - The initial content to load into the editor.
 * @returns {object} - Contains the Quill instance and the reference to the editor DOM element.
 */
const useQuillEditor = (isOpen, content) => {
  const quillRef = useRef(null);
  const quillInstanceRef = useRef(null);

  useEffect(() => {
    if (isOpen && quillRef.current) {
      if (!quillInstanceRef.current) {
        quillInstanceRef.current = new Quill(quillRef.current, {
          theme: "snow",
          modules: {
            toolbar: [
              [{ header: "1" }, { header: "2" }, { font: [] }],
              [{ list: "ordered" }, { list: "bullet" }],
              ["bold", "italic", "underline"],
              ["link", "image"],
              [{ align: [] }],
              ["clean"],
            ],
          },
        });
      }
      quillInstanceRef.current.root.innerHTML = content || "";
    }
  }, [isOpen, content]);

  return { quillInstance: quillInstanceRef.current, quillRef };
};

/**
 * Main component for managing Xbox Test Cases.
 * @returns {JSX.Element} - The rendered component.
 */
const XboxDocs = () => {
  const [testCases, setTestCases] = useState([]);
  const [filteredTestCases, setFilteredTestCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [testCaseForm, setTestCaseForm] = useState({
    id: "",
    xr: "",
    passExample: "",
    failExample: "",
    naExample: "",
    documentation: "",
  });
  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [isSidePeekOpen, setSidePeekOpen] = useState(false);

  const { quillInstance, quillRef } = useQuillEditor(
    isSidePeekOpen,
    selectedTestCase?.documentation
  );
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true); // Loading state for data fetching

  useEffect(() => {
    loadData();
  }, []);

  /**
   * Fetches all test cases and updates the state.
   */
  const loadData = async () => {
    setLoading(true);
    try {
      const loadedTestCases = await window.cert.getAllTestCases();
      setTestCases(loadedTestCases);
      setFilteredTestCases(loadedTestCases);
      setLoading(false);
    } catch (error) {
      handleToast("Error loading test cases.", "error");
      setLoading(false);
    }
  };

  useEffect(() => {
    setFilteredTestCases(
      searchTerm
        ? testCases.filter((tc) =>
            tc.xr.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : testCases
    );
  }, [searchTerm, testCases]);

  /**
   * Displays a toast notification.
   * @param {string} description - The message to display.
   * @param {string} status - The status of the toast (e.g., "success", "error").
   */
  const handleToast = (description, status) => {
    toast({
      title: description,
      status: status,
      duration: 3000,
      isClosable: true,
      position: "top-right",
    });
  };

  /**
   * Saves a new or updated test case.
   * @param {Event} e - The form submission event.
   */
  const saveTestCase = async (e) => {
    e.preventDefault();
    const documentation = quillInstance?.root.innerHTML || "";
    const username = localStorage.getItem("username");

    if (
      !testCaseForm.xr ||
      !documentation ||
      !testCaseForm.passExample ||
      !testCaseForm.failExample ||
      !testCaseForm.naExample ||
      !username
    ) {
      handleToast("Please complete all fields.", "warning");
      return;
    }

    const updatedTestCase = { ...testCaseForm, documentation, username };

    try {
      if (testCaseForm.id) {
        // Update an existing test case
        const result = await window.cert.updateTestCase(updatedTestCase);
        if (result.changes > 0) {
          updateTestCaseList(updatedTestCase);
          handleToast("Test case updated successfully.", "success");
        }
      } else {
        // Insert a new test case
        const newTestCase = await window.cert.insertTestCase(updatedTestCase);
        if (newTestCase) {
          // Add the new test case to the list
          setTestCases((prev) => [...prev, newTestCase]);
          setFilteredTestCases((prev) => [...prev, newTestCase]);
          handleToast("Test case created successfully.", "success");
        }
      }
      resetForm();
      setSidePeekOpen(false);
    } catch (error) {
      handleToast("Error saving test case.", "error");
    }
  };

  /**
   * Updates the test case list with the updated test case.
   * @param {object} updatedTestCase - The updated test case object.
   */
  const updateTestCaseList = (updatedTestCase) => {
    setTestCases((prev) =>
      prev.map((tc) => (tc.id === updatedTestCase.id ? updatedTestCase : tc))
    );
    setFilteredTestCases((prev) =>
      prev.map((tc) => (tc.id === updatedTestCase.id ? updatedTestCase : tc))
    );
    setSelectedTestCase(updatedTestCase);
  };

  /**
   * Selects a test case for viewing.
   * @param {string} id - The ID of the test case.
   */
  const viewTestCase = (id) => {
    const testCase = testCases.find((tc) => tc.id === id);
    if (testCase) {
      setSelectedTestCase(testCase);
      setTestCaseForm({
        id: testCase.id,
        xr: testCase.xr,
        passExample: testCase.passExample,
        failExample: testCase.failExample,
        naExample: testCase.naExample,
        documentation: testCase.documentation,
      });
    }
  };

  /**
   * Resets the test case form.
   */
  const resetForm = () => {
    setTestCaseForm({
      id: "",
      xr: "",
      passExample: "",
      failExample: "",
      naExample: "",
      documentation: "",
    });
    if (quillInstance) {
      quillInstance.root.innerHTML = "";
    }
  };

  return (
    <Box display="flex" height="100vh">
      <Sidebar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        setSidePeekOpen={setSidePeekOpen}
        navigate={navigate}
        filteredTestCases={filteredTestCases}
        viewTestCase={viewTestCase}
      />

      <MainContent
        selectedTestCase={selectedTestCase}
        setSidePeekOpen={setSidePeekOpen}
      />

      {isSidePeekOpen && (
        <SidePeek
          testCaseForm={testCaseForm}
          setTestCaseForm={setTestCaseForm}
          saveTestCase={saveTestCase}
          setSidePeekOpen={setSidePeekOpen}
          quillRef={quillRef} // Pass quillRef here
        />
      )}
    </Box>
  );
};

/**
 * Sidebar component containing navigation and test case search.
 */
const Sidebar = ({
  searchTerm,
  setSearchTerm,
  setSidePeekOpen,
  navigate,
  filteredTestCases,
  viewTestCase,
}) => (
  <Box
    width="250px"
    bg="gray.100"
    p="20px"
    display="flex"
    flexDirection="column"
    overflowY="auto"
  >
    <Heading as="h2" size="lg" mb="10px">
      Xbox Docs
    </Heading>
    <Input
      placeholder="Search test cases..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      mb="10px"
    />
    <Button onClick={() => setSidePeekOpen(true)} colorScheme="blue" mb="10px">
      Add Test Case
    </Button>
    <Button colorScheme="blue" onClick={() => navigate("/Fma")} mb="10px">
      FMA Scenarios
    </Button>
    <Button colorScheme="blue" onClick={() => navigate("/Home")} mb="10px">
      Go to Home
    </Button>
    <Heading as="h4" size="md" mb="5px">
      TC Docs
    </Heading>
    <List spacing={3} overflowY="auto">
      {filteredTestCases.map((testCase) => (
        <ListItem
          key={testCase.id}
          cursor="pointer"
          onClick={() => viewTestCase(testCase.id)}
          _hover={{ textDecoration: "underline", color: "teal.500" }}
        >
          {testCase.xr}
        </ListItem>
      ))}
    </List>
  </Box>
);

/**
 * Main content area displaying selected test case details.
 */
const MainContent = ({ selectedTestCase, setSidePeekOpen }) => (
  <Box flexGrow={1} p="40px" bg="white" overflowY="auto">
    {selectedTestCase ? (
      <>
        <Heading as="h2" size="xl" mb="6">
          View Test Case
        </Heading>
        <Text fontWeight="bold" mb="2">
          Test Case XR:
        </Text>
        <Text mb="6">{selectedTestCase.xr}</Text>
        <TestCaseDetail
          title="Documentation"
          content={selectedTestCase.documentation}
        />
        <TestCaseDetail
          title="Pass Example"
          content={selectedTestCase.passExample}
        />
        <TestCaseDetail
          title="Fail Example"
          content={selectedTestCase.failExample}
        />
        <TestCaseDetail
          title="Non Applicable Example"
          content={selectedTestCase.naExample}
        />
        <Button colorScheme="blue" onClick={() => setSidePeekOpen(true)} mt="6">
          Edit Test Case
        </Button>
      </>
    ) : (
      <Text>Select a test case to view the details.</Text>
    )}
  </Box>
);

/**
 * SidePeek component for adding or editing a test case.
 */
const SidePeek = ({
  testCaseForm,
  setTestCaseForm,
  saveTestCase,
  setSidePeekOpen,
  quillRef,
}) => (
  <Box
    className="side-peek"
    style={{
      position: "fixed",
      top: 0,
      right: 0,
      height: "100%",
      width: "40%",
      backgroundColor: "white",
      boxShadow: "-3px 0px 5px rgba(0, 0, 0, 0.2)",
      padding: "24px",
      zIndex: 1000,
      overflowY: "auto",
      transition: "right 0.3s ease",
    }}
  >
    <Heading as="h2" size="lg" mb="6">
      Add/Edit Test Case
    </Heading>
    <form onSubmit={saveTestCase}>
      <InputField
        label="Test Case XR"
        value={testCaseForm.xr}
        onChange={(e) =>
          setTestCaseForm((prev) => ({ ...prev, xr: e.target.value }))
        }
      />
      <EditorField label="Documentation" quillRef={quillRef} />
      <TextareaField
        label="Pass Example"
        value={testCaseForm.passExample}
        onChange={(e) =>
          setTestCaseForm((prev) => ({ ...prev, passExample: e.target.value }))
        }
      />
      <TextareaField
        label="Fail Example"
        value={testCaseForm.failExample}
        onChange={(e) =>
          setTestCaseForm((prev) => ({ ...prev, failExample: e.target.value }))
        }
      />
      <TextareaField
        label="Non Applicable Example"
        value={testCaseForm.naExample}
        onChange={(e) =>
          setTestCaseForm((prev) => ({ ...prev, naExample: e.target.value }))
        }
      />
      <Button colorScheme="blue" type="submit" width="100%" mt="4" mb="4">
        Save Test Case
      </Button>
    </form>
    <Button
      colorScheme="red"
      onClick={() => setSidePeekOpen(false)}
      width="100%"
    >
      Close
    </Button>
  </Box>
);

/**
 * Reusable input field component.
 */
const InputField = ({ label, ...props }) => (
  <Box mb="5">
    <Text fontWeight="bold" mb="1">
      {label}
    </Text>
    <Input {...props} />
  </Box>
);

/**
 * Reusable textarea field component.
 */
const TextareaField = ({ label, ...props }) => (
  <Box mb="5">
    <Text fontWeight="bold" mb="1">
      {label}
    </Text>
    <Textarea rows={3} {...props} />
  </Box>
);

/**
 * Reusable editor field component using Quill.
 */
const EditorField = ({ label, quillRef }) => (
  <Box mb="5">
    <Text fontWeight="bold" mb="1">
      {label}
    </Text>
    <div
      ref={quillRef}
      style={{ height: "200px", border: "1px solid #ccc" }}
    ></div>
  </Box>
);

/**
 * Component to display detailed information of a test case.
 */
const TestCaseDetail = ({ title, content }) => (
  <>
    <Heading as="h4" size="md" mb="2">
      {title}:
    </Heading>
    <Box
      bg="gray.50"
      p="4"
      mb="4"
      borderRadius="md"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  </>
);

/**
 * Skeleton Loading component to display while data is being fetched.
 */
const SkeletonLoading = () => (
  <Stack spacing={6}>
    <Skeleton height="40px" />
    <Skeleton height="200px" />
    <Skeleton height="40px" />
    <Skeleton height="200px" />
  </Stack>
);

export default XboxDocs;
