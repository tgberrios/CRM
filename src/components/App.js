import React from "react";
import { ChakraProvider } from "@chakra-ui/react";
import {
  HashRouter as Router, // Cambiado a HashRouter
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Auth from "./Auth";
import Home from "./Home";
import News from "./News";
import theme from "../styles/theme";
import Docs from "./Docs";
import FMA from "./Fma";
import KPI from "./Kpi";
import LabDistribution from "./LabDistribution";
import TitleAudit from "./TitleAudit";
import Tickets from "./Tickets";
import Bugpedia from "./Bugpedia";
import Sgc from "./Sgc";
import InventoryManager from "./InventoryManager";
import CmtQuestionary from "./CmtQuestionary";
import SubmissionManager from "./SubmissionManager";
import { TestModelsProvider } from "./TestModelsProvider";
import Dashboard from "./Dashboard";
import TrackerComments from "./TrackerComments";
import RetailTracker from "./Retail";
import ConsolePrep from "./ConsolePrep";

export default function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Routes>
          {/* Redirige a /auth si no se especifica una ruta */}
          <Route path="/" element={<Navigate to="/auth" />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/home" element={<Home />} />
          <Route path="/news" element={<News />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/Fma" element={<FMA />} />
          <Route path="/Kpi" element={<KPI />} />
          <Route path="/TitleAudit" element={<TitleAudit />} />
          <Route path="/LabDistribution" element={<LabDistribution />} />
          <Route path="/Tickets" element={<Tickets />} />
          <Route path="/Bugpedia" element={<Bugpedia />} />
          <Route path="/Sgc" element={<Sgc />} />
          <Route path="/InventoryManager" element={<InventoryManager />} />
          <Route path="/CmtQuestionary" element={<CmtQuestionary />} />
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/TrackerComments" element={<TrackerComments />} />
          <Route path="/RetailTracker" element={<RetailTracker />} />
          <Route path="/ConsolePrep" element={<ConsolePrep />} />

          {/* Envolver SubmissionManager con TestModelsProvider */}
          <Route
            path="/SubmissionManager"
            element={
              <TestModelsProvider>
                <SubmissionManager />
              </TestModelsProvider>
            }
          />
        </Routes>
      </Router>
    </ChakraProvider>
  );
}
