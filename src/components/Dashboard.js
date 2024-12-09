// Dashboard.js
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
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Skeleton,
  Stack,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaBug,
  FaClipboardList,
  FaTools,
  FaTicketAlt,
  FaShoppingCart,
  FaLaptop,
} from "react-icons/fa";
import { FaUsers } from "react-icons/fa"; // Correct Import
import { MdUpdate } from "react-icons/md";
import { GiAchievement } from "react-icons/gi";
import sanitizeHtml from "sanitize-html";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

// DataTable Component
const DataTable = ({ columns, data, formatDate }) => (
  <Table variant="simple" bg="secondary" borderRadius="md" shadow="sm">
    <Thead>
      <Tr>
        {columns.map((col) => (
          <Th key={col.accessor}>{col.header}</Th>
        ))}
      </Tr>
    </Thead>
    <Tbody>
      {data.map((row) => (
        <Tr key={row.id}>
          {columns.map((col) => (
            <Td key={col.accessor}>
              {col.isDate ? formatDate(row[col.accessor]) : row[col.accessor]}
            </Td>
          ))}
        </Tr>
      ))}
    </Tbody>
  </Table>
);

// TrackersList Component
const TrackersList = ({ trackers, formatDate }) => (
  <Table variant="simple" bg="secondary" borderRadius="md" shadow="sm">
    <Thead>
      <Tr>
        <Th>Title</Th>
        <Th>Progress</Th>
      </Tr>
    </Thead>
    <Tbody>
      {trackers.map((tracker) => (
        <Tr key={tracker.id}>
          <Td>{tracker.titlename}</Td>
          <Td>
            <Badge
              colorScheme={
                tracker.progress > 75
                  ? "green"
                  : tracker.progress > 50
                  ? "yellow"
                  : "red"
              }
            >
              {tracker.progress}%
            </Badge>
          </Td>
        </Tr>
      ))}
    </Tbody>
  </Table>
);

// UpdatesList Component
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
      >
        <HStack>
          <Icon as={MdUpdate} w={6} h={6} color="blue.500" />
          <Text fontWeight="bold">{update.title}</Text>
          <Badge colorScheme="green">{formatDate(update.date)}</Badge>
        </HStack>
        <Text>
          {stripHtmlTags(update.content).substring(0, 100)}...{" "}
          <Button
            variant="link"
            colorScheme="teal"
            onClick={() => handleOpenUpdateModal(update)}
          >
            Read More
          </Button>
        </Text>
      </Box>
    ))}
  </VStack>
);

