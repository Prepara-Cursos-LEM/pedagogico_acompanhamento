/** @type {typeof import("./lib/acacia/content").Content} */
const Content = window.Content;
/** @type {typeof import("./lib/acacia/renderer").Renderer} */
const Renderer = window.Renderer;
/** @type {typeof import("./lib/acacia/acacia").Datagrid} */
const Datagrid = window.Datagrid;
/** @type {typeof import("./lib/acacia/acacia").Gallery} */
const Gallery = window.Gallery;
/** @type {typeof import("./lib/acacia/acacia").Modal} */
const Modal = window.Modal;
/** @type {typeof import("./lib/acacia/acacia").Tooltip} */
const Tooltip = window.Tooltip;

const appURL = `${window.location.origin}/app`;
console.log("appURL:", appURL);

let index = 0;
let appStatus;

const App = {
    Usuarios: [],
    Cadastros: {
        current: {},
        selection: [],
        selectionCount: 0,
        sourceLength: 0,
        allSelected: false,
        contratos: [],
        filtros: {
            gridAtual: "acompanhamento",
            //actualGrid: "andamento",
            //actualGrid: "apostila",
            colunas: [
                "CONTRATO",
                "ALUNO",
                "STATUS",
                "EDUCADOR",
                "DIAAGENDAMENTO",
                "HORASAGENDAMENTO",
                "MATERIAATUAL",
                "PROXIMAMATERIA",
                "INICIOCONTRATO",
                "TERMINOCONTRATO",
                "TOTALSEMANAS",
                "SEMANASCONCLUIDAS",
                "AULASCURSO",
                "AULASCONCLUIDAS",
                "SALDOAULAS",
                "REPOSICOES",
                "DATAACOMPANHAMENTO",
                "DIASVERIFICADOS",
                "VERIFICAR",
                "MATERIA_NOME",
                "MATERIA_CARGAHORARIA",
                "MATERIA_TOTALAULAS",
                "MATERIA_PREVISAOINICIO",
                "MATERIA_PREVISAOTERMINO",
                "MATERIA_DATAINICIO",
                "MATERIA_DATATERMINO",
                "MATERIA_AULASCONCLUIDAS",
                "MATERIA_SITUACAOANDAMENTO",
                "MATERIA_CODIGOAPOSTILA",
                "MATERIA_ENTREGAAPOSTILA",
            ],
            situacao: {
                filtrar: "TUDO", classificar: "MAIOR"
            },
            educador: {
                filtrar: "TODOS", classificar: "MAIOR"
            },
            contrato: {
                filtrar: "TUDO", classificar: "MAIOR"
            },
        }
    },
    Precarregamento: async () => {
        const urlQuery = new URLSearchParams(window.location.search);
        console.log("URL Query Parameters:", urlQuery);
        const role = urlQuery.get("role");
        if (!role) {
            return alert("Usuário não autenticado.");
        } else if (role === "COORDENADOR") {
            await UI.StatusBar.Coordenador();
        } else if (role === "SECRETARIA") {
            await UI.StatusBar.Secretaria();
        } else if (role && role.length > 1) {
            await UI.StatusBar.Educador();
        }
        //
        APPVIEW.style.overflow = "hidden";
    },
    Main: async (callback = null) => {
        await App.Precarregamento();
        console.log("App started");
        // Lógica de inicialização aqui:
        // Remover a logo nativa:
        document.getElementById("topbar-logo").src = "files/ico.svg";
        //
        // Barra de status:
        UI.MainGrid.Acompanhamento();
        const tabAndamento = document.getElementById("tab1");
        const tabAcompanhamento = document.getElementById("tab2");
        const tabApostila = document.getElementById("tab3");
        tabAndamento.addEventListener("click", UI.MainGrid.Andamento);
        tabAcompanhamento.addEventListener("click", UI.MainGrid.Acompanhamento);
        tabApostila.addEventListener("click", UI.MainGrid.Apostila);
        //
        await App.Logica.AtualizarUsuarios();
        await App.Logica.AtualizarCadastros();
        // Finalização da inicialização:
        document.getElementById("tools-refresh-btn").onclick = e => {
            e.preventDefault();
            sessionStorage.setItem("history", 1);
            window.location.reload();
        };
        appStatus = document.getElementById("app-status");
        if (callback) callback();
    },
    Coordenador: {
        _: async () => { },
    },
    Secretaria: {
        CadastroAluno: async () => {
            // Lógica para cadastro de aluno
        },
    },
    Educador: {
        RelatorioAndamento: async () => { },
        RelatorioApostilas: async () => { },
        RelatorioReposicoes: async () => { },
        _: async () => { },
    },
    Documentos: {
        CarregarPlanilhaControle: async () => {
            // Lógica para carregar planilha de controle
        },
        CarregarPlanilhaAndamento: async () => {
            // Lógica para carregar planilha de andamento
        },
        DocumentosSalvos: async () => { },
        Download: async () => { },
    },
    Relatorios: {
        Andamento: async () => { },
        Reposicoes: async () => { },
        Apostilas: async () => { },
    },
    Cadastro: {
        Educador: async () => { },
        Aluno: async () => { },
        FormacaoMateria: async () => { },
    },
    Notificacoes: {
        _: async () => { },
    },
    Perfil: {
        _: async () => { },
    },
    Administradores: {
        _: async () => { },
    },
    Configuracoes: {
        Ajustes: async () => { },
        ConfigurarBackup: async () => { },
    },
    Suporte: {
        _: async () => { },
    },
    Logica: {
        Andamento: async (contrato) => {
            const { TOTALSEMANAS, SEMANASCONCLUIDAS, SALDOAULAS, REPOSICOES, DIASVERIFICADOS, VERIFICAR, MATERIA_SITUACAOANDAMENTO, MATERIA_DATAINICIO, MATERIA_DATATERMINO } = contrato;

            function calc(aulas) {
                if (saldoAulas < -12) return "🟥 Muito adiantado";
                if (saldoAulas < -6) return "🟦 Adiantado";
                if (saldoAulas < 0) return "🟨 Atrasado";
                if (saldoAulas >= 0) return "🟩 Em dias";
                if (saldoAulas > 6) return "🟨 Atrasado";
                if (saldoAulas > 12) return "🟥 Muito atrasado";
            };
            const result = { aulas, situacao }
            result.aulas = saldoAulas;
            result.situacao = calc(aulas);
            return result;
        },
        AtualizarUsuarios: async () => {
            App.Usuarios = await App.HttpRequest.Get("/app/usuarios");
            UI.MainGrid.Render(App.Cadastros);
            //
            // Barra de ferramentas:
            const tools = UI.Tools.Render();
            TOPBAR.appendChild(tools);

        },
        AtualizarCadastros: async () => {
            App.Cadastros = await App.HttpRequest.Get("/app/cadastros");
            UI.MainGrid.Render(App.Cadastros);
        },
        CopiarNContrato: async (obj = new Contrato()) => {
            console.log(obj, "CopiarNContrato");
            const contrato = obj["CONTRATO"];
            const input = document.createElement("textarea");
            input.value = contrato;
            input.style.position = "absolute";
            input.style.left = "-9999px";
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            input.remove();
            return contrato;
        },
        CopiarNome: (obj = new Contrato()) => {
            console.log(obj, "CopiarNome");
            const nome = obj["ALUNO"];
            const input = document.createElement("textarea");
            input.value = nome;
            input.style.position = "absolute";
            input.style.left = "-9999px";
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            input.remove();
            return nome;
        },
        AlterarDataTermino: async (obj = new Contrato()) => {
            const modalContent = await Modal.Window("Editar contrato", "Jorge");
            modalContent.style.padding = "5px";
            await Renderer.Load("cadastro", modalContent);
            // Bloquar campos não alteráveis:
            // Obter alterações:
            const res = {};
            //
            // Salvar alterações:
            return;
            App.Cadastros.current = res;
            App.Logica.GravarAlteracoes();
        },
        AlterarEducador: (obj = new Contrato()) => {
            alert("AlterarEducador");
            return;
            //
        },
        AlterarQtdReposicoes: (obj = new Contrato()) => {
            alert("AlterarQtdReposicoes");
            return;
            //
        },
        EditarContrato: (obj = new Contrato()) => {
            alert("EditarContrato");
            return;
            const resultado = App.Cadastros.contratos.map(x => {
                x.Contrato === obj.Contrato
                    ? { ...x, ...obj }
                    : x;
                return x;
            });

        },
        ExcluirContratos: (obj = []) => {
            alert("ExcluirContratos");
            return;
            const contratosRemover = new Set(obj.map(x => x.Contrato));
            const resultado = App.Cadastros.contratos.filter(
                x => !contratosRemover.has(x.Contrato)
            );
            App.Cadastros.contratos = resultado;
            App.Logica.GravarAlteracoes();
        },
        GravarAlteracoes: () => {
            //
        },
    },
    HttpRequest: {
        Get: (path) => {
            const url = appURL + path;
            return new Promise((resolve, reject) => {
                fetch(url).then(res => {
                    if (!res.ok) {
                        reject(new Error(`HTTP error! status: ${res.status}`));
                    } else {
                        res.json().then(data => resolve(data)).catch(err => reject(err));
                    }
                }).catch(err => reject(err));
            });
        },
        Post: (path, data) => {
            const url = appURL + path;
            return new Promise((resolve, reject) => {
                fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                }).then(res => {
                    if (!res.ok) {
                        reject(new Error(`HTTP error! status: ${res.status}`));
                    } else {
                        res.json().then(data => resolve(data)).catch(err => reject(err));
                    }
                }).catch(err => reject(err));
            });
        },
    },
    BufferHttpRequest: {
        Get: async (path) => {
            const url = appURL + path;

            const res = await fetch(url);

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const arrayBuffer = await res.arrayBuffer();

            return arrayBuffer;
        },

        Post: async (path, data) => {
            const url = appURL + path;

            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/octet-stream"
                },
                body: data
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const arrayBuffer = await res.arrayBuffer();

            return arrayBuffer;
        }
    },
    BlobHttpRequest: {
        Get: async (path) => {
            const url = appURL + path;

            const res = await fetch(url);

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            return await res.blob();
        },

        Post: async (path, data) => {
            const url = appURL + path;

            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/octet-stream"
                },
                body: data
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            return await res.blob();
        }
    },
    _pooling: true,
    LongPooling: async () => {
        if (!App._pooling) return;
        const history = sessionStorage.getItem("history") ?? 1;
        if (!history) sessionStorage.setItem("history", 1);
        const path = "/app/pooling/" + history;
        setTimeout(App.LongPooling, 500);
        UI.renderStatus();
        //
        App.HttpRequest.Get(path).then(async data => {
            const { atualizar, version } = data;
            if (Boolean(atualizar)) {
                sessionStorage.setItem("history", version);
                await App.Logica.AtualizarUsuarios();
                await App.Logica.AtualizarCadastros();
            }
        }).catch(err => {
            App._pooling = false;
            Boolean(document.getElementById("modal-container")) ?
                {} :
                Modal.Message(
                    "Erro",
                    "Não foi possível se comunicar com o servidor.",
                    () => window.location.reload()
                );
        });
    },
};

