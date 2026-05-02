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
 * Endpoint para carregar dados para a aplicação
 * a partir de uma planilha de acompanhamento
 * previamente criada.
 */
router.post('/docs/andamento', async (req, res) => {
    try {
        const result = await CarregarXLS(req.body);
        res.status(200).json({ message: "File uploaded successfully", data: result });
    } catch (error) {
        console.error("Erro ao fazer upload do arquivo:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * Endpoint para baixar uma planilha de andamento
 * a partir dos dados de cadastro existentes.
 */
router.get('/docs/andamento', async (req, res) => {
    try {
        const arquivo = path.join(tmpDir, "ACOMPANHAMENTO PEDAGOGICO.xlsx");
        const buffer = await fs.readFile(arquivo);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", 'attachment; filename="ACOMPANHAMENTO PEDAGOGICO.xlsx"');
        res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// POST - Create new entry
router.post('/', async (req, res) => {
    try {
        const payload = req.body;
        res.status(201).json({ message: "Created successfully", data: payload });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
