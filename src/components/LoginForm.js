// LoginForm.jsx
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

export default function LoginForm({ onLoginSuccess, showRegister }) {
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
      const response = await window.cert.loginUser(username, password);
      if (response.success) {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${username}!`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        onLoginSuccess(username);
      } else {
        setError("Login failed. Please check your credentials and try again.");
        toast({
          title: "Login Failed",
          description: "Invalid username or password.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      setError("An error occurred during login. Please try again later.");
      toast({
        title: "Error",
        description: "Unable to process your request. Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Login Error:", error);
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
        Login
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
          {loading ? <Spinner size="sm" color="white" /> : "Login"}
        </Button>
        <Text color="textSecondary">
          Don’t have an account?{" "}
          <Link color="accent" onClick={showRegister}>
            Register
          </Link>
        </Text>
      </form>
    </Box>
  );
}