const UI = {
    Menu: {
        Render: async (items = []) => { },
    },
    MainGrid: {
        Acompanhamento: () => {
            const Acompanhamento = [
                [
                    "ALUNO",
                    "CONTRATO",
                    "EDUCADOR",
                    "DIAS AGENDAMENTO",
                    "HORAS AGENDAMENTO",
                    "QUANTIDADE AGENDAMENTOS",
                    "DATA ACOMPANHAMENTO",
                    "AULAS",
                    "AULAS CONCLUÍDAS",
                    "AULAS ATRASADAS",
                    "AULAS RECUPERADAS",
                    "REPOSIÇÕES",
                    "MATÉRIA",
                    "PRÓXIMA MATÉRIA"
                ],
                [
                    "João Silva",
                    "12345",
                    "Amanda",
                    "SEGUNDA, QUARTA, SEXTA",
                    "18:00, 19:00, 20:00, 21:00",
                    "4",
                    "01/01/2024",
                    "16",
                    "5",
                    "3",
                    "2",
                    "1",
                    "EMPREENDEDORISMO",
                    "ESCRITA CONTÁBIL E FISCAL"
                ]
            ];
            //
            const data = [];
            data.push(Acompanhamento[0]);
            for (let i = 0; i < 30; i++) data.push(Acompanhamento[1]);

            // Renderiza o datagrid:
            const dataGrid = new PreparaGrid("DataGridElement", "Acompanhamento", data, document.getElementById("grid-content"),
                x => console.log(x),
                y => console.log(y)
            );
            //
            const tabs = document.querySelectorAll('acacia-tabs-item');
            tabs.forEach((tab, index) => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                });
            });
        },
        Andamento: () => {
            const Andamento = [
                [
                    "ALUNO",
                    "CONTRATO",
                    "EDUCADOR",
                    "DATA INICIAL",
                    "DATA FINAL",
                    "DIAS AGENDAMENTO",
                    "HORAS AGENDAMENTO",
                    "QUANTIDADE AGENDAMENTOS",
                    "RECEBIMENTOS FUTUROS",
                    "QUANTIDADE MATÉRIAS RESTANTES"
                ],
                [
                    "João Silva",
                    "12345",
                    "Amanda",
                    "01/01/2024",
                    "30/06/2024",
                    "SEGUNDA, QUARTA, SEXTA",
                    "18:00, 19:00, 20:00, 21:00",
                    "4",
                    "7",
                    "2"

                ]
            ];
        },
        Apostila: () => {
            const Apostila = [
                [
                    "ALUNO",
                    "CONTRATO",
                    "EDUCADOR",
                    "DIAS AGENDAMENTO",
                    "HORAS AGENDAMENTO",
                    "QUANTIDADE AGENDAMENTOS",
                    "MATÉRIA",
                    "APOSTILA",
                    "ENTREGA FÍSICA",
                    "AULAS CONCLUÍDAS"
                ],
            ];
        },
        Render: () => { }
    },
    Home: {},
    Tools: {
        Render: () => {
            if (document.querySelector(".tools-container")) {
                document.querySelector(".tools-container").remove();
            }
            const span = document.createElement("span");
            span.className = "tools-container";

            function criarLabel(texto) {
                const label = document.createElement("text-label");
                label.textContent = texto;
                return label;
            }
            function criarSelect(opcoesFiltrar, opcoesClassificar) {
                const select = document.createElement("select");
                select.className = "acacia-input";
                const optgroupFiltrar = document.createElement("optgroup");
                optgroupFiltrar.label = "Filtrar";
                opcoesFiltrar.forEach(opt => {
                    const option = document.createElement("option");
                    option.value = opt.value;
                    option.textContent = opt.text;
                    optgroupFiltrar.appendChild(option);
                });
                const optgroupClassificar = document.createElement("optgroup");
                optgroupClassificar.label = "Classificar";

                opcoesClassificar.forEach(opt => {
                    const option = document.createElement("option");
                    option.value = opt.value;
                    option.textContent = opt.text;
                    optgroupClassificar.appendChild(option);
                });
                select.appendChild(optgroupFiltrar);
                select.appendChild(optgroupClassificar);
                return select;
            }

            // Situação
            span.appendChild(criarLabel("Situação:"));
            span.appendChild(criarSelect(
                [
                    { value: "TUDO", text: "Tudo" },
                    { value: "EMDIAS", text: "🟩 Em dias" },
                    { value: "ATRASADO", text: "🟨 Atrasado" },
                    { value: "MUITOATRASADO", text: "🟥 Muito atrasado" },
                    { value: "ADIANTADO", text: "🟦 Adiantado" },
                    { value: "MUITOADIANTADO", text: "🟪 Muito adiantado" }
                ],
                [
                    { value: "MENOR", text: "↑ Menor valor" },
                    { value: "MAIOR", text: "↓ Maior valor" }
                ]
            ));
            // Educador
            span.appendChild(criarLabel("Educador:"));
            const educadores = [];
            Object.keys(App.Usuarios).forEach(key => {
                educadores.push({
                    value: App.Usuarios[key].role,
                    text: `👤 ${UI.toTitleCase(App.Usuarios[key].role)}`
                });
            });
            span.appendChild(criarSelect(
                [
                    { value: "TODOS", text: "Todos" },
                    ...educadores
                ],
                [
                    { value: "MAIOR", text: "↑ Menor valor" },
                    { value: "MENOR", text: "↓ Maior valor" }
                ]
            ));
            // Contrato
            span.appendChild(criarLabel("Contrato:"));
            span.appendChild(criarSelect(
                [
                    { value: "TUDO", text: "Tudo" },
                    { value: "ATIVO", text: "🔲 Ativo" },
                    { value: "INATIVO", text: "🔳 Inativo" },
                    { value: "CONCLUIDO", text: "✅ Concluído" },
                    { value: "CANCELADO", text: "❌ Cancelado" }
                ],
                [
                    { value: "MENOR", text: "↑ Menor valor" },
                    { value: "MAIOR", text: "↓ Maior valor" }
                ]
            ));
            return span;
        },
    },
    StatusBar: {
        Coordenador: async () => {
            BOTTOMBAR.innerHTML = "";
            BOTTOMBAR.innerHTML = '<span id="app-status" style="font-size: x-small;">🟢</span><small> | Bem-vindo(a), <strong style="color: var(--LightGreen)">Coordenador(a)!</strong> Pólo LEM: 🔴 Prepara | IA - Desenvolvedor: <text-link href="https://jorgesouza.com.br" target="_blank">https://jorgesouza.com.br</text-link></small>';
        },
        Secretaria: async () => {
            BOTTOMBAR.innerHTML = "";
            BOTTOMBAR.innerHTML = '<span id="app-status" style="font-size: x-small;">🟢</span><small> | Bem-vindo(a), <strong style="color: var(--LightGreen)">Secretário(a)!</strong> Pólo LEM: 🔴 Prepara | IA - Desenvolvedor: <text-link href="https://jorgesouza.com.br" target="_blank">https://jorgesouza.com.br</text-link></small>';
        },
        Educador: async () => {
            BOTTOMBAR.innerHTML = "";
            BOTTOMBAR.innerHTML = '<span id="app-status" style="font-size: x-small;">🟢</span><small> | Bem-vindo(a), <strong style="color: var(--LightGreen)">Educador(a)!</strong> Pólo LEM: 🔴 Prepara | IA - Desenvolvedor: <text-link href="https://jorgesouza.com.br" target="_blank">https://jorgesouza.com.br</text-link></small>';
        },
    },
    "Perfil": () => {
        alert("Perfil");
    },
    "CarregarPlanilhaControle": () => { },

    /**
     * Endpoint para carregar dados para a aplicação
     * a partir de uma planilha de acompanhamento
     * previamente criada.
     */
    "CarregarPlanilhaAndamento": async () => {
        try {
            const modalContent = await Modal.Window("Atualizar", "");
            await Renderer.Load("upload", modalContent);
            //
            function processFile(file, zoneId) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    // Processar o arquivo:
                    const data = e.target.result;
                    console.log(`Arquivo da zona ${zoneId} carregado:`, file.name);
                    App.HttpRequest.Post("/docs/andamento", { filename: file.name, zona: zoneId, data }).then(response => {
                        const { message, data } = response;
                        const { status, dados } = data;
                        const zona = zoneId.replace("drop-", "");
                        window[zona] = dados ?? null;
                        if (status === "OK") {
                        } else if (status === "CONT") {
                            alert("Dados inválidos enviados na planilha: CONTROLE");
                        } else if (status === "SEGM") {
                            alert("Dados inválidos enviados na planilha: SEGMENTAÇÃO");
                        } else if (window["controle"] && window["segmenta"]) {
                            finishUpload([window["controle"], window["segmenta"]]);
                        } else {
                            alert("Erro ao enviar a planilha para o servidor.");
                        }
                    }).catch(error => {
                        alert("Erro ao enviar a planilha para o servidor.");
                        console.error("Erro ao enviar a planilha para o servidor:", error);
                    });
                    Tooltip.Toast(`Arquivo "${file.name}" carregado com sucesso! (${data.byteLength || data.length} bytes)`, 5);
                };
                reader.readAsBinaryString(file);
            }
            function finishUpload(jsonSheets) {
                const controle = jsonSheets[0];
                const segmenta = jsonSheets[1];
                // Gerar dados de cadastro:
                const cadastros = [];

                const template = {};
                for (let i = 0; i < controle.length; i++) {
                    // Obtém o nome do educador:
                    const r = segmenta.find(e => e["Contrato"] === controle[i]["Contrato"]);
                    template["EDUCADOR"] = r ? r["Nome Educador"] : "###EDUCADOR NÃO ENCONTRADO! PREENCHA MANUALMENTE CLICANDO COM O BOTÃO DIREITO SOBRE O CONTRATO NO GRID PRINCIPAL E ESCOLHENDO A OPÇÃO \"ALTERAR EDUCADOR\".";
                    //
                    template["TOTALSEMANAS"] = null;
                    template["SEMANASCONCLUIDAS"] = null;
                    template["SALDOAULAS"] = null;
                    template["REPOSICOES"] = null;
                    template["DIASVERIFICADOS"] = null;
                    template["VERIFICAR"] = null;
                    template["MATERIA_SITUACAOANDAMENTO"] = null;
                    template["MATERIA_DATAINICIO"] = null;
                    template["MATERIA_DATATERMINO"] = null;
                    //
                    template["CONTRATO"] = controle[i]["Contrato"];
                    template["ALUNO"] = controle[i]["Aluno"];
                    template["STATUS"] = controle[i]["Status"];
                    template["DIAAGENDAMENTO"] = controle[i]["Dias Agendamento"];
                    template["HORASAGENDAMENTO"] = controle[i]["Horas Agendamento"];
                    template["MATERIAATUAL"] = controle[i]["Matéria"];
                    template["PROXIMAMATERIA"] = controle[i]["Próxima Matéria"];
                    template["INICIOCONTRATO"] = Utils.Date(controle[i]["Data Inicial"]);
                    template["TERMINOCONTRATO"] = Utils.Date(controle[i]["Data Final"]);
                    template["AULASCURSO"] = controle[i]["Aulas"];
                    template["AULASCONCLUIDAS"] = controle[i]["Aulas Concluídas"];
                    template["DATAACOMPANHAMENTO"] = Utils.FormatDate(Date.now());
                    template["MATERIA_NOME"] = controle[i]["Matéria"];
                    template["MATERIA_CARGAHORARIA"] = controle[i][""];
                    template["MATERIA_TOTALAULAS"] = controle[i]["Aulas"];
                    template["MATERIA_PREVISAOINICIO"] = Utils.Date(controle[i]["Data Início"]);
                    template["MATERIA_PREVISAOTERMINO"] = Utils.Date(controle[i]["Data Final Prevista"]);
                    template["MATERIA_AULASCONCLUIDAS"] = controle[i]["Aulas Concluídas"];
                    template["MATERIA_CODIGOAPOSTILA"] = controle[i]["Apostila"];
                    template["MATERIA_ENTREGAAPOSTILA"] = controle[i]["Entrega Física"];

                    const resultado = App.Logica.Andamento(template);
                    cadastros.push(resultado);
                }

                delete window["controle"];
                delete window["segmenta"];
            }
            function setupUploadZone(dropZoneId, inputId, btnId, fileNameId) {
                const dropZone = document.getElementById(dropZoneId);
                const fileInput = document.getElementById(inputId);
                const selectBtn = document.getElementById(btnId);
                const fileNameSpan = document.getElementById(fileNameId);

                // Validação e processamento ao selecionar arquivo (código original adaptado)
                fileInput.onchange = async () => {
                    if (!fileInput.files || fileInput.files.length === 0) {
                        return alert("Nenhum arquivo selecionado.");
                    } else if (fileInput.files[0].type !== "application/vnd.ms-excel") {
                        return Tooltip.Toast(`Formato: ${fileInput.files[0].type} não suportado.`, 5);
                    } else if (fileInput.files.length > 1) {
                        return Tooltip.Toast(`Apenas um arquivo por vez.`, 5);
                    }
                    const file = fileInput.files[0];
                    fileNameSpan.textContent = file.name;
                    fileNameSpan.style.color = "var(--LightGreen)";
                    processFile(file, dropZoneId);
                };

                // Abrir seletor ao clicar no botão "Selecionar arquivo"
                selectBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    fileInput.click();
                });

                // Também permite clique em toda a zona para abrir o seletor
                dropZone.addEventListener('click', (e) => {
                    // Evita abrir duas vezes se o clique foi no botão (já tratado)
                    if (e.target !== selectBtn && !selectBtn.contains(e.target)) {
                        fileInput.click();
                    }
                });

                // Prevenir comportamento padrão para permitir drop
                ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                    dropZone.addEventListener(eventName, (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    });
                });

                // Feedback visual ao arrastar sobre a zona
                dropZone.addEventListener('dragover', () => {
                    dropZone.classList.add('dragover');
                });

                dropZone.addEventListener('dragleave', () => {
                    dropZone.classList.remove('dragover');
                });

                // Processar arquivo solto
                dropZone.addEventListener('drop', (e) => {
                    dropZone.classList.remove('dragover');
                    const dt = e.dataTransfer;
                    if (dt.files && dt.files.length > 0) {
                        // Simula a seleção no input file para reutilizar a validação
                        // Criamos um DataTransfer para atribuir ao input (compatível com navegadores modernos)
                        const dataTransfer = new DataTransfer();
                        // Só pegamos o primeiro arquivo (mas mantemos a validação de múltiplos)
                        const droppedFile = dt.files[0];
                        // Verifica tipo antes de atribuir (a validação do onchange fará o resto)
                        if (dt.files.length > 1) {
                            alert("Apenas um arquivo por vez.");
                            return;
                        }
                        if (droppedFile.type !== "application/vnd.ms-excel") {
                            Tooltip.Toast(`Formato: ${droppedFile.type} não suportado.`, 5);
                            console.log(droppedFile.type);
                            return;
                        }
                        dataTransfer.items.add(droppedFile);
                        fileInput.files = dataTransfer.files;
                        // Dispara o evento change manualmente
                        fileInput.dispatchEvent(new Event('change'));
                    }
                });
            }
            setupUploadZone('drop-controle', 'fileInput1', 'selectBtn1', 'fileName1');
            setupUploadZone('drop-segmenta', 'fileInput2', 'selectBtn2', 'fileName2');

        } catch (error) {
            Modal.Error("Erro ao carregar planilhas", error, true);
            console.error("Erro ao carregar a planilha de andamento:", error);
        }
    },

    /**
     * Endpoint para baixar uma planilha de andamento
     * a partir dos dados de cadastro existentes.
     */
    "GerarPlanilhaAndamento": () => {
        console.log("GerarPlanilhaAndamento");
        return new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(appURL + "/docs/andamento", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
                console.log("Resposta recebida:", response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                // Baixar o XLSX gerado pelo servidor:
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "planilha_andamento.xlsx";
                a.click();
                window.URL.revokeObjectURL(url);
                console.log("Planilha de andamento gerada com sucesso!");
                resolve();
            } catch (error) {
                console.error("Erro ao gerar a planilha de andamento:", error);
                reject(error);
            }
        });
    },
    "Relatorios": () => {
        alert("Relatorios");
    },
    "Cadastros": () => {
        alert("Cadastros");
    },
    "Documentos": () => {
        alert("Documentos");
    },
    "Suporte": () => {
        alert("Suporte");
    },
    renderStatus: () => {
        if (index > 100) {
            appStatus.style.opacity = "0";
            index = 0;
        } else {
            appStatus.style.opacity = (index / 100).toString();
            index += 50;
        }
    },
    toTitleCase: (str) => {
        return str.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }
};

