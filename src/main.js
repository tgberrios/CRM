// main.js

const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const { Pool } = require("pg");
const { exec } = require("child_process");
const XLSX = require("xlsx");
const url = require("url");

// ========================== Configuración de PostgreSQL ==========================

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  user: "postgres", // Reemplaza con tu usuario de PostgreSQL
  host: "CERTPDC.CRLABCERT.com", // Reemplaza con el host de tu servidor PostgreSQL
  database: "certdb", // Reemplaza con el nombre de tu base de datos
  password: "!! abc 123", // Reemplaza con la contraseña de tu usuario de PostgreSQL
  port: 5432, // Reemplaza con el puerto de tu servidor PostgreSQL si es diferente
});

// Probar la conexión
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Error al conectar a PostgreSQL:", err.stack);
  } else {
    console.log("Conexión exitosa a PostgreSQL:", res.rows[0]);
  }
});

// ========================== Clase WriteQueue ==========================

class WriteQueue {
  constructor() {
    this.queue = [];
    this.isWriting = false;
  }

  enqueue(operation) {
    return new Promise((resolve, reject) => {
      this.queue.push({ operation, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isWriting || this.queue.length === 0) return;
    this.isWriting = true;
    const { operation, resolve, reject } = this.queue.shift();
    try {
      const result = await operation();
      resolve(result);
    } catch (error) {
      reject(error);
    }
    this.isWriting = false;
    this.processQueue();
  }
}

const writeQueue = new WriteQueue();

// ========================== Función runWithRetry ==========================

/**
 * Ejecuta una operación con reintentos en caso de errores.
 * @param {Function} operation - Función que retorna una Promise para la operación.
 * @param {number} retries - Número máximo de reintentos.
 * @param {number} delay - Tiempo de espera entre reintentos en milisegundos.
 * @returns {Promise}
 */
function runWithRetry(operation, retries = 5, delay = 1000) {
  return new Promise((resolve, reject) => {
    function attempt(currentRetry) {
      operation()
        .then(resolve)
        .catch((err) => {
          if (currentRetry < retries) {
            const timestamp = new Date().toISOString();
            console.warn(
              `[${timestamp}] Error detectado: ${
                err.message
              }. Reintentando en ${delay}ms... (Intento ${currentRetry + 1})`
            );
            setTimeout(() => attempt(currentRetry + 1), delay);
          } else {
            const timestamp = new Date().toISOString();
            console.error(`[${timestamp}] Error persistente:`, err.message);
            reject(err);
          }
        });
    }
    attempt(0);
  });
}

// ========================== Inicialización de Tablas ==========================

async function initializeTables() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Crear tabla users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL
      );
    `);

    // Crear tabla logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        action TEXT NOT NULL,
        tableName TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
      );
    `);

