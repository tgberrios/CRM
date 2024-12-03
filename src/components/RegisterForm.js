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
} from "@chakra-ui/react";

export default function RegisterForm({ onRegisterSuccess, showLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log("Username:", username);
    console.log("Password:", password);
    try {
      const response = await window.cert.registerUser(username, password);
      if (response.success) {
        onRegisterSuccess(username);
      } else {
        setError("Registration failed. Please try again.");
      }
    } catch (error) {
      setError("Error during registration. Please try again.");
    }
  };

  return (
    <Box textAlign="center" bg="primary" p={8} borderRadius="lg" boxShadow="lg">
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
        <FormControl id="username" mb={4}>
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
        <FormControl id="password" mb={6}>
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
        >
          Register
        </Button>
        <Text color="textSecondary">
          Already have an account?{" "}
          <Link color="accent" onClick={showLogin}>
            Login
          </Link>
        </Text>
      </form>
    </Box>
  );
}