const Utils = {
    Date: (serial) => {
        const base = new Date(Date.UTC(1899, 11, 30)); // 30/12/1899
        const msPorDia = 86400000;
        const data = new Date(base.getTime() + serial * msPorDia);

        const dia = String(data.getUTCDate()).padStart(2, "0");
        const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
        const ano = data.getUTCFullYear();

        return `${dia}/${mes}/${ano}`;
    },
    FormatDate: (timestamp) => {
        const date = new Date(timestamp);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    },
    _: () => { }
};

// Cria a aplicação:
const topMenu = {
    "☰ Menu": [
        { title: "📂 Atualizar Cadastros", action: UI.CarregarPlanilhaAndamento },
        { title: "💾 Gerar Planilha de Acompanhamento", action: UI.GerarPlanilhaAndamento },
        { title: "👦 Perfil", action: UI.Perfil },
        { title: "👨‍🏫 Cadastros", action: UI.Cadastros },
        { title: "📄 Documentos", action: UI.Documentos },
        { title: "⚙️ Configurações", action: UI.Configuracoes },
        { title: "ℹ️ Suporte", action: UI.Suporte },
        { title: "⛔ Sair", action: x => window.location = "/" }
    ]

};
//
import { AcaciaDesktop } from './lib/acacia/acacia.js';