    // Crear tabla tickets
    await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        name TEXT,
        category TEXT,
        description TEXT,
        priority TEXT,
        status TEXT,
        date TEXT,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
      );
    `);

    // Crear tabla purchases
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        price REAL NOT NULL,
        account TEXT NOT NULL,
        reason TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Crear tabla updates
    await client.query(`
      CREATE TABLE IF NOT EXISTS updates (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        title TEXT,
        type TEXT,
        content TEXT,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
      );
    `);

    // Crear tabla testCases
    await client.query(`
      CREATE TABLE IF NOT EXISTS testCases (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        xr TEXT,
        documentation TEXT,
        passExample TEXT,
        failExample TEXT,
        naExample TEXT,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
      );
    `);

    // Crear tabla issues
    await client.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        name TEXT,
        date TEXT,
        observedBehavior TEXT,
        reproductionSteps TEXT,
        expectedBehavior TEXT,
        notes TEXT,
        bqScore INTEGER,
        tags TEXT,
        xr TEXT,
        scenario TEXT,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
      );
    `);

    // Crear tabla accounts
    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        state TEXT,
        email TEXT,
        position TEXT,
        gamertag TEXT,
        sandbox TEXT,
        subscription TEXT,
        location TEXT,
        notes TEXT,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
      );
    `);

    // Crear tabla testers
    await client.query(`
      CREATE TABLE IF NOT EXISTS testers (
        name TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
      );
    `);

    // Crear tabla audits
    await client.query(`
      CREATE TABLE IF NOT EXISTS audits (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        titleName TEXT,
        submissionIteration TEXT,
        generation TEXT,
        testDate TEXT,
        nonCFRIssuesLogged INTEGER,
        cfrIssuesLogged INTEGER,
        totalCFRMissed INTEGER,
        lead TEXT,
        testers TEXT,
        actionItems TEXT,
        bugQualityTracking TEXT,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
      );
    `);

    // Crear tabla trackers
    await client.query(`
      CREATE TABLE IF NOT EXISTS trackers (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        titleName TEXT,
        leadName TEXT,
        testStartDate TEXT,
        testEndDate TEXT,
        sandboxIds TEXT,
        recoveryVersion TEXT,
        binaryId TEXT,
        skuIdentifier TEXT,
        xboxVersion TEXT,
        simplifiedUserModel TEXT,
        windowsVersion TEXT,
        supportedPlatforms TEXT,
        testModel TEXT,
        testCases TEXT,
        progress INTEGER DEFAULT 0,
        completedOn TEXT,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
      );
    `);

    // Crear tabla widget_positions
    await client.query(`
      CREATE TABLE IF NOT EXISTS widget_positions (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        top INTEGER,
        left INTEGER,
        width INTEGER,
        height INTEGER,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
      );
    `);

    // Crear tabla hardware
    await client.query(`
      CREATE TABLE IF NOT EXISTS hardware (
        serialNumber TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        consoleId TEXT,
        xboxLiveId TEXT,
        assetOwner TEXT,
        projectOwner TEXT,
        type TEXT,
        classification TEXT,
        assetTag TEXT,
        location TEXT,
        status TEXT,
        owner TEXT,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
      );
    `);

    // Crear tabla history
    await client.query(`
      CREATE TABLE IF NOT EXISTS history (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        titleName TEXT NOT NULL,
        supportedPlatforms TEXT,
        leadName TEXT,
        testCases TEXT,
        date TEXT NOT NULL,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
      );
    `);

    // Crear índices
    const createIndices = [
      "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);",
      "CREATE INDEX IF NOT EXISTS idx_logs_username ON logs(username);",
      "CREATE INDEX IF NOT EXISTS idx_tickets_username ON tickets(username);",
      "CREATE INDEX IF NOT EXISTS idx_purchases_account ON purchases(account);",
      "CREATE INDEX IF NOT EXISTS idx_updates_username ON updates(username);",
      "CREATE INDEX IF NOT EXISTS idx_testCases_username ON testCases(username);",
      "CREATE INDEX IF NOT EXISTS idx_issues_name ON issues(name);",
      "CREATE INDEX IF NOT EXISTS idx_issues_tags ON issues(tags);",
      "CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts(username);",
      "CREATE INDEX IF NOT EXISTS idx_audits_username ON audits(username);",
      "CREATE INDEX IF NOT EXISTS idx_trackers_username ON trackers(username);",
      "CREATE INDEX IF NOT EXISTS idx_widget_positions_username ON widget_positions(username);",
      "CREATE INDEX IF NOT EXISTS idx_hardware_username ON hardware(username);",
      "CREATE INDEX IF NOT EXISTS idx_history_username ON history(username);",
      // Añade más índices según sea necesario
    ].join("\n");

    await client.query(createIndices);

    await client.query("COMMIT");
    console.log(
      "Todas las tablas e índices han sido inicializados correctamente."
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error inicializando tablas:", error.message);
  } finally {
    client.release();
  }
}

// ========================== Funciones de Backup y Verificación ==========================

/**
 * Función para realizar un backup de la base de datos usando pg_dump.
 */
function backupDatabase() {
  const backupPath = path.join(__dirname, "CERTDB_backup.dump");
  const command = `pg_dump -U certuser -h localhost -F c -b -v -f "${backupPath}" certdb`;

  // Configura la variable de entorno PGPASSWORD para evitar que pg_dump solicite la contraseña
  const env = { ...process.env, PGPASSWORD: "!! abc 123" };

  exec(command, { env }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error realizando backup: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`Backup realizado exitosamente en: ${backupPath}`);
  });
}

/**
 * Función para verificar la integridad de la base de datos.
 * En PostgreSQL, se puede verificar la conectividad y la existencia de la base de datos.
 */
async function checkDatabaseIntegrity() {
  try {
    const res = await pool.query("SELECT 1");
    if (res.rows.length === 1 && res.rows[0] === 1) {
      console.log("Integridad de la base de datos verificada correctamente.");
    } else {
      console.error("Integridad de la base de datos comprometida.");
      // Implementa lógica para manejar la corrupción, como restaurar desde un backup
    }
  } catch (err) {
    console.error(
      "Error verificando integridad de la base de datos:",
      err.message
    );
    // Implementa lógica para manejar la corrupción, como restaurar desde un backup
  }
}

// Realizar un backup cada hora
setInterval(backupDatabase, 60 * 60 * 1000); // 60 minutos * 60 segundos * 1000 ms

// Verificar la integridad cada 30 minutos
setInterval(checkDatabaseIntegrity, 30 * 60 * 1000); // 30 minutos * 60 segundos * 1000 ms

// ========================== Manejo de Ventanas ==========================

// Definir la ventana principal
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, "../xbox.ico"),
    webPreferences: {
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: true,
      preload: path.join(__dirname, "./services/preload.js"),
    },
  });

  // Construir la URL de inicio
  const startUrl =
    process.env.ELECTRON_START_URL ||
    url.format({
      pathname: path.join(__dirname, "../dist/index.html"),
      protocol: "file:",
      slashes: true,
    });

  console.log(startUrl);
  mainWindow.loadURL(startUrl);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.maximize();
    // mainWindow.webContents.openDevTools();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.setZoomFactor(0.8);
  });
}

// Configurar el menú de la aplicación
Menu.setApplicationMenu(null);

// Manejar el evento de 'ready'
app.on("ready", () => {
  createWindow();
  initializeTables();
});

// Manejar el cierre de todas las ventanas
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Manejar la activación de la aplicación (macOS)
app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// Cerrar la pool de conexiones al salir de la aplicación
app.on("before-quit", () => {
  pool.end(() => {
    console.log("Pool de PostgreSQL cerrado correctamente.");
  });
});

// ========================== IPC Handlers ==========================

// ==================== IPC NEWS ====================

ipcMain.handle("log-update", async (event, update) => {
  return runWithRetry(
    async () => {
      const query =
        "INSERT INTO updates (title, type, content, username) VALUES ($1, $2, $3, $4) RETURNING id";
      const values = [
        update.title,
        update.type,
        update.content,
        update.username,
      ];
      try {
        const res = await pool.query(query, values);
        return { id: res.rows[0].id };
      } catch (err) {
        console.error("Error insertando actualización:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("load-updates", async () => {
  try {
    const res = await pool.query("SELECT * FROM updates");
    return res.rows;
  } catch (err) {
    console.error("Error cargando actualizaciones:", err.message);
    throw err;
  }
});

ipcMain.handle("delete-update", async (event, updateId) => {
  return runWithRetry(
    async () => {
      const query = "DELETE FROM updates WHERE id = $1";
      try {
        const res = await pool.query(query, [updateId]);
        return { deleted: res.rowCount > 0 };
      } catch (err) {
        console.error("Error eliminando actualización:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

// ==================== IPC USERS ====================

ipcMain.handle("getUsers", async () => {
  try {
    const res = await pool.query("SELECT * FROM users");
    return res.rows;
  } catch (err) {
    console.error("Error obteniendo usuarios:", err.message);
    throw err;
  }
});

ipcMain.handle("loginUser", async (event, username, password) => {
  try {
    const query = `
      SELECT * FROM users WHERE username = $1 AND password = $2;
    `;
    const values = [username, password];
    const res = await pool.query(query, values);

    if (res.rows.length > 0) {
      return { success: true, user: res.rows[0] };
    } else {
      return { success: false, message: "Invalid username or password." };
    }
  } catch (err) {
    console.error("Error during login:", err.message);
    return { success: false, error: err.message };
  }
});

// ==================== IPC DOCS ====================

ipcMain.handle("insert-test-case", async (event, newTestCase) => {
  return runWithRetry(
    async () => {
      const query =
        "INSERT INTO testCases (xr, documentation, passExample, failExample, naExample, username) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id";
      const values = [
        newTestCase.xr,
        newTestCase.documentation,
        newTestCase.passExample,
        newTestCase.failExample,
        newTestCase.naExample,
        newTestCase.username,
      ];
      try {
        const res = await pool.query(query, values);
        return { id: res.rows[0].id };
      } catch (err) {
        console.error("Error insertando caso de prueba:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("update-test-case", async (event, testCase) => {
  return runWithRetry(
    async () => {
      const {
        id,
        xr,
        documentation,
        passExample,
        failExample,
        naExample,
        username,
      } = testCase;
      const query = `
        UPDATE testCases 
        SET xr = $1, documentation = $2, passExample = $3, failExample = $4, naExample = $5, username = $6 
        WHERE id = $7
      `;
      const values = [
        xr,
        documentation,
        passExample,
        failExample,
        naExample,
        username,
        id,
      ];
      try {
        const res = await pool.query(query, values);
        return { changes: res.rowCount };
      } catch (err) {
        console.error("Error actualizando caso de prueba:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("get-all-test-cases", async () => {
  try {
    const res = await pool.query("SELECT * FROM testCases");
    return res.rows;
  } catch (err) {
    console.error("Error obteniendo todos los casos de prueba:", err.message);
    throw err;
  }
});

ipcMain.handle("get-test-case-by-id", async (event, id) => {
  try {
    const query = "SELECT * FROM testCases WHERE id = $1";
    const res = await pool.query(query, [id]);
    if (res.rows.length === 0) {
      throw new Error("Caso de prueba no encontrado");
    }
    return res.rows[0];
  } catch (err) {
    console.error("Error obteniendo caso de prueba por ID:", err.message);
    throw err;
  }
});

ipcMain.handle("delete-test-case", async (event, id) => {
  return runWithRetry(
    async () => {
      const query = "DELETE FROM testCases WHERE id = $1";
      try {
        const res = await pool.query(query, [id]);
        return { deleted: res.rowCount > 0 };
      } catch (err) {
        console.error("Error eliminando caso de prueba:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

// ==================== IPC KPI ====================

ipcMain.handle("get-testers", async () => {
  try {
    const res = await pool.query("SELECT * FROM testers");
    return res.rows;
  } catch (err) {
    console.error("Error obteniendo testers:", err.message);
    throw err;
  }
});

ipcMain.handle("get-reviews", async () => {
  try {
    const res = await pool.query("SELECT * FROM reviews");
    return res.rows;
  } catch (err) {
    console.error("Error obteniendo reviews:", err.message);
    throw err;
  }
});

ipcMain.handle("add-review", async (event, review) => {
  const {
    username,
    testerName = "Unknown Tester", // Valor predeterminado si no se recibe testerName
    performanceScore = 0,
    bugDetectionAccuracy = 0,
    testingEfficiency = 0,
    communicationskills = 0,
    creativity = 0,
    responsiveness = 0,
    punctuality = 0,
    problemAnalysis = 0,
    toolsKnowledge = 0,
    overallRating = 0,
    observations = "No observations provided",
    date = new Date().toISOString().split("T")[0], // Fecha actual
  } = review;

  try {
    const query = `
      INSERT INTO reviews (
        username, testername, performancescore, bugdetectionaccuracy, testingefficiency, 
        communicationskills, creativity, responsiveness, punctuality, problemanalysis, 
        toolsknowledge, overallrating, observations, date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id
    `;
    const values = [
      username,
      testerName,
      performanceScore,
      bugDetectionAccuracy,
      testingEfficiency,
      communicationskills,
      creativity,
      responsiveness,
      punctuality,
      problemAnalysis,
      toolsKnowledge,
      overallRating,
      observations,
      date,
    ];

    const res = await pool.query(query, values);
    return { id: res.rows[0].id };
  } catch (err) {
    console.error("Error agregando review:", err.message);
    throw err;
  }
});

ipcMain.handle("registerUser", async (event, { username, password }) => {
  console.log("Received username:", username, "Received password:", password);

  if (!username || !password) {
    console.error("Error: Both username and password must be provided.");
    return {
      success: false,
      error: "Both username and password are required.",
    };
  }

  try {
    const query = `
      INSERT INTO users (username, password)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const values = [username, password];
    const res = await pool.query(query, values);

    console.log("User registered successfully:", res.rows[0]);
    return { success: true, user: res.rows[0] };
  } catch (err) {
    console.error("Error registrando usuario:", err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("update-review", async (event, review) => {
  return runWithRetry(
    async () => {
      const {
        id,
        testerName,
        performanceScore,
        bugDetectionAccuracy,
        testingEfficiency,
        communicationskills,
        creativity,
        responsiveness,
        punctuality,
        problemAnalysis,
        toolsKnowledge,
        overallRating,
        observations,
        date,
      } = review;

      const query = `
        UPDATE reviews SET
          testerName = $1,
          performanceScore = $2,
          bugDetectionAccuracy = $3,
          testingEfficiency = $4,
          communicationskills = $5,
          creativity = $6,
          responsiveness = $7,
          punctuality = $8,
          problemAnalysis = $9,
          toolsKnowledge = $10,
          overallRating = $11,
          observations = $12,
          date = $13
        WHERE id = $14
      `;
      const values = [
        testerName,
        performanceScore,
        bugDetectionAccuracy,
        testingEfficiency,
        communicationskills,
        creativity,
        responsiveness,
        punctuality,
        problemAnalysis,
        toolsKnowledge,
        overallRating,
        observations,
        date,
        id,
      ];

      try {
        const res = await pool.query(query, values);
        return { changes: res.rowCount };
      } catch (err) {
        console.error("Error actualizando review:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("delete-review", async (event, id) => {
  return runWithRetry(
    async () => {
      const query = "DELETE FROM reviews WHERE id = $1";
      try {
        const res = await pool.query(query, [id]);
        return { deleted: res.rowCount > 0 };
      } catch (err) {
        console.error("Error eliminando review:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

// ==================== IPC Title Audit ====================

ipcMain.handle("add-audit", async (event, audit) => {
  return runWithRetry(
    async () => {
      const {
        titleName,
        submissionIteration,
        generation,
        testDate,
        nonCFRIssuesLogged,
        cfrIssuesLogged,
        totalCFRMissed,
        lead,
        testers,
        actionItems,
        bugQualityTracking,
        username,
      } = audit;

      const query = `
        INSERT INTO audits (
          titleName, submissionIteration, generation, testDate, nonCFRIssuesLogged, 
          cfrIssuesLogged, totalCFRMissed, lead, testers, actionItems, bugQualityTracking, username
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id
      `;
      const values = [
        titleName,
        submissionIteration,
        generation,
        testDate,
        nonCFRIssuesLogged,
        cfrIssuesLogged,
        totalCFRMissed,
        lead,
        testers,
        actionItems,
        bugQualityTracking,
        username,
      ];

      try {
        const res = await pool.query(query, values);
        return { id: res.rows[0].id };
      } catch (err) {
        console.error("Error agregando audit:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("load-audits", async () => {
  try {
    const res = await pool.query("SELECT * FROM audits");
    return res.rows;
  } catch (err) {
    console.error("Error cargando audits:", err.message);
    throw err;
  }
});

ipcMain.handle("get-audit", async (event, id) => {
  try {
    const query = "SELECT * FROM audits WHERE id = $1";
    const res = await pool.query(query, [id]);
    if (res.rows.length === 0) {
      throw new Error("Audit no encontrado");
    }
    return res.rows[0];
  } catch (err) {
    console.error("Error obteniendo audit:", err.message);
    throw err;
  }
});

ipcMain.handle("delete-audit", async (event, id) => {
  return runWithRetry(
    async () => {
      const query = "DELETE FROM audits WHERE id = $1";
      try {
        const res = await pool.query(query, [id]);
        return { deleted: res.rowCount > 0 };
      } catch (err) {
        console.error("Error eliminando audit:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("edit-audit", async (event, id, audit) => {
  return runWithRetry(
    async () => {
      const {
        titleName,
        submissionIteration,
        generation,
        testDate,
        nonCFRIssuesLogged,
        cfrIssuesLogged,
        totalCFRMissed,
        lead,
        testers,
        actionItems,
        bugQualityTracking,
      } = audit;

      const query = `
        UPDATE audits SET
          titleName = $1,
          submissionIteration = $2,
          generation = $3,
          testDate = $4,
          nonCFRIssuesLogged = $5,
          cfrIssuesLogged = $6,
          totalCFRMissed = $7,
          lead = $8,
          testers = $9,
          actionItems = $10,
          bugQualityTracking = $11
        WHERE id = $12
      `;
      const values = [
        titleName,
        submissionIteration,
        generation,
        testDate,
        nonCFRIssuesLogged,
        cfrIssuesLogged,
        totalCFRMissed,
        lead,
        testers,
        actionItems,
        bugQualityTracking,
        id,
      ];

      try {
        const res = await pool.query(query, values);
        return { changes: res.rowCount };
      } catch (err) {
        console.error("Error editando audit:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

// ==================== IPC TICKETS ====================

ipcMain.handle("addTicket", async (event, ticket) => {
  return runWithRetry(
    async () => {
      const { name, category, description, priority, status, date, username } =
        ticket;
      const query = `
        INSERT INTO tickets (name, category, description, priority, status, date, username)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
      `;
      const values = [
        name,
        category,
        description,
        priority,
        status,
        date,
        username,
      ];
      try {
        const res = await pool.query(query, values);
        return { id: res.rows[0].id };
      } catch (err) {
        console.error("Error agregando ticket:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("get-tickets", async () => {
  try {
    const res = await pool.query("SELECT * FROM tickets");
    return res.rows;
  } catch (err) {
    console.error("Error obteniendo tickets:", err.message);
    throw err;
  }
});

ipcMain.handle("delete-ticket", async (event, id) => {
  return runWithRetry(
    async () => {
      const query = "DELETE FROM tickets WHERE id = $1";
      try {
        const res = await pool.query(query, [id]);
        return { deleted: res.rowCount > 0 };
      } catch (err) {
        console.error("Error eliminando ticket:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("update-ticket-status", async (event, ticketId, newStatus) => {
  return runWithRetry(
    async () => {
      const query = "UPDATE tickets SET status = $1 WHERE id = $2";
      try {
        const res = await pool.query(query, [newStatus, ticketId]);
        return { success: res.rowCount > 0 };
      } catch (err) {
        console.error("Error actualizando estado de ticket:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

// ==================== IPC Bugpedia ====================

ipcMain.handle("get-issues", async () => {
  try {
    const res = await pool.query("SELECT * FROM issues");
    return res.rows;
  } catch (err) {
    console.error("Error obteniendo issues:", err.message);
    throw err;
  }
});

ipcMain.handle("search-issues", async (event, searchQuery) => {
  try {
    const query = `
      SELECT * FROM issues
      WHERE name ILIKE $1 OR observedBehavior ILIKE $1 OR tags ILIKE $1
    `;
    const param = `%${searchQuery}%`;
    const res = await pool.query(query, [param, param, param]);
    return res.rows;
  } catch (err) {
    console.error("Error buscando issues:", err.message);
    throw err;
  }
});

ipcMain.handle("addIssue", async (event, issue) => {
  return runWithRetry(
    async () => {
      const query = `
        INSERT INTO issues (
          name, date, observedBehavior, reproductionSteps, expectedBehavior, 
          notes, bqScore, tags, xr, scenario, username
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id
      `;
      const values = [
        issue.name,
        issue.date,
        issue.observedBehavior,
        issue.reproductionSteps,
        issue.expectedBehavior,
        issue.notes,
        issue.bqScore,
        issue.tags,
        issue.xr,
        issue.scenario,
        issue.username,
      ];
      try {
        const res = await pool.query(query, values);
        return { id: res.rows[0].id };
      } catch (err) {
        console.error("Error agregando issue:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

// ==================== IPC SGC ====================

ipcMain.handle("save-data", async (event, formData) => {
  return runWithRetry(
    async () => {
      const query = `
        INSERT INTO data (
          date, position, email, gamertag, title_name, title_version, 
          submission_iteration, progress, options, publisher_accounts, 
          publisher_password, username
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id
      `;
      const values = [
        formData.date,
        formData.position,
        formData.email,
        formData.gamertag,
        formData.title_name,
        formData.title_version,
        formData.submission_iteration,
        formData.progress,
        formData.options,
        formData.publisher_accounts,
        formData.publisher_password,
        formData.username,
      ];
      try {
        const res = await pool.query(query, values);
        return { success: true, id: res.rows[0].id };
      } catch (err) {
        console.error("Error guardando datos:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("load-all-data", async () => {
  try {
    const res = await pool.query("SELECT * FROM data");
    return res.rows;
  } catch (err) {
    console.error("Error cargando datos:", err.message);
    throw err;
  }
});

ipcMain.handle("load-data-by-id", async (event, id) => {
  try {
    const query = "SELECT * FROM data WHERE id = $1";
    const res = await pool.query(query, [id]);
    return res.rows[0];
  } catch (err) {
    console.error("Error cargando datos por ID:", err.message);
    throw err;
  }
});

ipcMain.handle("edit-data", async (event, id, formData) => {
  return runWithRetry(
    async () => {
      const query = `
        UPDATE data SET
          date = $1, position = $2, email = $3, gamertag = $4, 
          title_name = $5, title_version = $6, submission_iteration = $7, 
          progress = $8, options = $9, publisher_accounts = $10, 
          publisher_password = $11, username = $12
        WHERE id = $13
      `;
      const values = [
        formData.date,
        formData.position,
        formData.email,
        formData.gamertag,
        formData.title_name,
        formData.title_version,
        formData.submission_iteration,
        formData.progress,
        formData.options,
        formData.publisher_accounts,
        formData.publisher_password,
        formData.username,
        id,
      ];
      try {
        const res = await pool.query(query, values);
        return { success: res.rowCount > 0, changes: res.rowCount };
      } catch (err) {
        console.error("Error editando datos:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("delete-data", async (event, id) => {
  return runWithRetry(
    async () => {
      const query = "DELETE FROM data WHERE id = $1";
      try {
        const res = await pool.query(query, [id]);
        return { success: res.rowCount > 0, changes: res.rowCount };
      } catch (err) {
        console.error("Error eliminando datos:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

// ==================== IPC Inventory ====================

ipcMain.handle("get-accounts", async () => {
  try {
    const res = await pool.query("SELECT * FROM accounts");
    return res.rows;
  } catch (err) {
    console.error("Error obteniendo cuentas:", err.message);
    throw err;
  }
});

ipcMain.handle("get-hardware", async () => {
  try {
    const res = await pool.query("SELECT * FROM hardware");
    return res.rows;
  } catch (err) {
    console.error("Error obteniendo hardware:", err.message);
    throw err;
  }
});

ipcMain.handle("add-account", async (event, account) => {
  return runWithRetry(
    async () => {
      const {
        state,
        email,
        position,
        gamertag,
        sandbox,
        subscription,
        location,
        notes,
        username,
      } = account;
      const query = `
        INSERT INTO accounts (
          state, email, position, gamertag, sandbox, subscription, 
          location, notes, username
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
      `;
      const values = [
        state,
        email,
        position,
        gamertag,
        sandbox,
        subscription,
        location,
        notes,
        username,
      ];
      try {
        const res = await pool.query(query, values);
        return { id: res.rows[0].id };
      } catch (err) {
        console.error("Error agregando cuenta:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("edit-account", async (event, account) => {
  return runWithRetry(
    async () => {
      const {
        id,
        state,
        email,
        position,
        gamertag,
        sandbox,
        subscription,
        location,
        notes,
        username,
      } = account;
      const query = `
        UPDATE accounts SET
          state = $1, email = $2, position = $3, gamertag = $4, sandbox = $5, 
          subscription = $6, location = $7, notes = $8, username = $9
        WHERE id = $10
      `;
      const values = [
        state,
        email,
        position,
        gamertag,
        sandbox,
        subscription,
        location,
        notes,
        username,
        id,
      ];
      try {
        const res = await pool.query(query, values);
        return { changes: res.rowCount };
      } catch (err) {
        console.error("Error editando cuenta:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("delete-account", async (event, id) => {
  return runWithRetry(
    async () => {
      const query = "DELETE FROM accounts WHERE id = $1";
      try {
        const res = await pool.query(query, [id]);
        return { deleted: res.rowCount > 0 };
      } catch (err) {
        console.error("Error eliminando cuenta:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("add-hardware", async (event, hardware) => {
  const {
    serialnumber,
    consoleid,
    xboxliveid,
    assetowner,
    projectowner,
    type,
    classification,
    assettag,
    location,
    status,
    owner,
    username,
  } = hardware;

  const query = `
    INSERT INTO hardware (
      serialnumber, consoleid, xboxliveid, assetowner, projectowner, 
      type, classification, assettag, location, status, owner, username
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id
  `;

  const values = [
    serialnumber,
    consoleid,
    xboxliveid,
    assetowner,
    projectowner,
    type,
    classification,
    assettag,
    location,
    status,
    owner,
    username,
  ];

  try {
    const res = await pool.query(query, values);
    console.log("Inserción exitosa:", res.rows[0]);
    return res.rows[0];
  } catch (err) {
    console.error("Error al insertar hardware:", err.message);
    throw err;
  }
});

ipcMain.handle("edit-hardware", async (event, hardware) => {
  return runWithRetry(
    async () => {
      const {
        id,
        serialnumber,
        consoleId,
        xboxLiveId,
        assetOwner,
        projectOwner,
        type,
        classification,
        assetTag,
        location,
        status,
        owner,
        username,
      } = hardware;

      const query = `
        UPDATE hardware SET
          serialnumber = $1, consoleid = $2, xboxliveid = $3, assetowner = $4, 
          projectowner = $5, type = $6, classification = $7, assettag = $8, 
          location = $9, status = $10, owner = $11, username = $12
        WHERE id = $13
      `;
      const values = [
        serialnumber,
        consoleId,
        xboxLiveId,
        assetOwner,
        projectOwner,
        type,
        classification,
        assetTag,
        location,
        status,
        owner,
        username,
        id, // Usamos id como clave
      ];

      try {
        const res = await pool.query(query, values);
        return { changes: res.rowCount };
      } catch (err) {
        console.error("Error editando hardware:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("delete-hardware", async (event, id) => {
  return runWithRetry(
    async () => {
      const query = "DELETE FROM hardware WHERE id = $1"; // Usamos id
      try {
        const res = await pool.query(query, [id]);
        return { deleted: res.rowCount > 0 };
      } catch (err) {
        console.error("Error eliminando hardware:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

// ==================== IPC Tracker ====================

ipcMain.handle("get-trackers", async () => {
  try {
    const res = await pool.query("SELECT * FROM trackers");
    return res.rows.map((row) => ({
      ...row,
      testcases: row.testcases || [],
      invitesjoinsdata: row.invitesjoinsdata || [],
      crashlogs: row.crashlogs || [],
    }));
  } catch (err) {
    console.error("Error obteniendo trackers:", err.message);
    throw err;
  }
});

function generateUniqueId() {
  return Date.now().toString();
}

ipcMain.handle("add-tracker", async (event, tracker) => {
  return runWithRetry(
    async () => {
      const id = generateUniqueId();
      const {
        username,
        titlename,
        leadname,
        teststartdate,
        testenddate,
        sandboxids,
        recoveryversion,
        binaryid,
        skuidentifier,
        xboxversion,
        simplifiedusermodel,
        windowsversion,
        supportedplatforms,
        testmodel,
        testcases,
        progress,
        completedon,
        crashlogs,
        invitesjoinsdata,
      } = tracker;

      console.log("Datos recibidos para agregar:", tracker);

      // Validar que testcases sea un array
      if (!Array.isArray(testcases)) {
        throw new Error("El campo 'testcases' debe ser un array.");
      }

      // Validar cada testCase
      testcases.forEach((tc, index) => {
        if (
          typeof tc.id !== "string" ||
          typeof tc.name !== "string" ||
          typeof tc.status !== "string" ||
          typeof tc.testerName !== "string" ||
          typeof tc.comment !== "string" ||
          typeof tc.posKey !== "string"
        ) {
          throw new Error(
            `El testCase en el índice ${index} tiene campos inválidos.`
          );
        }
      });

      // Validar JSON
      try {
        console.log("Validando JSON...");
        JSON.stringify(testcases);
        JSON.stringify(crashlogs);
        JSON.stringify(invitesjoinsdata);
        console.log("Validación de JSON exitosa.");
      } catch (err) {
        throw new Error("Campos JSON malformados.");
      }

      // Agregar logs detallados
      console.log("testcases como JSON:", JSON.stringify(testcases));
      console.log("crashlogs como JSON:", JSON.stringify(crashlogs));
      console.log(
        "invitesjoinsdata como JSON:",
        JSON.stringify(invitesjoinsdata)
      );

      const query = `
  INSERT INTO trackers (
    id, username, titlename, leadname, teststartdate, testenddate, 
    sandboxids, recoveryversion, binaryid, skuidentifier, xboxversion, 
    simplifiedusermodel, windowsversion, supportedplatforms, testmodel, 
    testcases, progress, completedon, invitesjoinsdata, crashlogs
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb, $17, $18, $19::jsonb, $20::jsonb)
  RETURNING id
`;
      const values = [
        id,
        username,
        titlename,
        leadname,
        teststartdate,
        testenddate,
        sandboxids,
        recoveryversion,
        binaryid,
        skuidentifier,
        xboxversion,
        simplifiedusermodel,
        windowsversion,
        supportedplatforms,
        testmodel,
        JSON.stringify(testcases), // Serializar manualmente
        progress,
        completedon || null,
        JSON.stringify(invitesjoinsdata) || "[]",
        JSON.stringify(crashlogs) || "[]",
      ];

      try {
        console.log(
          "Preparando para ejecutar la consulta SQL con los siguientes valores:"
        );
        console.log("Values:", values);
        const res = await pool.query(query, values);
        tracker.id = res.rows[0].id;
        console.log("Tracker agregado exitosamente:", tracker);
        return tracker;
      } catch (err) {
        console.error("Error agregando tracker:", err.message);
        console.error("Contenido de los campos JSON:");
        console.error("testcases:", JSON.stringify(testcases));
        console.error("crashlogs:", JSON.stringify(crashlogs));
        console.error("invitesjoinsdata:", JSON.stringify(invitesjoinsdata));
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("update-tracker", async (event, updatedTracker) => {
  return runWithRetry(
    async () => {
      console.log("Datos recibidos para actualizar:", updatedTracker);

      const {
        id,
        username,
        titlename,
        leadname,
        teststartdate,
        testenddate,
        sandboxids,
        recoveryversion,
        binaryid,
        skuidentifier,
        xboxversion,
        simplifiedusermodel,
        windowsversion,
        supportedplatforms,
        testmodel,
        testcases,
        progress,
        completedon,
        crashlogs,
        invitesjoinsdata,
      } = updatedTracker;

      console.log("Tipo de testcases:", typeof testcases);
      console.log("Tipo de crashlogs:", typeof crashlogs);
      console.log("Tipo de invitesjoinsdata:", typeof invitesjoinsdata);

      console.log("Contenido de testcases:", JSON.stringify(testcases));
      console.log("Contenido de crashlogs:", JSON.stringify(crashlogs));
      console.log(
        "Contenido de invitesjoinsdata:",
        JSON.stringify(invitesjoinsdata)
      );

      // Validar que testcases sea un array
      if (!Array.isArray(testcases)) {
        throw new Error("El campo 'testcases' debe ser un array.");
      }

      // Validar cada testCase
      testcases.forEach((tc, index) => {
        if (
          typeof tc.id !== "string" ||
          typeof tc.name !== "string" ||
          typeof tc.status !== "string" ||
          typeof tc.testerName !== "string" ||
          typeof tc.comment !== "string" ||
          typeof tc.posKey !== "string"
        ) {
          throw new Error(
            `El testCase en el índice ${index} tiene campos inválidos.`
          );
        }
      });

      // Validar que crashlogs e invitesjoinsdata sean arrays
      if (!Array.isArray(crashlogs)) {
        throw new Error("El campo 'crashlogs' debe ser un array.");
      }

      if (!Array.isArray(invitesjoinsdata)) {
        throw new Error("El campo 'invitesjoinsdata' debe ser un array.");
      }

      // Validar JSON
      try {
        console.log("Validando JSON...");
        JSON.stringify(testcases);
        JSON.stringify(crashlogs);
        JSON.stringify(invitesjoinsdata);
        console.log("Validación de JSON exitosa.");
      } catch (err) {
        throw new Error("Campos JSON malformados.");
      }

      // Agregar logs detallados antes de la consulta
      console.log(
        "Preparando para actualizar el tracker con los siguientes valores:"
      );
      console.log("ID del Tracker:", id);
      console.log("Username:", username);
      console.log("Title Name:", titlename);
      console.log("Lead Name:", leadname);
      console.log("Test Start Date:", teststartdate);
      console.log("Test End Date:", testenddate);
      console.log("Sandbox IDs:", sandboxids);
      console.log("Recovery Version:", recoveryversion);
      console.log("Binary ID:", binaryid);
      console.log("SKU Identifier:", skuidentifier);
      console.log("Xbox Version:", xboxversion);
      console.log("Simplified User Model:", simplifiedusermodel);
      console.log("Windows Version:", windowsversion);
      console.log("Supported Platforms:", supportedplatforms);
      console.log("Test Model:", testmodel);
      console.log("Test Cases:", JSON.stringify(testcases));
      console.log("Progress:", progress);
      console.log("Completed On:", completedon);
      console.log("Invites & Joins Data:", JSON.stringify(invitesjoinsdata));
      console.log("Crash Logs:", JSON.stringify(crashlogs));

      const query = `
        UPDATE trackers SET
          username = $1,
          titlename = $2,
          leadname = $3,
          teststartdate = $4,
          testenddate = $5,
          sandboxids = $6,
          recoveryversion = $7,
          binaryid = $8,
          skuidentifier = $9,
          xboxversion = $10,
          simplifiedusermodel = $11,
          windowsversion = $12,
          supportedplatforms = $13,
          testmodel = $14,
          testcases = $15::jsonb,
          progress = $16,
          completedon = $17,
          invitesjoinsdata = $18::jsonb,
          crashlogs = $19::jsonb
        WHERE id = $20
      `;

      const values = [
        username, // $1
        titlename, // $2
        leadname, // $3
        teststartdate, // $4
        testenddate, // $5
        sandboxids, // $6
        recoveryversion, // $7
        binaryid, // $8
        skuidentifier, // $9
        xboxversion, // $10
        simplifiedusermodel, // $11
        windowsversion, // $12
        supportedplatforms, // $13
        testmodel, // $14
        JSON.stringify(testcases), // $15: JSONB
        progress, // $16
        completedon || null, // $17
        JSON.stringify(invitesjoinsdata) || "[]", // $18: JSONB
        JSON.stringify(crashlogs) || "[]", // $19: JSONB
        id, // $20
      ];

      try {
        console.log("Ejecutando la consulta SQL para actualizar el tracker...");
        console.log("Consulta SQL:", query);
        console.log("Valores:", values);

        const res = await pool.query(query, values);
        console.log("Actualización exitosa, filas afectadas:", res.rowCount);
        return { changes: res.rowCount };
      } catch (err) {
        console.error("Error actualizando tracker:", err.message);
        console.error("Contenido de los campos JSON:");
        console.error("Test Cases:", JSON.stringify(testcases));
        console.error("Crash Logs:", JSON.stringify(crashlogs));
        console.error(
          "Invites & Joins Data:",
          JSON.stringify(invitesjoinsdata)
        );
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("delete-tracker", async (event, id) => {
  return runWithRetry(
    async () => {
      const query = "DELETE FROM trackers WHERE id = $1";
      try {
        const res = await pool.query(query, [id]);
        return { deleted: res.rowCount > 0 };
      } catch (err) {
        console.error("Error eliminando tracker:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

// ==================== IPC Dashboard ====================

ipcMain.handle("get-audits", async () => {
  try {
    const res = await pool.query("SELECT * FROM audits");
    return res.rows;
  } catch (err) {
    console.error("Error obteniendo audits:", err.message);
    throw err;
  }
});

ipcMain.handle("get-updates", async () => {
  try {
    const res = await pool.query(
      "SELECT * FROM updates ORDER BY id DESC LIMIT 5"
    );
    return res.rows;
  } catch (err) {
    console.error("Error obteniendo updates:", err.message);
    throw err;
  }
});

// Obtener actividades recientes de diferentes tablas
ipcMain.handle("get-recent-activities", async () => {
  try {
    const query = `
      SELECT 'Issue' AS type, name AS description, date FROM issues
      UNION ALL
      SELECT 'Audit' AS type, titleName AS description, testDate AS date FROM audits
      UNION ALL
      SELECT 'Review' AS type, testerName AS description, date FROM reviews
      ORDER BY date DESC LIMIT 5
    `;
    const res = await pool.query(query);
    return res.rows;
  } catch (err) {
    console.error("Error obteniendo actividades recientes:", err.message);
    throw err;
  }
});

// ==================== IPC Excel ====================

ipcMain.handle("load-excel", async () => {
  try {
    let filePath;
    if (app.isPackaged) {
      // En producción, usa process.resourcesPath para acceder a los recursos empaquetados
      filePath = path.join(process.resourcesPath, "public", "fma.xlsx");
    } else {
      // En desarrollo, usa __dirname para acceder a la carpeta public
      filePath = path.join(__dirname, "..", "public", "fma.xlsx");
    }

    console.log(`Intentando acceder al archivo Excel en: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo no existe en la ruta: ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log("Excel cargado exitosamente");
    return { success: true, data: json };
  } catch (error) {
    console.error("Error al cargar el archivo Excel:", error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("load-console-excel", async () => {
  try {
    let filePath;
    if (app.isPackaged) {
      filePath = path.join(process.resourcesPath, "public", "consolas.xlsx");
    } else {
      filePath = path.join(__dirname, "..", "public", "consolas.xlsx");
    }

    console.log(`Intentando acceder al archivo Excel en: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo no existe en la ruta: ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    console.log("Datos brutos de la hoja de Excel:", worksheet);

    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (json.length === 0) {
      console.error("No se encontraron datos en el archivo Excel");
    } else {
      console.log("Excel cargado exitosamente");
    }

    return { success: true, data: json };
  } catch (error) {
    console.error("Error al cargar el archivo Excel:", error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("load-comments-excel", async () => {
  try {
    let filePath;
    if (app.isPackaged) {
      filePath = path.join(process.resourcesPath, "public", "comments.xlsx");
    } else {
      filePath = path.join(__dirname, "..", "public", "comments.xlsx");
    }

    console.log(`Intentando acceder al archivo Excel en: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo no existe en la ruta: ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    console.log("Datos brutos de la hoja de Excel:", worksheet);

    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (json.length === 0) {
      console.error("No se encontraron datos en el archivo Excel");
    } else {
      console.log("Excel cargado exitosamente");
    }

    return { success: true, data: json };
  } catch (error) {
    console.error("Error al cargar el archivo Excel:", error.message);
    return { success: false, error: error.message };
  }
});

// ==================== IPC Purchases ====================

ipcMain.handle("get-purchases", async () => {
  try {
    const res = await pool.query("SELECT * FROM purchases");
    return res.rows;
  } catch (err) {
    console.error("Error obteniendo compras:", err.message);
    throw err;
  }
});

ipcMain.handle("add-purchase", async (event, purchase) => {
  return runWithRetry(
    async () => {
      const { title, date, price, account, reason } = purchase;
      const query = `
        INSERT INTO purchases (title, date, price, account, reason)
        VALUES ($1, $2, $3, $4, $5) RETURNING id
      `;
      const values = [title, date, price, account, reason];
      try {
        const res = await pool.query(query, values);
        return { success: true, id: res.rows[0].id };
      } catch (err) {
        console.error("Error agregando compra:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("delete-purchase", async (event, id) => {
  return runWithRetry(
    async () => {
      const query = "DELETE FROM purchases WHERE id = $1";
      try {
        const res = await pool.query(query, [id]);
        return { success: res.rowCount > 0 };
      } catch (err) {
        console.error("Error eliminando compra:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("update-purchase", async (event, id, updatedFields) => {
  return runWithRetry(
    async () => {
      const { title, date, price, account, reason } = updatedFields;
      const query = `
        UPDATE purchases SET
          title = $1, date = $2, price = $3, account = $4, reason = $5
        WHERE id = $6
      `;
      const values = [title, date, price, account, reason, id];
      try {
        const res = await pool.query(query, values);
        return { success: res.rowCount > 0 };
      } catch (err) {
        console.error("Error actualizando compra:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("search-purchases", async (event, queryText) => {
  try {
    const query = `
      SELECT * FROM purchases
      WHERE title ILIKE $1 OR account ILIKE $1 OR reason ILIKE $1
    `;
    const param = `%${queryText}%`;
    const res = await pool.query(query, [param, param, param]);
    return res.rows;
  } catch (err) {
    console.error("Error buscando compras:", err.message);
    throw err;
  }
});

// ==================== IPC Console Prep ====================

// ======= Teams =======
ipcMain.handle("get-teams", async () => {
  try {
    const res = await pool.query("SELECT * FROM teams");
    return res.rows;
  } catch (err) {
    console.error("Error obteniendo equipos:", err.message);
    throw err;
  }
});

ipcMain.handle("add-team", async (event, team) => {
  return runWithRetry(
    async () => {
      const { name, category } = team;
      const query = `
        INSERT INTO teams (name, category)
        VALUES ($1, $2) RETURNING id
      `;
      const values = [name, category];
      try {
        const res = await pool.query(query, values);
        return { id: res.rows[0].id, name, category };
      } catch (err) {
        console.error("Error agregando equipo:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("update-team", async (event, team) => {
  return runWithRetry(
    async () => {
      const { id, name, category } = team;
      const query = `
        UPDATE teams SET
          name = $1, category = $2
        WHERE id = $3
      `;
      const values = [name, category, id];
      try {
        const res = await pool.query(query, values);
        return { id, name, category, changes: res.rowCount };
      } catch (err) {
        console.error("Error actualizando equipo:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("delete-team", async (event, teamId) => {
  return runWithRetry(
    async () => {
      const query = "DELETE FROM teams WHERE id = $1";
      try {
        const res = await pool.query(query, [teamId]);
        return { deleted: res.rowCount > 0 };
      } catch (err) {
        console.error("Error eliminando equipo:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

// ======= Personnel =======
ipcMain.handle("get-personnel", async () => {
  try {
    const res = await pool.query("SELECT * FROM personnel");
    return res.rows;
  } catch (err) {
    console.error("Error obteniendo personal:", err.message);
    throw err;
  }
});

ipcMain.handle("add-personnel", async (event, person) => {
  return runWithRetry(
    async () => {
      const { name, role } = person;
      const query = `
        INSERT INTO personnel (name, role)
        VALUES ($1, $2) RETURNING id
      `;
      const values = [name, role];
      try {
        const res = await pool.query(query, values);
        return { id: res.rows[0].id, name, role };
      } catch (err) {
        console.error("Error agregando personal:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("update-personnel", async (event, person) => {
  return runWithRetry(
    async () => {
      const { id, name, role } = person;
      const query = `
        UPDATE personnel SET
          name = $1, role = $2
        WHERE id = $3
      `;
      const values = [name, role, id];
      try {
        const res = await pool.query(query, values);
        return { id, name, role, changes: res.rowCount };
      } catch (err) {
        console.error("Error actualizando personal:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("delete-personnel", async (event, personId) => {
  return runWithRetry(
    async () => {
      const query = "DELETE FROM personnel WHERE id = $1";
      try {
        const res = await pool.query(query, [personId]);
        return { deleted: res.rowCount > 0 };
      } catch (err) {
        console.error("Error eliminando personal:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

// ======= Config History =======
ipcMain.handle("get-config-history", async () => {
  try {
    const res = await pool.query("SELECT * FROM config_history");
    return res.rows;
  } catch (err) {
    console.error("Error obteniendo config_history:", err.message);
    throw err;
  }
});

ipcMain.handle("delete-config-history", async (event, date) => {
  return runWithRetry(
    async () => {
      const query = "DELETE FROM config_history WHERE date = $1";
      try {
        const res = await pool.query(query, [date]);
        return { deleted: res.rowCount > 0 };
      } catch (err) {
        console.error("Error eliminando config_history:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("update-config-history", async (event, historyEntry) => {
  return runWithRetry(
    async () => {
      const { id, date, data } = historyEntry;
      const query = `
        UPDATE config_history SET
          date = $1, data = $2
        WHERE id = $3
      `;
      const values = [date, JSON.stringify(data), id];
      try {
        const res = await pool.query(query, values);
        return { updated: res.rowCount > 0 };
      } catch (err) {
        console.error("Error actualizando config_history:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("add-config-history", async (event, historyEntry) => {
  return runWithRetry(
    async () => {
      const { date, data } = historyEntry;
      const query = `
        INSERT INTO config_history (date, data)
        VALUES ($1, $2) RETURNING id
      `;
      const values = [date, JSON.stringify(data)];
      try {
        const res = await pool.query(query, values);
        return { id: res.rows[0].id, date, data };
      } catch (err) {
        console.error("Error agregando config_history:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

// ======= Assignments =======
ipcMain.handle("get-assignments", async () => {
  try {
    const res = await pool.query("SELECT * FROM assignments");
    return res.rows;
  } catch (err) {
    console.error("Error obteniendo assignments:", err.message);
    throw err;
  }
});

ipcMain.handle("add-assignment", async (event, assignment) => {
  return runWithRetry(
    async () => {
      const { team_id, personnel_id, project, date } = assignment;
      const query = `
        INSERT INTO assignments (team_id, personnel_id, project, date)
        VALUES ($1, $2, $3, $4) RETURNING id
      `;
      const values = [team_id, personnel_id, project, date];
      try {
        const res = await pool.query(query, values);
        return {
          id: res.rows[0].id,
          team_id,
          personnel_id,
          project,
          date,
        };
      } catch (err) {
        console.error("Error agregando assignment:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("update-assignment", async (event, assignment) => {
  return runWithRetry(
    async () => {
      const { id, team_id, personnel_id, project, date } = assignment;
      const query = `
        UPDATE assignments SET
          team_id = $1, personnel_id = $2, project = $3, date = $4
        WHERE id = $5
      `;
      const values = [team_id, personnel_id, project, date, id];
      try {
        const res = await pool.query(query, values);
        return {
          id,
          team_id,
          personnel_id,
          project,
          date,
          changes: res.rowCount,
        };
      } catch (err) {
        console.error("Error actualizando assignment:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("delete-assignment", async (event, assignmentId) => {
  return runWithRetry(
    async () => {
      const query = "DELETE FROM assignments WHERE id = $1";
      try {
        const res = await pool.query(query, [assignmentId]);
        return { deleted: res.rowCount > 0 };
      } catch (err) {
        console.error("Error eliminando assignment:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

// ======= WorkDays =======
ipcMain.handle("get-workdays", async () => {
  try {
    const res = await pool.query("SELECT * FROM workdays");
    return res.rows;
  } catch (err) {
    console.error("Error obteniendo workdays:", err.message);
    throw err;
  }
});

ipcMain.handle("add-workday", async (event, workday) => {
  return runWithRetry(
    async () => {
      const { personnel_id, work_days } = workday;
      const query = `
        INSERT INTO workdays (personnel_id, work_days)
        VALUES ($1, $2) RETURNING id
      `;
      const values = [personnel_id, work_days];
      try {
        const res = await pool.query(query, values);
        return { id: res.rows[0].id, personnel_id, work_days };
      } catch (err) {
        console.error("Error agregando workday:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("update-workday", async (event, workday) => {
  return runWithRetry(
    async () => {
      const { id, personnel_id, work_days } = workday;
      const query = `
        UPDATE workdays SET
          personnel_id = $1, work_days = $2
        WHERE id = $3
      `;
      const values = [personnel_id, work_days, id];
      try {
        const res = await pool.query(query, values);
        return { id, personnel_id, work_days, changes: res.rowCount };
      } catch (err) {
        console.error("Error actualizando workday:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("delete-workday", async (event, workdayId) => {
  return runWithRetry(
    async () => {
      const query = "DELETE FROM workdays WHERE id = $1";
      try {
        const res = await pool.query(query, [workdayId]);
        return { deleted: res.rowCount > 0 };
      } catch (err) {
        console.error("Error eliminando workday:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

// ======= Absences =======
ipcMain.handle("get-absences", async () => {
  try {
    const res = await pool.query("SELECT * FROM absences");
    return res.rows;
  } catch (err) {
    console.error("Error obteniendo absences:", err.message);
    throw err;
  }
});

ipcMain.handle("add-absence", async (event, absence) => {
  return runWithRetry(
    async () => {
      const { personnel_id, date, absent } = absence;
      const query = `
        INSERT INTO absences (personnel_id, date, absent)
        VALUES ($1, $2, $3) RETURNING id
      `;
      const values = [personnel_id, date, absent];
      try {
        const res = await pool.query(query, values);
        return { id: res.rows[0].id, personnel_id, date, absent };
      } catch (err) {
        console.error("Error agregando absence:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("update-absence", async (event, absence) => {
  return runWithRetry(
    async () => {
      const { id, personnel_id, date, absent } = absence;
      const query = `
        UPDATE absences SET
          personnel_id = $1, date = $2, absent = $3
        WHERE id = $4
      `;
      const values = [personnel_id, date, absent, id];
      try {
        const res = await pool.query(query, values);
        return { id, personnel_id, date, absent, changes: res.rowCount };
      } catch (err) {
        console.error("Error actualizando absence:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

ipcMain.handle("delete-absence", async (event, absenceId) => {
  return runWithRetry(
    async () => {
      const query = "DELETE FROM absences WHERE id = $1";
      try {
        const res = await pool.query(query, [absenceId]);
        return { deleted: res.rowCount > 0 };
      } catch (err) {
        console.error("Error eliminando absence:", err.message);
        throw err;
      }
    },
    3,
    2000
  );
});

// ==================== Inicializar Equipos ====================

const defaultTeams = [
  { name: "Equipo 1", category: "Xbox" },
  { name: "Equipo 2", category: "Xbox" },
  { name: "Equipo 3", category: "Xbox" },
  { name: "Equipo 4", category: "Xbox" },
  { name: "Equipo 5", category: "Xbox" },
  { name: "Equipo 6", category: "Xbox" },
  { name: "Equipo 7", category: "Xbox" },
  { name: "Equipo 8", category: "BVT" },
  { name: "Equipo 9", category: "BVT" },
  { name: "Equipo 10", category: "W10" },
  { name: "Equipo 11", category: "W10" },
  { name: "Equipo 12", category: "Special Roles" },
];

ipcMain.handle("initialize-teams", async () => {
  return runWithRetry(
    async () => {
      try {
        const res = await pool.query("SELECT COUNT(*) FROM teams");
        const count = parseInt(res.rows[0].count, 10);

        if (count >= defaultTeams.length) {
          return { message: "Los equipos ya están inicializados." };
        }

        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const insertPromises = defaultTeams.map((team) => {
            const query = `
              INSERT INTO teams (name, category)
              VALUES ($1, $2)
            `;
            const values = [team.name, team.category];
            return client.query(query, values);
          });
          await Promise.all(insertPromises);
          await client.query("COMMIT");
          console.log("Equipos predeterminados insertados.");
          return { message: "Equipos inicializados correctamente." };
        } catch (error) {
          await client.query("ROLLBACK");
          console.error("Error inicializando equipos:", error.message);
          throw error;
        } finally {
          client.release();
        }
      } catch (error) {
        console.error("Error inicializando equipos:", error.message);
        throw error;
      }
    },
    3,
    2000
  );
});

// ==================== Fin de IPC Handlers ====================
