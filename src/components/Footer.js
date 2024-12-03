// Footer.js
import React from "react";
import { Box, Text } from "@chakra-ui/react";
import { CURRENT_VERSION } from "../../config";

const Footer = () => {
  return (
    <Box
      as="footer"
      bg="secondary"
      p={4}
      textAlign="center"
      mt="auto"
      boxShadow="md"
    >
      <Text color="textPrimary">Version {CURRENT_VERSION} &copy; IKS</Text>
    </Box>
  );
};

export default Footer;