const acacia = new AcaciaDesktop("Prepara LEM | Acompanhamento Pedagógico", topMenu, () => { App.Main(App.LongPooling) });
//
let KaatanConsoleBrand = `
██   ██  █████   █████  ████████  █████  ███    ██
██  ██  ██   ██ ██   ██    ██    ██   ██ ████   ██
█████   ███████ ███████    ██    ███████ ██ ██  ██
██  ██  ██   ██ ██   ██    ██    ██   ██ ██  ██ ██
██   ██ ██   ██ ██   ██    ██    ██   ██ ██   ████
    `;
console.log(KaatanConsoleBrand);

document.getElementById("favicon").href = "./files/ico.svg";

window.App = App;

// #region Modelos

class Contrato {
    "CONTRATO";
    "ALUNO";
    "STATUS";
    "EDUCADOR";
    "DIAAGENDAMENTO";
    "HORASAGENDAMENTO";
    "MATERIAATUAL";
    "PROXIMAMATERIA";
    "INICIOCONTRATO";
    "TERMINOCONTRATO";
    "TOTALSEMANAS";
    "SEMANASCONCLUIDAS";
    "AULASCURSO";
    "AULASCONCLUIDAS";
    "SALDOAULAS";
    "REPOSICOES";
    "DATAACOMPANHAMENTO";
    "DIASVERIFICADOS";
    "VERIFICAR";
    "MATERIA" = new Materia();
}

