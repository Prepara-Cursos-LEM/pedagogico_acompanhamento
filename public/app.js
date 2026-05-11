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
            gridAtual: "andamento",
            //actualGrid: "andamento",
            //actualGrid: "apostila",
            colunas: [],
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
        await App.Logica.AtualizarUsuarios();
        await App.Logica.AtualizarCadastros();
        // Barra de status:
        UI.MainGrid.Render();
        const tabAndamento = document.getElementById("tab1");
        const tabAcompanhamento = document.getElementById("tab2");
        const tabApostila = document.getElementById("tab3");

        tabAndamento.addEventListener("click", () => {
            App.Cadastros.filtros.gridAtual = "andamento";
            UI.MainGrid.Render();
        });

        tabAcompanhamento.addEventListener("click", () => {
            App.Cadastros.filtros.gridAtual = "acompanhamento";
            UI.MainGrid.Render();
        });

        tabApostila.addEventListener("click", () => {
            App.Cadastros.filtros.gridAtual = "apostila";
            UI.MainGrid.Render();
        });

        //
        // Finalização da inicialização:
        document.getElementById("tools-refresh-btn").onclick = async e => {
            e.preventDefault();
            if (await Modal.Confirm("Recarregar?", "A aplicação atualiza os dados em tempo real. Se notou algum comportamento estranho ou dados inconsistentes você pode forçar um recarregamento limpo confirmando no botão abaixo. Tem certeza?")) {
                sessionStorage.setItem("history", 1);
                window.location.reload();
            }
        };
        document.getElementById("print-btn").onclick = () => {
            localStorage.setItem("print-dados", JSON.stringify(App.Cadastros.selection));
            window.open("print.html", "_blank");
        };
        document.getElementById("update-btn").onclick = () => {
            const modalText = `
            Realizar um novo acompanhamento? O Acompanhamento anterior será arquivado
            e poderá ser verificado selecionando na caixa de seleção ao lado.
            Para realizar o acompanhamento é necessário haver baixado previamente
            as planilhas de Controle Pedagógico e Segmentação Aluno Educador.
            Para saber como exportar as planilhas do Hub clique no menu e selecione
            Suporte.
            `;
            Modal.Confirm("Novo Acompanhamento", modalText).then(response => {
                if (response) {
                    UI.CarregarPlanilhas();
                }
            });
        }
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
        DocumentosSalvos: async () => { },
        Upload: async (controle, segmenta) => { },
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
            // Barra de ferramentas:
            const tools = UI.Tools.Render();
            TOPBAR.appendChild(tools);

        },
        AtualizarCadastros: async () => {
            const { cadastros, atualizacoes } = await App.HttpRequest.Get("/app/cadastros");
            App.Cadastros.contratos = cadastros;
            let atualizaSelect = document.getElementById("atualizacoes");
            atualizaSelect.innerHTML = "";
            const option1 = document.createElement("option");
            option1.value = atualizacoes.update;
            option1.textContent = "Atual";
            atualizaSelect.appendChild(option1);
            Object.keys(atualizacoes.lasts).forEach(x => {
                const option2 = document.createElement("option");
                option2.value = x;
                option2.textContent = x;
                atualizaSelect.appendChild(option2);
            });
            UI.MainGrid.Render();
        },
        CopiarNContrato: () => {
            const resultado = App.Cadastros.current;
            const contrato = resultado["CONTRATO"];
            const input = document.createElement("textarea");
            input.value = contrato;
            input.style.position = "absolute";
            input.style.left = "-9999px";
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            input.remove();
            Tooltip.Toast("Número do contrado copiado: " + contrato, 5);
            return contrato;
        },
        CopiarNome: () => {
            const resultado = App.Cadastros.current;
            const nome = resultado["ALUNO"];
            const input = document.createElement("textarea");
            input.value = nome;
            input.style.position = "absolute";
            input.style.left = "-9999px";
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            input.remove();
            Tooltip.Toast("Nome copiado: " + nome, 5);
            return nome;
        },
        AlterarDataTermino: async () => {
            const resultado = App.Cadastros.current;
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
        AlterarEducador: () => {
            const resultado = App.Cadastros.current;
            Tooltip.Toast("Contrato selecionado: " + resultado["CONTRATO"] + "<br>Nome: " + resultado["ALUNO"], 5);
            //
        },
        InserirReposicao: () => {
            const resultado = App.Cadastros.current;
            Tooltip.Toast("Contrato selecionado: " + resultado["CONTRATO"] + "<br>Nome: " + resultado["ALUNO"], 5);
            //
        },
        InserirFolga: () => {
            const resultado = App.Cadastros.current;
            Tooltip.Toast("Contrato selecionado: " + resultado["CONTRATO"] + "<br>Nome: " + resultado["ALUNO"], 5);
            //
        },
        EditarContrato: async () => {
            const resultado = App.Cadastros.current;
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
        ExcluirContratos: (obj = []) => {
            const resultado = App.Cadastros.current;
            Tooltip.Toast("Contrato selecionado: " + resultado["Contrato"] + "<br>Nome: " + resultado["Aluno"], 7);
            //
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
        setTimeout(App.LongPooling, 100);
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
        colunas: {
            acompanhamento: [
                "NOME",
                "AULASCURSO",
                "PREVISAOINICIO",
                "PREVISAOTERMINO",
                "AULASCONCLUIDAS",
                "CODIGOAPOSTILA",
                "ENTREGAAPOSTILA",
                "HORASAGENDAMENTO",
                "SALDOAULAS",
                "SALDOCONTRATO",
                "STATUS",
                "AULASPLANEJADAS",
                "AULASRECUPERADAS",
                "ATRASO",
                "SITUACAOANDAMENTO",
                "DATAINICIO",
                "DATATERMINO",
            ],
            andamento: [
                "CONTRATO",
                "ALUNO",
                "STATUS",
                "EDUCADOR",
                "MATERIAATUAL",
                "PROXIMAMATERIA",
                "INICIOCONTRATO",
                "TERMINOCONTRATO",
                "TOTALSEMANAS",
                "SEMANASCONCLUIDAS",
                "SALDOAULAS",
                "REPOSICOES",
                "PARCELAS",
                "DATAACOMPANHAMENTO",
                "DIASVERIFICADOS",
                "VERIFICAR",
            ],
            apostila: [
                "AULASCONCLUIDAS",
                "PROXIMAMATERIA",
                "SEM CÓDIGO",
                "ENTREGUE",
                "CÓD. CADASTRADO",
            ]
        },
        acompanhamento: () => {
            const data = [];

            const headers = [
                "CONTRATO",
                "ALUNO",
                "MATERIA",
                "AULAS-MATERIA",
                "AULAS-CONCLUIDAS",
                "SITUACAO",
                "AULAS-RECUPERADAS",
                "AULAS-DIFERENCA",
                "DATA-ACOMPANHAMENTO"
            ];

            data.push(headers);

            Object.keys(App.Cadastros.contratos).forEach(contrato => {

                const c = App.Cadastros.contratos[contrato];

                c["MATERIAS"].forEach(materia => {

                    const arr = [];

                    arr.push(c["CONTRATO"]);
                    arr.push(c["ALUNO"]);

                    arr.push(materia["MATERIA"]);
                    arr.push(materia["AULAS-MATERIA"]);
                    arr.push(materia["AULAS-CONCLUIDAS"]);

                    arr.push(c["Detalhes"]["SITUACAO"]);

                    // Não existe no objeto original
                    arr.push(c["Detalhes"]["AULAS-RECUPERADAS"] || 0);

                    arr.push(c["Detalhes"]["AULAS-DIFERENCA"]);
                    arr.push(c["Detalhes"]["DATA-ACOMPANHAMENTO"]);

                    data.push(arr);

                });

            });

            return data;
        },
        andamento: () => {
            const data = [];
            const ignorar = ["MATERIAS", "ENTREGA-FISICA", "CODIGO-APOSTILA", "Detalhes"];

            const headers = Object.keys(App.Cadastros.contratos[0])
                .filter(x => !ignorar.includes(x));
            data.push(headers);
            App.Cadastros.contratos.forEach(contrato => {
                const values = Object.values(contrato);
                const arr = [];
                headers.forEach((key, index) => arr.push(values[index]));
                data.push(arr);
            });
            return data;
        },
        apostila: () => {
            App.Cadastros.filtros.gridAtual = "apostila";
            const data = [];
            const headers = Object.keys(App.Cadastros.contratos[0]);
            data.push(headers);
            App.Cadastros.contratos.forEach(contrato => {
                const keys = Object.keys(contrato);
                const values = Object.values(contrato);
                const arr = [];
                keys.forEach((key, index) => {
                    if (key != "MATERIAS") {
                        arr.push(values[index]);
                    } else {

                    }
                });
                data.push(arr);
            });
            UI.MainGrid.Render(data);
        },
        // Renderiza o datagrid:
        Render: () => {
            const data = UI.MainGrid[App.Cadastros.filtros.gridAtual]();
            const guia = App.Cadastros.filtros.gridAtual;
            const dataGrid = new PreparaGrid("DataGridElement", guia, data, document.getElementById("grid-content"),
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
        }
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
            function criarSelect(opcoesFiltrar) {
                const select = document.createElement("select");
                select.className = "acacia-input";
                opcoesFiltrar.forEach(opt => {
                    const option = document.createElement("option");
                    option.value = opt.value;
                    option.textContent = opt.text;
                    select.appendChild(option);
                });
                const optgroupClassificar = document.createElement("optgroup");
                optgroupClassificar.label = "Classificar";
                return select;
            }

            // Situação
            span.appendChild(criarLabel("Situação:"));
            span.appendChild(criarSelect([
                { value: "TUDO", text: "Tudo" },
                { value: "EMDIAS", text: "🟩 Em dias" },
                { value: "ATRASADO", text: "🟨 Atrasado" },
                { value: "MUITOATRASADO", text: "🟥 Muito atrasado" },
                { value: "ADIANTADO", text: "🟦 Adiantado" },
                { value: "MUITOADIANTADO", text: "🟪 Muito adiantado" }
            ]));
            // Educador
            span.appendChild(criarLabel("Educador:"));
            const educadores = [];
            Object.keys(App.Usuarios).forEach(key => {
                educadores.push({
                    value: App.Usuarios[key].role,
                    text: `👤 ${Utils.Text.toTitleCase(App.Usuarios[key].role)}`
                });
            });
            span.appendChild(criarSelect([
                { value: "TODOS", text: "Todos" },
                ...educadores
            ]));

            return span;
        },
    },
    StatusBar: {
        Coordenador: async () => {
            BOTTOMBAR.innerHTML = "";
            BOTTOMBAR.innerHTML = '<span id="app-status" style="font-size: x-small;">🟢</span><small> | Bem-vindo(a), <strong style="color: var(--LightGreen)">Coordenador(a)!</strong> Pólo LEM: 🔴 Prepara | IA - Desenvolvedor: <text-link class="developerlink" href="https://jorgesouza.com.br" target="_blank">Jorge Souza</text-link></small>';
        },
        Secretaria: async () => {
            BOTTOMBAR.innerHTML = "";
            BOTTOMBAR.innerHTML = '<span id="app-status" style="font-size: x-small;">🟢</span><small> | Bem-vindo(a), <strong style="color: var(--LightGreen)">Secretário(a)!</strong> Pólo LEM: 🔴 Prepara | IA - Desenvolvedor: <text-link class="developerlink" href="https://jorgesouza.com.br" target="_blank">Jorge Souza</text-link></small>';
        },
        Educador: async () => {
            BOTTOMBAR.innerHTML = "";
            BOTTOMBAR.innerHTML = '<span id="app-status" style="font-size: x-small;">🟢</span><small> | Bem-vindo(a), <strong style="color: var(--LightGreen)">Educador(a)!</strong> Pólo LEM: 🔴 Prepara | IA - Desenvolvedor: <text-link class="developerlink" href="https://jorgesouza.com.br" target="_blank">Jorge Souza</text-link></small>';
        },
    },
    "Perfil": () => {
        alert("Perfil");
    },

    /**
     * Endpoint para carregar dados para a aplicação
     * a partir de uma planilha de acompanhamento
     * previamente criada.
     */
    "CarregarPlanilhas": async () => {
        try {
            const modalContent = await Modal.Window("Atualizar", "");
            await Renderer.Load("upload", modalContent);

            // Estado dos arquivos selecionados
            let selectedFiles = [];

            // Elementos do DOM
            const dropZone = document.getElementById('dropzone-main');
            const fileInput = document.getElementById('fileInputMain');
            const selectBtn = document.getElementById('selectBtnMain');
            const fileNameDisplay = document.getElementById('fileNameDisplay');
            const updateBtn = document.getElementById('updateBtn');

            /**
             * Atualiza a interface com a lista de arquivos e visibilidade do botão.
             */
            function updateUI() {
                fileNameDisplay.innerHTML = ''; // limpa

                if (selectedFiles.length > 0) {
                    const ul = document.createElement('ul');
                    selectedFiles.forEach(file => {
                        const li = document.createElement('li');
                        li.textContent = file.name;
                        ul.appendChild(li);
                    });
                    fileNameDisplay.appendChild(ul);
                }

                // Mostra o botão apenas quando há exatamente dois arquivos válidos
                updateBtn.style.opacity = selectedFiles.length === 2 ? '1' : '0';
            }

            /**
             * Valida o array de arquivos: quantidade e formato.
             * Exibe toasts em caso de erro e retorna false.
             */
            function validateFiles(files) {
                if (files.length !== 2) {
                    Tooltip.Toast("Devem ser carregados exatamente dois arquivos.", 5);
                    return false;
                }

                for (const file of files) {
                    if (file.type !== "application/vnd.ms-excel") {
                        Tooltip.Toast(`Formato "${file.type}" não suportado. Utilize arquivos .xls.`, 5);
                        return false;
                    }
                }
                return true;
            }

            /**
             * Aceita um novo conjunto de arquivos, substituindo qualquer seleção anterior.
             * Se válidos, armazena e atualiza a UI; caso contrário, limpa tudo.
             */
            function acceptFiles(files) {
                if (!validateFiles(files)) {
                    selectedFiles = [];
                    fileInput.value = ''; // limpa input file
                    updateUI();
                    return;
                }

                // Atualiza a lista de arquivos selecionados
                selectedFiles = Array.from(files);

                // Sincroniza o input file com os arquivos aceitos (opcional, mas mantém coerência)
                const dt = new DataTransfer();
                selectedFiles.forEach(f => dt.items.add(f));
                fileInput.files = dt.files;

                updateUI();
            }

            /**
             * Lê um arquivo como base64 (string pura, sem cabeçalho data:).
             */
            function readFileAsBase64(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        // Extrai apenas a parte base64 do resultado
                        const base64 = reader.result.split(',')[1];
                        resolve(base64);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }

            /**
             * Envia os dois arquivos ao servidor no formato JSON esperado.
             */
            async function handleUpdate() {
                if (selectedFiles.length !== 2) return;

                try {
                    const [base64_1, base64_2] = await Promise.all([
                        readFileAsBase64(selectedFiles[0]),
                        readFileAsBase64(selectedFiles[1])
                    ]);

                    const payload = {
                        file1: base64_1,
                        file2: base64_2
                    };

                    const response = await App.HttpRequest.Post("/docs/andamento", payload);
                    handleResponse(response);

                    Tooltip.Toast("Arquivos enviados com sucesso!", 5);

                    // Limpa após envio bem‑sucedido
                    selectedFiles = [];
                    fileInput.value = '';
                    updateUI();
                } catch (error) {
                    Modal.Error("Erro ao enviar os arquivos para o servidor.", error, true);
                }
            }

            // --- Configuração dos eventos da zona de upload única ---

            // Clique no botão de seleção ou na área do dropzone abre o seletor de arquivos
            selectBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                fileInput.click();
            });

            dropZone.addEventListener('click', (e) => {
                if (e.target !== selectBtn && !selectBtn.contains(e.target)) {
                    fileInput.click();
                }
            });

            // Quando arquivos são escolhidos pelo seletor
            fileInput.onchange = () => {
                if (!fileInput.files || fileInput.files.length === 0) return;
                acceptFiles(fileInput.files);
            };

            // Previne comportamento padrão para eventos de drag
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });

            // Feedback visual durante o arraste
            dropZone.addEventListener('dragover', () => {
                dropZone.classList.add('dragover');
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('dragover');
            });

            // Processa os arquivos soltos
            dropZone.addEventListener('drop', (e) => {
                dropZone.classList.remove('dragover');
                const dt = e.dataTransfer;
                if (dt.files && dt.files.length > 0) {
                    acceptFiles(dt.files);
                }
            });

            // Botão "Atualizar" chama o envio
            updateBtn.addEventListener('click', handleUpdate);

            // Manipula a resposta

            function handleResponse(response) {
                const { message, data } = response;
                const { status, dados } = data;
                console.log("message: ", message);
                console.log("data: ", data);
                //
            }

            // Inicializa a UI (botão oculto, display vazio)
            updateUI();

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
        //
        return new Promise(async (resolve, reject) => {
            try {
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
        if (index > 10) {
            appStatus.style.opacity = "0";
            index = 0;
        } else {
            appStatus.style.opacity = (index / 10).toString();
            index += 1;
        }
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
        if (Number(ano) < 2000) {
            return null;
        } else {
            return `${dia}/${mes}/${ano}`;
        }
    },
    FormatDate: (timestamp) => {
        const date = new Date(timestamp);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    },
    Text: {
        toTitleCase: (str) => {
            return str.replace(/\w\S*/g, function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        }
    },
    Convert: {
        async fileToBase64Browser(file) {
            const arrayBuffer = await file.arrayBuffer();
            let binary = "";
            const bytes = new Uint8Array(arrayBuffer);
            for (const byte of bytes) {
                binary += String.fromCharCode(byte);
            }
            return btoa(binary);
        },
        base64ToFileBrowser(base64, mimeType = "application/octet-stream") {
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);

            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return new Blob([bytes], { type: mimeType });
        }
    },
    _: () => { }
};

// Cria a aplicação:
const topMenu = {
    "☰ Menu": [
        { title: "💾 Gerar Planilha de Acompanhamento", action: UI.GerarPlanilhaAndamento },
        { title: "👦 Perfil", action: UI.Perfil },
        { title: "👨‍🏫 Cadastro de Educador", action: UI.Cadastros },
        { title: "📚 Cadastro de Matérias", action: UI.Cadastros },
        { title: "🗂️ Documentos", action: x => window.location = "/documents.html" },
        { title: "⚙️ Configurações", action: x => window.location = "/settings.html" },
        { title: '🛡️ Desenvolvedor', action: UI.Configuracoes },
        { title: "ℹ️ Suporte", action: UI.Suporte },
        { title: "⛔ Sair", action: x => window.location = "/" }
    ]

};
//
import { AcaciaDesktop } from './lib/acacia/acacia.js';

const acacia = new AcaciaDesktop("Prepara LEM | Acompanhamento Pedagógico", topMenu, () => { App.Main(App.LongPooling) });
//
console.log(`
%c██████╗ %c██████╗ %c███████╗ %c██████╗ %c █████╗ %c██████╗ %c █████╗ 
%c██╔══██╗%c██╔══██╗%c██╔════╝%c██╔══██╗%c██╔══██╗%c██╔══██╗%c██╔══██╗
%c██████╔╝%c██████╔╝%c█████╗  %c██████╔╝%c███████║%c██████╔╝%c███████║
%c██╔═══╝ %c██╔══██╗%c██╔══╝  %c██╔═══╝ %c██╔══██║%c██╔══██╗%c██╔══██║
%c██║     %c██║  ██║%c███████╗%c██║     %c██║  ██║%c██║  ██║%c██║  ██║
%c╚═╝     %c╚═╝  ╚═╝%c╚══════╝%c╚═╝     %c╚═╝  ╚═╝%c╚═╝  ╚═╝%c╚═╝  ╚═╝
`,
    // Cores para cada letra (gradiente azul)
    'color: #4a90d9', 'color: #5b9bd5', 'color: #6ca6d1', 'color: #7db1cd', 'color: #8ebcc9', 'color: #9fc7c5', 'color: #b0d2c1',
    'color: #4a90d9', 'color: #5b9bd5', 'color: #6ca6d1', 'color: #7db1cd', 'color: #8ebcc9', 'color: #9fc7c5', 'color: #b0d2c1',
    'color: #4a90d9', 'color: #5b9bd5', 'color: #6ca6d1', 'color: #7db1cd', 'color: #8ebcc9', 'color: #9fc7c5', 'color: #b0d2c1',
    'color: #4a90d9', 'color: #5b9bd5', 'color: #6ca6d1', 'color: #7db1cd', 'color: #8ebcc9', 'color: #9fc7c5', 'color: #b0d2c1',
    'color: #4a90d9', 'color: #5b9bd5', 'color: #6ca6d1', 'color: #7db1cd', 'color: #8ebcc9', 'color: #9fc7c5', 'color: #b0d2c1',
    'color: #4a90d9', 'color: #5b9bd5', 'color: #6ca6d1', 'color: #7db1cd', 'color: #8ebcc9', 'color: #9fc7c5', 'color: #b0d2c1'
);

document.getElementById("favicon").href = "./files/ico.svg";

window.onerror = function (mensagem, arquivo, linha, coluna, erro) {
    App.HttpRequest.Post("e/rror", { msg: `/error", "Um erro ocorreu na aplicação:\n\n ${(event.reason?.stack || event.reason)}` });
    Tooltip.Toast("Ocorreu um erro na aplicação, acesse o menu Suporte > Logs, para mais detalhes", 5);
};

window.addEventListener("unhandledrejection", function (event) {
    App.HttpRequest.Post("/error", { msg: `/error", "Um erro assíncrono ocorreu na aplicação:\n\n ${(event.reason?.stack || event.reason)}` });
    Tooltip.Toast("Ocorreu um erro assíncrono na aplicação, acesse o menu Suporte > Logs, para mais detalhes", 5);
});

window.App = App;

// #region Modelos
/**
 * Essa classe é uma cópia da classe Datagrid da biblioteca Acácia
 * para aceitar a manipulação de contratos semanticamente.
 */
class PreparaGrid {
    constructor(gridID, title, sourceData, target, selectCB, allSelectedCB) {
        sourceData = this.dataHandle(sourceData);
        const datagridElement = document.createElement("data-grid");
        datagridElement.id = gridID;
        target.innerHTML = "";
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
                cell.innerHTML = cellData;
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
        target.addEventListener('auxclick', e => {
            if (e.button === 1) {
                e.preventDefault();
            }
        });
        target.addEventListener("mousedown", e => {
            if (e.button === 1) {
                e.preventDefault();
                e.stopPropagation();
                document.body.style.cursor = 'grabbing';
                document.querySelectorAll("data-grid-cell").forEach(x => {
                    x.style.cursor = 'grabbing'
                });
                document.querySelectorAll("data-grid-row").forEach(x => {
                    x.style.cursor = 'grabbing'
                });
                this.dragGrid(target, e);
            }
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
                Title: "+Reposição",
                Ico: "files/settings.svg",
                Action: () => App.Logica.InserirReposicao(App.Cadastros.current)
            },
            {
                Title: "+Dia de Folga",
                Ico: "files/settings.svg",
                Action: () => App.Logica.InserirFolga(App.Cadastros.current)
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
    dragGrid(container, e) {
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let scrollLeft = 0;
        let scrollTop = 0;

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        scrollLeft = container.scrollLeft;
        scrollTop = container.scrollTop;
        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            container.scrollLeft = scrollLeft - dx;
            container.scrollTop = scrollTop - dy;
        });

        window.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            document.body.style.cursor = '';
            document.querySelectorAll("data-grid-cell").forEach(x => {
                x.style.cursor = ''
            });
            document.querySelectorAll("data-grid-row").forEach(x => {
                x.style.cursor = ''
            });
            window.removeEventListener('mousemove', () => { });
            window.removeEventListener('mouseup', () => { });
        });
    }
}
// #endregion

// EOF