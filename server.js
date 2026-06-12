const express = require('express');
const app = express();
const { filseService } = require("./FileCache");
const { LongPooling, clearLoginEntries, readXLSX, Update } = require("./app").ServerApp;
const port = require("./config").port;
const cors = require('cors');
const Logger = require("./logger");
const config = require("./config");
// Middleware

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static("public"));

app.use((req, res, next) => {
    next();
});

// Routes

app.get('/', (req, res) => {
    res.sendFile("public/index.html");
});

app.get("/app/users", async (req, res) => {
    try {
        res.status(200).json(await clearLoginEntries());
    } catch (error) {
        Logger.Log("error", "Failed to retrieve users", error);
        res.status(500).json({ error: "resource not found" });
    }
});

app.get("/app/pooling/:history", async (req, res) => {
    try {
        const { history } = req.params;
        if (!history) {
            Logger.Log("error", "History parameter is missing", null);
            return res.status(400).json({ error: "History parameter is required" });
        }
        res.status(200).json(LongPooling(history));
    } catch (error) {
        Logger.Log("error", "Failed to retrieve pooling data", error);
        res.status(500).json({ error: "resource not found" });
    }
});

/**
 * Endpoint para atualizar a lista de usuários em pooling
 */
app.get("/app/update/usuarios", async (req, res) => {
    res.status(200).json(await Update.Users());
});

/**
 * Endpoint para atualizar os cadastros em pooling
*/
app.get("/app/update/cadastros", async (req, res) => {
    res.status(200).json(await Update.Contracts());
});

/**
 * Endpoint para atualizar os cadastros em pooling
*/
app.get("/app/update/dashboard", async (req, res) => {
    res.status(200).json(await Update.ProcessData());
});

// GET users
app.get('/app/auth/:role/:pass', async (req, res) => {
    let data = {};
    data = config.login;
    try {
        const { pass, role } = req.params;

        if (!role || !pass) {
            Logger.Log("error", "Role or password is missing", null);
            return res.status(400).json({ error: "Role and password are required" });
        } else if (!Object.values(data).some(user => user.role === role)) {
            Logger.Log("error", `Invalid role: ${role}`, null);
            return res.status(401).json({ error: "Invalid role" });
        } else {
            const user = data[role];
            if (user.passwd !== pass) {
                Logger.Log("error", `Invalid password for role: ${role}`, null);
                return res.status(401).json({ error: "Invalid password" });
            }
            res.status(200).json({ token: user.token, role: user.role });
        }
    } catch (error) {
        Logger.Log("error", "Failed to authenticate user", error);
        res.status(500).json({ error: "Authentication failed" });
    }
});

// #region POST - Create or update data
/**
 * Endpoint para salvar as alterações na base de contratos
 */
app.post("/app/update/save", async (req, res) => {
    res.status(200).json(await Update.Save(req.body));
});
/**
 * Endpoint para processar dados enviados pelo cliente
 * 1: recebe os dados no formato:
 * { message: "", data: { status: "", dados: [] } }
 */
app.post("/app/docs/andamento", async (req, res) => {
    try {
        const result = await readXLSX(req.body);
        res.status(200).json({ message: "Dados processados com sucesso", data: result });
    } catch (error) {
        Logger.Log("error", "Failed to process data", error);
        res.status(500).json({ error: "Failed to process data" });
    }
});

/**
 * Log an error message with optional error object
 * @param {string} level - Log level (e.g., "error", "info")
 * @param {string} message - Log message
 * @param {Error} [error] - Optional error object for detailed logging
 */
app.post("/app/error", async (req, res) => {
    try {
        const { level, message, error } = req.body;
        Logger.Log(level, message, error);
        res.status(200).json({ message: "Error logged successfully" });
    } catch (error) {
        Logger.Log("error", "Failed to log error", error);
        res.status(500).json({ error: "Failed to log error" });
    }
});
// #endregion

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});