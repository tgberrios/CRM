import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  VStack,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  useToast,
  Table,
  Tbody,
  Tr,
  Td,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
  Badge,
  Icon,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { FaRegCalendarAlt, FaUser, FaBug } from "react-icons/fa";

ChartJS.register(BarElement, CategoryScale, LinearScale, ChartTooltip, Legend);

const TitleAudit = () => {
  const [audits, setAudits] = useState([]);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const {
    isOpen: isViewModalOpen,
    onOpen: onViewModalOpen,
    onClose: onViewModalClose,
  } = useDisclosure();

  const {
    isOpen: isAddModalOpen,
    onOpen: onAddModalOpen,
    onClose: onAddModalClose,
  } = useDisclosure();

  const [formData, setFormData] = useState({
    titleName: "",
    submissionIteration: "",
    generation: "",
    testDate: new Date().toISOString().split("T")[0],
    nonCFRIssuesLogged: "",
    cfrIssuesLogged: "",
    totalCFRMissed: "",
    lead: "",
    testers: "",
    actionItems: "",
    bugQualityTracking: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleQuillChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const addAudit = async () => {
    const username = localStorage.getItem("username");

    const newAudit = {
      ...formData,
      username,
    };

    try {
      await window.cert.addAudit(newAudit);
      loadAudits();
      clearForm();
      onAddModalClose();
      toast({
        title: "Audit Added",
        description: "The audit has been added successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error adding audit:", error);
      toast({
        title: "Error",
        description: "There was an error adding the audit.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const clearForm = () => {
    setFormData({
      titleName: "",
      submissionIteration: "",
      generation: "",
      testDate: new Date().toISOString().split("T")[0],
      nonCFRIssuesLogged: "",
      cfrIssuesLogged: "",
      totalCFRMissed: "",
      lead: "",
      testers: "",
      actionItems: "",
      bugQualityTracking: "",
    });
  };

  const loadAudits = async () => {
    try {
      const auditsData = await window.cert.loadAudits();
      const normalizedAudits = auditsData.map((audit) => ({
        ...audit,
        titlename: audit.titlename || "Untitled",
        nonCFRIssuesLogged: Number(audit.noncfrissueslogged || 0),
        cfrIssuesLogged: Number(formData.cfrIssuesLogged || 0),
        totalCFRMissed: Number(audit.totalcfrmissed || 0),
      }));
      setAudits(normalizedAudits);
    } catch (error) {
      console.error("Error loading audits:", error);
    }
  };

  const showAuditDetails = (audit) => {
    setSelectedAudit(audit);
    onViewModalOpen();
  };

  useEffect(() => {
    loadAudits();
  }, []);

  // Calculate metrics for summary cards
  const totalAudits = audits.length;
  const totalNonCFRIssues = audits.reduce(
    (sum, audit) => sum + Number(audit.nonCFRIssuesLogged || 0),
    0
  );
  const totalCFRIssues = audits.reduce(
    (sum, audit) => sum + Number(audit.cfrIssuesLogged || 0),
    0
  );
  const totalMissedCFR = audits.reduce(
    (sum, audit) => sum + Number(audit.totalCFRMissed || 0),
    0
  );
  const averageNonCFRPerAudit = totalAudits
    ? (totalNonCFRIssues / totalAudits).toFixed(2)
    : 0;
  const averageCFRPerAudit = totalAudits
    ? (totalCFRIssues / totalAudits).toFixed(2)
    : 0;

  // Function to generate colors based on value
  const getColorBasedOnValue = (value, maxValue) => {
    const intensity = (value / maxValue) * 0.7 + 0.3; // Ensure the color is not too light
    return `rgba(54, 162, 235, ${intensity})`;
  };

  // Get the maximum values for normalization
  const maxIssues = Math.max(
    ...audits.map(
      (audit) =>
        Number(audit.nonCFRIssuesLogged || 0) +
        Number(audit.cfrIssuesLogged || 0)
    )
  );

  const maxMissedCFR = Math.max(
    ...audits.map((audit) => Number(audit.totalCFRMissed || 0))
  );

  // Prepare data for charts
  const issuesBarChartData = {
    labels: audits.map((audit) => audit.titlename),
    datasets: [
      {
        label: "Non-CFR Issues",
        data: audits.map((audit) => audit.nonCFRIssuesLogged),
        backgroundColor: audits.map((audit) =>
          getColorBasedOnValue(audit.nonCFRIssuesLogged, maxIssues)
        ),
      },
      {
        label: "CFR Issues",
        data: audits.map((audit) => audit.cfrIssuesLogged),
        backgroundColor: audits.map((audit) =>
          getColorBasedOnValue(audit.cfrIssuesLogged, maxIssues)
        ),
      },
    ],
  };

  const missedCFRChartData = {
    labels: audits.map((audit) => audit.titlename),
    datasets: [
      {
        label: "Missed CFRs",
        data: audits.map((audit) => audit.totalCFRMissed),
        backgroundColor: audits.map((audit) =>
          getColorBasedOnValue(audit.totalCFRMissed, maxMissedCFR)
        ),
      },
    ],
  };

  const chartOptions = {
    indexAxis: "y", // Makes the bars horizontal
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true,
      },
    },
  };

  return (
    <Box display="flex" minHeight="100vh">
      {/* Sidebar with the list of audits */}
      <Box width="20%" bg="gray.50" p={5}>
        <Text fontSize="xl" mb={4} fontWeight="bold">
          Audit List
        </Text>
        <VStack align="start" spacing={4}>
          {audits.length === 0 ? (
            <Text>No audits found</Text>
          ) : (
            audits.map((audit) => (
              <Box
                key={audit.id}
                p={4}
                bg="white"
                borderRadius="md"
                width="100%"
                cursor="pointer"
                boxShadow="sm"
                _hover={{ boxShadow: "md" }}
                onClick={() => showAuditDetails(audit)}
              >
                <Text fontWeight="bold" fontSize="md">
                  {audit.titlename}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {audit.testDate}
                </Text>
              </Box>
            ))
          )}
          <Button
            colorScheme="blue"
            size="md"
            width="100%"
            onClick={onAddModalOpen}
          >
            Add Audit
          </Button>

          {/* Button to go to Home */}
          <Button
            colorScheme="gray"
            size="md"
            width="100%"
            onClick={() => navigate("/home")}
          >
            Go to Home
          </Button>
        </VStack>
      </Box>

      {/* Main content */}
      <Box flex="1" p={10} bg="gray.50">
        {/* Audit Summary Cards */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
          <Stat
            p={5}
            shadow="md"
            borderWidth="1px"
            borderRadius="md"
            bg="white"
          >
            <StatLabel>Total Audits</StatLabel>
            <StatNumber>{totalAudits}</StatNumber>
          </Stat>

          <Stat
            p={5}
            shadow="md"
            borderWidth="1px"
            borderRadius="md"
            bg="white"
          >
            <StatLabel>Non-CFR Issues</StatLabel>
            <StatNumber>{totalNonCFRIssues}</StatNumber>
            <StatHelpText>
              Average: {averageNonCFRPerAudit} per audit
            </StatHelpText>
          </Stat>

          <Stat
            p={5}
            shadow="md"
            borderWidth="1px"
            borderRadius="md"
            bg="white"
          >
            <StatLabel>CFR Issues Logged</StatLabel>
            <StatNumber>{totalCFRIssues}</StatNumber>
            <StatHelpText>Average: {averageCFRPerAudit} per audit</StatHelpText>
          </Stat>

          <Stat
            p={5}
            shadow="md"
            borderWidth="1px"
            borderRadius="md"
            bg="white"
          >
            <StatLabel>Total Missed CFRs</StatLabel>
            <StatNumber>{totalMissedCFR}</StatNumber>
          </Stat>
        </SimpleGrid>

        {/* Charts Section */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
          <Box
            bg="white"
            p={5}
            shadow="md"
            borderWidth="1px"
            borderRadius="md"
            height="400px"
          >
            <Text fontSize="lg" mb={4} fontWeight="bold">
              Issues by Title
            </Text>
            <Bar data={issuesBarChartData} options={chartOptions} />
          </Box>

          <Box
            bg="white"
            p={5}
            shadow="md"
            borderWidth="1px"
            borderRadius="md"
            height="400px"
          >
            <Text fontSize="lg" mb={4} fontWeight="bold">
              Missed CFRs by Title
            </Text>
            <Bar data={missedCFRChartData} options={chartOptions} />
          </Box>
        </SimpleGrid>
      </Box>

      {/* Enhanced Details Modal */}
      <Modal isOpen={isViewModalOpen} onClose={onViewModalClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Audit Details - {selectedAudit?.titlename}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedAudit && (
              <Tabs variant="enclosed" colorScheme="blue">
                <TabList>
                  <Tab>General Information</Tab>
                  <Tab>Action Items</Tab>
                  <Tab>Bug Quality Tracking</Tab>
                </TabList>
                <TabPanels>
                  {/* General Information */}
                  <TabPanel>
                    <Table variant="simple">
                      <Tbody>
                        <Tr>
                          <Td fontWeight="bold">
                            <Icon as={FaRegCalendarAlt} mr={2} />
                            Test Date
                          </Td>
                          <Td>{selectedAudit.testDate}</Td>
                        </Tr>
                        <Tr>
                          <Td fontWeight="bold">Submission Iteration</Td>
                          <Td>{selectedAudit.submissioniteration}</Td>
                        </Tr>
                        <Tr>
                          <Td fontWeight="bold">Generation</Td>
                          <Td>{selectedAudit.generation}</Td>
                        </Tr>
                        <Tr>
                          <Td fontWeight="bold">
                            <Icon as={FaBug} mr={2} />
                            Non-CFR Issues
                          </Td>
                          <Td>
                            {selectedAudit.nonCFRIssuesLogged}
                            <Badge ml={2} colorScheme="blue">
                              Non-CFR
                            </Badge>
                          </Td>
                        </Tr>
                        <Tr>
                          <Td fontWeight="bold">
                            <Icon as={FaBug} mr={2} />
                            CFR Issues
                          </Td>
                          <Td>
                            {selectedAudit.cfrIssuesLogged}
                            <Badge ml={2} colorScheme="red">
                              CFR
                            </Badge>
                          </Td>
                        </Tr>
                        <Tr>
                          <Td fontWeight="bold">Total Missed CFRs</Td>
                          <Td>{selectedAudit.totalCFRMissed}</Td>
                        </Tr>
                        <Tr>
                          <Td fontWeight="bold">
                            <Icon as={FaUser} mr={2} />
                            Lead
                          </Td>
                          <Td>{selectedAudit.lead}</Td>
                        </Tr>
                        <Tr>
                          <Td fontWeight="bold">Testers</Td>
                          <Td>{selectedAudit.testers}</Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </TabPanel>

                  {/* Action Items */}
                  <TabPanel>
                    {selectedAudit.actionitems ? (
                      <Box
                        dangerouslySetInnerHTML={{
                          __html:
                            selectedAudit.actionitems ||
                            "No action items recorded.",
                        }}
                      />
                    ) : (
                      <Text>No Action Items recorded.</Text>
                    )}
                  </TabPanel>

                  {/* Bug Quality Tracking */}
                  <TabPanel>
                    {selectedAudit.bugqualitytracking ? (
                      <Box
                        mt={2}
                        dangerouslySetInnerHTML={{
                          __html: selectedAudit.bugqualitytracking,
                        }}
                        sx={{
                          "& img": {
                            maxWidth: "100%",
                          },
                        }}
                      />
                    ) : (
                      <Text>No Bug Quality Tracking information.</Text>
                    )}
                  </TabPanel>
                </TabPanels>
              </Tabs>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onViewModalClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal to Add a New Audit */}
      <Modal isOpen={isAddModalOpen} onClose={onAddModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Audit</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl id="titlename" isRequired>
              <FormLabel>Title Name</FormLabel>
              <Input
                value={formData.titlename}
                name="titleName"
                onChange={handleInputChange}
                placeholder="Enter the title name"
              />
            </FormControl>

            <FormControl id="submissionIteration" mt={4} isRequired>
              <FormLabel>Submission Iteration</FormLabel>
              <Input
                value={formData.submissioniteration}
                name="submissionIteration"
                onChange={handleInputChange}
                placeholder="Enter the submission iteration"
              />
            </FormControl>

            <FormControl id="generation" mt={4} isRequired>
              <FormLabel>Generation</FormLabel>
              <Input
                value={formData.generation}
                name="generation"
                onChange={handleInputChange}
                placeholder="Enter the generation"
              />
            </FormControl>

            <FormControl id="testDate" mt={4} isRequired>
              <FormLabel>Test Date</FormLabel>
              <Input
                type="date"
                value={formData.testDate}
                name="testDate"
                onChange={handleInputChange}
              />
            </FormControl>

            <FormControl id="nonCFRIssuesLogged" mt={4} isRequired>
              <FormLabel>Non-CFR Issues Logged</FormLabel>
              <Input
                type="number"
                value={formData.nonCFRIssuesLogged}
                name="nonCFRIssuesLogged"
                onChange={handleInputChange}
              />
            </FormControl>

            <FormControl id="cfrIssuesLogged" mt={4} isRequired>
              <FormLabel>CFR Issues Logged</FormLabel>
              <Input
                type="number"
                value={formData.cfrIssuesLogged}
                name="cfrIssuesLogged"
                onChange={handleInputChange}
              />
            </FormControl>

            <FormControl id="totalCFRMissed" mt={4} isRequired>
              <FormLabel>Total CFR Missed</FormLabel>
              <Input
                type="number"
                value={formData.totalCFRMissed}
                name="totalCFRMissed"
                onChange={handleInputChange}
              />
            </FormControl>

            <FormControl id="lead" mt={4} isRequired>
              <FormLabel>Lead</FormLabel>
              <Input
                value={formData.lead}
                name="lead"
                onChange={handleInputChange}
                placeholder="Enter the lead's name"
              />
            </FormControl>

            <FormControl id="testers" mt={4} isRequired>
              <FormLabel>Testers</FormLabel>
              <Input
                value={formData.testers}
                name="testers"
                onChange={handleInputChange}
                placeholder="Enter the testers' names"
              />
            </FormControl>

            <FormControl id="actionitems" mt={4}>
              <FormLabel>Action Items</FormLabel>
              <ReactQuill
                theme="snow"
                value={formData.actionitems}
                onChange={(value) => handleQuillChange("actionItems", value)}
                style={{ height: "200px", marginBottom: "50px" }}
              />
            </FormControl>

            <FormControl id="bugQualityTracking" mt={4}>
              <FormLabel>Bug Quality Tracking</FormLabel>
              <ReactQuill
                theme="snow"
                value={formData.bugqualitytracking}
                onChange={(value) =>
                  handleQuillChange("bugQualityTracking", value)
                }
                style={{ height: "200px", marginBottom: "50px" }}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" onClick={addAudit}>
              Add Audit
            </Button>
            <Button onClick={onAddModalClose} ml={3}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default TitleAudit;
