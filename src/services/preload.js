const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("cert", {
  // News
  logUpdate: (update) => ipcRenderer.invoke("log-update", update),
  loadUpdates: () => ipcRenderer.invoke("load-updates"),
  deleteUpdate: (updateId) => ipcRenderer.invoke("delete-update", updateId),
  // News

  // USERS
  registerUser: (username, password) => {
    console.log("Preload received username:", username);
    console.log("Preload received password:", password);
    return ipcRenderer.invoke("registerUser", { username, password });
  },

  loginUser: (username, password) =>
    ipcRenderer.invoke("loginUser", username, password),
  getUsers: () => ipcRenderer.invoke("getUsers"),
  // USERS

  // DOCS
  insertTestCase: (testCase) =>
    ipcRenderer.invoke("insert-test-case", testCase),
  updateTestCase: (testCase) =>
    ipcRenderer.invoke("update-test-case", testCase),
  getAllTestCases: () => ipcRenderer.invoke("get-all-test-cases"),
  getTestCaseById: (id) => ipcRenderer.invoke("get-test-case-by-id", id),
  deleteTestCase: (id) => ipcRenderer.invoke("delete-test-case", id),
  // DOCS

  // KPI
  getTesters: () => ipcRenderer.invoke("get-testers"),
  getReviews: () => ipcRenderer.invoke("get-reviews"),
  addReview: (review) => ipcRenderer.invoke("add-review", review),
  updateReview: (review) => ipcRenderer.invoke("update-review", review),
  deleteReview: (id) => ipcRenderer.invoke("delete-review", id),
  // KPI

  // Title Audit
  addAudit: (audit) => ipcRenderer.invoke("add-audit", audit),
  loadAudits: () => ipcRenderer.invoke("load-audits"),
  getAudit: (id) => ipcRenderer.invoke("get-audit", id),
  deleteAudit: (id) => ipcRenderer.invoke("delete-audit", id),
  editAudit: (id, audit) => ipcRenderer.invoke("edit-audit", id, audit),
  // Title Audit

  // Tickets
  addTicket: (ticket) => ipcRenderer.invoke("addTicket", ticket),
  getTickets: () => ipcRenderer.invoke("get-tickets"),
  deleteTicket: (id) => ipcRenderer.invoke("delete-ticket", id),
  updateTicketStatus: (ticketId, newStatus) =>
    ipcRenderer.invoke("update-ticket-status", ticketId, newStatus),

  // Tickets

  // Bugpedia
  addIssue: (issue) => ipcRenderer.invoke("addIssue", issue),
  getIssues: () => ipcRenderer.invoke("get-issues"),
  searchIssues: (query) => ipcRenderer.invoke("search-issues", query),
  // Bugpedia

  // SGC
  saveData: (formData) => ipcRenderer.invoke("save-data", formData),
  loadAllData: () => ipcRenderer.invoke("load-all-data"),
  loadDataById: (id) => ipcRenderer.invoke("load-data-by-id", id),
  editData: (id, formData) => ipcRenderer.invoke("edit-data", id, formData),
  deleteData: (id) => ipcRenderer.invoke("delete-data", id),
  // SGC

  // Inventory
  getAccounts: () => ipcRenderer.invoke("get-accounts"),
  addAccount: (account) => ipcRenderer.invoke("add-account", account),
  editAccount: (account) => ipcRenderer.invoke("edit-account", account),
  deleteAccount: (id) => ipcRenderer.invoke("delete-account", id),

  getHardware: () => ipcRenderer.invoke("get-hardware"),
  addHardware: (hardware) => ipcRenderer.invoke("add-hardware", hardware),
  editHardware: (hardware) => ipcRenderer.invoke("edit-hardware", hardware),
  deleteHardware: (serialNumber) =>
    ipcRenderer.invoke("delete-hardware", serialNumber),
  // Inventory

  // TRACKER

  getTrackers: () => ipcRenderer.invoke("get-trackers"),
  addTracker: (tracker) => ipcRenderer.invoke("add-tracker", tracker),
  updateTracker: (tracker) => ipcRenderer.invoke("update-tracker", tracker),
  deleteTracker: (id) => ipcRenderer.invoke("delete-tracker", id),

  // TRACKER

  // Dashboard

  getAccounts: () => ipcRenderer.invoke("get-accounts"),
  getAudits: () => ipcRenderer.invoke("get-audits"),
  getHardware: () => ipcRenderer.invoke("get-hardware"),
  getIssues: () => ipcRenderer.invoke("get-issues"),
  getReviews: () => ipcRenderer.invoke("get-reviews"),
  getUpdates: () => ipcRenderer.invoke("get-updates"),
  getRecentActivities: () => ipcRenderer.invoke("get-recent-activities"),

  // Dashboard

  //

  loadExcel: () => ipcRenderer.invoke("load-excel"),
  loadConsoleExcel: (filePath) =>
    ipcRenderer.invoke("load-console-excel", filePath),
  loadCommentsExcel: () => ipcRenderer.invoke("load-comments-excel"),

  //

  // Purchases
  getPurchases: () => ipcRenderer.invoke("get-purchases"),
  addPurchase: (purchase) => ipcRenderer.invoke("add-purchase", purchase),
  deletePurchase: (id) => ipcRenderer.invoke("delete-purchase", id),
  updatePurchase: (id, updatedFields) =>
    ipcRenderer.invoke("update-purchase", id, updatedFields),
  searchPurchases: (query) => ipcRenderer.invoke("search-purchases", query),

  // Console Prep

  // ======= Teams =======
  getTeams: () => ipcRenderer.invoke("get-teams"),
  addTeam: (team) => ipcRenderer.invoke("add-team", team),
  updateTeam: (team) => ipcRenderer.invoke("update-team", team),
  deleteTeam: (teamId) => ipcRenderer.invoke("delete-team", teamId),

  // ======= Personnel =======
  getPersonnel: () => ipcRenderer.invoke("get-personnel"),
  addPersonnel: (person) => ipcRenderer.invoke("add-personnel", person),
  updatePersonnel: (person) => ipcRenderer.invoke("update-personnel", person),
  deletePersonnel: (personId) =>
    ipcRenderer.invoke("delete-personnel", personId),

  // ======= Config History =======
  addConfigHistory: (historyEntry) =>
    ipcRenderer.invoke("add-config-history", historyEntry),
  getConfigHistory: () => ipcRenderer.invoke("get-config-history"),
  deleteConfigHistory: (date) =>
    ipcRenderer.invoke("delete-config-history", date),
  updateConfigHistory: (historyEntry) =>
    ipcRenderer.invoke("update-config-history", historyEntry),

  // ======= Assignments =======
  getAssignments: () => ipcRenderer.invoke("get-assignments"),
  addAssignment: (assignment) =>
    ipcRenderer.invoke("add-assignment", assignment),
  updateAssignment: (assignment) =>
    ipcRenderer.invoke("update-assignment", assignment),
  deleteAssignment: (assignmentId) =>
    ipcRenderer.invoke("delete-assignment", assignmentId),

  // ======= WorkDays =======
  getWorkDays: () => ipcRenderer.invoke("get-workdays"),
  addWorkDay: (workday) => ipcRenderer.invoke("add-workday", workday),
  updateWorkDay: (workday) => ipcRenderer.invoke("update-workday", workday),
  deleteWorkDay: (workdayId) => ipcRenderer.invoke("delete-workday", workdayId),

  // ======= Absences =======
  getAbsences: () => ipcRenderer.invoke("get-absences"),
  addAbsence: (absence) => ipcRenderer.invoke("add-absence", absence),
  updateAbsence: (absence) => ipcRenderer.invoke("update-absence", absence),
  deleteAbsence: (absenceId) => ipcRenderer.invoke("delete-absence", absenceId),

  // ======= Migration =======
  migrateLocalstorage: (localData) =>
    ipcRenderer.invoke("migrate-localstorage", localData),

  initializeTeams: () => ipcRenderer.invoke("initialize-teams"),
});
