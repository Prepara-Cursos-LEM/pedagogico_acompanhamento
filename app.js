const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");
const { filseService } = require("./FileCache");
const Logger = require("./logger");
let tmpDir = "";

const App = {
    history: 2,
    _historyUpdate: (updateNow = false) => {
        const data = JSON.parse(fs.readFileSync("config.json", "utf-8"));
        const { version, update, lasts } = data.updates;
        let num = 2;
        let up = update;
        if (updateNow) {
            lasts[update] = update;
            up = Utils.GenerateDailySecret(Date.now(), "").date;
        }
        version > 1000000 ? num = 2 : num = (version + 1);
        App.history = num;
        filseService.write("data/h", JSON.stringify({ version: num, update: up, lasts: lasts }, false, 2), null).then(() => {
            resolve(num);
        }).catch(err => {
            reject(err);
        });
    },
    /**
     * @description Retorna a lista de usuários sem as senhas
     * @returns {Object} Objeto contendo os usuários e suas informações, exceto as senhas
     */
    clearLoginEntries: async () => {
        const login = await Utils.config().then(cfg => cfg.login).catch(() => "./");
        const cleaned = Object.fromEntries(Object.entries(login).map(([k, v]) => [k, (({ passwd, ...rest }) => rest)(v)]));
        return cleaned;
    },
    readXLSX: async (payload) => {
        // Accept payload either as raw base64 string or an object with a "file" property.
        const base64 = typeof payload === "string" ? payload : payload.file;
        try {
            const buffer = Buffer.from(base64, "base64");
            const workbook = XLSX.read(buffer, { type: "buffer" });
            const aba = workbook.SheetNames[0];
            const sheet = workbook.Sheets[aba];
            const dados = XLSX.utils.sheet_to_json(sheet);
            const expectedHeaders = [
                "ALUNOS",
                "EDUCADOR",
                "DIA SEMANA",
                "DATA INICIO",
                "DATA TERMINO",
                "AULAS CURSO",
                "AULAS CONCLUIDAS",
                "AULAS ATRASADAS",
                "SITUAÇÃO",
                "DATA ACOMPANHAMENTO",
                "DIAS VERIFICADOS",
                "VERIFICAÇÃO"
            ];
            if (dados.length > 0 && expectedHeaders.every(h => Object.keys(dados[0]).includes(h))) {
                const cleanData = dados.map(item => {
                    const x = [
                        String(item["DATA INICIO"]).trim().length > 1,
                        String(item["DATA TERMINO"]).trim().length > 1,
                        String(item["ALUNOS"]).trim().length > 1,
                    ];
                    if (x.every(v => v)) return item;
                });
                // Save JSON representation
                const daily = Utils.GenerateDailySecret(Date.now(), "-").path;
                const filePathJson = `${tmpDir}/_json/${daily}.json`;
                await filseService.write(filePathJson, JSON.stringify(cleanData, false, 2), null);
                // Save the original .xlsx file
                const filePathXlsx = `${tmpDir}/_xlsx/${daily}.xlsx`;
                await filseService.write(filePathXlsx, buffer, null);
                return { status: "OK", dados: cleanData };
            } else {
                Logger.Log("error", "ELSE: Erro ao ler o arquivo XLSX");
                return { status: "ERR", dados: [] };
            }
        } catch (error) {
            Logger.Log("error", "CATCH: Erro ao ler o arquivo XLSX", error);
            return { status: "ERR", dados: [] };
        }
    },
    writeXLSX: async (rows, filePath) => {
        const placehold = (i, alunos, educador, inicio, termino, aulasCurso, aulasConcluidas) => {
            const x = {
                "ALUNOS": alunos,
                "EDUCADOR": educador,
                "DIA SEMANA": `="L${i}"`,
                "DATA INICIO": inicio,
                "DATA TERMINO": termino,
                "TOTAL SEMANAS": `=INT((E${i} - D${i}) / 7)`,
                "SEMANAS CONCLUIDAS": `=INT((HOJE() - D${i}) / 7)`,
                "AULAS CURSO": aulasCurso,
                "AULAS CONCLUIDAS": aulasConcluidas,
                "AULAS ATRASADAS": `=INT(((G${i} * H${i}) / F${i}) - I${i})`,
                "SITUAÇÃO": `=SE(J${i} < -12;"MUITO ADIANTADO";SE(J${i} < -6;"ADIANTADO";SE(J${i} < 6;"EM DIAS";SE(J${i} < 12;"ATRASADO";"MUITO ATRASADO"))))`,
                "DATA ACOMPANHAMENTO": `=${dataAcompanhamento}`,
                "DIAS VERIFICADOS": `=HOJE()-L${i}`,
                "VERIFICAÇÃO": `=SE(M${i} < 8;"VERIFICADO";SE(M${i} < 15;"VERIFICAR";"VERIFICAR URGENTE"))`
            };
        };
        /**
         * Cria uma planilha XLSX com suporte a fórmulas.
         * @param {Object} options
         * @param {string} options.filePath Caminho final do arquivo
         * @param {Array<Array<any>>} options.rows Matriz de linhas
        **/
        function writeWorkbook({ filePath, rows = [] }) {
            const sheetName = 'CENTRO ANDAMENTO ALUNOS';
            const workbook = XLSX.utils.book_new();
            // Cria worksheet vazia
            const worksheet = XLSX.utils.aoa_to_sheet([]);
            // Percorre linhas/colunas
            rows.forEach((row, rowIndex) => {
                row.forEach((value, colIndex) => {
                    const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
                    // Fórmula
                    if (typeof value === 'string' && value.startsWith('=')) {
                        worksheet[cellAddress] = {
                            t: 'n',
                            f: value.substring(1)
                        };
                        return;
                    }
                    // Número
                    if (typeof value === 'number') {
                        worksheet[cellAddress] = { t: 'n', v: value };
                        return;
                    }
                    // Boolean
                    if (typeof value === 'boolean') {
                        worksheet[cellAddress] = { t: 'b', v: value };
                        return;
                    }
                    // Data
                    if (typeof value === 'object' && value instanceof Date) {
                        worksheet[cellAddress] = { t: 'd', v: value };
                        return;
                    }
                    // Texto
                    worksheet[cellAddress] = { t: 's', v: value?.toString() ?? '' };
                });
            });

            // Define range da planilha
            worksheet['!ref'] = XLSX.utils.encode_range({
                s: { r: 0, c: 0 },
                e: {
                    r: rows.length - 1,
                    c: Math.max(...rows.map(r => r.length), 1) - 1
                }
            });

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                sheetName
            );

            // Garante diretório
            fs.mkdirSync(path.dirname(filePath), {
                recursive: true
            });

            XLSX.writeFile(workbook, filePath);
        }
    },
    LongPooling: (history) => {
        return history != App.history ?
            { atualizar: true, version: App.history } :
            { atualizar: false, version: null };
    },
    ProcessarContratos: (mesAnterior, mesAtual) => {
        return {
            mesAtual: gerarResumoMes(mesAtual),
            mesAnterior: gerarResumoMes(mesAnterior)
        };
        // Helpers:
        function gerarResumoMes(registros) {
            const hoje = new Date();
            const resumo = {
                geral: criarEstruturaResumo(),
                porEducador: {}
            };
            for (const registro of registros) {
                const educador = (registro["EDUCADOR"] || "").trim();

                if (!resumo.porEducador[educador]) {
                    resumo.porEducador[educador] = criarEstruturaResumo();
                }
                const geral = resumo.geral;
                const educadorResumo = resumo.porEducador[educador];
                // Total de alunos
                geral.totalAlunos++;
                educadorResumo.totalAlunos++;
                // Situação
                contabilizarSituacao(
                    registro["SITUAÇÃO"],
                    geral,
                    educadorResumo
                );
                // Verificação
                contabilizarVerificacao(
                    registro["VERIFICAÇÃO"],
                    geral,
                    educadorResumo
                );
                // Concluído
                if (estaConcluido(registro["DATA TERMINO"], hoje)) {
                    geral.concluidos++;
                    educadorResumo.concluidos++;
                }
            }

            return resumo;
        }
        function criarEstruturaResumo() {
            return {
                totalAlunos: 0,

                totalAdiantados: 0,
                totalAtrasados: 0,
                totalMuitoAtrasados: 0,
                totalMuitoAdiantados: 0,
                totalEmDias: 0,

                totalVerificados: 0,
                totalVerificar: 0,
                totalVerificarUrgente: 0,

                concluidos: 0
            };
        }
        function contabilizarSituacao(situacao, geral, educador) {
            switch ((situacao || "").toUpperCase()) {
                case "ADIANTADO":
                    geral.totalAdiantados++;
                    educador.totalAdiantados++;
                    break;

                case "ATRASADO":
                    geral.totalAtrasados++;
                    educador.totalAtrasados++;
                    break;

                case "MUITO ATRASADO":
                    geral.totalMuitoAtrasados++;
                    educador.totalMuitoAtrasados++;
                    break;

                case "MUITO ADIANTADO":
                    geral.totalMuitoAdiantados++;
                    educador.totalMuitoAdiantados++;
                    break;

                case "EM DIAS":
                    geral.totalEmDias++;
                    educador.totalEmDias++;
                    break;
            }
        }
        function contabilizarVerificacao(verificacao, geral, educador) {
            switch ((verificacao || "").toUpperCase()) {
                case "VERIFICADO":
                    geral.totalVerificados++;
                    educador.totalVerificados++;
                    break;

                case "VERIFICAR":
                    geral.totalVerificar++;
                    educador.totalVerificar++;
                    break;

                case "VERIFICAR URGENTE":
                    geral.totalVerificarUrgente++;
                    educador.totalVerificarUrgente++;
                    break;
            }
        }
        function excelDateToJSDate(excelDate) {
            const utcDays = Math.floor(excelDate - 25569);
            const utcValue = utcDays * 86400;
            return new Date(utcValue * 1000);
        }
        function estaConcluido(dataTerminoExcel, hoje) {
            if (!dataTerminoExcel) return false;

            const dataTermino = excelDateToJSDate(dataTerminoExcel);

            return dataTermino < hoje;
        }
    },
    Update: {
        Users: async () => {
            let users = await App.clearLoginEntries();
            return users;
        },
        Contracts: async () => {
            const ultimo = Utils.ultimoCadastro();
            if (ultimo) {
                const data1 = JSON.parse(await filseService.read(`${tmpDir}/_json/${ultimo}`, "utf-8"));
                const data2 = JSON.parse(await filseService.read(`config.json`, "utf-8")).updates;
                return { cadastros: data1, atualizacoes: data2 };
            }
            return { cadastros: [], atualizacoes: [] };
        },
        ProcessData: async () => {
            // Lógica para processar os dados dos cadastros:
            const ultimo = Utils.ultimoCadastro().replace(".json", "");
            const arquivos = require('fs').readdirSync("data/_json").map(f => f.replace(".json", ""));
            const { anterior, atual } = Utils.comparacao(ultimo, arquivos);
            const mesAtual = JSON.parse(await filseService.read(`data/_json/${atual}.json`, "utf-8"));
            const mesAnterior = JSON.parse(await filseService.read(`data/_json/${anterior}.json`, "utf-8"));
            return App.ProcessarContratos(mesAnterior, mesAtual);
        },
        GetSheetData: async () => {
            const arquivos = require('fs').readdirSync("data/_json").map(f => f.replace(".json", ""));
        },
        Save: async (data) => {
            console.log(data);
            return {};
        },
        Control: async () => {
            // Obter os dados do mês atual e do anterior:
            const mesAtual = [];
            const mesAnterior = [];
            return gerarResumoComparativo(mesAtual, mesAnterior);
            // Helpers:
            function gerarResumoComparativo(mesAtual, mesAnterior) {
                const mapaAnterior = new Map(
                    mesAnterior.map(aluno => [
                        aluno.ALUNOS.trim().toUpperCase(),
                        aluno
                    ])
                );
                const mapaAtual = new Map(
                    mesAtual.map(aluno => [
                        aluno.ALUNOS.trim().toUpperCase(),
                        aluno
                    ])
                );
                const comparativos = [];
                const novos = [];
                const removidos = [];
                // Compara alunos do mês atual
                for (const atual of mesAtual) {
                    const chave = atual.ALUNOS.trim().toUpperCase();
                    const anterior = mapaAnterior.get(chave);
                    // Aluno novo
                    if (!anterior) {
                        novos.push({
                            aluno: atual.ALUNOS,
                            aluno: atual.EDUCADOR,
                            mesAtual: {
                                verificacao: atual["VERIFICAÇÃO"],
                                situacao: atual["SITUAÇÃO"],
                                aulasAtrasadas: atual["AULAS ATRASADAS"]
                            }
                        });
                        continue;
                    }
                    const aulasAtrasadasAnterior =
                        Number(anterior["AULAS ATRASADAS"]) || 0;
                    const aulasAtrasadasAtual =
                        Number(atual["AULAS ATRASADAS"]) || 0;
                    comparativos.push({
                        aluno: atual.ALUNOS,
                        aluno: atual.EDUCADOR,
                        mesAnterior: {
                            verificacao: anterior["VERIFICAÇÃO"],
                            situacao: anterior["SITUAÇÃO"],
                            aulasAtrasadas: aulasAtrasadasAnterior
                        },
                        mesAtual: {
                            verificacao: atual["VERIFICAÇÃO"],
                            situacao: atual["SITUAÇÃO"],
                            aulasAtrasadas: aulasAtrasadasAtual
                        },
                        // positivo = recuperou
                        // negativo = piorou
                        // zero = ficou igual
                        aulasRecuperadas:
                            aulasAtrasadasAnterior - aulasAtrasadasAtual
                    });
                }
                // Procura alunos que existiam antes mas não existem agora
                for (const anterior of mesAnterior) {
                    const chave = anterior.ALUNOS.trim().toUpperCase();
                    if (!mapaAtual.has(chave)) {
                        removidos.push({
                            aluno: anterior.ALUNOS,
                            aluno: anterior.EDUCADOR,
                            mesAnterior: {
                                verificacao: anterior["VERIFICAÇÃO"],
                                situacao: anterior["SITUAÇÃO"],
                                aulasAtrasadas: anterior["AULAS ATRASADAS"]
                            }
                        });
                    }
                }
                return {
                    comparativos,
                    novos,
                    removidos
                };
            }
        },
    }
};