class Materia {
    "MATERIA_NOME";
    "MATERIA_CARGAHORARIA";
    "MATERIA_TOTALAULAS";
    "MATERIA_PREVISAOINICIO";
    "MATERIA_PREVISAOTERMINO";
    "MATERIA_DATAINICIO";
    "MATERIA_DATATERMINO";
    "MATERIA_AULASCONCLUIDAS";
    "MATERIA_SITUACAOANDAMENTO";
    "MATERIA_CODIGOAPOSTILA";
    "MATERIA_ENTREGAAPOSTILA";
}

/**
 * Representa uma célula que pode conter um valor simples ou uma estrutura de fórmula.
 * Encapsula a extração do valor efetivo (resultado calculado) e preserva metadados.
 */
class Cell {
    #raw;
    #effectiveValue;

    constructor(rawValue) {
        this.#raw = rawValue;
        this.#effectiveValue = this.#extractEffectiveValue(rawValue);
    }

    #extractEffectiveValue(raw) {
        if (raw === null || raw === undefined) return null;
        if (typeof raw !== 'object') return raw;

        // Se for um objeto com a propriedade "result", usa esse valor.
        if ('result' in raw) {
            const result = raw.result;
            // Trata erros do Excel (ex: { error: "#REF!" })
            if (result && typeof result === 'object' && result.error) {
                return result.error;
            }
            return result;
        }

