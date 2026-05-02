const XLSX = require("xlsx");
const fs = require("fs");
const { Sheet } = require("./model");
const { filseService } = require("./FileCache");
const tmpDir = require("./conf").tmpDir;

const ServerApp = {
  History: 2,
  CarregarXLS: async (rawData) => {
    try {
      const { filename, zona, data } = rawData;
      const daily = Utils.GenerateDailySecret();
      const buffer = Buffer.from(data, "binary");

      // Criar a planilha .xls:
      const filePathXls = `${tmpDir}/_xls/${daily}-${zona}.xls`;
      await filseService.write(filePathXls, buffer, null);

      // carrega a planilha
      const workbook = XLSX.readFile(filePathXls);
      // primeira aba
      const nomeAba = workbook.SheetNames[0];
      const sheet = workbook.Sheets[nomeAba];
      // usa primeira linha como cabeçalho
      const dados = XLSX.utils.sheet_to_json(sheet);
      // Verificação
      if (zona === "drop-controle") {
        // Planilha de controle pedagógico:
        if (Boolean(dados[0]["Apostila"])) {
          //
        } else {
          console.log("dados inválidos na planilha de segmentação.");
          return { status: "CONT", dados: [] }
        }
      } else if (zona === "drop-segmenta") {
        if (Boolean(dados[0]["Nome Educador"])) {
          //
        } else {
          console.log("dados inválidos na planilha de segmentação.");
          return { status: "SEGM", dados: [] }
        }
      } else {
        console.log("Zona inválida.");
        return { status: "ZONE", dados: [] }
      }
      const filePathJson = `${tmpDir}/_json/${daily}-${zona}.json`;
      await filseService.write(filePathJson, JSON.stringify(dados, false, 2), null);
      return { status: "OK", dados };
    } catch (error) {
      console.error("Erro ao carregar a planilha de andamento:", error);
    }
  },

  GravarXLS: async (rawData) => { },
  Pooling: async (history) => {
    const data = {};
    if (history < ServerApp.History) {
      data.atualizar = true;
      data.version = ServerApp.History;
    } else if (history > ServerApp.History + 100) {
      data.atualizar = true;
      data.version = ServerApp.History
    } else {
      data.atualizar = false;
    }
    return data;
  },
  Update: {
    Usuarios: async () => {
      const data = JSON.parse(await filseService.read("data/login.json", "utf-8"));
      const cleaned = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, (({ passwd, ...rest }) => rest)(v)]));
      return cleaned;
    },
    Cadastros: async () => {
      const data = JSON.parse(await filseService.read("data/cadastros.json", "utf-8"));
      return data;
    },
  }
};

const Utils = {
  generateToken: (length = 32) => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";
    for (let i = 0; i < length; i++) {
      token += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return token;
  },
  /** @description Generates a numeric secret that changes every day based on the date string */
  GenerateDailySecret: () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const x = `${day}/${month}/${year}`;
    let hash = 0;
    for (let i = 0; i < x.length; i++) {
      hash = x.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash).toString();
  },
  clearLoginEntries: async () => {
    const data = JSON.parse(await filseService.read("data/login.json", "utf-8"));
    const cleaned = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, (({ passwd, ...rest }) => rest)(v)]));
    return cleaned;
  }
};

module.exports = { ServerApp, Utils };

// EOF