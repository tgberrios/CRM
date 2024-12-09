import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Heading,
  RadioGroup,
  Text,
  Button,
  Skeleton,
  SkeletonText,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom"; // Use useNavigate instead of useHistory

const QAForm = () => {
  const [currentSection, setCurrentSection] = useState(1);
  const [answers, setAnswers] = useState({});
  const [resultCodes, setResultCodes] = useState("");
  const [resultAnswers, setResultAnswers] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Loading state

  const navigate = useNavigate(); // Change to useNavigate for redirection

  const toast = useToast(); // Initialize toast

  const arrCMTAnswers = {
    // Section A
    q1o1: "Agree.",
    q1o2: "Agree.",
    q1o3: "Agree.",
    q1o4: "Disagree.",
    q1o5: "Disagree.",
    q1o6: "Disagree.",

    // Section B
    q2o1: "Mark the ‘Remained seated and focused’.",
    q2o2: "Remains seated but does not concentrate on tasks.",
    q2o3: "Stopped 1 or more times throughout the day.",

    // Section C
    q3o1: "Mark ‘Wore headphones where possible’.",
    q3o2: "Used headphones less than 25% of the time.",
    q3o3: "Used headphones to listen to music.",

    // Section D
    q4o1: "Mark ‘Did not chat excessively’.",
    q4o2: "Distracted coworkers by talking on unrelated topics.",
    q4o3: "Raised voice, generating noise pollution.",

    // Section E
    q5o1: "Agree.",
    q5o2: "Did not complete documentation on time.",
    q5o3: "Did not use the checklist.",

    // Section F
    q6o1: "Agree.",
    q6o2: "Stayed no more than 10 minutes in the bathroom.",
    q6o3: "Exceeded 10 minutes in the bathroom.",
    q6o4: "Was late for more than 10% of working hours.",

    // Section G
    q7o1: "Select: Correctly completed test cases.",
    q7o2: "Select: Added comments detailing behavior of the title.",
    q7o3: "Select: Did not add correct comments on behavior.",
    q7o4: "Select: Performed test cases incorrectly.",

    // Section H
    q8o1: "Select: Helped coworkers without needing to be asked.",
    q8o2: "Select: Show interest in helping the team.",
    q8o3: "Select: Was asked 1 to 3 times to help with tasks.",
    q8o4: "Select: Ignored requests for help 3 or more times.",
    q8o5: "Select: Did not help, preferring to do unrelated activities.",

    // Section I
    q9o1: "Select: Did not require supervision from a leader.",
    q9o2: "Select: Helped the leader by completing tasks on initiative.",
    q9o3: "Select: Demonstrated initiative in team tasks.",
    q9o4: "Select: Handled their own cases without supervision, but didn’t help others.",
    q9o5: "Select: Asked 1 or more times to perform one or more test cases.",
    q9o6: "Select: Required supervision or instructions from a leader to continue.",
  };

  // Map to associate section number with a prefix (A, B, C, etc.)
  const sectionPrefixes = {
    1: "A",
    2: "B",
    3: "C",
    4: "D",
    5: "E",
    6: "F",
    7: "G",
    8: "H",
    9: "I",
  };

  // Function to handle moving to the next section
  const handleNextSection = (sectionNumber) => {
    setCurrentSection(sectionNumber);
    const section = document.getElementById(`section${sectionNumber}`);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Function to handle selection of an answer
  const handleSelection = (question, value) => {
    setAnswers((prev) => ({ ...prev, [question]: value }));
  };

  // Function to compile and display results
  const showResultCombined = () => {
    let resultCodesArray = [];
    let resultAnswersString = "";

    for (let i = 1; i <= 9; i++) {
      const selectedOption = answers[`question${i}`]; // Capture the selected answer
      if (selectedOption) {
        const sectionPrefix = sectionPrefixes[i]; // Get the section prefix (A, B, C, etc.)
        const code = `${sectionPrefix}${selectedOption.slice(1)}`; // Format the code correctly
        resultCodesArray.push(code); // Store the answer code

        const answerKey = `q${i}o${selectedOption.slice(1)}`; // Generate the key to look up in arrCMTAnswers

        // Check if the key is correctly defined
        if (arrCMTAnswers[answerKey]) {
          resultAnswersString += `${arrCMTAnswers[answerKey]}<br>`; // Add the corresponding answer
        } else {
          resultAnswersString += `Answer not found<br>`; // Message if answer is not found
        }
      }
    }

    setResultCodes(resultCodesArray.join(" "));
    setResultAnswers(resultAnswersString); // Compile the answers correctly
  };

  // Effect to show results when all sections are completed
  useEffect(() => {
    if (currentSection === 10) {
      showResultCombined();
    }
  }, [currentSection]);

  // Function to reset the form
  const handleReset = () => {
    setAnswers({});
    setResultCodes("");
    setResultAnswers("");
    setCurrentSection(1); // Return to the first section
    toast({
      title: "Form Reset",
      description: "The form has been reset successfully.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  // Function to navigate to the home page
  const handleGoHome = () => {
    navigate("/home"); // Redirect to the home page
  };

  // Function to render each section
  const renderSection = (sectionNumber, questionText, options) => {
    return (
      <Box
        id={`section${sectionNumber}`}
        display={currentSection === sectionNumber ? "block" : "none"}
        minHeight="100vh"
        d="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        py={8}
        bg={sectionNumber % 2 === 0 ? "#f5cba7" : "#f1948a"}
        textAlign="center" // Ensure all content is centered
      >
        <Heading as="h1" size="lg" textAlign="center" mb={4} color="black">
          {questionText}
        </Heading>
        <RadioGroup>
          <Flex
            wrap="wrap"
            justifyContent="center"
            alignItems="center"
            maxWidth="600px"
            mx="auto"
          >
            {options.map((option, index) => (
              <Box
                key={index}
                m={2}
                p={6}
                bg="#ffffff"
                color="#721c24"
                borderRadius="50px"
                minWidth="250px"
                minHeight="100px"
                display="flex"
                justifyContent="center"
                alignItems="center"
                cursor="pointer"
                boxShadow="md"
                transition="all 0.3s ease"
                _hover={{ transform: "scale(1.05)" }}
                borderLeft={
                  index === 0
                    ? "10px solid #28a745"
                    : index === options.length - 1
                    ? "10px solid #dc3545"
                    : "10px solid #ffc107"
                }
                onClick={() => {
                  handleSelection(`question${sectionNumber}`, `o${index + 1}`);
                  handleNextSection(sectionNumber + 1);
                }}
              >
                <Text textAlign="center" fontSize="1.2rem">
                  {option}
                </Text>
              </Box>
            ))}
          </Flex>
        </RadioGroup>
        {/* Button to go to Home from the first section */}
        {sectionNumber === 1 && (
          <Button mt={8} colorScheme="blue" onClick={handleGoHome}>
            Go to Home
          </Button>
        )}
      </Box>
    );
  };

  return (
    <Box>
      {/* Render all sections */}
      {renderSection(
        1,
        "Worked Proactively, whether autonomously or by following instructions?",
        [
          "Does not require follow-up on your tasks.",
          "Follows instructions given by the lead or senior lead.",
          "Completes your assignments before 4:30 pm.",
          "Were given 2 or more reminders to do your test cases.",
          "Did not follow any instruction, instead did a different task.",
          "Didn’t complete your assignments before 4:30 pm.",
        ]
      )}

      {renderSection(
        2,
        "Professional – Seated: Maintained a professional work ethic at all times (tick all that apply)",
        [
          "Remained seated, and only got up to go to the bathroom or require help.",
          "Remains seated but does not concentrate on tasks.",
          "Stopped 1 or more times throughout the day.",
        ]
      )}

      {renderSection(
        3,
        "Professional – Headphones: The tester used headphones connected to the Xbox controller?",
        [
          "Used headphones more than 25% of working hours.",
          "Used headphones less than 25% of the time.",
          "Used headphones to listen to music.",
        ]
      )}

      {renderSection(
        4,
        "Professional – Chat: Maintained a professional work ethic at all times (tick all that apply)",
        [
          "Did not talk more than 10% on unrelated topics.",
          "Distracted coworkers by talking on unrelated topics.",
          "Raised voice, generating noise pollution.",
        ]
      )}

      {renderSection(
        5,
        "All applicable documentation was fully completed at the end of the test?",
        [
          "Completed documentation on time.",
          "Did not complete documentation on time.",
          "Did not use the checklist.",
        ]
      )}

      {renderSection(6, "The tester remained punctual throughout the day.", [
        "The tester is punctual.",
        "Stayed no more than 10 minutes in the bathroom.",
        "Exceeded 10 minutes in the bathroom.",
        "Was late for more than 10% of working hours.",
      ])}

      {renderSection(
        7,
        "The tester gave due care and attention to test cases, running them properly and in full.",
        [
          "Correctly completed test cases.",
          "Added comments detailing behavior of the title.",
          "Did not add correct comments on behavior.",
          "Performed test cases incorrectly.",
        ]
      )}

      {renderSection(
        8,
        "Once their assigned tasks were completed, the tester...",
        [
          "Helped coworkers without needing to be asked.",
          "Showed interest in helping the team.",
          "Was asked 1 to 3 times to help with tasks.",
          "Ignored requests for help 3 or more times.",
          "Did not help, preferring to do unrelated activities.",
        ]
      )}

      {renderSection(9, "Throughout the course of the test, the tester...", [
        "Did not require supervision from a leader.",
        "Helped the leader by completing tasks on initiative.",
        "Demonstrated initiative in team tasks.",
        "Handled their own cases without supervision, but didn’t help others.",
        "Asked 1 or more times to perform one or more test cases.",
        "Required supervision or instructions from a leader to continue.",
      ])}

      {/* Results Section */}
      <Box
        id="resultSection"
        display={currentSection === 10 ? "flex" : "none"}
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bg="gray.700"
        color="white"
        py={8}
        textAlign="center"
      >
        {isLoading ? (
          // Skeleton while loading results
          <Box>
            <Skeleton height="40px" mb={4} />
            <SkeletonText mt="4" noOfLines={4} spacing="4" />
          </Box>
        ) : (
          <Flex flexDirection="column" alignItems="center">
            <Heading as="h2" mb={4}>
              Codes:
            </Heading>
            <Text dangerouslySetInnerHTML={{ __html: resultCodes }}></Text>
            <Heading as="h2" mt={4} mb={4}>
              Answers:
            </Heading>
            <Text dangerouslySetInnerHTML={{ __html: resultAnswers }}></Text>

            {/* Buttons aligned at the center with more space */}
            <Flex mt={8} justifyContent="space-around" width="100%">
              <Button colorScheme="blue" onClick={handleGoHome}>
                Go to Home
              </Button>
              <Button colorScheme="red" onClick={handleReset}>
                Reset Form
              </Button>
            </Flex>
          </Flex>
        )}
      </Box>
    </Box>
  );
};

export default QAForm;
