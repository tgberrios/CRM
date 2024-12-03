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
} from "@chakra-ui/react";

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

  useEffect(() => {
    window.cert
      .getAllTestCases()
      .then((loadedTestCases) => {
        setTestCases(loadedTestCases);
        setFilteredTestCases(loadedTestCases);
      })
      .catch((error) => handleToast("Error loading test cases.", "error"));
  }, []);

  useEffect(() => {
    setFilteredTestCases(
      searchTerm
        ? testCases.filter((tc) =>
            tc.xr.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : testCases
    );
  }, [searchTerm, testCases]);

  const handleToast = (description, status) => {
    toast({
      title: description,
      status: status,
      duration: 2000,
      isClosable: true,
    });
  };

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
        // Actualizar un test case existente
        const result = await window.cert.updateTestCase(updatedTestCase);
        if (result.changes > 0) {
          updateTestCaseList(updatedTestCase);
          handleToast("Test case updated successfully.", "success");
        }
      } else {
        // Agregar un nuevo test case
        const newTestCase = await window.cert.insertTestCase(updatedTestCase);
        if (newTestCase) {
          // Añadimos el nuevo caso a la lista
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

  const updateTestCaseList = (updatedTestCase) => {
    setTestCases((prev) =>
      prev.map((tc) => (tc.id === updatedTestCase.id ? updatedTestCase : tc))
    );
    setFilteredTestCases((prev) =>
      prev.map((tc) => (tc.id === updatedTestCase.id ? updatedTestCase : tc))
    );
    setSelectedTestCase(updatedTestCase);
  };

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
          quillRef={quillRef} // Pasamos quillRef aquí
        />
      )}
    </Box>
  );
};

const Sidebar = ({
  searchTerm,
  setSearchTerm,
  setSidePeekOpen,
  navigate,
  filteredTestCases,
  viewTestCase,
}) => (
  <Box
    width="200px"
    bg="gray.100"
    p="10px"
    display="flex"
    flexDirection="column"
  >
    <Heading as="h2" size="lg" mb="5">
      Xbox Docs
    </Heading>
    <Input
      placeholder="Search test cases..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      mb="5"
    />
    <Button onClick={() => setSidePeekOpen(true)} colorScheme="blue" mb="5">
      Add Test Case
    </Button>
    <Button colorScheme="blue" onClick={() => navigate("/Fma")} mb="5">
      FMA Scenarios
    </Button>
    <Button colorScheme="blue" onClick={() => navigate("/Home")} mb="5">
      Go to Home
    </Button>
    <Heading as="h4" size="md" mb="3">
      TC Docs
    </Heading>
    <List spacing={3}>
      {filteredTestCases.map((testCase) => (
        <ListItem
          key={testCase.id}
          cursor="pointer"
          onClick={() => viewTestCase(testCase.id)}
        >
          {testCase.xr}
        </ListItem>
      ))}
    </List>
  </Box>
);

const MainContent = ({ selectedTestCase, setSidePeekOpen }) => (
  <Box flexGrow={1} p="20px" bg="white" display="flex" flexDirection="column">
    {selectedTestCase ? (
      <>
        <Heading as="h2" size="xl" mb="4">
          View Test Case
        </Heading>
        <Text fontWeight="bold" mb="2">
          Test Case XR:
        </Text>
        <Text mb="4">{selectedTestCase.xr}</Text>
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
        <Button colorScheme="blue" onClick={() => setSidePeekOpen(true)} mt="4">
          Edit Test Case
        </Button>
      </>
    ) : (
      <Text>Select a test case to view the details.</Text>
    )}
  </Box>
);

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
      width: "30%",
      backgroundColor: "white",
      boxShadow: "-3px 0px 5px rgba(0, 0, 0, 0.2)",
      padding: "16px",
      zIndex: 1000,
      transition: "right 0.3s ease",
    }}
  >
    <Heading as="h2" size="lg" mb="4">
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
      <Button colorScheme="blue" type="submit" width="100%">
        Save Test Case
      </Button>
    </form>
    <Button mt={4} colorScheme="red" onClick={() => setSidePeekOpen(false)}>
      Close
    </Button>
  </Box>
);

const InputField = ({ label, ...props }) => (
  <Box mb="4">
    <Text fontWeight="bold">{label}</Text>
    <Input {...props} />
  </Box>
);

const TextareaField = ({ label, ...props }) => (
  <Box mb="4">
    <Text fontWeight="bold">{label}</Text>
    <Textarea rows={2} {...props} />
  </Box>
);

const EditorField = ({ label, quillRef }) => (
  <Box mb="4">
    <Text fontWeight="bold">{label}</Text>
    <div
      ref={quillRef}
      style={{ height: "200px", border: "1px solid #ccc" }}
    ></div>
  </Box>
);

const TestCaseDetail = ({ title, content }) => (
  <>
    <Heading as="h4" size="md" mb="2">
      {title}:
    </Heading>
    <Box
      bg="gray.50"
      p="4"
      mb="4"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  </>
);

export default XboxDocs;
