import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Select,
  NumberInput,
  NumberInputField,
  VStack,
  HStack,
  Text,
  List,
  ListItem,
  Divider,
  Heading,
  SimpleGrid,
  Progress,
  CircularProgress,
  CircularProgressLabel,
  Skeleton,
  useToast,
} from "@chakra-ui/react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";

const QAReviewForm = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [relatedReviews, setRelatedReviews] = useState([]);
  const [isSidePeekOpen, setIsSidePeekOpen] = useState(false);
  const quillRef = useRef(null);
  const [observations, setObservations] = useState("");
  const [testerName, setTesterName] = useState("");

  const [performancescore, setPerformanceScore] = useState(1);
  const [bugdetectionaccuracy, setBugDetectionAccuracy] = useState(1);
  const [testingefficiency, setTestingEfficiency] = useState(1);
  const [communicationskills, setCommunicationSkills] = useState(1);
  const [creativity, setCreativity] = useState(1);
  const [responsiveness, setResponsiveness] = useState(1);
  const [punctuality, setPunctuality] = useState(1);
  const [problemanalysis, setProblemAnalysis] = useState(1);
  const [toolsknowledge, setToolsKnowledge] = useState(1);
  const [overallPerformance, setOverallPerformance] = useState(1);

  const [averageKpis, setAverageKpis] = useState({
    performancescore: 0,
    bugdetectionaccuracy: 0,
    testingefficiency: 0,
    communicationskills: 0,
    creativity: 0,
    responsiveness: 0,
    punctuality: 0,
    problemanalysis: 0,
    toolsknowledge: 0,
    overallrating: 0,
  });

  // State for Global Overall Performance
  const [globalOverallPerformance, setGlobalOverallPerformance] = useState(0);

  const [exportRange, setExportRange] = useState("week"); // For date range selection

  // Loading States
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    loadUsers();
    loadReviews();
    if (quillRef.current) {
      new Quill(quillRef.current, {
        theme: "snow",
        modules: { toolbar: true },
      });
    }
  }, []);

  const loadUsers = async () => {
    setIsUsersLoading(true);
    try {
      const users = await window.cert.getUsers();
      setUsers(users);
      toast({
        title: "Users Loaded",
        description: "User data has been successfully loaded.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Error fetching users:", err);
      toast({
        title: "Error Loading Users",
        description: err.message || "An error occurred while loading users.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUsersLoading(false);
    }
  };

  const loadReviews = async () => {
    setIsReviewsLoading(true);
    try {
      const reviews = await window.cert.getReviews();

      console.log("Data received from backend:", reviews);

      const normalizedReviews = reviews.map((review) => ({
        id: review.id,
        testerName: review.testername || "Unknown Tester",
        performancescore: Number(review.performancescore) || 0,
        bugdetectionaccuracy: Number(review.bugdetectionaccuracy) || 0,
        testingefficiency: Number(review.testingefficiency) || 0,
        communicationskills: Number(review.communicationskills) || 0,
        creativity: Number(review.creativity) || 0,
        responsiveness: Number(review.responsiveness) || 0,
        punctuality: Number(review.punctuality) || 0,
        problemanalysis: Number(review.problemanalysis) || 0,
        toolsknowledge: Number(review.toolsknowledge) || 0,
        overallrating: Number(review.overallrating) || 0,
        observations: review.observations || "No observations provided",
        date: review.date || new Date().toISOString().split("T")[0],
      }));

      console.log("Normalized Data:", normalizedReviews);

      setReviews(normalizedReviews);
      toast({
        title: "Reviews Loaded",
        description: "Review data has been successfully loaded.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Error fetching reviews:", err);
      toast({
        title: "Error Loading Reviews",
        description: err.message || "An error occurred while loading reviews.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsReviewsLoading(false);
    }
  };

  // Recalculate statistics when reviews change
  useEffect(() => {
    calculateAverageKpis(reviews);
    calculateGlobalOverallPerformance(reviews);
  }, [reviews]);

  const calculateGlobalOverallPerformance = (reviews) => {
    if (!reviews || reviews.length === 0) {
      setGlobalOverallPerformance(0);
      return;
    }
    const totalOverallPerformance = reviews.reduce(
      (acc, review) => acc + (review.overallrating || 0),
      0
    );
    const globalAverage = totalOverallPerformance / reviews.length;
    setGlobalOverallPerformance(parseFloat(globalAverage.toFixed(2)));

    console.log("Global Overall Performance:", globalAverage);
  };

  const calculateAverageKpis = (reviews) => {
    const totals = reviews.reduce(
      (acc, review) => {
        acc.performancescore += review.performancescore;
        acc.bugdetectionaccuracy += review.bugdetectionaccuracy;
        acc.testingefficiency += review.testingefficiency;
        acc.communicationskills += review.communicationskills;
        acc.creativity += review.creativity;
        acc.responsiveness += review.responsiveness;
        acc.punctuality += review.punctuality;
        acc.problemanalysis += review.problemanalysis;
        acc.toolsknowledge += review.toolsknowledge;
        acc.overallrating += review.overallrating;
        return acc;
      },
      {
        performancescore: 0,
        bugdetectionaccuracy: 0,
        testingefficiency: 0,
        communicationskills: 0,
        creativity: 0,
        responsiveness: 0,
        punctuality: 0,
        problemanalysis: 0,
        toolsknowledge: 0,
        overallrating: 0,
      }
    );

    const averages = {};
    const totalReviews = reviews.length;
    for (const key in totals) {
      averages[key] = totalReviews
        ? parseFloat((totals[key] / totalReviews).toFixed(2))
        : 0;
    }
    setAverageKpis(averages);
  };

  const handleSelectReview = (review) => {
    setSelectedReview(review);

    const related = reviews
      .filter((r) => r.testerName === review.testerName)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    setRelatedReviews(related);

    // Define kpiValues based on the selected review
    const kpiValues = [
      review.performancescore || 0,
      review.bugdetectionaccuracy || 0,
      review.testingefficiency || 0,
      review.communicationskills || 0,
      review.creativity || 0,
      review.responsiveness || 0,
      review.punctuality || 0,
      review.problemanalysis || 0,
      review.toolsknowledge || 0,
    ];

    const avgPerformance =
      kpiValues.reduce((sum, val) => sum + val, 0) / kpiValues.length;
    setOverallPerformance(parseFloat(avgPerformance.toFixed(2)));

    console.log("Overall Performance:", avgPerformance);
  };

  const getColor = (score) => {
    if (score <= 3) return "red.400";
    if (score <= 7) return "yellow.400";
    return "green.400";
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!testerName || performancescore <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please provide a valid tester name and scores.",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    // Calculate overallrating as the average of all KPIs
    const kpiValues = [
      performancescore,
      bugdetectionaccuracy,
      testingefficiency,
      communicationskills,
      creativity,
      responsiveness,
      punctuality,
      problemanalysis,
      toolsknowledge,
    ];

    const overallrating = parseFloat(
      (kpiValues.reduce((sum, val) => sum + val, 0) / kpiValues.length).toFixed(
        2
      )
    );

    const newReview = {
      username: localStorage.getItem("username"),
      testerName: testerName || "Unknown Tester",
      performancescore: performancescore || 0,
      bugdetectionaccuracy: bugdetectionaccuracy || 0,
      testingefficiency: testingefficiency || 0,
      communicationskills: communicationskills || 0,
      creativity: creativity || 0,
      responsiveness: responsiveness || 0,
      punctuality: punctuality || 0,
      problemanalysis: problemanalysis || 0,
      toolsknowledge: toolsknowledge || 0,
      overallrating: overallrating || 0,
      observations: observations || "No observations provided",
      date: new Date().toISOString().split("T")[0],
    };

    try {
      await window.cert.addReview(newReview);
      loadReviews(); // Update the reviews list
      toast({
        title: "Review Added",
        description: "The review has been successfully added.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // Reset form fields
      setTesterName("");
      setObservations("");
      resetKpis();
    } catch (err) {
      console.error("Error adding review:", err);
      toast({
        title: "Error Adding Review",
        description:
          err.message || "An error occurred while adding the review.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const resetKpis = () => {
    setPerformanceScore(1);
    setBugDetectionAccuracy(1);
    setTestingEfficiency(1);
    setCommunicationSkills(1);
    setCreativity(1);
    setResponsiveness(1);
    setPunctuality(1);
    setProblemAnalysis(1);
    setToolsKnowledge(1);
  };

  const handleExportPDF = async () => {
    try {
      toast({
        title: "Generating PDF",
        description: "Please wait while the PDF is being generated.",
        status: "info",
        duration: 2000,
        isClosable: true,
      });

      // Filter reviews based on the selected date range
      const now = new Date();
      let filteredReviews = [];
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      switch (exportRange) {
        case "week":
          filteredReviews = reviews.filter(
            (review) => new Date(review.date) >= oneWeekAgo
          );
          break;
        case "month":
          filteredReviews = reviews.filter(
            (review) => new Date(review.date) >= oneMonthAgo
          );
          break;
        case "year":
          filteredReviews = reviews.filter(
            (review) => new Date(review.date) >= oneYearAgo
          );
          break;
        default:
          filteredReviews = reviews;
      }

      const pdf = new jsPDF();

      // Add title
      pdf.setFontSize(18);
      pdf.text("QA Audit Report", 14, 22);

      // Add date range
      pdf.setFontSize(12);
      pdf.text(`Date Range: ${exportRange}`, 14, 32);

      // Add total audits
      pdf.text(`Total Audits: ${filteredReviews.length}`, 14, 40);

      // Add a separator line
      pdf.setLineWidth(0.5);
      pdf.line(14, 45, 200, 45);

      // Add reviews table
      const tableData = filteredReviews.map((review, index) => [
        index + 1,
        review.testerName,
        new Date(review.date).toLocaleDateString(),
        review.overallrating,
      ]);

      pdf.autoTable({
        startY: 50,
        head: [["#", "Tester Name", "Date", "Overall Rating"]],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 8 },
      });

      // Add KPI Averages
      let yPosition = pdf.lastAutoTable.finalY + 10;
      pdf.setFontSize(14);
      pdf.text("KPI Averages", 14, yPosition);

      yPosition += 6;

      const kpiAverages = calculateAverageKpisForExport(filteredReviews);

      const kpiData = Object.entries(kpiAverages).map(([key, value]) => [
        key,
        value,
      ]);

      pdf.autoTable({
        startY: yPosition,
        head: [["KPI", "Average"]],
        body: kpiData,
        theme: "grid",
        styles: { fontSize: 8 },
      });

      // Update Y position after KPI table
      yPosition = pdf.lastAutoTable.finalY + 10;

      // *** Add Observations Table ***
      if (filteredReviews.length > 0) {
        pdf.setFontSize(14);
        pdf.text("Observations", 14, yPosition);
        yPosition += 6;

        // Prepare observations table data
        const observationsData = filteredReviews.map((review, index) => [
          index + 1,
          review.testerName,
          new Date(review.date).toLocaleDateString(),
          review.overallrating,
          // Remove HTML tags from observations
          review.observations.replace(/<\/?[^>]+(>|$)/g, ""),
        ]);

        pdf.autoTable({
          startY: yPosition + 4,
          head: [
            ["#", "Tester Name", "Date", "Overall Rating", "Observations"],
          ],
          body: observationsData,
          theme: "grid",
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: {
            4: { cellWidth: 80 }, // Adjust width of Observations column
          },
          didDrawPage: (data) => {
            // Optional: Add headers or footers to each page
          },
        });

        yPosition = pdf.lastAutoTable.finalY + 10;
      }

      // Save the PDF
      pdf.save(`QA_Audit_Report_${exportRange}.pdf`);

      toast({
        title: "PDF Generated",
        description: `QA_Audit_Report_${exportRange}.pdf has been downloaded.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error Generating PDF",
        description:
          error.message ||
          "An error occurred while generating the PDF. Please check the console for more details.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Function to calculate KPI averages for export
  const calculateAverageKpisForExport = (reviews) => {
    const totals = reviews.reduce(
      (acc, review) => {
        acc.performancescore += review.performancescore;
        acc.bugdetectionaccuracy += review.bugdetectionaccuracy;
        acc.testingefficiency += review.testingefficiency;
        acc.communicationskills += review.communicationskills;
        acc.creativity += review.creativity;
        acc.responsiveness += review.responsiveness;
        acc.punctuality += review.punctuality;
        acc.problemanalysis += review.problemanalysis;
        acc.toolsknowledge += review.toolsknowledge;
        acc.overallrating += review.overallrating;
        return acc;
      },
      {
        performancescore: 0,
        bugdetectionaccuracy: 0,
        testingefficiency: 0,
        communicationskills: 0,
        creativity: 0,
        responsiveness: 0,
        punctuality: 0,
        problemanalysis: 0,
        toolsknowledge: 0,
        overallrating: 0,
      }
    );

    const averages = {};
    const totalReviews = reviews.length;
    for (const key in totals) {
      averages[key] = totalReviews
        ? parseFloat((totals[key] / totalReviews).toFixed(2))
        : 0;
    }
    return averages;
  };

  return (
    <HStack align="stretch" height="100vh" spacing={0}>
      {/* Sidebar */}
      <Box bg="gray.100" p={4} w="250px" minH="100vh" boxShadow="md">
        <VStack spacing={4} align="stretch">
          <Heading size="md">Review List</Heading>
          {isReviewsLoading ? (
            <VStack spacing={3}>
              {[...Array(5)].map((_, index) => (
                <Skeleton height="20px" width="100%" key={index} />
              ))}
            </VStack>
          ) : (
            <List spacing={3}>
              {reviews
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((review) => (
                  <ListItem
                    key={review.id}
                    onClick={() => handleSelectReview(review)}
                    _hover={{ cursor: "pointer", background: "gray.200" }}
                    p={2}
                    borderRadius="md"
                  >
                    {review.testerName} -{" "}
                    {new Date(review.date).toLocaleDateString()}
                  </ListItem>
                ))}
            </List>
          )}
          <Button colorScheme="blue" onClick={() => navigate("/Home")} mb="5">
            Go to Home
          </Button>
          <Button
            colorScheme="green"
            width="full"
            onClick={() => setIsSidePeekOpen(true)}
          >
            Add Review
          </Button>
          <FormControl id="exportRange" mt={4}>
            <FormLabel>Select Export Range</FormLabel>
            <Select
              value={exportRange}
              onChange={(e) => setExportRange(e.target.value)}
              placeholder="Select Export Range"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </Select>
          </FormControl>
          <Button colorScheme="teal" onClick={handleExportPDF}>
            Export to PDF
          </Button>
        </VStack>
      </Box>

      {/* Main Content */}
      <Box flex="1" p={6} bg="gray.50">
        {isUsersLoading || isReviewsLoading ? (
          <VStack spacing={4}>
            {[...Array(5)].map((_, index) => (
              <Skeleton height="20px" width="100%" key={index} />
            ))}
          </VStack>
        ) : selectedReview ? (
          <Box bg="white" p={6} borderRadius="md" boxShadow="md">
            <HStack justify="space-between" mb={4}>
              <Text fontSize="xl" fontWeight="bold">
                {selectedReview?.testerName || "Unknown Tester"}'s KPI Summary
              </Text>
              <Button
                colorScheme="red"
                size="sm"
                onClick={() => setSelectedReview(null)}
              >
                Close
              </Button>
            </HStack>
            <Text mb={2}>
              <strong>Date:</strong>{" "}
              {new Date(selectedReview.date).toLocaleDateString()}
            </Text>
            <Divider my={4} />

            <SimpleGrid columns={2} spacing={4}>
              {[
                {
                  label: "Performance Score",
                  value: selectedReview.performancescore,
                },
                {
                  label: "Bug Detection Accuracy",
                  value: selectedReview.bugdetectionaccuracy,
                },
                {
                  label: "Testing Efficiency",
                  value: selectedReview.testingefficiency,
                },
                {
                  label: "Communication Skills",
                  value: selectedReview.communicationskills,
                },
                { label: "Creativity", value: selectedReview.creativity },
                {
                  label: "Responsiveness",
                  value: selectedReview.responsiveness,
                },
                { label: "Punctuality", value: selectedReview.punctuality },
                {
                  label: "Problem Analysis",
                  value: selectedReview.problemanalysis,
                },
                {
                  label: "Tools Knowledge",
                  value: selectedReview.toolsknowledge,
                },
              ].map((metric) => (
                <Box key={metric.label}>
                  <Text fontWeight="bold" fontSize="sm" mb={2}>
                    {metric.label}
                  </Text>
                  <Progress
                    value={(Number(metric.value) / 10) * 100}
                    colorScheme={
                      metric.value >= 8
                        ? "green"
                        : metric.value >= 5
                        ? "yellow"
                        : "red"
                    }
                    size="lg"
                    borderRadius="md"
                    transition="width 0.4s ease"
                  />
                  <Text fontSize="md" mt={1} color={getColor(metric.value)}>
                    {metric.value || 0}/10
                  </Text>
                </Box>
              ))}
            </SimpleGrid>

            <Divider my={4} />
            <HStack spacing={8} justify="center" mt={4}>
              {/* Overall Performance */}
              <Box textAlign="center">
                <CircularProgress
                  value={(overallPerformance / 10) * 100}
                  color={getColor(overallPerformance)}
                  size="120px"
                  thickness="12px"
                >
                  <CircularProgressLabel fontSize="lg" fontWeight="bold">
                    {overallPerformance}/10
                  </CircularProgressLabel>
                </CircularProgress>
                <Text fontSize="lg" fontWeight="bold" mt={2}>
                  Overall Performance
                </Text>
              </Box>

              {/* Global Overall Performance */}
              <Box textAlign="center">
                <CircularProgress
                  value={(globalOverallPerformance / 10) * 100}
                  color={getColor(globalOverallPerformance)}
                  size="120px"
                  thickness="12px"
                >
                  <CircularProgressLabel fontSize="lg" fontWeight="bold">
                    {globalOverallPerformance}/10
                  </CircularProgressLabel>
                </CircularProgress>
                <Text fontSize="lg" fontWeight="bold" mt={2}>
                  Global Overall Performance
                </Text>
              </Box>
            </HStack>

            <Divider my={4} />

            {/* Show Observations */}
            <Box>
              <Heading size="md" mb={2}>
                Observations
              </Heading>
              <Box
                p={4}
                bg="gray.100"
                borderRadius="md"
                dangerouslySetInnerHTML={{
                  __html: selectedReview.observations,
                }}
              />
            </Box>

            <Divider my={4} />
            <Heading size="md" mb={2}>
              Related Reviews
            </Heading>
            {relatedReviews.length === 0 ? (
              <Text>No related reviews found.</Text>
            ) : (
              <List spacing={3}>
                {relatedReviews.map((review) => (
                  <ListItem
                    key={review.id}
                    p={2}
                    borderRadius="md"
                    bg={
                      review.id === selectedReview.id ? "green.100" : "gray.100"
                    }
                    _hover={{ cursor: "pointer", background: "green.200" }}
                    onClick={() => handleSelectReview(review)}
                  >
                    {new Date(review.date).toLocaleDateString()}
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        ) : (
          <Box>
            <Heading size="md" mb={4}>
              Global KPI Statistics
            </Heading>
            {isReviewsLoading ? (
              <VStack spacing={4}>
                {[...Array(10)].map((_, index) => (
                  <Skeleton height="20px" width="100%" key={index} />
                ))}
              </VStack>
            ) : (
              <SimpleGrid columns={2} spacing={6}>
                {[
                  {
                    label: "Performance Score",
                    value: averageKpis.performancescore,
                  },
                  {
                    label: "Bug Detection Accuracy",
                    value: averageKpis.bugdetectionaccuracy,
                  },
                  {
                    label: "Testing Efficiency",
                    value: averageKpis.testingefficiency,
                  },
                  {
                    label: "Communication Skills",
                    value: averageKpis.communicationskills,
                  },
                  { label: "Creativity", value: averageKpis.creativity },
                  {
                    label: "Responsiveness",
                    value: averageKpis.responsiveness,
                  },
                  { label: "Punctuality", value: averageKpis.punctuality },
                  {
                    label: "Problem Analysis",
                    value: averageKpis.problemanalysis,
                  },
                  {
                    label: "Tools Knowledge",
                    value: averageKpis.toolsknowledge,
                  },
                  { label: "Overall Rating", value: averageKpis.overallrating },
                ].map((metric) => (
                  <Box key={metric.label}>
                    <Text fontWeight="bold" fontSize="sm" mb={2}>
                      {metric.label}
                    </Text>
                    <Progress
                      value={(metric.value / 10) * 100}
                      colorScheme={
                        metric.value >= 8
                          ? "green"
                          : metric.value >= 5
                          ? "yellow"
                          : "red"
                      }
                      size="lg"
                      borderRadius="md"
                      transition="width 0.4s ease"
                    />
                    <Text fontSize="md" mt={1} color={getColor(metric.value)}>
                      {metric.value}/10
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </Box>
        )}
      </Box>

      {/* Side Peek for Adding Reviews */}
      <Box
        position="fixed"
        top="0"
        right={isSidePeekOpen ? "0" : "-400px"}
        width="400px"
        height="100vh"
        bg="white"
        boxShadow="xl"
        p={6}
        transition="right 0.3s ease"
        zIndex={10}
        overflowY="auto"
      >
        <Button
          colorScheme="red"
          size="sm"
          onClick={() => setIsSidePeekOpen(false)}
          mb={4}
        >
          Close
        </Button>
        <Text fontSize="2xl" fontWeight="bold" mb={4}>
          Add Review
        </Text>
        <form onSubmit={handleAddReview}>
          <VStack spacing={4}>
            <FormControl id="testerName" isRequired>
              <FormLabel>Tester Name</FormLabel>
              {isUsersLoading ? (
                <Skeleton height="40px" />
              ) : (
                <Select
                  placeholder="Select Tester"
                  name="testerName"
                  value={testerName}
                  onChange={(e) => setTesterName(e.target.value)}
                >
                  {users.map((user, index) => (
                    <option key={index} value={user.username}>
                      {user.username}
                    </option>
                  ))}
                </Select>
              )}
            </FormControl>

            {[
              {
                label: "Performance Score",
                value: performancescore,
                set: setPerformanceScore,
              },
              {
                label: "Bug Detection Accuracy",
                value: bugdetectionaccuracy,
                set: setBugDetectionAccuracy,
              },
              {
                label: "Testing Efficiency",
                value: testingefficiency,
                set: setTestingEfficiency,
              },
              {
                label: "Communication Skills",
                value: communicationskills,
                set: setCommunicationSkills,
              },
              { label: "Creativity", value: creativity, set: setCreativity },
              {
                label: "Responsiveness",
                value: responsiveness,
                set: setResponsiveness,
              },
              { label: "Punctuality", value: punctuality, set: setPunctuality },
              {
                label: "Problem Analysis",
                value: problemanalysis,
                set: setProblemAnalysis,
              },
              {
                label: "Tools Knowledge",
                value: toolsknowledge,
                set: setToolsKnowledge,
              },
            ].map(({ label, value, set }) => (
              <FormControl key={label} isRequired>
                <FormLabel>{label}</FormLabel>
                <NumberInput
                  min={1}
                  max={10}
                  value={value}
                  onChange={(val) => set(parseInt(val) || 1)}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
            ))}

            <FormControl id="observations" isRequired>
              <FormLabel>Observations (Include Audited Case)</FormLabel>
              <Box border="1px solid" borderColor="gray.300" borderRadius="md">
                <div ref={quillRef} style={{ height: "100px" }} />
              </Box>
            </FormControl>

            <Button type="submit" colorScheme="blue" width="full">
              Submit Review
            </Button>
          </VStack>
        </form>
      </Box>
    </HStack>
  );
};

export default QAReviewForm;
