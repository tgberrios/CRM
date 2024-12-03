import React, { useState, useEffect } from "react";
import { Box, Flex } from "@chakra-ui/react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { useNavigate } from "react-router-dom";
import "../styles/style.css";

export default function Auth() {
  const [showLoginForm, setShowLoginForm] = useState(true);
  const navigate = useNavigate();

  // Check if user is already logged in (based on localStorage)
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      navigate("/home"); // Redirect if already logged in
    }
  }, [navigate]);

  const handleLoginSuccess = (username) => {
    console.log("User logged in:", username);

    // Save username to localStorage to keep session
    localStorage.setItem("username", username);

    // Redirect to home page
    navigate("/home");
  };

  const handleRegisterSuccess = (username) => {
    console.log("User registered:", username);

    // Save username to localStorage to keep session
    localStorage.setItem("username", username);

    // Redirect to home page
    navigate("/home");
  };

  return (
    <Flex
      id="auth-page"
      height="100vh"
      alignItems="center"
      justifyContent="center"
    >
      <div className="bubble1"></div>
      <div className="bubble2"></div>
      <Box
        p={8}
        maxW="400px"
        borderWidth={1}
        borderRadius="lg"
        boxShadow="lg"
        bg="white"
        zIndex={1}
      >
        {showLoginForm ? (
          <LoginForm
            onLoginSuccess={handleLoginSuccess}
            showRegister={() => setShowLoginForm(false)}
          />
        ) : (
          <RegisterForm
            onRegisterSuccess={handleRegisterSuccess}
            showLogin={() => setShowLoginForm(true)}
          />
        )}
      </Box>
    </Flex>
  );
}