// Dashboard Component
const Dashboard = () => {
  // States for different sections
  const [stats, setStats] = useState({});
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [rolesCount, setRolesCount] = useState({});
  const [trackers, setTrackers] = useState([]);
  const [averageProgress, setAverageProgress] = useState(0);
  const [recentTrackers, setRecentTrackers] = useState([]);
  // const [issues, setIssues] = useState([]); // Removed

  const [loading, setLoading] = useState(true);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Page for updates
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const toast = useToast();

  const UPDATES_PER_PAGE = 5;

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        accounts,
        audits,
        hardware,
        // issuesData, // Removed
        reviews,
        updates,
        activities,
        // ticketsData, // Removed
        purchasesData,
        personnelData,
        trackersData,
      ] = await Promise.all([
        window.cert.getAccounts(),
        window.cert.getAudits(),
        window.cert.getHardware(),
        // window.cert.getIssues(), // Removed
        window.cert.getReviews(),
        window.cert.getUpdates(),
        window.cert.getRecentActivities(),
        // window.cert.getTickets(), // Removed
        window.cert.getPurchases(),
        window.cert.getPersonnel(),
        window.cert.getTrackers(),
      ]);

      const statsData = {
        accountsCount: accounts.length,
        auditsCount: audits.length,
        hardwareCount: hardware.length,
        // issuesCount: issuesData.length, // Removed
        reviewsCount: reviews.length,
        // ticketsCount: ticketsData.length, // Removed
      };

      // Get top performers
      const topPerformersData = getTopPerformers(reviews);

      // Process purchases
      setPurchases(purchasesData);
      const total = purchasesData.reduce(
        (acc, purchase) => acc + (purchase.price || 0),
        0
      );
      setTotalSpent(total);
      setRecentPurchases(purchasesData.slice(-5).reverse());

      // Process personnel
      setPersonnel(personnelData);
      const roles = personnelData.reduce((acc, person) => {
        acc[person.role] = (acc[person.role] || 0) + 1;
        return acc;
      }, {});
      setRolesCount(roles);

      // Process trackers
      setTrackers(trackersData);
      const avgProgress =
        trackersData.reduce(
          (acc, tracker) => acc + (tracker.progress || 0),
          0
        ) / (trackersData.length || 1);
      setAverageProgress(avgProgress);
      setRecentTrackers(trackersData.slice(-5).reverse());

      // Process issues // Removed
      // setIssues(issuesData);

      setStats(statsData);
      setRecentUpdates(updates);
      setRecentActivities(activities);
      setTopPerformers(topPerformersData);

      // Example notifications
      if (purchasesData.length > 0) {
        // Adjusted to reflect purchases
        toast({
          title: "New Purchases",
          description: `${purchasesData.length} new purchases have been recorded.`,
          status: "info",
          duration: 5000,
          isClosable: true,
        });
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
      toast({
        title: "Error",
        description: "There was a problem loading the data.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getTopPerformers = (reviews) => {
    const testerScores = {};
    reviews.forEach((review) => {
      const { testername, overallrating } = review;
      if (!testerScores[testername]) {
        testerScores[testername] = {
          totalScore: 0,
          count: 0,
        };
      }
      const rating = parseFloat(overallrating) || 0;
      testerScores[testername].totalScore += rating;
      testerScores[testername].count += 1;
    });

    const sortedPerformers = Object.keys(testerScores)
      .map((testername) => ({
        testername,
        averageScore:
          testerScores[testername].count > 0
            ? testerScores[testername].totalScore /
              testerScores[testername].count
            : 0,
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
    return date.toLocaleDateString("en-US", options); // Changed locale to English
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
        <Tabs isFitted variant="enclosed">
          <TabList mb="1em">
            <Tab>Summary</Tab>
            <Tab>Retail Purchases List</Tab>
            <Tab>Trackers Progress</Tab>
            {/* <Tab>Issues</Tab> Removed */}
            <Tab>Updates</Tab>
          </TabList>
          <TabPanels>
            {/* Summary */}
            <TabPanel>
              <Grid
                templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }}
                gap={6}
              >
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
                {/* <StatCard
                  title="Issues"
                  count={stats.issuesCount}
                  icon={FaBug}
                  color="red.500"
                /> Removed */}
                <StatCard
                  title="Reviews"
                  count={stats.reviewsCount}
                  icon={GiAchievement}
                  color="orange.500"
                />
                {/* <StatCard
                  title="Tickets"
                  count={stats.ticketsCount}
                  icon={FaTicketAlt}
                  color="green.500"
                /> Removed */}
                <StatCard
                  title="Total Personnel"
                  count={personnel.length}
                  icon={FaUsers}
                  color="purple.500"
                  subCount={`Different Roles: ${
                    Object.keys(rolesCount).length
                  }`}
                />
                <StatCard
                  title="Trackers"
                  count={trackers.length}
                  icon={FaLaptop}
                  color="orange.500"
                  subCount={`Average Progress: ${averageProgress.toFixed(2)}%`}
                />
              </Grid>
              {/* Recent Activity */}
              <Divider my={6} />
              <SectionHeading title="Recent Activity" />
              <RecentActivities
                activities={recentActivities}
                formatDate={formatDate}
              />
            </TabPanel>

            {/* Purchases */}
            <TabPanel>
              <VStack align="start" spacing={4}>
                {/* Purchases Summary */}
                <HStack spacing={4}>
                  <StatCard
                    title="Total Purchases"
                    count={purchases.length}
                    icon={FaShoppingCart}
                    color="green.500"
                  />
                  <StatCard
                    title="Total Spent"
                    count={`$${totalSpent.toFixed(2)}`}
                    icon={FaShoppingCart}
                    color="green.500"
                  />
                </HStack>
                {/* Recent Purchases */}
                <SectionHeading title="Recent Purchases" />
                <PurchasesList
                  purchases={recentPurchases}
                  formatDate={formatDate}
                />
              </VStack>
            </TabPanel>

            {/* Trackers */}
            <TabPanel>
              <VStack align="start" spacing={4}>
                {/* Trackers Summary */}
                <HStack spacing={4}>
                  <StatCard
                    title="Total Trackers"
                    count={trackers.length}
                    icon={FaLaptop}
                    color="orange.500"
                  />
                  <StatCard
                    title="Average Progress"
                    count={`${averageProgress.toFixed(2)}%`}
                    icon={FaLaptop}
                    color="orange.500"
                  />
                </HStack>
                {/* Recent Trackers List */}
                <SectionHeading title="Recent Trackers" />
                <TrackersList
                  trackers={recentTrackers}
                  formatDate={formatDate}
                />
                {/* Removed: All Trackers */}
                {/* <Divider my={6} />
                <SectionHeading title="All Trackers" />
                <DataTable
                  columns={[
                    { header: "Title", accessor: "titlename" },
                    { header: "Progress", accessor: "progress" },
                  ]}
                  data={trackers}
                  formatDate={formatDate}
                /> */}
              </VStack>
            </TabPanel>

            {/* Recent Updates */}
            <TabPanel>
              <VStack align="start" spacing={4}>
                {/* Updates List */}
                <SectionHeading title="Recent Updates" />
                <UpdatesList
                  updates={currentUpdates}
                  formatDate={formatDate}
                  stripHtmlTags={stripHtmlTags}
                  handleOpenUpdateModal={handleOpenUpdateModal}
                />
                {/* Pagination */}
                <Pagination
                  totalItems={recentUpdates.length}
                  itemsPerPage={UPDATES_PER_PAGE}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                />
                {/* All Updates */}
                <Divider my={6} />
                <SectionHeading title="All Updates" />
                <DataTable
                  columns={[
                    { header: "ID", accessor: "id" },
                    { header: "Title", accessor: "title" },
                    { header: "Date", accessor: "date", isDate: true },
                    { header: "Type", accessor: "type" },
                    { header: "Content", accessor: "content" },
                  ]}
                  data={recentUpdates} // Change this to all updates if desired
                  formatDate={formatDate}
                />
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
      {/* Modal for Updates */}
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
    <Skeleton height="40px" />
    <Skeleton height="200px" />
    {/* Add more Skeletons as needed */}
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

// StatCard component
const StatCard = ({ title, count, icon, color, subCount }) => (
  <Box
    p={4}
    bg="secondary"
    borderRadius="md"
    shadow="md"
    _hover={{ transform: "scale(1.05)" }}
    transition="transform 0.2s"
  >
    <HStack>
      <Icon as={icon} w={10} h={10} color={color} />
      <Stat>
        <StatLabel>{title}</StatLabel>
        <StatNumber>{count}</StatNumber>
        {subCount && (
          <Text fontSize="sm" color="gray.500">
            {subCount}
          </Text>
        )}
      </Stat>
    </HStack>
  </Box>
);

// SectionHeading component
const SectionHeading = ({ title }) => (
  <Heading size="md" mb={4} color="textPrimary">
    {title}
  </Heading>
);

// RecentActivities component
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

// TopPerformersList component
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
              <Avatar name={performer.testername} />
              <Text>{performer.testername}</Text>
            </HStack>
          </Td>
          <Td>{performer.averageScore.toFixed(2)}</Td>
        </Tr>
      ))}
    </Tbody>
  </Table>
);

// PurchasesList component
const PurchasesList = ({ purchases, formatDate }) => (
  <Table variant="simple" bg="secondary" borderRadius="md" shadow="sm">
    <Thead>
      <Tr>
        <Th>Title</Th>
        <Th>Date</Th>
        <Th>Amount</Th>
        <Th>Account</Th>
        <Th>Reason</Th>
      </Tr>
    </Thead>
    <Tbody>
      {purchases.map((purchase) => (
        <Tr key={purchase.id}>
          <Td>{purchase.title}</Td>
          <Td>{formatDate(purchase.date)}</Td>
          <Td>${purchase.price.toFixed(2)}</Td>
          <Td>{purchase.account}</Td>
          <Td>{purchase.reason}</Td>
        </Tr>
      ))}
    </Tbody>
  </Table>
);

export default Dashboard;