        // Se for um objeto com "formula" mas sem "result", retorna null ou a própria fórmula?
        // Para consistência, retornamos null, mas poderíamos expor a fórmula.
        if ('formula' in raw) {
            // Poderia retornar raw.formula, mas mantemos o comportamento padrão de valor efetivo.
            return null;
        }

        // Caso genérico: retorna o próprio objeto (pode ocorrer em sharedFormula sem result)
        return raw;
    }

    /** Retorna o valor efetivo da célula (resultado da fórmula, valor bruto ou erro) */
    get value() {
        return this.#effectiveValue;
    }

    /** Retorna o conteúdo original (útil para debug ou exportação) */
    get raw() {
        return this.#raw;
    }

    /** Verifica se a célula contém um erro (ex: "#REF!") */
    isError() {
        return typeof this.#effectiveValue === 'string' && this.#effectiveValue.startsWith('#');
    }

    toJSON() {
        return this.#effectiveValue;
    }
}
/**
 * Representa uma linha da planilha.
 * Armazena internamente um Map (chave → instância de Cell).
 */
class Row {
    #data;

    constructor(data = {}) {
        this.#data = new Map();
        for (const [key, rawValue] of Object.entries(data)) {
            this.#data.set(key, new Cell(rawValue));
        }
    }

    /**
     * Retorna o valor efetivo associado a uma chave.
     * @param {string} key - Nome da coluna.
     * @returns {*} Valor efetivo ou undefined se não existir.
     */
    get(key) {
        const cell = this.#data.get(key);
        return cell ? cell.value : undefined;
    }

    /**
     * Retorna a instância de Cell associada à chave (acesso a metadados).
     * @param {string} key
     * @returns {Cell|undefined}
     */
    getCell(key) {
        return this.#data.get(key);
    }

    /**
     * Define ou atualiza o valor de uma chave na linha.
     * @param {string} key
     * @param {*} value - Valor bruto (será convertido em Cell).
     * @returns {Row}
     */
    set(key, value) {
        this.#data.set(key, new Cell(value));
        return this;
    }

    /**
     * Remove uma chave da linha.
     * @param {string} key
     * @returns {Row}
     */
    remove(key) {
        this.#data.delete(key);
        return this;
    }

    /**
     * Converte a linha em um objeto simples com valores efetivos.
     * @returns {Object<string, *>}
     */
    toObject() {
        const obj = {};
        for (const [key, cell] of this.#data) {
            obj[key] = cell.value;
        }
        return obj;
    }

    /**
     * Exporta a linha com os dados brutos (incluindo metadados de fórmula).
     * Útil para recriar o formato original.
     * @returns {Object<string, *>}
     */
    toRawObject() {
        const obj = {};
        for (const [key, cell] of this.#data) {
            obj[key] = cell.raw;
        }
        return obj;
    }
}
/**
 * Representa uma visão de uma coluna dentro de uma Sheet.
 * Opera diretamente sobre as linhas, retornando valores efetivos.
 */
class Column {
    #sheet;
    #name;

    constructor(sheet, name) {
        this.#sheet = sheet;
        this.#name = name;
        if (!this.#sheet.getHeaders().includes(name)) {
            throw new Error(`Column "${name}" does not exist`);
        }
    }

    /**
     * Retorna o valor efetivo da coluna em uma linha específica.
     * @param {number} index
     * @returns {*}
     */
    get(index) {
        const row = this.#sheet.getRows()[index];
        return row ? row.get(this.#name) : undefined;
    }

    /**
     * Define o valor da coluna em uma linha específica.
     * @param {number} index
     * @param {*} value
     * @returns {Column}
     */
    set(index, value) {
        const row = this.#sheet.getRows()[index];
        if (row) row.set(this.#name, value);
        return this;
    }

    /**
     * Retorna todos os valores efetivos da coluna.
     * @returns {Array<*>}
     */
    getAll() {
        return this.#sheet.getRows().map(r => r.get(this.#name));
    }

    /**
     * Define os valores da coluna em todas as linhas.
     * @param {Array<*>} values
     * @returns {Column}
     */
    setAll(values) {
        this.#sheet.getRows().forEach((row, i) => {
            row.set(this.#name, values[i] ?? null);
        });
        return this;
    }

    /**
     * Aplica uma função de transformação aos valores efetivos.
     * @param {function(*, number): *} fn
     * @returns {Array<*>}
     */
    map(fn) {
        return this.getAll().map(fn);
    }

    /**
     * Itera sobre os valores efetivos da coluna.
     * @param {function(*, number): void} fn
     */
    forEach(fn) {
        this.#sheet.getRows().forEach((row, i) => {
            fn(row.get(this.#name), i);
        });
    }

    /**
     * Remove a coluna da planilha.
     * @returns {Column}
     */
    remove() {
        this.#sheet.removeColumn(this.#name);
        return this;
    }

    /**
     * Renomeia a coluna.
     * @param {string} newName
     * @returns {Column}
     */
    rename(newName) {
        const headers = this.#sheet.getHeaders();
        if (headers.includes(newName)) {
            throw new Error("Column already exists");
        }
        this.#sheet.getRows().forEach(row => {
            const cell = row.getCell(this.#name);
            const rawValue = cell ? cell.raw : null;
            row.set(newName, rawValue);
            row.remove(this.#name);
        });
        this.#sheet.removeColumn(this.#name);
        this.#sheet.addColumn(newName);
        this.#name = newName;
        return this;
    }
}
/**
 * Representa uma planilha (sheet) com cabeçalhos e linhas.
 * Processa dados brutos no formato Excel (A1, B2, ...) extraídos de rawData.json.
 */
class Sheet {
    #name;
    #headers = [];
    #rows = [];

    /**
     * @param {string} name - Nome da planilha.
     * @param {Object[]} [rawData=[]] - Array de objetos representando linhas (ex: rawData.json).
     */
    constructor(name, rawData = []) {
        this.#name = name;
        if (rawData.length === 0) return;
        this.#parse(rawData);
    }

