// Navbar.jsx
import React from "react";
import {
  Box,
  Flex,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { Link as RouterLink } from "react-router-dom";

const Navbar = () => {
  const downloadLink = "http://10.1.30.5:5005/";

  return (
    <Box as="nav" bg="white" p={4} boxShadow="md">
      <Flex justify="center" align="center">
        <Flex gap={4}>
          <Link
            as={RouterLink}
            to="/news"
            color="gray.700"
            fontWeight="normal"
            _hover={{ color: "blue.500" }}
          >
            News
          </Link>

          <Link
            as={RouterLink}
            to="/dashboard"
            color="gray.700"
            fontWeight="normal"
            _hover={{ color: "blue.500" }}
          >
            Dashboard
          </Link>

          <Link
            as={RouterLink}
            to="/docs"
            color="gray.700"
            fontWeight="normal"
            _hover={{ color: "blue.500" }}
          >
            Docs
          </Link>

          <Link
            as={RouterLink}
            to="/TrackerComments"
            color="gray.700"
            fontWeight="normal"
            _hover={{ color: "blue.500" }}
          >
            XR Comments
          </Link>

          <Menu>
            <MenuButton
              as={Text}
              variant="link"
              color="gray.700"
              fontWeight="normal"
              _hover={{ color: "blue.500" }}
              rightIcon={<ChevronDownIcon />}
            >
              KPI Management
            </MenuButton>
            <MenuList bg="white" borderColor="gray.200">
              <MenuItem _hover={{ bg: "gray.100" }}>
                <Link
                  as={RouterLink}
                  to="/Kpi"
                  color="gray.700"
                  _hover={{ color: "blue.500" }}
                >
                  KPI
                </Link>
              </MenuItem>
              <MenuItem _hover={{ bg: "gray.100" }}>
                <Link
                  as={RouterLink}
                  to="/TitleAudit"
                  color="gray.700"
                  _hover={{ color: "blue.500" }}
                >
                  Audits
                </Link>
              </MenuItem>
            </MenuList>
          </Menu>

          <Link
            as={RouterLink}
            to="/SubmissionManager"
            color="gray.700"
            fontWeight="normal"
            _hover={{ color: "blue.500" }}
          >
            Submissions Manager
          </Link>

          <Link
            as={RouterLink}
            to="/LabDistribution"
            color="gray.700"
            _hover={{ color: "blue.500" }}
          >
            Lab Distribution & Info
          </Link>

          <Link
            as={RouterLink}
            to="/Tickets"
            color="gray.700"
            _hover={{ color: "blue.500" }}
          >
            Tickets
          </Link>

          <Link
            as={RouterLink}
            to="/Bugpedia"
            color="gray.700"
            _hover={{ color: "blue.500" }}
          >
            Bugpedia
          </Link>

          <Link
            as={RouterLink}
            to="/Sgc"
            color="gray.700"
            _hover={{ color: "blue.500" }}
          >
            Save Game Compatibility
          </Link>

          <Link
            as={RouterLink}
            to="/InventoryManager"
            color="gray.700"
            _hover={{ color: "blue.500" }}
          >
            Inventory Manager
          </Link>

          <Menu>
            <MenuButton
              as={Text}
              variant="link"
              color="gray.700"
              fontWeight="normal"
              _hover={{ color: "blue.500" }}
              rightIcon={<ChevronDownIcon />}
            >
              Tools
            </MenuButton>
            <MenuList bg="white" borderColor="gray.200">
              <MenuItem _hover={{ bg: "gray.100" }}>
                <Link
                  href="https://cmlog.blob.core.windows.net/cmcont/publish.htm"
                  color="gray.700"
                  _hover={{ color: "blue.500" }}
                  target="_blank"
                >
                  CMT
                </Link>
              </MenuItem>
              <MenuItem _hover={{ bg: "gray.100" }}>
                <Link
                  as={RouterLink}
                  to="/CmtQuestionary"
                  color="gray.700"
                  _hover={{ color: "blue.500" }}
                >
                  CMT QUESTIONARY
                </Link>
              </MenuItem>
              <MenuItem _hover={{ bg: "gray.100" }}>
                <Link
                  as={RouterLink}
                  to="/RetailTracker"
                  color="gray.700"
                  _hover={{ color: "blue.500" }}
                >
                  Retail Tracker
                </Link>
              </MenuItem>
              <MenuItem _hover={{ bg: "gray.100" }}>
                <Link
                  as={RouterLink}
                  to="/ConsolePrep"
                  color="gray.700"
                  _hover={{ color: "blue.500" }}
                >
                  Console Prep
                </Link>
              </MenuItem>
              <MenuItem _hover={{ bg: "gray.100" }}>
                <Link
                  href="https://aibugcopilot.azurewebsites.net/"
                  color="gray.700"
                  _hover={{ color: "blue.500" }}
                  target="_blank"
                >
                  Bug Copilot
                </Link>
              </MenuItem>
              <MenuItem _hover={{ bg: "gray.100" }}>
                <Link
                  href="https://xcert.xboxlive.com/xcertclient/XCert.appinstaller"
                  color="gray.700"
                  _hover={{ color: "blue.500" }}
                  target="_blank"
                >
                  XCert Installer
                </Link>
              </MenuItem>

              <MenuItem _hover={{ bg: "gray.100" }}>
                <Link
                  href="https://xcert.xboxlive.com/submissions"
                  color="gray.700"
                  _hover={{ color: "blue.500" }}
                  target="_blank"
                >
                  XCert Submissions
                </Link>
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar;
