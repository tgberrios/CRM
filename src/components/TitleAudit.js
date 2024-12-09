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
  Skeleton,
  SkeletonText,
  Tooltip,
  HStack,
  Progress,
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

ChartJS.register(BarElement, CategoryScale, LinearScale, ChartTooltip, Legend);

const TitleAudit = () => {
  const [audits, setAudits] = useState([]);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [loading, setLoading] = useState(true);

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
    setLoading(true);
    try {
      const auditsData = await window.cert.loadAudits();
      const normalizedAudits = auditsData.map((audit) => ({
        ...audit,
        titlename: audit.titlename || "Untitled",
        nonCFRIssuesLogged: Number(audit.noncfrissueslogged || 0),
        cfrIssuesLogged: Number(audit.cfrissueslogged || 0),
        totalCFRMissed: Number(audit.totalcfrmissed || 0),
      }));
      setAudits(normalizedAudits);
      setLoading(false);
    } catch (error) {
      console.error("Error loading audits:", error);
      toast({
        title: "Error",
        description: "There was an error loading the audits.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setLoading(false);
    }
  };

  const showAuditDetails = (audit) => {
    setSelectedAudit(audit);
    onViewModalOpen();
  };

  useEffect(() => {
    loadAudits();
  }, []);

  // Calculate metrics
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
    const intensity = (value / maxValue) * 0.7 + 0.3;
    return `rgba(54, 162, 235, ${intensity})`;
  };

  const maxIssues = Math.max(
    0,
    ...audits.map(
      (audit) =>
        Number(audit.nonCFRIssuesLogged || 0) +
        Number(audit.cfrIssuesLogged || 0)
    )
  );

  const maxMissedCFR = Math.max(
    0,
    ...audits.map((audit) => Number(audit.totalCFRMissed || 0))
  );

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
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true,
      },
    },
  };

  // Export PDF
  const handleExportPDF = async (audit) => {
    try {
      toast({
        title: "Generating PDF",
        description: "Please wait while the PDF is generated.",
        status: "info",
        duration: 2000,
        isClosable: true,
      });

      // Esperar un poco (opcional), por si quieres obtener más datos
      await new Promise((resolve) => setTimeout(resolve, 500));

      const pdf = new jsPDF();
      pdf.setFontSize(18);
      pdf.text("Audit Summary", 14, 22);

      pdf.setFontSize(12);
      pdf.text(`Title Name: ${audit.titlename}`, 14, 32);
      pdf.text(`Submission Iteration: ${audit.submissioniteration}`, 14, 40);
      pdf.text(`Generation: ${audit.generation}`, 14, 48);
      pdf.text(`Test Date: ${audit.testDate}`, 14, 56);
      pdf.text(`Lead: ${audit.lead}`, 14, 64);
      pdf.text(`Testers: ${audit.testers}`, 14, 72);

      pdf.setLineWidth(0.5);
      pdf.line(14, 78, 200, 78);

      const dataTable = [
        ["Non-CFR Issues", audit.nonCFRIssuesLogged],
        ["CFR Issues", audit.cfrIssuesLogged],
        ["Total CFR Missed", audit.totalCFRMissed],
      ];

      pdf.autoTable({
        startY: 80,
        head: [["Metric", "Value"]],
        body: dataTable,
        theme: "grid",
        styles: { fontSize: 10 },
      });

      let yPosition = pdf.lastAutoTable.finalY + 10;
      if (yPosition > pdf.internal.pageSize.height - 20) {
        pdf.addPage();
        yPosition = 20;
      }

      // Action Items
      pdf.setFontSize(14);
      pdf.text("Action Items", 14, yPosition);
      yPosition += 6;

      if (audit.actionitems) {
        // Para simplificar, si hay HTML, podemos extraer solo el texto
        const doc = new DOMParser().parseFromString(
          audit.actionitems,
          "text/html"
        );
        const textContent = doc.body.textContent || "No action items recorded.";
        const splittedText = pdf.splitTextToSize(textContent.trim(), 180);
        pdf.setFontSize(10);
        pdf.text(splittedText, 14, yPosition);
        yPosition += splittedText.length * 5 + 10;
      } else {
        pdf.setFontSize(10);
        pdf.text("No action items recorded.", 14, yPosition);
        yPosition += 10;
      }

      if (yPosition > pdf.internal.pageSize.height - 20) {
        pdf.addPage();
        yPosition = 20;
      }

      // Bug Quality Tracking
      pdf.setFontSize(14);
      pdf.text("Bug Quality Tracking", 14, yPosition);
      yPosition += 6;

      if (audit.bugqualitytracking) {
        const doc = new DOMParser().parseFromString(
          audit.bugqualitytracking,
          "text/html"
        );
        const textContent =
          doc.body.textContent || "No bug quality tracking info.";
        const splittedText = pdf.splitTextToSize(textContent.trim(), 180);
        pdf.setFontSize(10);
        pdf.text(splittedText, 14, yPosition);
        yPosition += splittedText.length * 5 + 10;
      } else {
        pdf.setFontSize(10);
        pdf.text("No bug quality tracking information.", 14, yPosition);
        yPosition += 10;
      }

      pdf.save(`${audit.titlename}_Audit.pdf`);

      toast({
        title: "PDF Exported",
        description: `${audit.titlename}_Audit.pdf has been downloaded.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Error",
        description: "There was an error exporting the PDF.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box display="flex" minHeight="100vh">
      {/* Sidebar */}
      <Box width="20%" bg="gray.50" p={5}>
        <Text fontSize="xl" mb={4} fontWeight="bold">
          Audit List
        </Text>
        <VStack align="start" spacing={4}>
          {loading ? (
            [...Array(5)].map((_, i) => (
              <Box key={i} p={4} bg="white" borderRadius="md" width="100%">
                <Skeleton height="20px" mb={2} />
                <Skeleton height="14px" />
              </Box>
            ))
          ) : audits.length === 0 ? (
            <Text>No audits found</Text>
          ) : (
            audits.map((audit) => (
              <Box
                key={audit.id}
                p={4}
                bg="white"
                borderRadius="md"
                width="100%"
                boxShadow="sm"
                _hover={{ boxShadow: "md" }}
              >
                <HStack justifyContent="space-between" alignItems="center">
                  <Box cursor="pointer" onClick={() => showAuditDetails(audit)}>
                    <Text fontWeight="bold" fontSize="md">
                      {audit.titlename}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {audit.testDate}
                    </Text>
                  </Box>
                  <Tooltip label="Export to PDF">
                    <Button
                      size="sm"
                      colorScheme="teal"
                      onClick={() => handleExportPDF(audit)}
                    >
                      PDF
                    </Button>
                  </Tooltip>
                </HStack>
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
        {/* Statistics */}
        {loading ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
            {[...Array(4)].map((_, i) => (
              <Box
                p={5}
                shadow="md"
                borderWidth="1px"
                borderRadius="md"
                bg="white"
                key={i}
              >
                <Skeleton height="20px" mb={3} />
                <Skeleton height="28px" mb={2} />
                <Skeleton height="16px" />
              </Box>
            ))}
          </SimpleGrid>
        ) : (
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
              <StatHelpText>
                Average: {averageCFRPerAudit} per audit
              </StatHelpText>
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
        )}

        {/* Charts */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
          {loading ? (
            <>
              <Box
                bg="white"
                p={5}
                shadow="md"
                borderWidth="1px"
                borderRadius="md"
                height="400px"
              >
                <Skeleton height="20px" mb={4} />
                <SkeletonText noOfLines={10} spacing="4" />
              </Box>
              <Box
                bg="white"
                p={5}
                shadow="md"
                borderWidth="1px"
                borderRadius="md"
                height="400px"
              >
                <Skeleton height="20px" mb={4} />
                <SkeletonText noOfLines={10} spacing="4" />
              </Box>
            </>
          ) : (
            <>
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
            </>
          )}
        </SimpleGrid>
      </Box>

      {/* View Details Modal */}
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

      {/* Add Audit Modal */}
      <Modal isOpen={isAddModalOpen} onClose={onAddModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Audit</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl id="titlename" isRequired>
              <FormLabel>Title Name</FormLabel>
              <Input
                value={formData.titleName}
                name="titleName"
                onChange={handleInputChange}
                placeholder="Enter the title name"
              />
            </FormControl>

            <FormControl id="submissionIteration" mt={4} isRequired>
              <FormLabel>Submission Iteration</FormLabel>
              <Input
                value={formData.submissionIteration}
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
                value={formData.actionItems}
                onChange={(value) => handleQuillChange("actionItems", value)}
                style={{ height: "200px", marginBottom: "50px" }}
              />
            </FormControl>

            <FormControl id="bugQualityTracking" mt={4}>
              <FormLabel>Bug Quality Tracking</FormLabel>
              <ReactQuill
                theme="snow"
                value={formData.bugQualityTracking}
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
