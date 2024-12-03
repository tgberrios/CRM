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
    <Box as="nav" bg="secondary" p={4} boxShadow="md">
      <Flex justify="center" align="center">
        <Flex gap={4}>
          <Link
            as={RouterLink}
            to="/news"
            color="textPrimary"
            fontWeight="normal"
            _hover={{ color: "accent" }}
          >
            News
          </Link>

          <Link
            as={RouterLink}
            to="/dashboard"
            color="textPrimary"
            fontWeight="normal"
            _hover={{ color: "accent" }}
          >
            Dashboard
          </Link>

          <Link
            as={RouterLink}
            to="/docs"
            color="textPrimary"
            fontWeight="normal"
            _hover={{ color: "accent" }}
          >
            Docs
          </Link>

          <Link
            as={RouterLink}
            to="/TrackerComments"
            color="textPrimary"
            fontWeight="normal"
            _hover={{ color: "accent" }}
          >
            XR Comments
          </Link>

          <Menu>
            <MenuButton
              as={Text}
              variant="link"
              color="textPrimary"
              fontWeight="normal"
              _hover={{ color: "accent" }}
              rightIcon={<ChevronDownIcon />}
            >
              KPI Management
            </MenuButton>
            <MenuList bg="secondary" borderColor="textSecondary">
              <MenuItem _hover={{ bg: "hover" }}>
                <Link
                  as={RouterLink}
                  to="/Kpi"
                  color="textPrimary"
                  _hover={{ color: "accent" }}
                >
                  KPI
                </Link>
              </MenuItem>
              <MenuItem _hover={{ bg: "hover" }}>
                <Link
                  as={RouterLink}
                  to="/TitleAudit"
                  color="textPrimary"
                  _hover={{ color: "accent" }}
                >
                  Audits
                </Link>
              </MenuItem>
            </MenuList>
          </Menu>

          <Link
            as={RouterLink}
            to="/SubmissionManager"
            color="textPrimary"
            fontWeight="normal"
            _hover={{ color: "accent" }}
          >
            Submissions Manager
          </Link>

          <Link
            as={RouterLink}
            to="/LabDistribution"
            color="textPrimary"
            _hover={{ color: "accent" }}
          >
            Lab Distribution & Info
          </Link>

          <Link
            as={RouterLink}
            to="/Tickets"
            color="textPrimary"
            _hover={{ color: "accent" }}
          >
            Tickets
          </Link>

          <Link
            as={RouterLink}
            to="/Bugpedia"
            color="textPrimary"
            _hover={{ color: "accent" }}
          >
            Bugpedia
          </Link>

          <Link
            as={RouterLink}
            to="/Sgc"
            color="textPrimary"
            _hover={{ color: "accent" }}
          >
            Save Game Compatibility
          </Link>

          <Link
            as={RouterLink}
            to="/InventoryManager"
            color="textPrimary"
            _hover={{ color: "accent" }}
          >
            Inventory Manager
          </Link>

          <Menu>
            <MenuButton
              as={Text}
              variant="link"
              color="textPrimary"
              fontWeight="normal"
              _hover={{ color: "accent" }}
              rightIcon={<ChevronDownIcon />}
            >
              Tools
            </MenuButton>
            <MenuList bg="secondary" borderColor="textSecondary">
              <MenuItem _hover={{ bg: "hover" }}>
                <Link
                  href="https://cmlog.blob.core.windows.net/cmcont/publish.htm"
                  color="textPrimary"
                  _hover={{ color: "accent" }}
                  target="_blank"
                >
                  CMT
                </Link>
              </MenuItem>
              <MenuItem _hover={{ bg: "hover" }}>
                <Link
                  as={RouterLink}
                  to="/CmtQuestionary"
                  color="textPrimary"
                  _hover={{ color: "accent" }}
                >
                  CMT QUESTIONARY
                </Link>
              </MenuItem>
              <MenuItem _hover={{ bg: "hover" }}>
                <Link
                  as={RouterLink}
                  to="/RetailTracker"
                  color="textPrimary"
                  _hover={{ color: "accent" }}
                >
                  Retail Tracker
                </Link>
              </MenuItem>
              <MenuItem _hover={{ bg: "hover" }}>
                <Link
                  as={RouterLink}
                  to="/ConsolePrep"
                  color="textPrimary"
                  _hover={{ color: "accent" }}
                >
                  Console Prep
                </Link>
              </MenuItem>
              <MenuItem _hover={{ bg: "hover" }}>
                <Link
                  target="_blank"
                  as={RouterLink}
                  to="https://aibugcopilot.azurewebsites.net/"
                  color="textPrimary"
                  _hover={{ color: "accent" }}
                >
                  Bug Copilot
                </Link>
              </MenuItem>
              <MenuItem _hover={{ bg: "hover" }}>
                <Link
                  target="_blank"
                  as={RouterLink}
                  to="https://xcert.xboxlive.com/xcertclient/XCert.appinstaller"
                  color="textPrimary"
                  _hover={{ color: "accent" }}
                >
                  XCert Installer
                </Link>
              </MenuItem>
            </MenuList>
          </Menu>

          {/* Enlace "Look for updates" destacado */}
          <Link
            href={downloadLink}
            color="blue.500"
            fontWeight="bold"
            _hover={{ color: "blue.600", textDecoration: "underline" }}
            isExternal
          >
            Look for updates
          </Link>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar;
