// Footer.js
import React from "react";
import { Box, Text } from "@chakra-ui/react";
import { CURRENT_VERSION } from "../../config";

/**
 * Footer Component
 * Displays the current version and company information.
 * Positioned at the bottom of the page.
 */
const Footer = () => {
  return (
    <Box
      as="footer"
      bg="secondary" // Ensure 'secondary' is defined in your Chakra UI theme
      p={4}
      textAlign="center"
      mt="auto" // Pushes the footer to the bottom if used within a Flex container
      boxShadow="md"
      position="relative" // Optional: Adjust positioning as needed
      width="100%" // Ensures the footer spans the full width
    >
      <Text color="textPrimary">Version {CURRENT_VERSION} &copy; IKS</Text>
    </Box>
  );
};

export default Footer;
