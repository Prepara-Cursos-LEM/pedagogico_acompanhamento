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

const appURL = `${window.location.origin}`;

let index = 0;
let appStatus;

const App = {
    Usuarios: [],
    Cadastros: {
        current: {},
        selectionCount: 0,
        sourceLength: 0,
        allSelected: false,
        source: {},
        contratos: {},
        previous: {},
        selection: [],
        filtros: {
            guiaAtual: "DASHBOARD",
            //guiaAtual: "GERAL",
            //guiaAtual: "ANDAMENTO",
            //guiaAtual: "LIVROS",
            colunas: [],
            situacao: {
                filtrar: "TUDO"
            },
            educador: {
                filtrar: "TODOS"
            },
            dias: {
                filtrar: "SEGUNDA"
            },
        }
    },
    Precarregamento: async () => {
        const urlQuery = new URLSearchParams(window.location.search);
        const role = urlQuery.get("role");
        if (!role) {
            return alert("Usuário não autenticado.");
        } else if (role == "COORDENADOR") {
            await UI.StatusBar.Coordenador();
        } else if (role == "SECRETARIA") {
            await UI.StatusBar.Secretaria();
        } else if (role == "EDUCADOR") {
            await UI.StatusBar.Educador();
        } else if (role && role.length > 1) {
            await UI.StatusBar.Educador();
        }
        //
        APPVIEW.style.overflow = "hidden";
        window.emptyState = document.getElementById("empty-state");
        document.getElementById("favicon").href = "./files/ico.svg";
        console.log("appURL:", appURL);
    },
    Main: async (callback = null) => {
        await App.Precarregamento();
        const emptyState = document.getElementById("empty-state");
        // Lógica de inicialização aqui:
        // Remover a logo nativa:
        document.getElementById("topbar-logo").src = "files/ico.svg";
        //
        await App.Logica.AtualizarUsuarios();
        await App.Logica.AtualizarCadastros();
        // Barra de status:
        //
        const tabDashboard = document.getElementById("tab-home");
        const tabGeral = document.getElementById("tab1");
        const tabAndamento = document.getElementById("tab2");
        const tabRelatorios = document.getElementById("tab3");
        const tabLivros = document.getElementById("tab4");

        tabDashboard.addEventListener("click", () => window.location.reload());

        tabGeral.addEventListener("click", x => {
            App.Cadastros.filtros.guiaAtual = "Geral";
            UI.MainGrid.Render();
        });
        tabAndamento.addEventListener("click", x => {
            App.Cadastros.filtros.guiaAtual = "Andamento";
            UI.MainGrid.Render();
        });
        tabRelatorios.addEventListener("click", x => {
            Tooltip.Toast("Funcionalidade RELATÓRIOS ainda não implementada.", 5);
            // App.Cadastros.filtros.guiaAtual = "Livros";
            // UI.MainGrid.Render();
        });
        tabLivros.addEventListener("click", x => {
            Tooltip.Toast("Funcionalidade LIVROS ainda não implementada.", 5);
            // App.Cadastros.filtros.guiaAtual = "Livros";
            // UI.MainGrid.Render();
        });

        // Finalização da inicialização:
        document.getElementById("tools-refresh-btn").onclick = async e => {
            e.preventDefault();
            if (await Modal.Confirm("Recarregar?", "A aplicação atualiza os dados em tempo real. Se notou algum comportamento estranho ou dados inconsistentes você pode forçar um recarregamento limpo confirmando no botão abaixo. Tem certeza?")) {
                sessionStorage.setItem("history", 1);
                window.location.reload();
            }
        };
        document.getElementById("print-btn").onclick = async () => {
            if (App.Cadastros.selectionCount == 0) {
                let res = await Modal.Confirm("Dados insuficientes", "Nenhum item selecionado para impressão.");
                return;
            } else if (App.Cadastros.selectionCount > 100) {
                let res = await Modal.Confirm("Dados em excesso", "Uma quantidade muito grande de dados foi selecionada para impressão. Isso pode travar seu navegador. Experimente alterar os filtros para reduzir a quantidade de itens. Continuar assim mesmo?");
                if (!res) return;
            }
            localStorage.setItem("print-dados", JSON.stringify(App.Cadastros.selection));
            window.open("print.html", "_blank");
        };
        document.getElementById("update-btn").onclick = () => {
            const cont = Object.keys(App.Cadastros.selection).length;
            document.getElementById("contracts-count").textContent = cont;
            Tooltip.Toast(cont + " contratos selecionados pelo filtro atual.", 5);
        };
        const cont = Object.keys(App.Cadastros.selection).length;
        document.getElementById("contracts-count").textContent = cont;
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
            Tooltip.Toast("Atualizando Central de Andamento de Alunos", 5);
        },
        /**
         * Obtém os dados de todos os usuários do sistema
         * @returns 
         */
        AtualizarUsuarios: async () => {
            App.Usuarios = await App.HttpRequest.Get("/app/update/usuarios");
            // Barra de ferramentas:
            const tools = UI.Tools.Render();
            TOPBAR.appendChild(tools);
        },
        /**
         * Obtém os dados de todos os contratos
         * @returns {any} { cadastros, atualizacoes }
         */
        AtualizarCadastros: async () => {
            const { cadastros, atualizacoes } = await App.HttpRequest.Get("/app/update/cadastros");
            if (!cadastros || cadastros.length == 0) return;
            let atualizaSelect = document.getElementById("atualizacoes");
            atualizaSelect.innerHTML = "";
            const option1 = document.createElement("option");
            option1.value = atualizacoes.update;
            option1.textContent = "Último";
            atualizaSelect.appendChild(option1);
            Object.keys(atualizacoes.lasts).forEach(x => {
                if (x == atualizacoes.update) return;
                const option2 = document.createElement("option");
                option2.value = x;
                option2.textContent = x;
                atualizaSelect.appendChild(option2);
            });

            Object.keys(cadastros).forEach((key, index) => {
                App.Cadastros.source[`C-${index + 1}`] = cadastros[key];
            });
            App.Cadastros.contratos = App.Cadastros.source;
            App.Cadastros.selection = App.Cadastros.source;
            UI.Home.DashBoard();
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
        GravarAlteracoes: (alteracoes = {}) => {
            // Lógica das alterações:
            //
            // Aplicar alterações
            App.Cadastros.contratos = alteracoes;
            const res = Utils.Save(App.Cadastros.contratos);
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
                        console.log(res);
                        reject(new Error(`HTTP error! status: ${res.status}`));
                    } else {
                        res.json().then(data => {
                            console.log(data);
                            resolve(data);
                        }).catch(err => {
                            console.log(err);
                            reject(err);
                        });
                    }
                }).catch(err => {
                    console.log(err);
                    reject(err);
                });
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
                await Modal.Message("Atualização", "Novos dados foram carregados remotamente. Atualize a página para aplicar as alterações.", () => {
                    window.location.reload();
                });
            }
        }).catch(err => {
            App._pooling = false;
            Boolean(document.getElementById("modal-container")) ?
                {} :
                Modal.Message(
                    "Erro",
                    "Não foi possível se comunicar com o servidor." + err,
                    () => window.location.reload()
                );
        });
    },
};

