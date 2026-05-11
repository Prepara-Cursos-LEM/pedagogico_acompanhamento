const XLSX = require("xlsx");
const fs = require("fs");
const { Cadastro, Materia, Sheet } = require("./model");
const _ = require("./model");
const { filseService } = require("./FileCache");
const tmpDir = require("./conf").tmpDir;
const autoUpdate = false;

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
      const date = Utils.GenerateDailySecret(Date.now(), "_").path;
      const data1 = JSON.parse(await filseService.read("data/cadastros/" + date + ".json", "utf-8"));
      const data2 = JSON.parse(await filseService.read("data/h", "utf-8"));
      return { cadastros: data1, atualizacoes: data2 };
    },
    ProcessarDados: async (controle = [], segmenta = []) => {
      const template = {};

      const data = [];

      // Calcular o progresso do aluno:
      const materias = JSON.parse(await filseService.read("data/materias.json", "utf-8"));
      const params = JSON.parse(await filseService.read("data/params", "utf-8"));
      const cadastros = ServerApp.calcularProgresso(controle, materias, params);
      // Gravar o resultado:
      const filename = `${tmpDir}/cadastros/${Utils.GenerateDailySecret(Date.now(), "_").path}.json`;
      await filseService.write(filename, JSON.stringify(cadastros, false, 2), null);
      //
      if (autoUpdate) await ServerApp._historyUpdate(true);
      return { status: "OK", dados: cadastros };
    },
  },
  // Cálculo de situação do aluno:
  calcularProgresso(contratosArray, materiasJson, params = { "rate": 6, "margin": 4 }) {
    // Mapeamento de dias da semana em português para números (0 = Domingo)
    const diasSemanaMap = {
      'Domingo': 0,
      'Segunda': 1, 'Segunda-Feira': 1,
      'Terça': 2, 'Terça-Feira': 2,
      'Quarta': 3, 'Quarta-Feira': 3,
      'Quinta': 4, 'Quinta-Feira': 4,
      'Sexta': 5, 'Sexta-Feira': 5,
      'Sábado': 6
    };
    // Mapa de matérias -> total de aulas (fallback 16 se não definido)
    const materiasAulasMap = new Map();
    materiasJson.forEach(item => {
      const aulas = item.Aulas ? parseInt(item.Aulas) : 16;
      materiasAulasMap.set(item.Matéria, aulas);
      if (item.Código) {
        materiasAulasMap.set(item.Código + '_' + item.Matéria, aulas);
        materiasAulasMap.set(item.Código, aulas);
      }
    });
    // Converte número serial do Excel para Date
    function excelSerialToJSDate(serial) {
      if (serial === undefined || serial === null || serial === '') return null;
      const num = Number(serial);
      if (isNaN(num)) return null;
      return new Date((num - 25569) * 86400 * 1000);
    }
    // Encontra a próxima data de aula (a partir de fromDate, inclusive) que caia nos dias da semana informados
    function getNextLessonDate(fromDate, weekdays) {
      const d = new Date(fromDate);
      d.setHours(0, 0, 0, 0);
      for (let i = 0; i < 366; i++) {
        if (weekdays.includes(d.getDay())) {
          return new Date(d);
        }
        d.setDate(d.getDate() + 1);
      }
      return null; // fallback
    }
    // Calcula a situação atual do aluno com base nos parâmetros:
    function getSituacao(diffDays) {
      const { rate, margin } = params;
      const highPositive = (rate * 2) + margin;
      const positive = rate + margin;
      const neutralNegative = -rate + margin;
      const negative = -(rate * 2) + margin;
      if (diffDays >= highPositive) {
        return 'MUITO ADIANTADO';
      }
      if (diffDays >= positive) {
        return 'ADIANTADO';
      }
      if (diffDays >= neutralNegative) {
        return 'EM DIAS';
      }
      if (diffDays >= negative) {
        return 'ATRASADO';
      }
      return 'MUITO ATRASADO';
    }
    // Agrupa por contrato
    const groups = new Map();
    for (const row of contratosArray) {
      const id = row.Contrato;
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id).push(row);
    }
    const resultado = [];
    for (const [contratoId, rows] of groups) {
      // 1. Monta lista de matérias na ordem original, estendendo via Próxima Matéria
      const subjectList = [];
      const namesSet = new Set();
      for (const row of rows) {
        const nome = row["Matéria"];
        if (!namesSet.has(nome)) {
          subjectList.push({
            nome,
            totalAulas: row["Aulas"],
            concluidas: row["Aulas Concluídas"],
            dataInicio: row["Data Início"],
            proxMateria: row["Próxima Matéria"]
          });
          namesSet.add(nome);
        }
      }
      // Adiciona matérias futuras a partir da última Próxima Matéria não mapeada
      let last = subjectList[subjectList.length - 1];
      while (last && last.proxMateria && !namesSet.has(last.proxMateria)) {
        const prox = last.proxMateria;
        const aulas = materiasAulasMap.has(prox) ? materiasAulasMap.get(prox) : 16;
        subjectList.push({
          nome: prox,
          totalAulas: aulas,
          concluidas: 0,
          dataInicio: null,
          proxMateria: '' // sem encadeamento adicional (não conhecido)
        });
        namesSet.add(prox);
        last = subjectList[subjectList.length - 1];
        break; // só estende um nível, pois não temos a próxima da próxima
      }
      // 2. Determina horário (usa a linha atual ou a primeira com agendamento)
      const scheduleRow = rows.find(r => r["Aulas Concluídas"] < r["Aulas"] && r["Quantidade Agendamentos"] > 0) ||
        rows.find(r => r["Quantidade Agendamentos"] > 0) ||
        rows[0];
      const quantAgend = scheduleRow ? scheduleRow["Quantidade Agendamentos"] : 0;
      const diasStr = scheduleRow ? scheduleRow["Dias Agendamento"] : "";
      const weekdays = [];
      if (quantAgend > 0 && diasStr && diasStr !== 'Indefinido') {
        diasStr.split(',').forEach(p => {
          const d = p.trim();
          if (diasSemanaMap[d] !== undefined) weekdays.push(diasSemanaMap[d]);
        });
      }
      const hasSchedule = quantAgend > 0 && weekdays.length > 0;
      // 3. Soma aulas restantes e localiza primeira matéria com pendência
      let totalRemaining = 0;
      let firstRemaining = null;
      for (const subj of subjectList) {
        const rem = Math.max(0, subj.totalAulas - subj.concluidas);
        if (rem > 0 && !firstRemaining) firstRemaining = subj;
        totalRemaining += rem;
      }
      // 4. Projeta data da última aula
      let lastLessonDate = null;
      const contractEndDate = excelSerialToJSDate(rows[0]["Data Final"]) || new Date();

      if (totalRemaining === 0) {
        lastLessonDate = new Date(); // todas as aulas concluídas
      } else if (!hasSchedule || !firstRemaining) {
        lastLessonDate = new Date(); // sem horário definido
      } else {
        let currentDate = firstRemaining.dataInicio ? excelSerialToJSDate(firstRemaining.dataInicio) : new Date();
        if (!currentDate) currentDate = new Date();

        // Pula as aulas já concluídas da primeira matéria com pendência
        if (firstRemaining.concluidas > 0) {
          for (let i = 0; i < firstRemaining.concluidas; i++) {
            const next = getNextLessonDate(currentDate, weekdays);
            if (!next) break;
            currentDate = new Date(next);
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }

        let finalLesson = null;
        for (const subj of subjectList) {
          const rem = Math.max(0, subj.totalAulas - subj.concluidas);
          for (let i = 0; i < rem; i++) {
            const next = getNextLessonDate(currentDate, weekdays);
            if (!next) break;
            finalLesson = next;
            currentDate = new Date(finalLesson);
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
        lastLessonDate = finalLesson || new Date();
      }
      // 5. Calcula diferença em dias
      const diffTime = contractEndDate.getTime() - lastLessonDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      // OLD:
      // const situacao = diffDays >= params.rate ? 'ADIANTADO' : 'ATRASADO';
      // NEW:
      const situacao = getSituacao(diffDays);
      // 6. Monta objeto do contrato consolidado
      const firstRow = rows[0];
      const contractObj = {
        "CONTRATO": contratoId,
        "ALUNO": firstRow["Aluno"],
        "INICIO-CONTRATO": firstRow["Data Inicial"],
        "TERMINO-CONTRATO": firstRow["Data Final"],
        "PROXIMA-MATERIA": firstRow["Próxima Matéria"],
        "PARCELAS-RESTANTES": firstRow["Recebimentos Futuros"],
        "MATERIAS-RESTANTES": firstRow["Quantidade Matérias Restantes"],
        "QUANTIDADE-AGENDAMENTOS": quantAgend,
        "MATERIA-ATUAL": firstRow["Matéria"],
        "AULAS-MATERIA-ATUAL": firstRow["Aulas"],
        "AULAS-CONCLUIDAS": firstRow["Aulas Concluídas"],
        "DIAS-AGENDAMENTO": scheduleRow["Dias Agendamento"],
        "HORAS-AGENDAMENTO": scheduleRow["Horas Agendamento"],
        "CODIGO-APOSTILA": firstRow["Apostila"],
        "ENTREGA-FISICA": firstRow["Entrega Física"],
        "MATERIAS": subjectList.map(s => ({
          "MATERIA": s.nome,
          "AULAS-MATERIA": s.totalAulas,
          "AULAS-CONCLUIDAS": s.concluidas
        })),
        "Detalhes": {
          "SITUACAO": situacao,
          "AULAS-DIFERENCA": diffDays,
          "DATA-ACOMPANHAMENTO": new Date().toISOString().split('T')[0]
        }
      };
      resultado.push(contractObj);
    }
    return resultado;
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
  analisarJSON: (jsonData, dataRef = new Date()) => {
    // Mapeia os dias da semana do JSON para números do JavaScript (0=Dom, 1=Seg, ...)
    const diaSemanaMap = {
      'domingo': 0,
      'segunda-feira': 1,
      'terça-feira': 2,
      'quarta-feira': 3,
      'quinta-feira': 4,
      'sexta-feira': 5,
      'sábado': 6
    };
    // Converte string dd/mm/aaaa para Date (ignora horário). Retorna null se for data inválida (ano 1899 etc.)
    function parseDate(str) {
      if (!str || str.indexOf('1899') !== -1) return null;
      const [d, m, y] = str.split('/').map(Number);
      const date = new Date(y, m - 1, d);
      return isNaN(date.getTime()) ? null : date;
    }
    // A partir de string "Segunda-Feira,Quinta-Feira" retorna array de números dos dias da semana.
    // Para "Indefinido" retorna array vazio.
    function getWeekDays(diaStr) {
      if (!diaStr || diaStr.toLowerCase() === 'indefinido') return [];
      return diaStr.split(',')
        .map(s => diaSemanaMap[s.trim().toLowerCase()])
        .filter(v => v !== undefined);
    }
    // "14:00:00,15:00:00" -> 2 (cada horário é uma aula)
    function getAulasPorDia(horasStr) {
      if (!horasStr) return 0;
      return horasStr.split(',').filter(s => s.trim() !== '').length;
    }
    // Conta ocorrências de um determinado dia da semana entre duas datas (inclusive)
    function countDaysBetween(start, end, targetDay, aulasPorDia) {
      let count = 0;
      let current = new Date(start);
      // Avança até o primeiro 'targetDay' após ou igual a start
      while (current.getDay() !== targetDay) {
        current.setDate(current.getDate() + 1);
      }
      // Enquanto não passar do end, conta as aulas e pula 7 dias
      while (current <= end) {
        count += aulasPorDia;
        current.setDate(current.getDate() + 7);
      }
      return count;
    }

    // Faz o cálculo de atraso para uma matéria individual.
    // Retorna null se não for possível calcular (datas inválidas, dia indefinido, etc.)
    function calcularAtrasoMateria(materia, dataReferencia = new Date()) {
      const inicio = parseDate(materia.PREVISAOINICIO);
      const termino = parseDate(materia.PREVISAOTERMINO);
      if (!inicio || !termino) return null;

      const dias = getWeekDays(materia.DIAAGENDAMENTO);
      const aulasPorDia = getAulasPorDia(materia.HORASAGENDAMENTO);
      if (dias.length === 0 || aulasPorDia === 0) return null;

      // A data de corte para contagem é a menor entre a data de referência e o término do curso
      const dataCorte = dataReferencia < termino ? dataReferencia : termino;

      let aulasPlanejadas = 0;
      for (const dia of dias) {
        aulasPlanejadas += countDaysBetween(inicio, dataCorte, dia, aulasPorDia);
      }

      const aulasConcluidas = materia.AULASCONCLUIDAS || 0;
      return {
        planejadas: aulasPlanejadas,
        concluidas: aulasConcluidas,
        atraso: aulasPlanejadas - aulasConcluidas   // > 0 = atrasado, < 0 = adiantado
      };
    }
    // Analisar o JSON:
    const resultados = [];
    for (const contrato of jsonData) {
      for (const materia of contrato.MATERIAS) {
        const res = calcularAtrasoMateria(materia, dataRef);
        if (res !== null) {
          resultados.push({
            CONTRATO: contrato.CONTRATO,
            ALUNO: contrato.ALUNO,
            MATERIA: materia.NOME,
            AULAS_PLANEJADAS: res.planejadas,
            AULAS_CONCLUIDAS: res.concluidas,
            ATRASO: res.atraso,
            STATUS: res.atraso > 0 ? 'ATRASADO' : (res.atraso < 0 ? 'ADIANTADO' : 'EM DIA')
          });
        }
      }
    }
    return resultados;
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