//

const Utils = {
    config: async () => {
        return JSON.parse(await filseService.read("config.json", "utf-8"));
    },
    generateToken: (length = 32) => {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
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
            milissegundos: diffMs,
            dias: diffDias,
            semanas: diffSemanas
        };
    },
    ultimoCadastro: () => {
        const pasta = `${tmpDir}/_json`;
        function extrairData(nomeArquivo) {
            const match = nomeArquivo.match(/^(\d{2})-(\d{2})-(\d{4})\.json$/);
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
    shuffle: (shuffled) => {
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },
    comparacao: (dataAtual = new Date(), datas = []) => {
        // Funções auxiliares
        const parseData = (str) => {
            const [dia, mes, ano] = str.split("-").map(Number);
            return new Date(ano, mes - 1, dia);
        };
        const atual = typeof dataAtual == "string" ? parseData(dataAtual) : dataAtual;
        const datasComDiff = datas
            .map(data => {
                const dt = parseData(data);
                const diffDias = Math.floor(
                    (atual - dt) / (1000 * 60 * 60 * 24)
                );
                return { data, diffDias };
            }).filter(item => item.diffDias > 29).sort((a, b) => a.diffDias - b.diffDias);
        if (!datasComDiff.length) return null;

        return {
            atual: dataAtual,
            anterior: datasComDiff[0].data
        };

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
    tmpDir = await Utils.config().then(cfg => cfg.tmpDir).catch(() => "./");
    const autoUpdate = await Utils.config().then(cfg => cfg.autoUpdate).catch(() => false);
    if (autoUpdate) await App._historyUpdate(false);
})();

module.exports = { ServerApp: App };