const UI = {
    MainGrid: {
        Helpers: {
            filtrar: () => {
                App.Cadastros.selection = App.Cadastros.contratos;
                const filtro = {
                    situacao: App.Cadastros.filtros.situacao.filtrar,
                    educador: App.Cadastros.filtros.educador.filtrar,
                    dias: App.Cadastros.filtros.dias.filtrar
                }
                const test = {
                    a: App.Cadastros.filtros.dias.filtrar == "TUDO",
                    b: App.Cadastros.filtros.situacao.filtrar == "TUDO",
                    c: App.Cadastros.filtros.educador.filtrar == "TODOS",
                }
                if (Object.values(test).every(x => x)) {
                    App.Cadastros.selection = App.Cadastros.contratos;
                    const container = document.getElementById("grid-content");
                    container.innerHTML = "";
                    Tooltip.Toast("Carregando todos os contratos...", 3);
                    container.innerHTML = "";
                    setTimeout(() => {
                        UI.MainGrid.Helpers.render(App.Cadastros.contratos);
                    }, 2000);
                } else {
                    App.Cadastros.selection = Utils.Filter(App.Cadastros.contratos, filtro);
                    if (Object.keys(App.Cadastros.selection).length > 0) {
                        UI.MainGrid.Helpers.render(App.Cadastros.selection);
                    } else {
                        UI.MainGrid.Helpers.render({});
                    }
                }
                document.getElementById("contracts-count").textContent = Object.keys(App.Cadastros.selection).length;
            },
            render: (obj = {}) => {
                const keys = Object.keys(obj);
                // 
                document.getElementById("grid-content").innerHTML = "";
                if (keys.length > 0) {
                    keys.forEach(key => {
                        const tmp = {
                            id: key,
                            aluno: obj[key]["ALUNOS"],
                            educador: obj[key]["EDUCADOR"],
                            inicioContrato: Utils.SerialToDate(Number(obj[key]["DATA INICIO"])),
                            fimContrato: Utils.SerialToDate(Number(obj[key]["DATA TERMINO"])),
                            diaSemana: Utils.DayOfWeek(Number(obj[key]["DIA SEMANA"])),
                            aulasTotais: obj[key]["AULAS CURSO"],
                            aulasConcluidas: obj[key]["AULAS CONCLUIDAS"],
                            aulasAtrasadas: Math.round(Number(obj[key]["AULAS ATRASADAS"])),
                            dataAcompanhamento: Utils.SerialToDate(Number(obj[key]["DATA ACOMPANHAMENTO"])),
                            situacao: obj[key]["SITUAÇÃO"],
                            verificacao: obj[key]["VERIFICAÇÃO"],
                        }
                        Grid.cardGen(tmp);
                    });
                } else {
                    emptyState.style.display = "flex";
                    document.getElementById("grid-content").appendChild(emptyState);
                }
            },
            pesquisar: e => {
                if (e.key == "Enter") {
                    const container = document.getElementById("grid-content");
                    container.innerHTML = "";
                    const pesquisa = document.getElementById("pesquisa-contratos");
                    const text = pesquisa.value.trim();
                    if (text.length == 0) {
                        if (App.Cadastros.selection.length > 0) UI.MainGrid.Helpers.render(App.Cadastros.selection);
                    } else {
                        const matriz = App.Cadastros.contratos.map(contrato => contrato["ALUNOS"]);
                        const res = Utils.buscaInteligente(matriz, text).map(r => r.distancia < 11 ? r.valor : null).filter(r => r != null);
                        // Adicionar também nomes que contenham o texto:
                        const nomesIniciados = matriz.filter(
                            valor => clear(valor || "").startsWith(clear(text || ""))
                        );

                        res.push(...nomesIniciados);

                        function clear(txt = "") {
                            return txt.toLowerCase()
                                .trim()
                                .normalize("NFD")
                                .replace(/[\u0300-\u036f]/g, "")
                                .replace(/\s+/g, "");
                        }
                        App.Cadastros.selection = App.Cadastros.contratos.filter(contrato => res.includes(contrato["ALUNOS"]));
                        if (App.Cadastros.selection.length > 0) {
                            container.innerHTML = "";
                            UI.MainGrid.Helpers.render(App.Cadastros.selection);
                        }
                    }
                }
            },
            selectsEvents: () => {
                const pesquisa = document.getElementById("pesquisa-contratos");
                pesquisa.placeholder = "Pesquisar contratos...";
                pesquisa.removeAttribute("disabled");
                pesquisa.focus();
                document.getElementById("select-dia").value = App.Cadastros.filtros.dias.filtrar;
                document.getElementById("select-situacao").value = App.Cadastros.filtros.situacao.filtrar;
                document.getElementById("select-educador").value = App.Cadastros.filtros.educador.filtrar;

                const container = document.getElementById("grid-content");
                container.innerHTML = "";
                pesquisa.onkeydown = UI.MainGrid.Helpers.pesquisar;

                document.getElementById("select-dia").onchange = () => {
                    const value = document.getElementById("select-dia").value;
                    App.Cadastros.filtros.dias.filtrar = value;
                    UI.MainGrid.Helpers.filtrar();
                };
                document.getElementById("select-situacao").onchange = () => {
                    // 
                    const value = document.getElementById("select-situacao").value;
                    App.Cadastros.filtros.situacao.filtrar = value;
                    UI.MainGrid.Helpers.filtrar();
                };
                document.getElementById("select-educador").onchange = () => {
                    // 
                    const value = document.getElementById("select-educador").value;
                    App.Cadastros.filtros.educador.filtrar = value;
                    UI.MainGrid.Helpers.filtrar();
                };
            },
        },
        Geral: () => {
            App.Cadastros.contratos = App.Cadastros.source;
            const tabs = document.querySelectorAll('acacia-tabs-item');
            tabs.forEach((tab, index) => {
                tab.classList.remove('active');
            });
            document.getElementById("tab1").classList.add("active");
            //

            // Lógica da Aba:
            Tooltip.Toast("Carregando dados...", 3);

            // Renderização inicial:
            UI.MainGrid.Helpers.selectsEvents();
            UI.MainGrid.Helpers.filtrar();
            return;
        },
        Andamento: () => {
            App.Cadastros.contratos = {};
            App.Cadastros.selection = {};
            App.Cadastros.filtros.dias.filtrar = "TUDO";
            App.Cadastros.filtros.situacao.filtrar = "TUDO";
            App.Cadastros.filtros.educador.filtrar = "TODOS";
            //
            Object.keys(App.Cadastros.source).forEach(key => {
                if (App.Cadastros.source[key]["VERIFICAÇÃO"] != "VERIFICADO") App.Cadastros.contratos[key] = App.Cadastros.source[key];
            });
            const tabs = document.querySelectorAll('acacia-tabs-item');
            tabs.forEach((tab, index) => {
                tab.classList.remove('active');
            });
            document.getElementById("tab2").classList.add("active");

            // Lógica da Aba:
            const pesquisa = document.getElementById("pesquisa-contratos");
            pesquisa.placeholder = "Pesquisar contratos...";
            pesquisa.removeAttribute("disabled");
            pesquisa.focus();
            document.getElementById("select-dia").value = App.Cadastros.filtros.dias.filtrar;
            document.getElementById("select-situacao").value = App.Cadastros.filtros.situacao.filtrar;
            document.getElementById("select-educador").value = App.Cadastros.filtros.educador.filtrar;
            //
            Tooltip.Toast("Carregando contratos não atualizados...", 3);

            // Renderização inicial:
            UI.MainGrid.Helpers.selectsEvents();
            UI.MainGrid.Helpers.filtrar();
            return;
        },
        Relatorios: () => {
            const tabs = document.querySelectorAll('acacia-tabs-item');
            tabs.forEach((tab, index) => {
                tab.classList.remove('active');
            });
            document.getElementById("tab3").classList.add("active");
            Renderer.Load("relatorios", document.getElementById("main-content"));
        },
        Livros: () => {
            Modal.Message("Não implementado", "Funcionalidade de controle de entrega de livros ainda não implementada.", () => {
                window.location.reload();
            });
            return;
            const tabs = document.querySelectorAll('acacia-tabs-item');
            tabs.forEach((tab, index) => {
                tab.classList.remove('active');
            });
            document.getElementById("tab4").classList.add("active");
        },
        Render: () => {
            UI.MainGrid[App.Cadastros.filtros.guiaAtual]();
        }
    },
    Home: {
        DashBoard: async () => {
            App.Cadastros.filtros.guiaAtual = "Dashboard";
            const tabs = document.querySelectorAll('acacia-tabs-item');
            tabs.forEach((tab, index) => {
                tab.classList.remove('active');
            });
            document.getElementById("tab-home").classList.add("active");
            const pesquisa = document.getElementById("pesquisa-contratos");
            pesquisa.placeholder = "Pesquisa indisponivel.";
            pesquisa.setAttribute("disabled", true);

            App.HttpRequest.Get("/app/update/dashboard").then(data => {
                // Extraindo os dados reais:
                resumo.mesAtual = data.mesAtual;
                resumo.mesAnterior = data.mesAnterior;
                // Dados de exemplo para o gráfico:
                const contractData = {
                    "Anterior": {
                        "Total de Contratos": resumo.mesAnterior.geral.totalAlunos,
                        "Em Dias": resumo.mesAnterior.geral.totalEmDias,
                        "Atrasado": resumo.mesAnterior.geral.totalAtrasados,
                        "Muito Atrasado": resumo.mesAnterior.geral.totalMuitoAtrasados,
                        "Adiantado": resumo.mesAnterior.geral.totalAdiantados,
                        "Muito Adiantado": resumo.mesAnterior.geral.totalMuitoAdiantados
                    },
                    "Atual": {
                        "Total de Contratos": resumo.mesAtual.geral.totalAlunos,
                        "Em Dias": resumo.mesAtual.geral.totalEmDias,
                        "Atrasado": resumo.mesAtual.geral.totalAtrasados,
                        "Muito Atrasado": resumo.mesAtual.geral.totalMuitoAtrasados,
                        "Adiantado": resumo.mesAtual.geral.totalAdiantados,
                        "Muito Adiantado": resumo.mesAtual.geral.totalMuitoAdiantados
                    }
                };

                // Renderização dos cards:
                const statsContainer = document.querySelector(".stats-grid");
                function generateStatCard(title, value, trend, total) {
                    const html = `
                    <div class="stat-card">
                        <div class="stat-title">${title}</div>
                        <div class="stat-value">${value}<small class="obfuscated">/${total}</small></div>
                        <div class="stat-trend"><span class="trend-up">${trend}</span></div>
                    </div>`;
                    // Generate element:
                    const statElement = document.createElement("div");
                    statElement.innerHTML = html;
                    return statElement;
                }
                statsContainer.innerHTML = "";
                const total = resumo.mesAtual.geral.totalAlunos;
                // Em dias:
                const totalEmDias = resumo.mesAtual.geral.totalEmDias;
                let percent = "Percentual: " + ((totalEmDias / total) * 100).toFixed(0) + "%";
                statsContainer.appendChild(generateStatCard("🟩 Em Dias", totalEmDias, percent, total));
                // Atrasados:
                const totalAtrasados = resumo.mesAtual.geral.totalAtrasados;
                percent = "Percentual: " + ((totalAtrasados / total) * 100).toFixed(0) + "%";
                statsContainer.appendChild(generateStatCard("🟨 Atrasados", totalAtrasados, percent, total));
                // Muito Atrasados:
                const totalMuitoAtrasados = resumo.mesAtual.geral.totalMuitoAtrasados;
                percent = "Percentual: " + ((totalMuitoAtrasados / total) * 100).toFixed(0) + "%";
                statsContainer.appendChild(generateStatCard("🟥 Muito Atrasados", totalMuitoAtrasados, percent, total));
                // Adiantados:
                const totalAdiantados = resumo.mesAtual.geral.totalAdiantados;
                percent = "Percentual: " + ((totalAdiantados / total) * 100).toFixed(0) + "%";
                statsContainer.appendChild(generateStatCard("🟦 Adiantados", totalAdiantados, percent, total));
                // Muito Adiantados:
                const totalMuitoAdiantados = resumo.mesAtual.geral.totalMuitoAdiantados;
                percent = "Percentual: " + ((totalMuitoAdiantados / total) * 100).toFixed(0) + "%";
                statsContainer.appendChild(generateStatCard("🟪 Muito Adiantados", totalMuitoAdiantados, percent, total));

                // Renderização do gráfico de progresso mensal:
                {
                    // Renderização dos gráficos:

                    const mainContent = document.getElementById("main-content");
                    mainContent.innerHTML = "";

                    // Categorias a serem exibidas
                    const rawCategories = [
                        "Em Dias",
                        "Atrasado",
                        "Muito Atrasado",
                        "Adiantado",
                        "Muito Adiantado"
                    ];

                    // Labels amigáveis
                    const displayLabels = {
                        "Em Dias": "🟩 Em Dias",
                        "Atrasado": "🟨 Atrasados",
                        "Muito Atrasado": "🟥 Muito Atrasados",
                        "Adiantado": "🟦 Adiantados",
                        "Muito Adiantado": "🟪 Muito Adiantados"
                    };

                    // Cores
                    const COLORS = {
                        ANTERIOR: "var(--LightGreen)",
                        ATUAL: "var(--SeaBlue)"
                    };

                    function createContractData(anterior, atual) {
                        return {
                            "Anterior": {
                                "Em Dias": anterior.totalEmDias,
                                "Atrasado": anterior.totalAtrasados,
                                "Muito Atrasado": anterior.totalMuitoAtrasados,
                                "Adiantado": anterior.totalAdiantados,
                                "Muito Adiantado": anterior.totalMuitoAdiantados
                            },
                            "Atual": {
                                "Em Dias": atual.totalEmDias,
                                "Atrasado": atual.totalAtrasados,
                                "Muito Atrasado": atual.totalMuitoAtrasados,
                                "Adiantado": atual.totalAdiantados,
                                "Muito Adiantado": atual.totalMuitoAdiantados
                            }
                        };
                    }

                    function renderChart(title, anteriorData, atualData) {

                        const chartContainer = document.createElement("div");
                        chartContainer.className = "chart-container";

                        chartContainer.innerHTML = `
                        <div class="section-header">
                            <h3>${title}</h3>
                            <span>últimos 60 dias</span>
                        </div>
                        <div class="chart-panel"></div>
                    `;

                        const chartPanel = chartContainer.querySelector(".chart-panel");

                        const contractData = createContractData(
                            anteriorData,
                            atualData
                        );

                        const months = Object.keys(contractData);

                        let globalMaxValue = 0;

                        for (const month of months) {
                            for (const category of rawCategories) {
                                const value = Number(contractData[month][category]);

                                if (!isNaN(value) && value > globalMaxValue) {
                                    globalMaxValue = value;
                                }
                            }
                        }

                        if (globalMaxValue === 0) {
                            globalMaxValue = 1;
                        }

                        rawCategories.forEach(categoryKey => {

                            const anteriorValue =
                                Number(contractData["Anterior"][categoryKey]) || 0;

                            const atualValue =
                                Number(contractData["Atual"][categoryKey]) || 0;

                            const groupDiv = document.createElement("div");
                            groupDiv.className = "chart-group";

                            const barsContainer = document.createElement("div");
                            barsContainer.className = "chart-bars";

                            // Barra anterior
                            const anteriorWrapper = document.createElement("div");
                            anteriorWrapper.className = "chart-bar";

                            const anteriorValueSpan = document.createElement("span");
                            anteriorValueSpan.className = "bar-value";
                            anteriorValueSpan.textContent = anteriorValue;

                            const anteriorBar = document.createElement("div");
                            anteriorBar.className = "bar";
                            anteriorBar.style.height =
                                `${(anteriorValue / globalMaxValue) * 100}%`;

                            anteriorBar.style.background = COLORS.ANTERIOR;

                            anteriorWrapper.appendChild(anteriorValueSpan);
                            anteriorWrapper.appendChild(anteriorBar);

                            // Barra atual
                            const atualWrapper = document.createElement("div");
                            atualWrapper.className = "chart-bar";

                            const atualValueSpan = document.createElement("span");
                            atualValueSpan.className = "bar-value";
                            atualValueSpan.textContent = atualValue;

                            const atualBar = document.createElement("div");
                            atualBar.className = "bar";
                            atualBar.style.height =
                                `${(atualValue / globalMaxValue) * 100}%`;

                            atualBar.style.background = COLORS.ATUAL;

                            atualWrapper.appendChild(atualValueSpan);
                            atualWrapper.appendChild(atualBar);

                            barsContainer.appendChild(anteriorWrapper);
                            barsContainer.appendChild(atualWrapper);

                            const categoryLabel = document.createElement("div");
                            categoryLabel.className = "group-label";
                            categoryLabel.textContent =
                                displayLabels[categoryKey] || categoryKey;

                            groupDiv.appendChild(barsContainer);
                            groupDiv.appendChild(categoryLabel);

                            chartPanel.appendChild(groupDiv);
                        });

                        // Legenda
                        const legendDiv = document.createElement("div");
                        legendDiv.className = "chart-legend";

                        legendDiv.innerHTML = `
                        <div class="legend-item">
                            <span class="legend-color legend-anterior"></span>
                            <span>📆 Mês Anterior</span>
                        </div>

                        <div class="legend-item">
                            <span class="legend-color legend-atual"></span>
                            <span>📆 Mês Atual</span>
                        </div>
                    `;

                        chartPanel.appendChild(legendDiv);

                        mainContent.appendChild(chartContainer);
                    }

                    // --------------------------------------------------
                    // GRÁFICO GERAL
                    // --------------------------------------------------

                    renderChart(
                        "PROGRESSO MENSAL GERAL",
                        resumo.mesAnterior.geral,
                        resumo.mesAtual.geral
                    );

                    // --------------------------------------------------
                    // EDUCADORES
                    // --------------------------------------------------

                    const educadoresAtual =
                        resumo.mesAtual.porEducador || {};

                    const educadoresAnterior =
                        resumo.mesAnterior.porEducador || {};

                    Object.keys(educadoresAtual).forEach(nomeEducador => {

                        const atual = educadoresAtual[nomeEducador];

                        const anterior =
                            educadoresAnterior[nomeEducador] || {
                                totalEmDias: 0,
                                totalAtrasados: 0,
                                totalMuitoAtrasados: 0,
                                totalAdiantados: 0,
                                totalMuitoAdiantados: 0
                            };

                        renderChart(
                            `PROGRESSO MENSAL - ${nomeEducador}`,
                            anterior,
                            atual
                        );
                    });
                }
            }).catch(err => {
                // Em caso de erro, exibir mensagem e renderizar gráfico vazio:
                console.error("Erro ao carregar dados do dashboard:", err);
                Modal.Error("Erro", "Não foi possível carregar os dados do dashboard. Tente atualizar a página ou contate o suporte.", true, window.location.reload);
            });
        },
    },
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
            const selectSituacao = criarSelect([
                { value: "TUDO", text: "Tudo" },
                { value: "EM DIAS", text: "🟢 Em dias" },
                { value: "ATRASADO", text: "🟡 Atrasado" },
                { value: "MUITO ATRASADO", text: "🔴 Muito atrasado" },
                { value: "ADIANTADO", text: "🔵 Adiantado" },
                { value: "MUITO ADIANTADO", text: "🟣 Muito adiantado" }
            ]);
            selectSituacao.id = "select-situacao";
            span.appendChild(selectSituacao);
            // Educador
            span.appendChild(criarLabel("Educador:"));
            const educadores = [];
            Object.keys(App.Usuarios).forEach(key => {
                if (App.Usuarios[key].role != "COORDENADOR" && App.Usuarios[key].role != "SECRETARIA") {
                    //
                    educadores.push({
                        value: App.Usuarios[key].role,
                        text: `👤 ${Utils.Text.toTitleCase(App.Usuarios[key].role)}`
                    });
                }
            });
            const selectEducador = criarSelect([
                { value: "TODOS", text: "Todos" },
                ...educadores
            ]);
            selectEducador.id = "select-educador";
            span.appendChild(selectEducador);

            span.appendChild(criarLabel("Dias:"));
            const selectDia = criarSelect([
                { value: "SEGUNDA", text: "Segunda" },
                { value: "TERCA", text: "Terça" },
                { value: "QUARTA", text: "Quarta" },
                { value: "QUINTA", text: "Quinta" },
                { value: "SEXTA", text: "Sexta" },
                { value: "SABADO", text: "Sábado" },
                { value: "DOMINGO", text: "Domingo" },
                { value: "TUDO", text: "Tudo" }
            ]);
            selectDia.id = "select-dia";
            selectDia.value = "TUDO";
            span.appendChild(selectDia);

            return span;
        },
    },
    StatusBar: {
        Coordenador: async () => {
            BOTTOMBAR.innerHTML = "";
            BOTTOMBAR.innerHTML = '<span id="app-status">🌐</span> | <small>Bem-vindo(a), <strong style="color: var(--LightGreen)">Coordenador(a)!</strong> Pólo LEM: 🔴 Prepara | IA - Desenvolvedor: <text-link class="developerlink" href="https://jorgesouza.com.br" target="_blank">Jorge Souza</text-link></small>';
        },
        Secretaria: async () => {
            BOTTOMBAR.innerHTML = "";
            BOTTOMBAR.innerHTML = '<span id="app-status">🌐</span> | <small>Bem-vindo(a), <strong style="color: var(--LightGreen)">Secretário(a)!</strong> Pólo LEM: 🔴 Prepara | IA - Desenvolvedor: <text-link class="developerlink" href="https://jorgesouza.com.br" target="_blank">Jorge Souza</text-link></small>';
        },
        Educador: async () => {
            BOTTOMBAR.innerHTML = "";
            BOTTOMBAR.innerHTML = '<span id="app-status">🌐</span> | <small>Bem-vindo(a), <strong style="color: var(--LightGreen)">Educador(a)!</strong> Pólo LEM: 🔴 Prepara | IA - Desenvolvedor: <text-link class="developerlink" href="https://jorgesouza.com.br" target="_blank">Jorge Souza</text-link></small>';
        }
    },
    "Cadastros": () => {
        APPVIEW.innerHTML = "";
        Renderer.Load("cadastro", APPVIEW).then(async () => {
            const saveBtn = document.getElementById("cadastro-save-btn");
            saveBtn.addEventListener("click", () => Tooltip.Toast("Nada salvo...", 3));
            const backBtn = document.getElementById("cadastro-back-btn");
            backBtn.addEventListener("click", () => window.location.reload());

            document.querySelector("acacia-tabs-content").style.display = "flex";
        });
    },
    /**
     * Endpoint para carregar dados para a aplicação
     * a partir de uma planilha de acompanhamento
     * previamente criada.
     */
    "CarregarPlanilhas": async () => {
        const modalText = `
            Realizar um novo acompanhamento via planilha? O Acompanhamento anterior será arquivado
            e poderá ser verificado selecionando na caixa de seleção ao lado.
            Certifique-se de que a planilha esteja formatada corretamente para evitar erros no processo de importação.
            Para saber como preparar a planilhas  corretamente vá ao menu Suporte.
            `;
        await Modal.Confirm("Acompanhamento via Planilha", modalText).then(async response => {
            if (response) {
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
                        fileNameDisplay.innerHTML = '';
                        if (selectedFiles.length > 0) {
                            const ul = document.createElement('ul');
                            selectedFiles.forEach(file => {
                                const li = document.createElement('li');
                                li.textContent = file.name;
                                ul.appendChild(li);
                            });
                            fileNameDisplay.appendChild(ul);
                        }
                        // Show button only when exactly one valid file is selected
                        updateBtn.style.opacity = selectedFiles.length == 1 ? '1' : '0';
                    }

                    /**
                     * Valida o array de arquivos: quantidade e formato.
                     * Exibe toasts em caso de erro e retorna false.
                     */
                    function validateFiles(files) {
                        if (files.length !== 1) {
                            Tooltip.Toast("Deve ser carregado exatamente um arquivo.", 5);
                            return false;
                        }
                        const file = files[0];
                        // Accept only .xlsx MIME type
                        if (file.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
                            Tooltip.Toast(`Formato "${file.type}" não suportado. Utilize arquivos .xlsx.`, 5);
                            return false;
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
                    * Envia o arquivo único ao servidor no formato JSON esperado.
                     */
                    async function handleUpdate() {
                        if (selectedFiles.length !== 1) return;
                        Tooltip.Toast("Aguarde...", 15);
                        updateBtn.style.opacity = "0";

                        try {
                            const base64 = await readFileAsBase64(selectedFiles[0]);
                            const payload = { file: base64 };

                            const response = await App.HttpRequest.Post("/app/docs/andamento", payload);
                            handleResponse(response);

                            Tooltip.Toast("Arquivos enviados com sucesso!", 5);

                            // Limpa após envio bem‑sucedido
                            selectedFiles = [];
                            fileInput.value = '';
                            document.getElementById("modal-close").click();
                            updateUI();
                            return;
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
                        if (!fileInput.files || fileInput.files.length == 0) return;
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
                        if (status == "ERR") {
                            Modal.Message("Erro 🥺", "Erro ao ler o arquivo XLSX, dados faltantes ou cabeçalhos inconsistentes. Para configurar os cabeçalhos corretamente acesse o menu Suporte.");
                            return;
                        }
                        console.log("message: ", message);
                        console.log("data: ", data);
                        window.location.reload();
                    }
                    // Inicializa a UI (botão oculto, display vazio)
                    updateUI();
                } catch (error) {
                    Modal.Error("Erro ao carregar planilhas", error, true);
                    console.error("Erro ao carregar a planilha de andamento:", error);
                }
            }
        });
    },
    /**
     * Endpoint para baixar uma planilha de andamento
     * a partir dos dados de cadastro existentes.
     */
    "GerarPlanilhaAcompanhamento": () => {
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
        Modal.Confirm("Relatórios", "Funcionalidade de relatórios ainda não implementada.");
    },
    "Suporte": () => {
        Modal.Confirm("Suporte", "Funcionalidade de suporte ainda não implementada.");
    },
    renderStatus: () => {
        if (index > 10) {
            appStatus.style.opacity = "0";
            index = 0;
        } else {
            appStatus.style.opacity = (index / 10).toString();
            index += 1;
        }
    },
    URL: () => {
        navigator.clipboard.writeText(appURL);
        Tooltip.Toast("Endereço da aplicação copiado para a área de transferência.", 3);
    }
};

