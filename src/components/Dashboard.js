import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  Heading,
  Text,
  VStack,
  Divider,
  Button,
  HStack,
  Avatar,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Icon,
  Badge,
  Spinner,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Skeleton,
  Select,
  Stack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaBug,
  FaClipboardList,
  FaTools,
  FaTicketAlt,
} from "react-icons/fa";
import { MdUpdate } from "react-icons/md";
import { GiAchievement } from "react-icons/gi";
import sanitizeHtml from "sanitize-html";

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [pendingTickets, setPendingTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Page for updates
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  const UPDATES_PER_PAGE = 5;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        accounts,
        audits,
        hardware,
        issues,
        reviews,
        updates,
        activities,
        tickets,
      ] = await Promise.all([
        window.cert.getAccounts(),
        window.cert.getAudits(),
        window.cert.getHardware(),
        window.cert.getIssues(),
        window.cert.getReviews(),
        window.cert.getUpdates(),
        window.cert.getRecentActivities(),
        window.cert.getTickets(),
      ]);

      const statsData = {
        accountsCount: accounts.length,
        auditsCount: audits.length,
        hardwareCount: hardware.length,
        issuesCount: issues.length,
        reviewsCount: reviews.length,
        ticketsCount: tickets.length,
      };

      const pendingTicketsData = tickets.filter(
        (ticket) =>
          ticket.status.toLowerCase() !== "closed" &&
          ticket.status.toLowerCase() !== "resolved"
      );

      const topPerformersData = getTopPerformers(reviews);

      setStats(statsData);
      setRecentUpdates(updates);
      setRecentActivities(activities);
      setTopPerformers(topPerformersData);
      setPendingTickets(pendingTicketsData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    }
  };

  const getTopPerformers = (reviews) => {
    const testerScores = {};
    reviews.forEach((review) => {
      const { testerName, overallRating } = review;
      if (!testerScores[testerName]) {
        testerScores[testerName] = {
          totalScore: 0,
          count: 0,
        };
      }
      testerScores[testerName].totalScore += overallRating;
      testerScores[testerName].count += 1;
    });

    const sortedPerformers = Object.keys(testerScores)
      .map((testerName) => ({
        testerName,
        averageScore:
          testerScores[testerName].totalScore / testerScores[testerName].count,
      }))
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 3);

    return sortedPerformers;
  };

  const stripHtmlTags = (html) => {
    return sanitizeHtml(html, {
      allowedTags: [],
      allowedAttributes: {},
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("es-ES", options);
  };

  const handleOpenUpdateModal = (update) => {
    setSelectedUpdate(update);
    onOpen();
  };

  const handlePageChange = (page) => setCurrentPage(page);

  const currentUpdates = recentUpdates.slice(
    (currentPage - 1) * UPDATES_PER_PAGE,
    currentPage * UPDATES_PER_PAGE
  );

  return (
    <Box p={8} bg="primary" minHeight="100vh">
      <Heading mb={6} color="textPrimary">
        Dashboard
      </Heading>
      <Button colorScheme="teal" mb={6} onClick={() => navigate("/Home")}>
        Go to Home
      </Button>
      {loading ? (
        <SkeletonLoading />
      ) : (
        <>
          <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
            <StatCard
              title="Accounts"
              count={stats.accountsCount}
              icon={FaUser}
              color="teal.500"
            />
            <StatCard
              title="Audits"
              count={stats.auditsCount}
              icon={FaClipboardList}
              color="blue.500"
            />
            <StatCard
              title="Hardware"
              count={stats.hardwareCount}
              icon={FaTools}
              color="purple.500"
            />
            <StatCard
              title="Issues"
              count={stats.issuesCount}
              icon={FaBug}
              color="red.500"
            />
            <StatCard
              title="Reviews"
              count={stats.reviewsCount}
              icon={GiAchievement}
              color="orange.500"
            />
            <StatCard
              title="Tickets"
              count={stats.ticketsCount}
              icon={FaTicketAlt}
              color="green.500"
            />
          </Grid>

          <Divider my={6} />

          <SectionHeading title="Recent Activities" />
          <RecentActivities
            activities={recentActivities}
            formatDate={formatDate}
          />

          <Divider my={6} />

          <SectionHeading title="Top Performers" />
          <TopPerformersList performers={topPerformers} />

          <Divider my={6} />

          <SectionHeading title="Pending Tickets" />
          <PendingTicketsList
            tickets={pendingTickets}
            formatDate={formatDate}
          />

          <Divider my={6} />

          <SectionHeading title="Recent Updates" />
          <UpdatesList
            updates={currentUpdates}
            formatDate={formatDate}
            stripHtmlTags={stripHtmlTags}
            handleOpenUpdateModal={handleOpenUpdateModal}
          />
          <Pagination
            totalItems={recentUpdates.length}
            itemsPerPage={UPDATES_PER_PAGE}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* Modal for showing full update content */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedUpdate?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <div
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(selectedUpdate?.content),
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

// Skeleton loading component
const SkeletonLoading = () => (
  <Stack spacing={6}>
    <Skeleton height="40px" />
    <Skeleton height="200px" />
    <Skeleton height="40px" />
    <Skeleton height="200px" />
  </Stack>
);

// Pagination component
const Pagination = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  return (
    <HStack mt={4} justify="center">
      {Array.from({ length: totalPages }, (_, index) => (
        <Button
          key={index + 1}
          onClick={() => onPageChange(index + 1)}
          colorScheme={currentPage === index + 1 ? "teal" : "gray"}
          variant={currentPage === index + 1 ? "solid" : "outline"}
        >
          {index + 1}
        </Button>
      ))}
    </HStack>
  );
};

const StatCard = ({ title, count, icon, color }) => (
  <Box
    p={4}
    bg="secondary"
    borderRadius="md"
    shadow="md"
    _hover={{ transform: "scale(1.05)" }}
  >
    <HStack>
      <Icon as={icon} w={10} h={10} color={color} />
      <Stat>
        <StatLabel>{title}</StatLabel>
        <StatNumber>{count}</StatNumber>
      </Stat>
    </HStack>
  </Box>
);

const SectionHeading = ({ title }) => (
  <Heading size="md" mb={4} color="textPrimary">
    {title}
  </Heading>
);

const RecentActivities = ({ activities, formatDate }) => (
  <VStack align="start" spacing={4}>
    {activities.map((activity, index) => (
      <Box
        key={index}
        p={4}
        bg="secondary"
        borderRadius="md"
        shadow="sm"
        w="100%"
      >
        <HStack>
          <Badge colorScheme="teal">{activity.type}</Badge>
          <Text fontWeight="bold">{activity.description}</Text>
        </HStack>
        <Text fontSize="sm" color="textSecondary">
          {formatDate(activity.date)}
        </Text>
      </Box>
    ))}
  </VStack>
);

const TopPerformersList = ({ performers }) => (
  <Table variant="simple" bg="secondary" borderRadius="md" shadow="sm">
    <Thead>
      <Tr>
        <Th>Name</Th>
        <Th>Average Score</Th>
      </Tr>
    </Thead>
    <Tbody>
      {performers.map((performer, index) => (
        <Tr key={index}>
          <Td>
            <HStack>
              <Avatar name={performer.testerName} />
              <Text>{performer.testerName}</Text>
            </HStack>
          </Td>
          <Td>{performer.averageScore.toFixed(2)}</Td>
        </Tr>
      ))}
    </Tbody>
  </Table>
);

const PendingTicketsList = ({ tickets, formatDate }) => (
  <VStack align="start" spacing={4}>
    {tickets.map((ticket) => (
      <Box
        key={ticket.id}
        p={4}
        bg="secondary"
        borderRadius="md"
        shadow="sm"
        w="100%"
      >
        <HStack>
          <Icon as={FaTicketAlt} w={6} h={6} color="green.500" />
          <Text fontWeight="bold">{ticket.name}</Text>
          <Badge colorScheme="red">{ticket.priority}</Badge>
        </HStack>
        <Text>{ticket.description}</Text>
        <Text fontSize="sm" color="textSecondary">
          {formatDate(ticket.date)}
        </Text>
      </Box>
    ))}
  </VStack>
);

const UpdatesList = ({
  updates,
  formatDate,
  stripHtmlTags,
  handleOpenUpdateModal,
}) => (
  <VStack align="start" spacing={4}>
    {updates.map((update) => (
      <Box
        key={update.id}
        p={4}
        bg="secondary"
        borderRadius="md"
        shadow="sm"
        w="100%"
        onClick={() => handleOpenUpdateModal(update)}
        cursor="pointer"
        _hover={{ bg: "gray.100" }}
      >
        <HStack>
          <Icon as={MdUpdate} w={6} h={6} color="blue.500" />
          <Text fontWeight="bold">{update.title}</Text>
          <Badge colorScheme="blue">{update.type}</Badge>
        </HStack>
        <Text fontSize="sm" color="textSecondary">
          {formatDate(update.date)}
        </Text>
      </Box>
    ))}
  </VStack>
);

export default Dashboard;