    /**
     * Processa os dados brutos: extrai cabeçalhos da primeira linha e converte as demais em Row.
     * @private
     */
    #parse(raw) {
        if (raw.length === 0) return;

        const headerRow = raw[0];
        // Mapeia letra da coluna → nome do cabeçalho (ex: "A" → "ALUNOS ")
        const columnMap = new Map();
        for (const [cellRef, headerValue] of Object.entries(headerRow)) {
            const colLetter = cellRef.replace(/\d+$/, ''); // "A1" → "A"
            // headerValue pode ser string ou objeto de fórmula; usamos o valor efetivo
            const headerCell = new Cell(headerValue);
            columnMap.set(colLetter, headerCell.value?.toString().trim() || '');
        }

        this.#headers = Array.from(columnMap.values());

        // Processa as linhas de dados (índices 1 em diante)
        for (let i = 1; i < raw.length; i++) {
            const rawRow = raw[i];
            const rowData = {};

            for (const [cellRef, rawValue] of Object.entries(rawRow)) {
                const colLetter = cellRef.replace(/\d+$/, '');
                const header = columnMap.get(colLetter);
                if (header !== undefined) {
                    rowData[header] = rawValue;
                }
                // Se não houver cabeçalho mapeado, ignora (colunas extras)
            }

            // Preenche colunas ausentes com null
            for (const header of this.#headers) {
                if (!(header in rowData)) {
                    rowData[header] = null;
                }
            }

            this.#rows.push(new Row(rowData));
        }
    }

    /** @returns {string} Nome da planilha */
    get name() {
        return this.#name;
    }

    /** @returns {string[]} Lista de cabeçalhos */
    getHeaders() {
        return [...this.#headers];
    }

    /** @returns {Row[]} Lista de linhas */
    getRows() {
        return this.#rows;
    }

    /**
     * Adiciona uma nova linha.
     * @param {Object<string, *>} data
     * @returns {Row}
     */
    addRow(data) {
        const normalized = {};
        for (const header of this.#headers) {
            normalized[header] = data[header] ?? null;
        }
        const row = new Row(normalized);
        this.#rows.push(row);
        return row;
    }

    /**
     * Remove uma linha pelo índice.
     * @param {number} index
     * @returns {Sheet}
     */
    removeRow(index) {
        this.#rows.splice(index, 1);
        return this;
    }

    /**
     * Adiciona uma nova coluna.
     * @param {string} name
     * @param {*} [defaultValue=null]
     * @returns {Sheet}
     */
    addColumn(name, defaultValue = null) {
        if (!this.#headers.includes(name)) {
            this.#headers.push(name);
        }
        this.#rows.forEach(row => {
            row.set(name, defaultValue);
        });
        return this;
    }

    /**
     * Remove uma coluna.
     * @param {string} name
     * @returns {Sheet}
     */
    removeColumn(name) {
        this.#headers = this.#headers.filter(h => h !== name);
        this.#rows.forEach(row => row.remove(name));
        return this;
    }

    /**
     * Obtém uma referência para manipulação de uma coluna específica.
     * @param {string} name
     * @returns {Column}
     */
    column(name) {
        return new Column(this, name);
    }

    /**
     * Exporta a planilha para um array de objetos com valores efetivos.
     * @returns {Object[]}
     */
    toJSON() {
        return this.#rows.map(row => row.toObject());
    }

    /**
     * Exporta a planilha para o formato bruto (similar ao rawData.json).
     * @returns {Object[]}
     */
    toRawJSON() {
        if (this.#rows.length === 0) return [];

        // Reconstrói a linha de cabeçalho no formato "A1", "B1", etc.
        const headerRow = {};
        const colLetters = this.#headers.map((_, idx) => {
            let n = idx;
            let letter = '';
            while (n >= 0) {
                letter = String.fromCharCode((n % 26) + 65) + letter;
                n = Math.floor(n / 26) - 1;
            }
            return letter;
        });

        colLetters.forEach((letter, i) => {
            headerRow[`${letter}1`] = this.#headers[i];
        });

        const result = [headerRow];

        // Adiciona linhas de dados
        for (let i = 0; i < this.#rows.length; i++) {
            const row = this.#rows[i];
            const rawRow = {};
            colLetters.forEach((letter, colIdx) => {
                const header = this.#headers[colIdx];
                const cell = row.getCell(header);
                rawRow[`${letter}${i + 2}`] = cell ? cell.raw : null;
            });
            result.push(rawRow);
        }

        return result;
    }

    /**
     * Converte a planilha para o formato exigido pela função XLSXWriter.
     * @returns {{ name: string, rows: Object[] }} Objeto contendo nome da planilha e array de linhas (objetos planos).
     * @example
     * const sheet = new Sheet("Dados", rawData);
     * const output = sheet.toXLSXFormat();
     * // output = [{ name: "Dados", rows: [ { "ALUNOS ": "MIGUEL PIRES...", ... }, ... ] }]
     * 
     * // Uso com XLSXWriter:
     * await XLSXWriter(sheet.toXLSXFormat(), './output.xlsx');
     */
    toXLSXFormat() {
        return [{
            name: this.#name,
            rows: this.#rows.map(row => row.toObject())
        }];
    }
}

/**
 * Essa classe é uma cópia da classe Datagrid da biblioteca Acácia
 * para aceitar a manipulação de contratos semanticamente.
 */
