import React, { createContext, useContext } from "react";

const testData = {
  testCases: {
    "001-01": "Title Stability",
    "003-02": "Title Integrity",
    "003-03": "Options",
    "003-04": "Language Support",
    "003-05": "Navigation",
    "014-01": "Personal Information",
    "022-01": "Official Naming Standards",
    "001-03": "Title Stability after Connected Standby",
    "003-14": "Local Multiple Players",
    "057-01": "No Additional Purchases Required for Base Achievements",
    "112-03": "No Signed-In User",
    "112-04": "Active User Indication",
    "112-05": "Access to Account Picker",
    "115-01": "Addition of Users",
    "130-01": "Controller Input",
    "130-04": "Featured Game Modes",
    "131-01": "Game DVR and Screenshots - Console 1",
    "115-02": "Removal of Controllers",
    "055-01": "Achievements",
    "115-03": "Removal of Users",
    "003-17": "Headset State Change",
    "003-18": "Headset State Change after Suspend",
    "003-19": "Headset State Change after Connected Standby",
    "018-01":
      "Reporting Inappropriate Content and UGC Text-String Verification",
    "050-02": "Cloud Storage: Roaming [USE GOLD PROFILE]",
    "123-01":
      "Installation/Unlock of Game Add-Ons or Consumables During Gameplay",
    "130-02": "Save Game Roaming [USE GOLD PROFILE]",
    "003-10": "Cross Region",
    "064-01": "Joining a Game Session from Outside the Game",
    "064-02": "Joining a Game Session from the Same Game",
    "064-05": "Non-Joinable Game",
    "067-01": "Maintaining Session State",
    "015-02": "Muting Support  - (matrix on Voice tab)",
    "015-03": "Blocked Users - (matrix on Voice tab)",
    "124-01": "Game Invitations - (matrix on Invites&Joins tab)",
    "130-03": "Online Segmentation",
    "015-01": "User Communication",
    "045-01": "Respect User Privileges",
    "064-07": "Xbox Play Anywhere - Cross Platform",
    "003-07": "Leaderboards",
    "003-08": "Low or High Friend Count",
    "047-01": "User-Profile Access - (matrix on Gtag tab)",
    "001-02": "Title Stability After Suspending",
    "013-01": "Linking Microsoft Accounts with Publisher Accounts",
    "046-01": "Display Name and Gamerpic - (matrix on Gtag tab)",
    "048-01": "Profile Settings Usage - (matrix on Gtag tab)",
    "050-01": "Correct User Association",
    "052-01": "User Sign-In and Sign-Out",
    "052-02": "User Change During Suspended or Terminated State",
    "112-02": "Initial User and Controller",
    "112-08": "User Change During Suspension",
    "001-04": "Title Stability After Quick Resume",
    "130-05": "Compatibility Mode",
    "812-01": "Scarlett Performance",
    "074-01": "WAN Disconnection to Xbox Services",
    "074-02": "Direct Disconnection",
    "074-07": "Dynamic Connectivity Loss",
    "074-08": "Pre-Launch Downtime",
    "112-06": "Handling Profile Change",
    "129-01": "Intelligent Delivery of Language Packs",
    "129-02": "Intelligent Delivery of Device specific Content",
    "129-03": "Migration of Device Specific Content",
    "129-04": "Intelligent Delivery of On-Demand Content",
    "074-03": "Suspend Disconnection to Xbox Services",
    "074-04": "Xbox Service Reconnection During Suspend",
    "074-05": "Constant Low Bandwidth",
    "074-06": "Variable Low Bandwidth",
    "112-07": "User Change During Constrained Mode",
    "129-05": "Features and Recipes",
    "037-04": "Multiplayer DLC",
    "034-01": "Streaming Installation",
    "037-01": "No Content Package Save-Game Dependencies for Base Title",
    "037-02": "No Dependencies on Other Content Packages",
    "123-02":
      "Installation/Unlock of Game Add-Ons or Consumables as Part of Main Game Package During Streaming Install",
    "117-01": "Beta/Game Preview Notification to Users",
    "003-16": "Save-Game Compatibility",
    "037-03": "DLC Dependency",
    "036-01": "Content Price Verification",
    "070-01": "Xbox Friends List",
    "132-01": "Service Access Limitations",
    "132-02": "Game Event Limitations",
    "133-01": "Local Storage Write Limitations",
    "001-01.2": "Hardware Requirements",
    "003-00": "App is testable",
    "002-10": "General Security",
    "003-24": "Test Account",
    "004-02": "App Crash or Freeze",
    "004-03": "App Responsiveness",
    "067-01": "Maintaining Session State",
    "124-01": "Game Invitations",
    "999-03": "Online - Only Metadata Verification",
    "999-90": "Optional Test Pass",
    "046-01": "Display Name and Gamerpic",
    "115-01": "Addition of Users",
    "115-02": "Removal of Controllers",
    "115-03": "Removal of Users",
    "003-04": "Language Support",
    "003-08": "Low or High Friend Count",
    "048-01": "Profile Settings Usage",
    "074-05": "Constant Low Bandwidth",
    "074-06": "Variable Low Bandwidth",
  },
  testModels: {
    // Nuevos Test Models Añadidos con Nombres de Tiers como Claves (sin guiones bajos)
    "Tier 1 - Singleplayer Optional": {
      // Asigna los códigos de test case correspondientes
      p1: "", // Ejemplo: "001-01"
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 1 - Multiplayer Optional": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 1 - Singleplayer Final - Main SKU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 1 - Singleplayer Final - Sub SKU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 1 - Multiplayer Final - Main SKU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 1 - Multiplayer Final - Sub SKU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 1 - Singleplayer CU - Main SKU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 1 - Singleplayer CU - Sub SKU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 1 - Multiplayer CU - Main SKU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 1 - Multiplayer CU - Sub SKU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 2 - Singleplayer Game - Optional": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 2 - Multiplayer Game - Optional": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 2 - Singleplayer Game - Final - Main SKU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 2 - Singleplayer Game - Final - Sub SKU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 2 - Multiplayer Game - Final - Main SKU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 2 - Multiplayer Game - Final - Sub SKU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 2 - Singleplayer Game - CU - Main SKU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 2 - Singleplayer Game - CU - Sub SKU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 2 - Multiplayer Game - CU - Main SKU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 2 - Multiplayer Game - CU - Sub SKU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 3 - Singleplayer Game - Optional": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 3 - Multiplayer Game - Optional": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 3 - Singleplayer Game - Final - Main SKU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 3 - Singleplayer Game - Final - Sub SKU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 3 - Multiplayer Game - Final - Main SKU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 3 - Multiplayer Game - Final - Sub SKU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 3 - Singleplayer Game - CU - Main SKU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 3 - Singleplayer Game - CU - Sub SKU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 3 - Multiplayer Game - CU - Main SKU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 3 - Multiplayer Game - CU - Sub SKU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 4 - Singleplayer Game - Optional": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 4 - Multiplayer Game - Optional": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 4 - Singleplayer Game - Final": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 4 - Multiplayer Game - Final": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 4 - Singleplayer Game - CU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 4 - Multiplayer Game - CU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 5 - Singleplayer Game - Optional": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 5 - Multiplayer Game - Optional": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 5 - Singleplayer Game - Final": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 5 - Multiplayer Game - Final": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 5 - Singleplayer Game - CU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 5 - Multiplayer Game - CU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 5 - Singleplayer Game - Optional - Gamepass": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 5 - Multiplayer Game - Optional - Gamepass": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 5 - Singleplayer Game - Final - Gamepass": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 5 - Multiplayer Game - Final - Gamepass": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 5 - Singleplayer Game - CU - Gamepass": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 5 - Multiplayer Game - CU - Gamepass": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Tier 6 - Low Usage CU": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    Beta: {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
    "Game Preview": {
      p1: "",
      p2: "",
      p3: "",
      // Continúa asignando según corresponda
    },
  },
};

// Crear el contexto para compartir los test models
const TestModelsContext = createContext();

export const TestModelsProvider = ({ children }) => {
  return (
    <TestModelsContext.Provider value={testData}>
      {children}
    </TestModelsContext.Provider>
  );
};

export const useTestModels = () => {
  return useContext(TestModelsContext);
};
