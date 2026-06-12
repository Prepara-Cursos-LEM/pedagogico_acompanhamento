const XLSX = require("xlsx");
const fs = require("fs");
const { Cadastro, Materia, Sheet } = require("./model");
const _ = require("./model");
const { filseService } = require("./FileCache");
const tmpDir = require("./conf").tmpDir;
const autoUpdate = require("./conf").autoUpdate;
const aliases = require("./conf").aliases;

const ServerApp = {
  History: 2,
  CarregarXLS: async (file1, file2) => {
    function processFile(file) {
      const buffer = Buffer.from(file, "base64");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const aba = workbook.SheetNames[0];
      const sheet = workbook.Sheets[aba];
      const dados = XLSX.utils.sheet_to_json(sheet);
      const res = { label: "", dados: [], buffer };
      if (dados[0]["Apostila"]) {
        res.label = "controle";
        res.dados = dados;
        res.buffer = buffer;
      } else if (dados[0]["Nome Educador"]) {
        res.label = "segmenta";
        res.dados = dados;
        res.buffer = buffer;
      } else {
        res.label = "erro";
        res.dados = [];
      }
      return res;
    }
    async function writeFiles(label, data) {
      const { dados, buffer } = data;
      const daily = Utils.GenerateDailySecret(Date.now(), "_").path;

      const filePathJson = `${tmpDir}/_json/${daily}-${label.trim()}.json`;
      await filseService.write(filePathJson, JSON.stringify(dados, false, 2), null);
      const filePathXls = `${tmpDir}/_xls/${daily}-${label}.xls`;
      await filseService.write(filePathXls, buffer, null);
    }
    // 
    try {
      const res1 = processFile(file1);
      const res2 = processFile(file2);

      // Determine combined status using a lookup table.
      const combo = `${res1.label}-${res2.label}`;
      const statusMap = {
        "controle-segmenta": "OK",
        "segmenta-controle": "OK",
        "erro-erro": "ERR",
        "controle-erro": "SEGM",
        "erro-segmenta": "CONT",
      };
      const status = statusMap[combo] || "ERR";

      // Successful case: write JSON and XLS files.
      if (status === "OK") {
        const res = {};
        res[res1.label] = {
          dados: res1.dados,
          buffer: res1.buffer
        }
        res[res2.label] = {
          dados: res2.dados,
          buffer: res2.buffer
        }

        await writeFiles("controle", res["controle"]);
        await writeFiles("segmenta", res["segmenta"]);
        const processed = await ServerApp.Update.ProcessarDados(res["controle"]["dados"], res["segmenta"]["dados"]);
        return { status: "OK", dados: processed };
      }

      // Other statuses return appropriate empty payloads.
      if (status === "SEGM") return { status: "SEGM", dados: [] };
      if (status === "CONT") return { status: "CONT", dados: [] };
      return { status: "ERR", dados: [] };
    } catch (error) {
      console.error("Erro ao carregar a planilha de andamento:", error);
      return { status: "ERR", dados: [] };
    }
  },
  GravarXLS: async (rawData) => { },
  Pooling: async (history) => {
    const data = {};
    if (history < ServerApp.History) {
      data.atualizar = true;
      data.version = ServerApp.History;
    } else if (history > ServerApp.History) {
      data.atualizar = true;
      data.version = ServerApp.History
    } else {
      data.atualizar = false;
    }
    return data;
  },
  Update: {
    Usuarios: async () => {
      const data = JSON.parse(await filseService.read(tmpDir + "/login.json", "utf-8"));
      const cleaned = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, (({ passwd, ...rest }) => rest)(v)]));
      return cleaned;
    },
    Cadastros: async () => {
      const ultimo = Utils.ultimoCadastro();
      const data1 = JSON.parse(await filseService.read("data/cadastros/" + ultimo, "utf-8"));
      const data2 = JSON.parse(await filseService.read("data/h", "utf-8"));
      return { cadastros: data1, atualizacoes: data2 };
    },
    ProcessarDados: async (controle = [], segmenta = []) => {
      const template = {};

      const data = [];

      // Calcular o progresso do aluno:
      const cadastros = await ServerApp.acompanhamentoPedagogico(controle, segmenta);
      // Gravar o resultado:
      const filename = `${tmpDir}/cadastros/${Utils.GenerateDailySecret(Date.now(), "_").path}.json`;
      await filseService.write(filename, JSON.stringify(cadastros, false, 2), null);
      //
      if (autoUpdate) await ServerApp._historyUpdate(true);
      return { status: "OK", dados: cadastros };
    },
  },
  // Cálculo de situação do aluno:
  async acompanhamentoPedagogico(controle = [], segmentacao = []) {

    const contratosMap = new Map();

    const hoje = new Date();

    for (const registro of controle) {

      const numeroContrato =
        Number(registro["Contrato"]) || null;

      if (!numeroContrato) {
        continue;
      }

      if (!contratosMap.has(numeroContrato)) {

        const segmentacaoRegistro =
          segmentacao.find(
            item =>
              Number(item["Contrato"]) === numeroContrato
          );

        contratosMap.set(numeroContrato, {

          "CONTRATO": numeroContrato,

          "ALUNO":
            normalizarTexto(registro["Aluno"]),

          "EDUCADOR":
            normalizarTexto(
              segmentacaoRegistro?.["Educador"]
            ),

          "INICIO-CONTRATO":
            registro["Data Inicial"] ?? null,

          "TERMINO-CONTRATO":
            registro["Data Final"] ?? null,

          "MATERIA-ATUAL": null,

          "QUANTIDADE-AGENDAMENTOS": 0,

          "PROXIMA-MATERIA": null,

          "MATERIAS-RESTANTES": 0,

          "PARCELAS-RESTANTES": 0,

          "MATERIAS": [],

          "ACOMPANHAMENTOS": []
        });
      }

      const contrato =
        contratosMap.get(numeroContrato);

      const {
        codigo,
        materia
      } = extrairMateria(
        registro["Matéria"]
      );

      const aulasMateria =
        Number(registro["Aulas"]) || 16;

      const aulasConcluidas =
        Number(
          registro["Aulas Concluídas"]
        ) || 0;

      const quantidadeAgendamentos =
        Number(
          registro["Quantidade Agendamentos"]
        ) || 0;

      const dataInicioMateria =
        excelDateToJSDate(
          registro["Data Início"]
        );

      const materiaConcluida =
        aulasConcluidas >= aulasMateria;

      const materiaNaoIniciada =
        !dataInicioMateria &&
        aulasConcluidas <= 0;

      const materiaObj = {

        "MATERIA-NOME":
          materia ?? null,

        "CODIGO":
          codigo ?? null,

        "AULAS-MATERIA":
          aulasMateria,

        "AULAS-CONCLUIDAS":
          aulasConcluidas,

        "AULAS-RESTANTES":
          Math.max(
            0,
            aulasMateria - aulasConcluidas
          ),

        "DIAS-AGENDAMENTO":
          normalizarTexto(
            registro["Dias Agendamento"]
          ),

        "HORAS-AGENDAMENTO":
          normalizarTexto(
            registro["Horas Agendamento"]
          ),

        "QUANTIDADE-AGENDAMENTOS":
          quantidadeAgendamentos,

        "DATA-INICIO":
          dataInicioMateria,

        "MATERIA-CONCLUIDA":
          materiaConcluida,

        "MATERIA-NAO-INICIADA":
          materiaNaoIniciada,

        "CODIGO-APOSTILA":
          normalizarTexto(
            registro["Apostila"]
          ),

        "ENTREGA-FISICA":
          normalizarTexto(
            registro["Entrega Física"]
          ),

        "SOLICITACAO-APOSTILA":
          null
      };

      contrato["MATERIAS"].push(materiaObj);

      // =====================================================
      // DEFINIR MATÉRIA ATUAL
      // =====================================================

      const ehMateriaAtiva =
        !materiaConcluida &&
        !materiaNaoIniciada;

      if (
        !contrato["MATERIA-ATUAL"] &&
        ehMateriaAtiva
      ) {
        contrato["MATERIA-ATUAL"] = materia;
      }

      // =====================================================
      // AGENDAMENTOS
      // =====================================================

      contrato["QUANTIDADE-AGENDAMENTOS"] +=
        quantidadeAgendamentos;

      // =====================================================
      // PRÓXIMA MATÉRIA
      // =====================================================

      if (
        registro["Próxima Matéria"]
      ) {
        contrato["PROXIMA-MATERIA"] =
          normalizarTexto(
            registro["Próxima Matéria"]
          );
      }

      // =====================================================
      // MATÉRIAS RESTANTES
      // =====================================================

      const materiasRestantes =
        Number(
          registro["Quantidade Matérias Restantes"]
        ) || 0;

      contrato["MATERIAS-RESTANTES"] =
        Math.max(
          contrato["MATERIAS-RESTANTES"],
          materiasRestantes
        );

      // =====================================================
      // PARCELAS RESTANTES
      // =====================================================

      const parcelasRestantes =
        Number(
          registro["Recebimentos Futuros"]
        ) || 0;

      contrato["PARCELAS-RESTANTES"] =
        Math.max(
          contrato["PARCELAS-RESTANTES"],
          parcelasRestantes
        );
    }

    // =========================================================
    // ACOMPANHAMENTOS
    // =========================================================

    for (const contrato of contratosMap.values()) {

      const dataInicial =
        excelDateToJSDate(
          contrato["INICIO-CONTRATO"]
        );

      const dataFinal =
        excelDateToJSDate(
          contrato["TERMINO-CONTRATO"]
        );

      // =====================================================
      // VALIDAÇÃO DE DATAS
      // =====================================================

      const datasValidas =
        dataInicial instanceof Date &&
        !isNaN(dataInicial) &&
        dataFinal instanceof Date &&
        !isNaN(dataFinal) &&
        dataFinal >= dataInicial;

      // =====================================================
      // MATÉRIAS REALMENTE COMPUTÁVEIS
      // =====================================================

      const materiasAtivas =
        contrato["MATERIAS"]
          .filter(materia => {

            // ignora matérias concluídas
            if (
              materia["MATERIA-CONCLUIDA"]
            ) {
              return false;
            }

            // ignora matérias nunca iniciadas
            if (
              materia["MATERIA-NAO-INICIADA"]
            ) {
              return false;
            }

            return true;
          });

      // =====================================================
      // AULAS
      // =====================================================

      const aulasConcluidas =
        contrato["MATERIAS"]
          .reduce(
            (total, materia) =>
              total +
              (
                Number(
                  materia["AULAS-CONCLUIDAS"]
                ) || 0
              ),
            0
          );

      const aulasRestantesAtivas =
        materiasAtivas
          .reduce(
            (total, materia) =>
              total +
              (
                Number(
                  materia["AULAS-RESTANTES"]
                ) || 0
              ),
            0
          );

      // =====================================================
      // CAPACIDADE SEMANAL
      // =====================================================

      let capacidadeSemanal =
        materiasAtivas.reduce(
          (total, materia) =>
            total +
            (
              Number(
                materia["QUANTIDADE-AGENDAMENTOS"]
              ) || 0
            ),
          0
        );

      // evita divisão absurda
      if (capacidadeSemanal <= 0) {
        capacidadeSemanal = 0;
      }

      // =====================================================
      // ESTADO
      // =====================================================

      let estadoAtual =
        "NÃO COMPUTÁVEL";

      let situacao =
        "SEM AGENDAMENTO";

      let aulasAtrasadas = 0;

      let totalSemanas = null;

      let semanasConcluidas = null;

      // =====================================================
      // REGRAS DE CÁLCULO
      // =====================================================

      if (
        datasValidas &&
        capacidadeSemanal > 0
      ) {

        totalSemanas =
          diferencaSemanas(
            dataInicial,
            dataFinal
          );

        semanasConcluidas =
          diferencaSemanas(
            dataInicial,
            hoje
          );

        if (semanasConcluidas < 0) {
          semanasConcluidas = 0;
        }

        // =================================================
        // AULAS ESPERADAS
        // =================================================

        const aulasEsperadas =
          semanasConcluidas *
          capacidadeSemanal;

        aulasAtrasadas =
          aulasEsperadas -
          aulasConcluidas;

        // trava absurdos
        if (aulasAtrasadas < -50) {
          aulasAtrasadas = -50;
        }

        if (aulasAtrasadas > 50) {
          aulasAtrasadas = 50;
        }

        aulasAtrasadas =
          Number(
            aulasAtrasadas.toFixed(2)
          );

        situacao =
          calcularSituacao(
            aulasAtrasadas
          );

        estadoAtual =
          "COMPUTÁVEL";
      }

      // =====================================================
      // SEM AGENDAMENTO
      // =====================================================

      if (
        capacidadeSemanal <= 0
      ) {

        situacao =
          "SEM AGENDAMENTO";

        estadoAtual =
          "NÃO COMPUTÁVEL";

        aulasAtrasadas = 0;
      }

      // =====================================================
      // DATAS INVÁLIDAS
      // =====================================================

      if (!datasValidas) {

        situacao =
          "DATAS INVÁLIDAS";

        estadoAtual =
          "NÃO COMPUTÁVEL";

        aulasAtrasadas = 0;
      }

      contrato["ACOMPANHAMENTOS"] = [];

      contrato["ACOMPANHAMENTOS"].push({

        "DATA-ACOMPANHAMENTO":
          hoje,

        "TOTAL-SEMANAS":
          totalSemanas !== null
            ? Number(
              totalSemanas.toFixed(2)
            )
            : null,

        "SEMANAS-CONCLUIDAS":
          semanasConcluidas !== null
            ? Number(
              semanasConcluidas.toFixed(2)
            )
            : null,

        "AULAS-CONCLUIDAS":
          aulasConcluidas,

        "AULAS-RESTANTES-ATIVAS":
          aulasRestantesAtivas,

        "CAPACIDADE-SEMANAL":
          capacidadeSemanal,

        "AULAS-ATRASADAS":
          aulasAtrasadas,

        "SITUACAO":
          situacao,

        "REPOSICOES":
          null,

        "ESTADO-ATUAL":
          estadoAtual
      });
    }

    return Array.from(
      contratosMap.values()
    );

    // =========================================================
    // HELPERS
    // =========================================================

    function excelDateToJSDate(excelDate) {

      if (
        excelDate === null ||
        excelDate === undefined ||
        excelDate === "" ||
        isNaN(excelDate)
      ) {
        return null;
      }

      const excelEpoch =
        new Date(Date.UTC(1899, 11, 30));

      const dias =
        Number(excelDate);

      const data =
        new Date(
          excelEpoch.getTime() +
          dias * 86400000
        );

      return data;
    }

    function normalizarTexto(valor) {

      if (
        valor === undefined ||
        valor === null ||
        valor === "" ||
        valor === "Indefinido"
      ) {
        return null;
      }

      return String(valor).trim();
    }

    function extrairMateria(materiaCompleta = "") {

      if (!materiaCompleta) {

        return {
          codigo: null,
          materia: null
        };
      }

      const match =
        materiaCompleta.match(
          /^(\d+)_(.+)$/
        );

      if (!match) {

        return {
          codigo: null,
          materia: materiaCompleta.trim()
        };
      }

      return {
        codigo: Number(match[1]),
        materia: match[2].trim()
      };
    }

    function calcularSituacao(
      aulasAtrasadas = 0
    ) {

      if (aulasAtrasadas <= -8) {
        return "ADIANTADO";
      }

      if (aulasAtrasadas < 6) {
        return "EM DIAS";
      }

      if (aulasAtrasadas < 12) {
        return "ATRASADO";
      }

      return "MUITO ATRASADO";
    }

    function diferencaSemanas(
      dataInicial,
      dataFinal
    ) {

      return (
        (
          dataFinal.getTime() -
          dataInicial.getTime()
        ) /
        (1000 * 60 * 60 * 24 * 7)
      );
    }
  },
  _historyUpdate: (updateNow = false) => {
    return new Promise((resolve, reject) => {
      filseService.read("data/h", "utf-8").then(data => {
        const { version, update, lasts } = JSON.parse(data);
        let num = 2;
        let up = update;
        if (updateNow) {
          lasts[update] = update;
          up = Utils.GenerateDailySecret(Date.now(), "").date;
        }
        version > 1000000 ? num = 2 : num = (version + 1);
        ServerApp.History = num;
        filseService.write("data/h", JSON.stringify({ version: num, update: up, lasts: lasts }, false, 2), null).then(() => {
          resolve(num);
        }).catch(err => {
          reject(err);
        });
      });
    });
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
  GenerateDailySecret: (timestamp, char) => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const x = `${day}/${month}/${year}`;
    let hash = 0;
    for (let i = 0; i < x.length; i++) {
      hash = x.charCodeAt(i) + ((hash << 5) - hash);
    }
    //
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    return {
      random: Math.abs(hash).toString(),
      array: [dia, mes, ano],
      date: `${dia}/${mes}/${ano}`,
      path: `${dia}${char}${mes}${char}${ano}`,
    };
  },
  clearLoginEntries: async () => {
    const data = JSON.parse(await filseService.read("data/login.json", "utf-8"));
    const cleaned = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, (({ passwd, ...rest }) => rest)(v)]));
    return cleaned;
  },
  diferencaDatas: (data1, data2) => {
    function parseData(str) {
      if (!str || typeof str !== 'string') return null;

      const match = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (!match) return null;

      const dia = parseInt(match[1], 10);
      const mes = parseInt(match[2], 10) - 1; // mês começa em 0
      const ano = parseInt(match[3], 10);

      const date = new Date(Date.UTC(ano, mes, dia));

      // validação extra (evita 32/13/2020 virar data válida)
      if (
        date.getUTCFullYear() !== ano ||
        date.getUTCMonth() !== mes ||
        date.getUTCDate() !== dia
      ) {
        return null;
      }

      return date;
    }

    const d1 = parseData(data1);
    const d2 = parseData(data2);

    if (!d1 || !d2) return null;

    const diffMs = Math.abs(d2 - d1);
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffSemanas = Math.floor(diffDias / 7);

    return {
      dias: diffDias,
      semanas: diffSemanas
    };
  },
  ultimoCadastro: () => {
    const pasta = 'data/cadastros';
    function extrairData(nomeArquivo) {
      const match = nomeArquivo.match(/^(\d{2})_(\d{2})_(\d{4})\.json$/);
      if (!match) return null;
      const [, dd, mm, yyyy] = match;
      return new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    }
    const arquivos = require('fs').readdirSync(pasta);
    let maisRecente = null;
    let dataMaisRecente = null;
    for (const arquivo of arquivos) {
      const data = extrairData(arquivo);
      if (!data) continue;
      if (!dataMaisRecente || data > dataMaisRecente) {
        dataMaisRecente = data;
        maisRecente = arquivo;
      }
    }
    return maisRecente;
  },
  convert: {
    fileToBase64(buffer) {
      return buffer.toString("base64");
    },
    base64ToFile(base64) {
      return Buffer.from(base64, "base64");
    }
  },
};

(async () => {
  if (autoUpdate) await ServerApp._historyUpdate(false);
})();

module.exports = { ServerApp, Utils };

// EOF