class PreparaGrid {
    constructor(gridID, title, sourceData, target, selectCB, allSelectedCB) {
        sourceData = this.dataHandle(sourceData);
        const datagridElement = document.createElement("data-grid");
        datagridElement.id = gridID;
        target.appendChild(datagridElement);
        App.Cadastros.sourceLength = sourceData.length - 1;
        const datagridTitle = document.createElement("data-grid-title");
        datagridTitle.textContent = title;
        datagridElement.appendChild(datagridTitle);
        const headersElement = document.createElement("data-grid-headers");
        headersElement.onclick = () => this.selectAll(gridID, selectCB, allSelectedCB);
        const headCheckbox = document.createElement("data-grid-head");
        const input = document.createElement("input");
        input.setAttribute("type", "checkbox");
        input.setAttribute("id", `${gridID}-chk`);
        headCheckbox.append(input);
        headersElement.append(headCheckbox);
        const headers = sourceData[0];
        headers.forEach(header => {
            const head = document.createElement("data-grid-head");
            head.textContent = header;
            headersElement.append(head);
        });
        datagridElement.appendChild(headersElement);
        sourceData.slice(1).forEach((rowData, rowIndex) => {
            const row = document.createElement("data-grid-row");
            const cellCheckbox = document.createElement("data-grid-cell");
            const input = document.createElement("input");
            input.setAttribute("type", "checkbox");
            input.setAttribute("id", `${gridID}-chk-${rowIndex}`);
            cellCheckbox.append(input);
            row.append(cellCheckbox);
            rowData.forEach(cellData => {
                const cell = document.createElement("data-grid-cell");
                cell.textContent = cellData;
                row.append(cell);
            });
            row.setAttribute("id", `${gridID}-${rowIndex}`);
            row.onclick = () => {
                this.selectRow(`${gridID}-${rowIndex}`, `${gridID}`, selectCB, allSelectedCB);
            };
            row.oncontextmenu = (e) => {
                e.preventDefault();
                this.selectRow(`${gridID}-${rowIndex}`, `${gridID}`, selectCB, allSelectedCB, true);
            };
            datagridElement.appendChild(row);
        });
    }
    selectRow(rowID, gridID, selectCB, allSelectedCB, context = false) {
        const row = document.getElementById(rowID);
        const cells = row.querySelectorAll("data-grid-cell");
        const headers = document.querySelectorAll(`data-grid#${gridID} data-grid-headers data-grid-head`);
        const input = document.querySelector(`#${rowID} input[type="checkbox"]`);
        const obj = {};
        input.checked = !input.checked;
        for (let index = 1; index < headers.length; index++) {
            const key = headers[index].textContent;
            const value = cells[index].textContent;
            obj[key] = value;
        }
        this.selectedRows(gridID, selectCB, allSelectedCB);
        App.Cadastros.current = obj;
        console.log("App.Cadastros.current: ", App.Cadastros.current);
        if (!context) return;
        Tooltip.Context([
            {
                Title: "Copiar Nº Contrato",
                Ico: "files/copy.svg",
                Action: () => App.Logica.CopiarNContrato(App.Cadastros.current)
            },
            {
                Title: "Copiar Nome",
                Ico: "files/copy.svg",
                Action: () => App.Logica.CopiarNome(App.Cadastros.current)
            },
            {
                Title: "Alterar Data Término",
                Ico: "files/settings.svg",
                Action: () => App.Logica.AlterarDataTermino(App.Cadastros.current)
            },
            {
                Title: "Alterar Educador",
                Ico: "files/settings.svg",
                Action: () => App.Logica.AlterarEducador(App.Cadastros.current)
            },
            {
                Title: "Alterar Reposições",
                Ico: "files/settings.svg",
                Action: () => App.Logica.AlterarQtdReposicoes(App.Cadastros.current)
            },
            {
                Title: "Editar",
                Ico: "files/edit.svg",
                Action: () => App.Logica.EditarContrato(App.Cadastros.current)
            }
        ]);
    }
    selectedRows(gridID, selectCB, allSelectedCB) {
        App.Cadastros.selection = [];
        const headers = document.querySelectorAll(`data-grid#${gridID} data-grid-headers data-grid-head`);
        const rows = document.querySelectorAll(`data-grid#${gridID} data-grid-row`);
        rows.forEach(row => {
            const input = row.querySelector(`input[type="checkbox"]`);
            const cells = row.querySelectorAll("data-grid-cell");
            if (input.checked) {
                const obj = {};
                for (let index = 1; index < headers.length; index++) {
                    const key = headers[index].textContent;
                    const value = cells[index].textContent;
                    obj[key] = value;
                }
                App.Cadastros.selection.push(obj);
            }
        });
        App.Cadastros.selectionCount = App.Cadastros.selection.length;
        const allSelected = App.Cadastros.selectionCount === App.Cadastros.sourceLength;
        App.Cadastros.allSelected = allSelected;
        document.getElementById(`${gridID}-chk`).checked = allSelected;
        allSelected ? allSelectedCB(App.Cadastros.selectionCount) : selectCB(App.Cadastros.selection);
    }
    selectAll(gridID, selectCB, allSelectedCB) {
        const rows = document.querySelectorAll(`data-grid#${gridID} data-grid-row`);
        const inputAll = document.getElementById(`${gridID}-chk`);
        inputAll.checked = !inputAll.checked;
        App.Cadastros.selection = [];
        rows.forEach(row => {
            const input = row.querySelector(`input[type="checkbox"]`);
            input.checked = inputAll.checked;
            if (inputAll.checked) {
                const headers = document.querySelectorAll(`data-grid#${gridID} data-grid-headers data-grid-head`);
                const cells = row.querySelectorAll("data-grid-cell");
                const obj = {};
                for (let index = 1; index < headers.length; index++) {
                    const key = headers[index].textContent;
                    const value = cells[index].textContent;
                    obj[key] = value;
                }
                App.Cadastros.selection.push(obj);
            }
        });
        App.Cadastros.selectionCount = App.Cadastros.selection.length;
        App.Cadastros.allSelected = App.Cadastros.selectionCount === App.Cadastros.sourceLength;
        allSelectedCB(App.Cadastros.selectionCount);
    }

    /**
     * const data = [
     *   ["Head 1", "Head 2", "Head 3"],
     *   ["Value 1", "Value 2", "Value 3", "Extra Value"],
     *   ["Value 4", "Value 5"]
     * ];
     * const result = adjustMatrix(data);
     * console.log(result);
     * // Output:
     * // [
     * //   ["Head 1", "Head 2", "Head 3"],
     * //   ["Value 1", "Value 2", "Value 3"],
     * //   ["Value 4", "Value 5", ""]
     * // ]
     */
    dataHandle(data) {
        if (!Array.isArray(data) || data.length === 0 || !Array.isArray(data[0])) {
            throw new Error("Invalid input: data must be a non-empty multidimensional array.");
        }
        const headers = data[0]; // Assume the first subarray contains headers
        const maxLength = headers.length;
        // Adjust each row based on the headers length
        return data.map((row, rowIndex) => {
            if (rowIndex === 0) {
                // Keep headers as is
                return row.slice(0, maxLength);
            }
            // If the row has more items than headers, truncate it
            if (row.length > maxLength) {
                return row.slice(0, maxLength);
            }
            // If the row has fewer items than headers, pad with empty strings
            return [...row, ...Array(maxLength - row.length).fill("")];
        });
    }
}
// #endregion

// EOF