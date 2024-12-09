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
  TabPanel,
  Tab,
  DrawerCloseButton,
  IconButton,
  HStack,
  Textarea,
  Skeleton,
  SkeletonText,
  Tooltip,
} from "@chakra-ui/react";
import { CopyIcon, AddIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Document, Packer, Paragraph, TextRun } from "docx";

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

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    displayIssues();
  }, []);

  const displayIssues = async () => {
    setIsLoading(true);
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
      toast({
        title: "Datos Cargados",
        description: "Los issues han sido cargados exitosamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error al mostrar issues:", error);
      toast({
        title: "Error",
        description: "Hubo un error al cargar los issues.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
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
    if (!issueForm.name) errors.name = "El nombre es requerido";
    if (!issueForm.bqScore) errors.bqScore = "El BQ Score es requerido";
    if (!issueForm.xr) errors.xr = "El XR es requerido";
    if (!issueForm.scenario) errors.scenario = "El escenario es requerido";

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
        title: "Issue Agregado",
        description: "El issue ha sido agregado exitosamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error al agregar el issue:", error);
      toast({
        title: "Error",
        description: "Hubo un error al agregar el issue.",
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
    setIsLoading(true);
    try {
      const searchedIssues = await window.cert.searchIssues(query);
      setIssues(searchedIssues);
      toast({
        title: "Búsqueda Completa",
        description: `${searchedIssues.length} issues encontrados.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error al buscar issues:", error);
      toast({
        title: "Error",
        description: "Hubo un error al buscar los issues.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
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
      (acc, issue) => acc + Number(issue.bqScore || 0),
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
    if (!selectedIssue) return;
    const details = `
      Observed Behavior: ${stripHTMLTags(selectedIssue.observedBehavior)}
      Reproduction Steps: ${stripHTMLTags(selectedIssue.reproductionSteps)}
      Expected Behavior: ${stripHTMLTags(selectedIssue.expectedBehavior)}
      Notes: ${stripHTMLTags(selectedIssue.notes)}
    `;
    navigator.clipboard.writeText(details);
    toast({
      title: "Copiado",
      description: "Los detalles han sido copiados al portapapeles.",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  const exportToWord = async () => {
    if (!selectedIssue) return;

    const doc = new Document({
      creator: "BugPedia",
      title: `Detalles del Issue - ${selectedIssue.name}`,
      description: "Detalles del issue exportados desde BugPedia",
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Detalles del Issue",
                  bold: true,
                  size: 28,
                }),
              ],
            }),
            new Paragraph({ text: `Nombre: ${selectedIssue.name}` }),
            new Paragraph({ text: `Fecha: ${selectedIssue.date}` }),
            new Paragraph({ text: `BQ Score: ${selectedIssue.bqScore}` }),
            new Paragraph({ text: `Tags: ${selectedIssue.tags}` }),
            new Paragraph({ text: `XR: ${selectedIssue.xr}` }),
            new Paragraph({ text: `Escenario: ${selectedIssue.scenario}` }),
            new Paragraph({ text: "Observed Behavior:" }),
            new Paragraph({
              text: stripHTMLTags(selectedIssue.observedBehavior),
            }),
            new Paragraph({ text: "Reproduction Steps:" }),
            new Paragraph({
              text: stripHTMLTags(selectedIssue.reproductionSteps),
            }),
            new Paragraph({ text: "Expected Behavior:" }),
            new Paragraph({
              text: stripHTMLTags(selectedIssue.expectedBehavior),
            }),
            new Paragraph({ text: "Notes:" }),
            new Paragraph({ text: stripHTMLTags(selectedIssue.notes) }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedIssue.name}_Issue.docx`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exportado a Word",
      description: `${selectedIssue.name}_Issue.docx ha sido descargado.`,
      status: "success",
      duration: 3000,
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
          placeholder="Buscar issues..."
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
          Agregar Issue
        </Button>

        <Button colorScheme="gray" w="full" onClick={() => navigate("/Home")}>
          Ir a Home
        </Button>

        <Divider my={4} />

        <Heading as="h2" size="md" mb={4}>
          Issues Subidos
        </Heading>
        <VStack align="start" spacing={3} overflowY="auto">
          {isLoading ? (
            <>
              <Skeleton height="60px" w="100%" />
              <Skeleton height="60px" w="100%" />
              <Skeleton height="60px" w="100%" />
            </>
          ) : issues.length > 0 ? (
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
            <Text>No hay issues subidos aún.</Text>
          )}
        </VStack>
      </Box>

      {/* Main Content */}
      <Box flex="1" p={6} bg="gray.50">
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>Issues</Tab>
            <Tab>AI Bug Copilot</Tab>
          </TabList>

          <TabPanels>
            {/* Pestaña de Issues */}
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
                <Stat
                  p={5}
                  shadow="md"
                  borderRadius="md"
                  bg="white"
                  borderLeftWidth="4px"
                  borderColor="blue.500"
                >
                  <StatLabel>Total de Issues</StatLabel>
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
                  <StatLabel>Promedio de BQ Score</StatLabel>
                  <StatNumber>{getAverageBQScore()}</StatNumber>
                </Stat>
              </SimpleGrid>

              {isLoading ? (
                <Box
                  p={6}
                  bg="white"
                  borderRadius="md"
                  shadow="md"
                  borderWidth="1px"
                >
                  <Skeleton height="40px" mb={4} />
                  <SkeletonText mt="4" noOfLines={4} spacing="4" />
                </Box>
              ) : selectedIssue ? (
                <Box
                  p={6}
                  bg="white"
                  borderRadius="md"
                  shadow="md"
                  borderWidth="1px"
                >
                  <HStack justifyContent="space-between" mb={4}>
                    <Heading size="md" color="gray.700">
                      {selectedIssue.name}
                    </Heading>
                    <HStack>
                      <IconButton
                        icon={<CopyIcon />}
                        colorScheme="blue"
                        aria-label="Copiar detalles"
                        onClick={copyDetailsToClipboard}
                      />
                      <Button colorScheme="teal" onClick={exportToWord}>
                        Exportar a Word
                      </Button>
                    </HStack>
                  </HStack>

                  <Tabs variant="enclosed" colorScheme="blue">
                    <TabList>
                      <Tab>Información General</Tab>
                      <Tab>Detalles</Tab>
                    </TabList>

                    <TabPanels>
                      <TabPanel>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <Box>
                            <Text fontWeight="bold" mb={2}>
                              Fecha:
                            </Text>
                            <Text>{selectedIssue.date}</Text>
                          </Box>
                          <Box>
                            <Text fontWeight="bold" mb={2}>
                              BQ Score:
                            </Text>
                            <Text>{selectedIssue.bqScore}</Text>
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
                              Escenario:
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
                              {stripHTMLTags(selectedIssue.observedBehavior)}
                            </Text>
                          </Box>
                          <Divider />
                          <Box>
                            <Text fontWeight="bold" mb={2}>
                              Reproduction Steps:
                            </Text>
                            <Text>
                              {stripHTMLTags(selectedIssue.reproductionSteps)}
                            </Text>
                          </Box>
                          <Divider />
                          <Box>
                            <Text fontWeight="bold" mb={2}>
                              Expected Behavior:
                            </Text>
                            <Text>
                              {stripHTMLTags(selectedIssue.expectedBehavior)}
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
                    Selecciona un issue para ver los detalles
                  </Text>
                </Box>
              )}
            </TabPanel>

            {/* Pestaña de AI Bug Copilot */}
            <TabPanel>
              <Box w="100%" h="80vh">
                <iframe
                  src="https://aibugcopilot.azurewebsites.net/"
                  title="AI Bug Copilot"
                  width="100%"
                  height="100%"
                  style={{ border: "none" }}
                ></iframe>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      {/* Drawer para agregar un nuevo issue */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="lg">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" bg="gray.100" p={4}>
            <Heading size="lg">Agregar Nuevo Issue</Heading>
          </DrawerHeader>
          <DrawerBody padding={8} bg="gray.50">
            <VStack spacing={8} align="stretch">
              <FormControl isInvalid={formErrors.name} isRequired>
                <FormLabel>Nombre</FormLabel>
                <Input
                  type="text"
                  name="name"
                  value={issueForm.name}
                  onChange={handleInputChange}
                  placeholder="Ingresa el nombre del issue"
                />
                {formErrors.name && (
                  <FormErrorMessage>{formErrors.name}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Fecha</FormLabel>
                <Input
                  type="date"
                  name="date"
                  value={issueForm.date}
                  onChange={handleInputChange}
                />
              </FormControl>

              <FormControl isInvalid={formErrors.bqScore} isRequired>
                <FormLabel>BQ Score</FormLabel>
                <Input
                  type="number"
                  name="bqScore"
                  value={issueForm.bqScore}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                />
                {formErrors.bqScore && (
                  <FormErrorMessage>{formErrors.bqScore}</FormErrorMessage>
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
                <FormLabel>Escenario</FormLabel>
                <Textarea
                  name="scenario"
                  value={issueForm.scenario}
                  onChange={handleInputChange}
                  placeholder="Describe el escenario"
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
                  value={issueForm.observedBehavior}
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
                  value={issueForm.reproductionSteps}
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
                  value={issueForm.expectedBehavior}
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
              Enviar
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default BugPedia;
