const express = require('express');
const router = express.Router();
const { filseService } = require("./FileCache");
const { CarregarXLS, Pooling, Update } = require("./app").ServerApp;
const { clearLoginEntries } = require("./app").Utils;
const fs = require("fs").promises;
const path = require("path");
const tmpDir = require("./conf").tmpDir;

// GET - List or retrieve data
router.get('/users', async (req, res) => {
    try {
        res.status(200).json(await clearLoginEntries());
    } catch (error) {
        console.log(error);
        res.status(404).json({ error: "Resource not found" });
    }
});

router.get('/app/pooling/:history', async (req, res) => {
    const { history } = req.params;
    res.status(200).json(await Pooling(history));
});

/**
 * Endpoint para atualizar a lista de usuários em pooling
 */
router.get("/app/usuarios", async (req, res) => {
    res.status(200).json(await Update.Usuarios());
});

/**
 * Endpoint para atualizar os cadastros em pooling
*/
router.get("/app/cadastros", async (req, res) => {
    res.status(200).json(await Update.Cadastros());
});

// GET users
router.get('/auth/:role/:pass', async (req, res) => {
    let data = {};

    data = JSON.parse(await filseService.read("data/login.json", "utf-8"));

    try {
        const { pass, role } = req.params;

        if (!role || !pass) {
            return res.status(400).json({ error: "Role and password are required" });
        } else if (!Object.values(data).some(user => user.role === role)) {
            return res.status(401).json({ error: "Invalid role" });
        } else {
            const user = data[role];
            if (user.passwd !== pass) {
                return res.status(401).json({ error: "Invalid password" });
            }
            res.status(200).json({ token: user.token, role: user.role });
        }
    } catch (error) {
        console.log(error);
        res.status(404).json({ error: "Resource not found" });
    }
});

/**
 * Endpoint para 
 * 3: retorna os dados no formato:
 * { message: "", data: { status: "", dados: [] } }
 */
router.post('/docs/andamento', async (req, res) => {
    try {
        // Expecting body to contain file1 and file2 as base64 strings
        const { file1, file2 } = req.body;
        const result = await CarregarXLS(file1, file2);
        res.status(200).json({ message: "File uploaded successfully", data: result });
    } catch (error) {
        console.error("Erro ao fazer upload do arquivo:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * Endpoint para baixar uma planilha de acompanhamento
 * a partir dos dados de cadastro existentes.
 */
router.get('/zzz', async (req, res) => {
    try { } catch (error) {
        res.status(200).json({ status: "OK" });
    }
});


// POST - Log an error
router.post('/error', async (req, res) => {
    const date = Date.now();
    require("fs").writeFileSync(`data/logs/${date}.log`, JSON.stringify(req.body, false, 2));
});

module.exports = router;