const Utils = {
    timeoutId: null,
    Save: (payload) => {
        console.log("Salvando alterações em 10s...");
        clearTimeout(Utils.timeoutId);
        Utils.timeoutId = setTimeout(async () => {
            App.HttpRequest.Post("/app/update/save", payload).then(console.log).catch(console.log)
                .then(x => console.log("Salvo com sucesso!"))
                .catch(err => console.log("Erro ao salvar:", err));
        }, 10000);
    },
    SerialToDate: (serial) => {
        const base = new Date(Date.UTC(1899, 11, 30)); // 30/12/1899
        const msPorDia = 86400000;
        const data = new Date(base.getTime() + serial * msPorDia);

        const dia = String(data.getUTCDate()).padStart(2, "0");
        const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
        const ano = data.getUTCFullYear();
        if (Number(ano) < 2000) {
            return null;
        } else {
            return `${dia}-${mes}-${ano}`;
        }
    },
    CountBy: (dados = [], campo, valor = true) => {
        if (dados.length == 0) return 0;
        return dados.filter(v => v[campo] == valor).length;
    },
    Filter: (dados = {}, filtro = { situacao: "TUDO", educador: "TODOS", dias: "TUDO" }) => {
        const keys = Object.keys(dados);
        if (keys.length == 0) return {};
        const result = {};
        keys.forEach(key => {
            const situacaoOk = filtro.situacao == "TUDO" || dados[key]["SITUAÇÃO"] == filtro.situacao;
            const educadorOk = filtro.educador == "TODOS" || dados[key]["EDUCADOR"] == filtro.educador;
            const diaOk = filtro.dias == "TUDO" || Utils.DayOfWeek(dados[key]["DIA SEMANA"]) == filtro.dias;
            if (situacaoOk && educadorOk && diaOk) result[key] = dados[key];
        });
        return result;
    },
    DayOfWeek: (serial) => {
        const data = new Date((serial - 25569) * 86400 * 1000);
        const dias = [
            "DOMINGO",
            "SEGUNDA",
            "TERCA",
            "QUARTA",
            "QUINTA",
            "SEXTA",
            "SABADO",
        ];
        return dias[data.getUTCDay()];
    },
    TimestampToDate: (timestamp) => {
        const date = new Date(timestamp);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
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
    /**
     * 
     * @param {*} matriz 
     * @param {*} texto 
     * @returns '[ { valor, distancia } ]'
     */
    buscaInteligente: (matriz, texto) => {
        function levenshtein(a, b) {
            const matrix = [];
            for (let i = 0; i <= b.length; i++) {
                matrix[i] = [i];
            }
            for (let j = 0; j <= a.length; j++) {
                matrix[0][j] = j;
            }
            for (let i = 1; i <= b.length; i++) {
                for (let j = 1; j <= a.length; j++) {
                    if (b[i - 1] == a[j - 1]) {
                        matrix[i][j] = matrix[i - 1][j - 1];
                    } else {
                        matrix[i][j] = Math.min(
                            matrix[i - 1][j - 1] + 1,
                            matrix[i][j - 1] + 1,
                            matrix[i - 1][j] + 1
                        );
                    }
                }
            }
            return matrix[b.length][a.length];
        }
        const resultado = matriz.map(valor => ({
            valor,
            distancia: levenshtein(texto.toLowerCase(), valor.toLowerCase())
        })).sort((a, b) => a.distancia - b.distancia);

        return resultado;
    },
    _: () => { }
};

// return;

// Cria a aplicação:
const topMenu = {
    "☰ Menu": [
        { title: "📩 Gerar Planilha de Acompanhamento", action: UI.GerarPlanilhaAcompanhamento },
        { title: "📚 Gerar Relatório Selecionados", action: () => Modal.Confirm("Relatório", "Gerar relatório dos contratos selecionados?", UI.Relatorios) },
        { title: "📂 Carregar Planilha de Acompanhamento", action: UI.CarregarPlanilhas },
        { title: "📆 Feriados", action: () => Modal.Message("Feriado", "Use a página a seguir para acrescentar feriados a todos os cadastros.") },
        { title: "🗂️ Documentos", action: x => window.location = "/documents.html" },
        { title: "👦 Cadastros", action: UI.Cadastros },
        { title: "Copiar Endereço do App", action: UI.URL },
        // { title: "⚙️ Configurações", action: x => window.location = "/settings.html" },
        { title: "ℹ️ Suporte", action: UI.Suporte },
        { title: "⛔ Sair", action: x => window.location = "/" }
    ]

};
//
import { AcaciaDesktop } from './lib/acacia/acacia.js';

const acacia = new AcaciaDesktop("Prepara LEM | Acompanhamento Pedagógico", topMenu, () => { App.Main(App.LongPooling) });
//

let errorCount = 0;
let errorTimer = null;

function trackError() {
    errorCount++;
    if (!errorTimer) {
        errorTimer = setTimeout(() => {
            errorCount = 0;
            errorTimer = null;
        }, 60000);
    }
    if (errorCount >= 3) {
        App._pooling = false;
        Modal.Message("Aplicação Falhou", "Muitos erros ocorreram. O aplicativo parou de se comunicar com o servidor para evitar mais problemas. Por favor, recarregue a página para tentar novamente.", x => window.location.reload());
        console.error("Loop principal encerrado devido ao excesso de erros.");
    }
    return errorCount < 10;
}

window.onerror = function (mensagem, arquivo, linha, coluna, erro) {
    if (trackError()) App.HttpRequest.Post("/error", { msg: `Um erro ocorreu na aplicação:\n\n ${mensagem}\n${erro?.stack}` });
    Tooltip.Toast("Ocorreu um erro na aplicação, acesse o menu Suporte > Logs, para mais detalhes", 3);
};

window.addEventListener("unhandledrejection", function (event) {
    Tooltip.Toast("Ocorreu um erro assíncrono na aplicação, acesse o menu Suporte, para mais detalhes", 3);
    if (trackError()) App.HttpRequest.Post("/error", { msg: `Um erro assíncrono ocorreu na aplicação:\n\n ${(event.reason?.stack || event.reason)}` });
});

// #region Modelos

const educadores = ["JORGE SOUZA", "EDILEUSA CHAVES", "JOICE LOPES", "NUBIA CARVALHO", "EDMUNDO SANTOS", "TANIA ANJOS"];
const situacao = ["EM DIAS", "ATRASADO", "MUITO ATRASADO", "ADIANTADO", "MUITO ADIANTADO"]
const verificacao = ["VERIFICADO", "VERIFICAR", "VERIFICAR URGENTE"];
const Grid = {
    // Geração de cards de contrados:
    cardGen: (dados) => {
        const container = document.getElementById("grid-content");

        container.insertAdjacentHTML("beforeend", `
            <div class="contractCard" data-id="${dados.id}">
                <div class="header">
                    <div class="nome-aluno">
                        <span class="nome"
                            contenteditable="true"
                            title="${dados.aluno}">
                            ${dados.aluno}
                        </span>
                    </div>
    
                    <div class="nome-educador">
                        <select>
                            ${educadores.map(e =>
            `<option ${e == dados.educador ? "selected" : ""}>${e}</option>`
        ).join("")}
                        </select>
                    </div>
                </div>
    
                <div class="data-inicio">
                    <label>Início contrato:</label>
                    <span class="data-value">${dados.inicioContrato}</span>
                    <span class="tool-box btn-date">🗓</span>
                </div>
    
                <div class="data-fim">
                    <label>Fim contrato:</label>
                    <span class="data-value">${dados.fimContrato}</span>
                    <span class="tool-box btn-date">🗓</span>
                </div>
    
                <div class="dia-semana">
                    <label>Dia da semana:</label>
                    <span class="data-value">${dados.diaSemana}</span>
                </div>
    
                <div class="aulas-curso">
                    <label>Aulas totais:</label>
                    <span class="data-value" contenteditable="true">${dados.aulasTotais}</span>
                </div>
    
                <div class="aulas-concluidas">
                    <label>Aulas concluídas:</label>
    
                    <span class="tool-box dec2">-2</span>
                    <span class="tool-box dec1">-1</span>
    
                    <span class="data-value" contenteditable="true">
                        ${dados.aulasConcluidas}
                    </span>
    
                    <span class="tool-box inc1">+1</span>
                    <span class="tool-box inc2">+2</span>
                </div>
    
                <div class="aulas-atrasadas">
                    <label>Aulas atrasadas:</label>
                    <span class="data-value">${dados.aulasAtrasadas}</span>
                </div>
    
                <div class="data-acompanhamento">
                    <label>Último acompanhamento:</label>
                    <span class="data-value">${dados.dataAcompanhamento}</span>
                    <span class="tool-box btn-date">🗓</span>
                </div>
    
                <div class="situacao">
                    <span>
                        ${dados.situacao == "ADIANTADO" ? "🟦 " : dados.situacao == "MUIRO ADIANTADO" ? "🟪 " : dados.situacao == "ATRASADO" ? "🟨 " : dados.situacao == "MUITO ATRASADO" ? "🟥 " : "🟩 "}
                        ${dados.situacao}
                    </span>
                </div>
    
                <div class="verificacao">
                    <span class="${dados.verificacao == "VERIFICADO" ? "green-flag" : dados.verificacao == "VERIFICAR" ? "yellow-flag" : "red-flag"}">${dados.verificacao}</span>
                </div>
            </div>
        `);

        const card = container.lastElementChild;

        // Datas
        card.querySelectorAll(".btn-date").forEach(btn => {
            btn.addEventListener("click", (e) => {
                //
                const campo = btn.previousElementSibling;
                const input = document.createElement("input");
                input.type = "date";
                const rect = btn.getBoundingClientRect();
                input.style.position = "fixed";
                input.style.left = `${rect.left}px`;
                input.style.top = `${rect.bottom + 5}px`;
                input.style.zIndex = "9999";
                document.body.appendChild(input);
                input.focus();
                input.addEventListener("change", () => {
                    const [ano, mes, dia] = input.value.split("-");
                    campo.textContent = `${dia}/${mes}/${ano}`;
                });
                input.addEventListener("blur", input.remove);
            });
        });

        // Selecionar elementos editáveis:
        function selectContent(e, element) {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(e.target);
            selection.removeAllRanges();
            selection.addRange(range);
        }
        const nome = card.querySelector(".nome");
        const aulasTotais = card.querySelector(".aulas-curso .data-value");
        const aulasConcluidas = card.querySelector(".aulas-concluidas .data-value");
        const aulasAtrasadas = card.querySelector(".aulas-atrasadas .data-value");
        nome.addEventListener("click", e => selectContent(e, nome));
        aulasTotais.addEventListener("click", e => selectContent(e, aulasTotais));
        aulasConcluidas.addEventListener("click", e => selectContent(e, aulasConcluidas));
        aulasAtrasadas.addEventListener("click", e => selectContent(e, aulasAtrasadas));

        // Nome completo ao editar
        nome.addEventListener("blur", () => {
            const texto = nome.textContent.trim();
            nome.textContent = texto;
        });

        // Incremento / decremento aulas concluídas
        card.querySelector(".dec2").addEventListener("click", () => {
            aulasConcluidas.textContent =
                Math.max(0, Number(aulasConcluidas.textContent) - 2);
        });

        card.querySelector(".dec1").addEventListener("click", () => {
            aulasConcluidas.textContent =
                Math.max(0, Number(aulasConcluidas.textContent) - 1);
        });

        card.querySelector(".inc1").addEventListener("click", () => {
            aulasConcluidas.textContent =
                Number(aulasConcluidas.textContent) + 1;
        });

        card.querySelector(".inc2").addEventListener("click", () => {
            aulasConcluidas.textContent =
                Number(aulasConcluidas.textContent) + 2;
        });
        // Solicita salvamento automático das alterações no:
        // clique, saída do mouse e pressionamento de teclas
        card.addEventListener("click", () => {
            const id = card.getAttribute("data-id");
            App.Cadastros.current = App.Cadastros.contratos[id];
            console.log(App.Cadastros.current);
            Utils.Save(Grid.saveCardData());
        });
        card.addEventListener("mouseleave", () => {
            const id = card.getAttribute("data-id");
            App.Cadastros.current = App.Cadastros.contratos[id];
            console.log(App.Cadastros.current);
            Utils.Save(Grid.saveCardData());
        });
        card.addEventListener("keyup", () => {
            const id = card.getAttribute("data-id");
            App.Cadastros.current = App.Cadastros.contratos[id];
            console.log(App.Cadastros.current);
            Utils.Save(Grid.saveCardData());
        });
    },
    // Obtenção de dados de contratos dos cards
    saveCardData: () => {
        const cards = document.querySelectorAll(".contractCard");
        const dados = {};
        cards.forEach(card => {
            const nome = card.querySelector(".nome").textContent.trim();
            dados[card.dataset.id] = {
                id: card.dataset.id,
                aluno: nome,
                educador: card.querySelector("select").value,
                inicioContrato: card.querySelector(".data-inicio .data-value").textContent.trim(),
                fimContrato: card.querySelector(".data-fim .data-value").textContent.trim(),
                diaSemana: card.querySelector(".dia-semana .data-value").textContent.trim(),
                aulasTotais: Number(card.querySelector(".aulas-curso .data-value").textContent.trim()),
                aulasConcluidas: Number(card.querySelector(".aulas-concluidas .data-value").textContent.trim()),
                aulasAtrasadas: Number(card.querySelector(".aulas-atrasadas .data-value").textContent.trim()),
                dataAcompanhamento: card.querySelector(".data-acompanhamento .data-value").textContent.trim(),
                situacao: card.querySelector(".situacao span").textContent.trim(),
                verificacao: card.querySelector(".verificacao span").textContent.trim()
            };
        });
        return dados;
    }
}

const resumo = {
    "mesAtual": {
        "geral": {
            "totalAlunos": 500,
            "totalAdiantados": 36,
            "totalAtrasados": 93,
            "totalMuitoAtrasados": 58,
            "totalMuitoAdiantados": 17,
            "totalEmDias": 296,
            "totalVerificados": 115,
            "totalVerificar": 383,
            "totalVerificarUrgente": 2,
            "concluidos": 21
        },
        "porEducador": {
            "JOICE LOPES": {
                "totalAlunos": 81,
                "totalAdiantados": 7,
                "totalAtrasados": 12,
                "totalMuitoAtrasados": 10,
                "totalMuitoAdiantados": 2,
                "totalEmDias": 50,
                "totalVerificados": 29,
                "totalVerificar": 52,
                "totalVerificarUrgente": 0,
                "concluidos": 1
            },
            "NUBIA CARVALHO": {
                "totalAlunos": 55,
                "totalAdiantados": 6,
                "totalAtrasados": 12,
                "totalMuitoAtrasados": 5,
                "totalMuitoAdiantados": 3,
                "totalEmDias": 29,
                "totalVerificados": 0,
                "totalVerificar": 54,
                "totalVerificarUrgente": 1,
                "concluidos": 4
            },
            "JORGE SOUZA": {
                "totalAlunos": 89,
                "totalAdiantados": 7,
                "totalAtrasados": 19,
                "totalMuitoAtrasados": 11,
                "totalMuitoAdiantados": 3,
                "totalEmDias": 49,
                "totalVerificados": 5,
                "totalVerificar": 84,
                "totalVerificarUrgente": 0,
                "concluidos": 8
            },
            "EDILEUSA CHAVES": {
                "totalAlunos": 148,
                "totalAdiantados": 9,
                "totalAtrasados": 29,
                "totalMuitoAtrasados": 17,
                "totalMuitoAdiantados": 5,
                "totalEmDias": 88,
                "totalVerificados": 48,
                "totalVerificar": 100,
                "totalVerificarUrgente": 0,
                "concluidos": 3
            },
            "EDMUNDO SANTOS": {
                "totalAlunos": 109,
                "totalAdiantados": 7,
                "totalAtrasados": 20,
                "totalMuitoAtrasados": 5,
                "totalMuitoAdiantados": 3,
                "totalEmDias": 74,
                "totalVerificados": 20,
                "totalVerificar": 89,
                "totalVerificarUrgente": 0,
                "concluidos": 5
            },
            "TANIA ANJOS": {
                "totalAlunos": 18,
                "totalAdiantados": 0,
                "totalAtrasados": 1,
                "totalMuitoAtrasados": 10,
                "totalMuitoAdiantados": 1,
                "totalEmDias": 6,
                "totalVerificados": 13,
                "totalVerificar": 4,
                "totalVerificarUrgente": 1,
                "concluidos": 0
            }
        }
    },
    "mesAnterior": {
        "geral": {
            "totalAlunos": 500,
            "totalAdiantados": 36,
            "totalAtrasados": 93,
            "totalMuitoAtrasados": 58,
            "totalMuitoAdiantados": 17,
            "totalEmDias": 296,
            "totalVerificados": 115,
            "totalVerificar": 383,
            "totalVerificarUrgente": 2,
            "concluidos": 21
        },
        "porEducador": {
            "JOICE LOPES": {
                "totalAlunos": 81,
                "totalAdiantados": 7,
                "totalAtrasados": 12,
                "totalMuitoAtrasados": 10,
                "totalMuitoAdiantados": 2,
                "totalEmDias": 50,
                "totalVerificados": 29,
                "totalVerificar": 52,
                "totalVerificarUrgente": 0,
                "concluidos": 1
            },
            "NUBIA CARVALHO": {
                "totalAlunos": 55,
                "totalAdiantados": 6,
                "totalAtrasados": 12,
                "totalMuitoAtrasados": 5,
                "totalMuitoAdiantados": 3,
                "totalEmDias": 29,
                "totalVerificados": 0,
                "totalVerificar": 54,
                "totalVerificarUrgente": 1,
                "concluidos": 4
            },
            "JORGE SOUZA": {
                "totalAlunos": 89,
                "totalAdiantados": 7,
                "totalAtrasados": 19,
                "totalMuitoAtrasados": 11,
                "totalMuitoAdiantados": 3,
                "totalEmDias": 49,
                "totalVerificados": 5,
                "totalVerificar": 84,
                "totalVerificarUrgente": 0,
                "concluidos": 8
            },
            "EDILEUSA CHAVES": {
                "totalAlunos": 148,
                "totalAdiantados": 9,
                "totalAtrasados": 29,
                "totalMuitoAtrasados": 17,
                "totalMuitoAdiantados": 5,
                "totalEmDias": 88,
                "totalVerificados": 48,
                "totalVerificar": 100,
                "totalVerificarUrgente": 0,
                "concluidos": 3
            },
            "EDMUNDO SANTOS": {
                "totalAlunos": 109,
                "totalAdiantados": 7,
                "totalAtrasados": 20,
                "totalMuitoAtrasados": 5,
                "totalMuitoAdiantados": 3,
                "totalEmDias": 74,
                "totalVerificados": 20,
                "totalVerificar": 89,
                "totalVerificarUrgente": 0,
                "concluidos": 5
            },
            "TANIA ANJOS": {
                "totalAlunos": 18,
                "totalAdiantados": 0,
                "totalAtrasados": 1,
                "totalMuitoAtrasados": 10,
                "totalMuitoAdiantados": 1,
                "totalEmDias": 6,
                "totalVerificados": 13,
                "totalVerificar": 4,
                "totalVerificarUrgente": 1,
                "concluidos": 0
            }
        }
    }
}
//#endregion

// Master functions:
window["App"] = App;
window["Utils"] = Utils;
window["UI"] = UI;

// EOF