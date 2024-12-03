import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Input,
  FormControl,
  FormLabel,
  useDisclosure,
  Heading,
  Text,
  SimpleGrid,
  Divider,
  VStack,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  useToast,
  FormErrorMessage,
  Stat,
  StatLabel,
  StatNumber,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  DrawerCloseButton,
  IconButton,
  HStack,
  Stack,
  Textarea,
  BoxProps,
} from "@chakra-ui/react";
import { CopyIcon, AddIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const BugPedia = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();
  const toast = useToast();

  const [issueForm, setIssueForm] = useState({
    name: "",
    date: new Date().toISOString().split("T")[0],
    bqScore: "",
    tags: "",
    xr: "",
    scenario: "",
    observedBehavior: "",
    reproductionSteps: "",
    expectedBehavior: "",
    notes: "",
  });

  useEffect(() => {
    displayIssues();
  }, []);

  const displayIssues = async () => {
    try {
      const fetchedIssues = await window.cert.getIssues();
      const formattedIssues = fetchedIssues.map((issue) => ({
        ...issue,
        date:
          typeof issue.date === "string"
            ? issue.date
            : new Date(issue.date).toISOString().split("T")[0],
      }));
      setIssues(formattedIssues);
    } catch (error) {
      console.error("Error displaying issues:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setIssueForm({ ...issueForm, [name]: value });
  };

  const handleQuillChange = (name, value) => {
    setIssueForm({ ...issueForm, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = {};
    if (!issueForm.name) errors.name = "Name is required";
    if (!issueForm.bqscore) errors.bqscore = "BQ Score is required";
    if (!issueForm.xr) errors.xr = "XR is required";
    if (!issueForm.scenario) errors.scenario = "Scenario is required";

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const username = localStorage.getItem("username") || "default_username";

    const issue = {
      ...issueForm,
      username,
    };

    try {
      await window.cert.addIssue(issue);
      setIssueForm({
        name: "",
        date: new Date().toISOString().split("T")[0],
        bqScore: "",
        tags: "",
        xr: "",
        scenario: "",
        observedBehavior: "",
        reproductionSteps: "",
        expectedBehavior: "",
        notes: "",
      });
      displayIssues();
      onClose();
      toast({
        title: "Issue added",
        description: "The issue has been added successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error adding issue:", error);
      toast({
        title: "Error",
        description: "There was an error adding the issue.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const showIssueDetails = (issue) => {
    setSelectedIssue(issue);
  };

  const handleSearch = async (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    try {
      const searchedIssues = await window.cert.searchIssues(query);
      setIssues(searchedIssues);
    } catch (error) {
      console.error("Error searching issues:", error);
    }
  };

  const getTopUploader = () => {
    const uploaders = {};
    issues.forEach((issue) => {
      if (!uploaders[issue.username]) {
        uploaders[issue.username] = 0;
      }
      uploaders[issue.username]++;
    });
    return Object.keys(uploaders).reduce(
      (a, b) => (uploaders[a] > uploaders[b] ? a : b),
      ""
    );
  };

  const getAverageBQScore = () => {
    const totalBQScore = issues.reduce(
      (acc, issue) => acc + Number(issue.bqscore || 0),
      0
    );
    return issues.length > 0 ? (totalBQScore / issues.length).toFixed(2) : 0;
  };

  const stripHTMLTags = (html) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.innerText;
  };

  const copyDetailsToClipboard = () => {
    const details = `
      Observed Behavior: ${stripHTMLTags(selectedIssue.observedbehavior)}
      Reproduction Steps: ${stripHTMLTags(selectedIssue.reproductionsteps)}
      Expected Behavior: ${stripHTMLTags(selectedIssue.expectedbehavior)}
      Notes: ${stripHTMLTags(selectedIssue.notes)}
    `;
    navigator.clipboard.writeText(details);
    toast({
      title: "Copied",
      description: "Details have been copied to clipboard.",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
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
      >
        <Heading as="h1" size="lg" mb={6}>
          BugPedia
        </Heading>

        <Input
          placeholder="Search issues..."
          mb={4}
          value={searchQuery}
          onChange={handleSearch}
        />

        <Button
          colorScheme="blue"
          w="full"
          mb={4}
          onClick={onOpen}
          leftIcon={<AddIcon />}
        >
          Add Issue
        </Button>

        <Button colorScheme="gray" w="full" onClick={() => navigate("/Home")}>
          Go to Home
        </Button>

        <Divider my={4} />

        <Heading as="h2" size="md" mb={4}>
          Uploaded Issues
        </Heading>
        <VStack align="start" spacing={3} overflowY="auto">
          {issues.length > 0 ? (
            issues.map((issue) => (
              <Box
                key={issue.id}
                p={3}
                bg="white"
                w="100%"
                borderRadius="md"
                boxShadow="sm"
                _hover={{ boxShadow: "md", cursor: "pointer" }}
                onClick={() => showIssueDetails(issue)}
              >
                <Text fontWeight="bold">{issue.name}</Text>
                <Text fontSize="sm" color="gray.600">
                  {issue.tags}
                </Text>
              </Box>
            ))
          ) : (
            <Text>No issues uploaded yet.</Text>
          )}
        </VStack>
      </Box>

      {/* Main Content */}
      <Box flex="1" p={6} bg="gray.50">
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
          <Stat
            p={5}
            shadow="md"
            borderRadius="md"
            bg="white"
            borderLeftWidth="4px"
            borderColor="blue.500"
          >
            <StatLabel>Total Issues</StatLabel>
            <StatNumber>{issues.length}</StatNumber>
          </Stat>

          <Stat
            p={5}
            shadow="md"
            borderRadius="md"
            bg="white"
            borderLeftWidth="4px"
            borderColor="green.500"
          >
            <StatLabel>Top Uploader</StatLabel>
            <StatNumber>{getTopUploader()}</StatNumber>
          </Stat>

          <Stat
            p={5}
            shadow="md"
            borderRadius="md"
            bg="white"
            borderLeftWidth="4px"
            borderColor="purple.500"
          >
            <StatLabel>Avg. BQ Score</StatLabel>
            <StatNumber>{getAverageBQScore()}</StatNumber>
          </Stat>
        </SimpleGrid>

        {selectedIssue ? (
          <Box p={6} bg="white" borderRadius="md" shadow="md" borderWidth="1px">
            <HStack justifyContent="space-between" mb={4}>
              <Heading size="md" color="gray.700">
                {selectedIssue.name}
              </Heading>
              <IconButton
                icon={<CopyIcon />}
                colorScheme="blue"
                aria-label="Copy details"
                onClick={copyDetailsToClipboard}
              />
            </HStack>

            <Tabs variant="enclosed" colorScheme="blue">
              <TabList>
                <Tab>General Information</Tab>
                <Tab>Details</Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box>
                      <Text fontWeight="bold" mb={2}>
                        Date:
                      </Text>
                      <Text>{selectedIssue.date}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold" mb={2}>
                        BQ Score:
                      </Text>
                      <Text>{selectedIssue.bqscore}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold" mb={2}>
                        Tags:
                      </Text>
                      <Text>{selectedIssue.tags}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold" mb={2}>
                        XR:
                      </Text>
                      <Text>{selectedIssue.xr}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold" mb={2}>
                        Scenario:
                      </Text>
                      <Text>{selectedIssue.scenario}</Text>
                    </Box>
                  </SimpleGrid>
                </TabPanel>
                <TabPanel>
                  <VStack align="stretch" spacing={8}>
                    <Box>
                      <Text fontWeight="bold" mb={2}>
                        Observed Behavior:
                      </Text>
                      <Text>
                        {stripHTMLTags(selectedIssue.observedbehavior)}
                      </Text>
                    </Box>
                    <Divider />
                    <Box>
                      <Text fontWeight="bold" mb={2}>
                        Reproduction Steps:
                      </Text>
                      <Text>
                        {stripHTMLTags(selectedIssue.reproductionsteps)}
                      </Text>
                    </Box>
                    <Divider />
                    <Box>
                      <Text fontWeight="bold" mb={2}>
                        Expected Behavior:
                      </Text>
                      <Text>
                        {stripHTMLTags(selectedIssue.expectedbehavior)}
                      </Text>
                    </Box>
                    <Divider />
                    <Box>
                      <Text fontWeight="bold" mb={2}>
                        Notes:
                      </Text>
                      <Text>{stripHTMLTags(selectedIssue.notes)}</Text>
                    </Box>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        ) : (
          <Box
            p={6}
            bg="white"
            borderRadius="md"
            shadow="md"
            borderWidth="1px"
            textAlign="center"
          >
            <Text fontSize="lg" color="gray.600">
              Select an issue to view details
            </Text>
          </Box>
        )}
      </Box>

      {/* Drawer for adding a new issue */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="lg">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" bg="gray.100" p={4}>
            <Heading size="lg">Add New Issue</Heading>
          </DrawerHeader>
          <DrawerBody padding={8} bg="gray.50">
            <VStack spacing={8} align="stretch">
              <FormControl isInvalid={formErrors.name} isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  type="text"
                  name="name"
                  value={issueForm.name}
                  onChange={handleInputChange}
                  placeholder="Enter issue name"
                />
                {formErrors.name && (
                  <FormErrorMessage>{formErrors.name}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  name="date"
                  value={issueForm.date}
                  onChange={handleInputChange}
                />
              </FormControl>

              <FormControl isInvalid={formErrors.bqscore} isRequired>
                <FormLabel>BQ Score</FormLabel>
                <Input
                  type="number"
                  name="bqScore"
                  value={issueForm.bqscore}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                />
                {formErrors.bqscore && (
                  <FormErrorMessage>{formErrors.bqscore}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>Tags</FormLabel>
                <Input
                  type="text"
                  name="tags"
                  value={issueForm.tags}
                  onChange={handleInputChange}
                />
              </FormControl>

              <FormControl isInvalid={formErrors.xr} isRequired>
                <FormLabel>XR</FormLabel>
                <Input
                  type="text"
                  name="xr"
                  value={issueForm.xr}
                  onChange={handleInputChange}
                />
                {formErrors.xr && (
                  <FormErrorMessage>{formErrors.xr}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isInvalid={formErrors.scenario} isRequired>
                <FormLabel>Scenario</FormLabel>
                <Textarea
                  name="scenario"
                  value={issueForm.scenario}
                  onChange={handleInputChange}
                  placeholder="Describe the scenario"
                  resize="vertical"
                />
                {formErrors.scenario && (
                  <FormErrorMessage>{formErrors.scenario}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>Observed Behavior</FormLabel>
                <ReactQuill
                  theme="snow"
                  value={issueForm.observedbehavior}
                  onChange={(value) =>
                    handleQuillChange("observedBehavior", value)
                  }
                  style={{
                    height: "200px",
                    width: "100%",
                    marginBottom: "20px",
                  }}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Reproduction Steps</FormLabel>
                <ReactQuill
                  theme="snow"
                  value={issueForm.reproductionsteps}
                  onChange={(value) =>
                    handleQuillChange("reproductionSteps", value)
                  }
                  style={{
                    height: "200px",
                    width: "100%",
                    marginBottom: "20px",
                  }}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Expected Behavior</FormLabel>
                <ReactQuill
                  theme="snow"
                  value={issueForm.expectedbehavior}
                  onChange={(value) =>
                    handleQuillChange("expectedBehavior", value)
                  }
                  style={{
                    height: "200px",
                    width: "100%",
                    marginBottom: "20px",
                  }}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Notes</FormLabel>
                <ReactQuill
                  theme="snow"
                  value={issueForm.notes}
                  onChange={(value) => handleQuillChange("notes", value)}
                  style={{
                    height: "200px",
                    width: "100%",
                    marginBottom: "20px",
                  }}
                />
              </FormControl>
            </VStack>
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px" bg="gray.100" padding={6}>
            <Button
              w="full"
              colorScheme="blue"
              type="submit"
              form="add-issue-form"
              onClick={handleSubmit}
            >
              Submit
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default BugPedia;
