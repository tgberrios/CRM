// RegisterForm.jsx
import React, { useState } from "react";
import {
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Box,
  Heading,
  Link,
  Alert,
  AlertIcon,
  useToast,
  Spinner,
} from "@chakra-ui/react";

export default function RegisterForm({ onRegisterSuccess, showLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Loading state
  const toast = useToast(); // Initialize toast

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true); // Start loading
    setError(""); // Reset previous errors

    try {
      const response = await window.cert.registerUser(username, password);
      if (response.success) {
        toast({
          title: "Registration Successful",
          description: `Welcome, ${username}! Your account has been created.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        onRegisterSuccess(username);
      } else {
        setError("Registration failed. Please try again.");
        toast({
          title: "Registration Failed",
          description:
            "Unable to create your account. Please check your details and try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      setError("An error occurred during registration. Please try again.");
      toast({
        title: "Error",
        description:
          "Unable to process your registration. Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Registration Error:", error);
    } finally {
      setLoading(false); // End loading
    }
  };

  return (
    <Box
      textAlign="center"
      bg="primary"
      p={8}
      borderRadius="lg"
      boxShadow="lg"
      maxW="md"
      mx="auto"
      mt={10}
    >
      <Heading as="h2" mb={6} color="textPrimary">
        Register
      </Heading>
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}
      <form onSubmit={handleSubmit}>
        <FormControl id="username" mb={4} isDisabled={loading}>
          <FormLabel color="textSecondary">Username</FormLabel>
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Enter your username"
            bg="secondary"
            color="textPrimary"
            _placeholder={{ color: "textSecondary" }}
          />
        </FormControl>
        <FormControl id="password" mb={6} isDisabled={loading}>
          <FormLabel color="textSecondary">Password</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
            bg="secondary"
            color="textPrimary"
            _placeholder={{ color: "textSecondary" }}
          />
        </FormControl>
        <Button
          type="submit"
          colorScheme="blue"
          bg="accent"
          size="lg"
          width="100%"
          _hover={{ bg: "hover" }}
          mb={4}
          disabled={loading}
        >
          {loading ? <Spinner size="sm" color="white" /> : "Register"}
        </Button>
        <Text color="textSecondary">
          Already have an account?{" "}
          <Link color="accent" onClick={showLogin} cursor="pointer">
            Login
          </Link>
        </Text>
      </form>
    </Box>
  );
}
