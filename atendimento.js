
"use strict";

(() => {

    const CHAVE = "cc_carrinho_v2";
    const $ = id => document.getElementById(id);

    const money = centavos =>
        new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
        }).format(centavos / 100);

    function elemento(tag, texto = "") {
        const e = document.createElement(tag);
        e.textContent = texto;
        return e;
    }

    function botao(texto, acao) {
        const b = elemento("button", texto);
        b.type = "button";
        b.addEventListener("click", acao);
        return b;
    }

    // ==========================================
    // 01. CADASTRO DOS SERVICOS
    // ==========================================

    function servico(
        codigo, nome, preco, tipo,
        consultaPrevia, documentos,
        motivo = "", ativo = true
    ) {
        return {
            codigo,
            nome,
            preco,
            tipo,
            consultaPrevia,
            documentos,
            motivo,
            ativo,
            quantidade: 1,
            escopoValidado: false,
            pagamentoAntecipado:
                !consultaPrevia &&
                ["fixo", "sessao"].includes(tipo)
        };
    }

    const CATALOGO = [

        servico(
            "mei-abertura",
            "Formalização de MEI",
            0, "gratuito", false,
            [
                "Atividade pretendida",
                "Endereço pretendido",
                "Informações cadastrais"
            ]
        ),

        servico(
            "mei-alteracao",
            "Alteração de MEI",
            40000, "fixo", false,
            ["CCMEI", "Descrição da alteração"]
        ),

        servico(
            "mei-baixa",
            "Baixa de MEI",
            60000, "variavel", true,
            [
                "CCMEI",
                "Situação das obrigações",
                "Informações sobre débitos"
            ],
            "Necessária análise das pendências."
        ),

        servico(
            "dasn",
            "Declaração anual DASN-SIMEI",
            25000, "fixo", false,
            [
                "CNPJ",
                "Receitas anuais",
                "Informações sobre empregados",
                "Ano da declaração"
            ]
        ),

        servico(
            "dirpf",
            "Declaração de Imposto de Renda PF",
            30000, "variavel", true,
            [
                "Ano-exercício",
                "Comprovantes de rendimentos",
                "Informações de bens e direitos",
                "Informações de dependentes"
            ],
            "O valor depende da complexidade da declaração."
        ),

        servico(
            "ditr",
            "Declaração de ITR",
            35000, "variavel", true,
            [
                "CIB",
                "Dados do imóvel rural",
                "CCIR, quando aplicável",
                "Informações sobre utilização da terra"
            ],
            "Necessária análise dos dados do imóvel rural."
        ),

        servico(
            "nfse",
            "Emissão de NFS-e",
            5000, "fixo", false,
            [
                "Dados da operação",
                "Dados do tomador",
                "Inscrição municipal, quando aplicável"
            ]
        ),

        servico(
            "nfe",
            "Emissão de NF-e",
            10000, "variavel", true,
            [
                "Dados da operação",
                "Dados dos produtos",
                "Inscrição estadual, quando aplicável"
            ],
            "Necessária análise da operação e tributação."
        ),

        servico(
            "cnd",
            "Emissão de certidão",
            20000, "fixo", false,
            [
                "Identificação do contribuinte",
                "Tipo de certidão solicitada"
            ]
        ),

        servico(
            "consultoria",
            "Consultoria contábil",
            25000, "sessao", false,
            [
                "Descrição da demanda",
                "Documentos relacionados ao assunto"
            ]
        ),

        servico(
            "tributaria",
            "Consultoria tributária",
            62500, "sessao", false,
            [
                "Regime tributário",
                "Descrição da demanda",
                "Informações fiscais"
            ]
        ),

        servico(
            "planejamento",
            "Planejamento tributário",
            76000, "variavel", true,
            [
                "Regime tributário",
                "Faturamento",
                "Atividades empresariais",
                "Informações sobre despesas"
            ],
            "Necessária avaliação técnica."
        ),

        servico(
            "rescisao",
            "Cálculo de rescisão trabalhista",
            10000, "variavel", true,
            [
                "Dados do vínculo empregatício",
                "Histórico de remuneração",
                "Motivo do desligamento",
                "Convenção coletiva aplicável"
            ],
            "Necessária análise das condições trabalhistas."
        ),

        servico(
            "abertura-sn",
            "Abertura de empresa - Simples Nacional",
            80000, "variavel", true,
            [
                "Atividades pretendidas",
                "Dados dos sócios",
                "Endereço pretendido",
                "Capital social"
            ],
            "Necessária análise de viabilidade."
        ),

        servico(
            "abertura-lp",
            "Abertura de empresa - Lucro Presumido",
            95000, "variavel", true,
            [
                "Atividades pretendidas",
                "Dados dos sócios",
                "Endereço pretendido",
                "Capital social"
            ],
            "Necessária análise societária e tributária."
        ),

        servico(
            "abertura-lr",
            "Abertura de empresa - Lucro Real",
            120000, "variavel", true,
            [
                "Atividades pretendidas",
                "Dados dos sócios",
                "Endereço pretendido",
                "Capital social",
                "Projeção de faturamento"
            ],
            "Necessária análise contábil e fiscal."
        ),

        servico(
            "alteracao",
            "Alteração empresarial",
            60000, "variavel", true,
            [
                "Contrato social",
                "CNPJ",
                "Descrição da alteração"
            ],
            "Necessária análise dos atos empresariais."
        ),

        servico(
            "baixa",
            "Baixa empresarial",
            80000, "variavel", true,
            [
                "Contrato social",
                "CNPJ",
                "Situação fiscal",
                "Informações sobre obrigações pendentes"
            ],
            "Necessária análise das obrigações."
        ),

        servico(
            "mensal",
            "Contabilidade mensal",
            40000, "mensal", true,
            [
                "CNPJ e ato constitutivo",
                "Documentos fiscais",
                "Informações de folha"
            ],
            "Honorários sujeitos à aprovação e contrato."
        ),

        servico(
            "regularizacao",
            "Regularização empresarial",
            35000, "diagnostico", true,
            [
                "CNPJ",
                "Relatórios de pendências",
                "Notificações recebidas"
            ],
            "Execução orçada separadamente."
        ),

        servico(
            "recuperacao-creditos",
            "Recuperação de créditos tributários",
            50000, "diagnostico", true,
            [
                "Documentos fiscais",
                "Apurações tributárias",
                "Comprovantes de recolhimento"
            ],
            "Necessária análise dos créditos."
        ),

        servico(
            "balanco-retroativo",
            "Balanço patrimonial retroativo",
            35000, "diagnostico", true,
            [
                "Balancetes existentes",
                "Extratos bancários",
                "Documentos contábeis"
            ],
            "Valor da execução sujeito à análise."
        ),

        servico(
            "escrituracao-retroativa",
            "Escrituração contábil retroativa",
            40000, "diagnostico", true,
            [
                "Documentos contábeis",
                "Documentos fiscais",
                "Períodos pendentes"
            ],
            "Necessário avaliar o volume de documentos."
        ),

        servico(
            "revisao-fiscal",
            "Revisão fiscal",
            62500, "diagnostico", true,
            [
                "Apurações fiscais",
                "Declarações transmitidas",
                "Documentos fiscais"
            ],
            "Necessária definição do escopo."
        ),

        servico(
            "diagnostico-endividamento",
            "Diagnóstico de endividamento",
            35000, "diagnostico", true,
            [
                "Relação de dívidas",
                "Contratos financeiros",
                "Informações de receitas e despesas"
            ],
            "Necessária análise financeira."
        ),

        servico(
            "reestruturacao",
            "Reestruturação empresarial",
            62500, "diagnostico", true,
            [
                "Contrato social",
                "Demonstrações contábeis",
                "Descrição dos objetivos empresariais"
            ],
            "Necessária definição individual do projeto."
        ),

        servico(
            "pericia",
            "Perícia contábil",
            50000, "diagnostico", true,
            [
                "Descrição da demanda",
                "Documentos relacionados ao objeto da perícia"
            ],
            "Sujeito à habilitação profissional.",
            false
        ),

        servico(
            "auditoria",
            "Auditoria contábil",
            75000, "diagnostico", true,
            [
                "Demonstrações contábeis",
                "Descrição do objeto da auditoria"
            ],
            "Sujeito à habilitação profissional.",
            false
        )

    ];

    // ==========================================
    // 02. ESTADO DO CARRINHO
    // ==========================================

    const carrinho = new Map();
    const documentosMarcados = new Set();

    const tabelaMensal = Array.isArray(window.PRECOS_MENSAIS)
        ? window.PRECOS_MENSAIS
        : [];

    function salvarCarrinho() {

        const itens = Array.from(carrinho.values())
            .map(item => ({
                ...item,
                documentosDisponiveis:
                    item.documentos.filter(
                        doc => documentosMarcados.has(doc)
                    )
            }));

        try {
            sessionStorage.setItem(
                CHAVE, JSON.stringify(itens)
            );
            return true;
        } catch {
            return false;
        }
    }

    function restaurarCarrinho() {

        try {

            const itens = JSON.parse(
                sessionStorage.getItem(CHAVE) || "[]"
            );

            if (!Array.isArray(itens)) return;

            for (const salvo of itens.slice(0, 28)) {

                if (!salvo || typeof salvo !== "object") {
                    continue;
                }

                const base = CATALOGO.find(
                    s => s.codigo === salvo.codigo && s.ativo
                );

                if (!base) continue;

                let item = { ...base };

                if (base.tipo === "mensal") {

                    const d = salvo.dadosSimulacao;

                    if (!d) continue;

                    const valor = obterValorMensal(d);

                    if (valor === null) continue;

                    item = {
                        ...base,
                        preco: valor,
                        nome: "Contabilidade mensal — " + d.regime,
                        dadosSimulacao: {
                            regime: d.regime,
                            faixa: d.faixa,
                            setor: d.setor,
                            vinculos: d.vinculos
                        }
                    };
                }

                carrinho.set(item.codigo, item);

                if (Array.isArray(salvo.documentosDisponiveis)) {

                    for (const doc of salvo.documentosDisponiveis) {

                        if (item.documentos.includes(doc)) {
                            documentosMarcados.add(doc);
                        }
                    }
                }
            }

        } catch {
            carrinho.clear();
            documentosMarcados.clear();
        }
    }

    function adicionarServico(item) {

        if (!item.ativo) return;

        carrinho.set(item.codigo, { ...item });

        renderizarCarrinho();
    }

    function removerServico(codigo) {

        carrinho.delete(codigo);

        renderizarCarrinho();
    }

    // ==========================================
    // 03. REGRAS COMERCIAIS
    // ==========================================

    function apresentarPreco(item) {

        switch (item.tipo) {

            case "gratuito":
                return "Gratuito";

            case "fixo":
                return money(item.preco);

            case "sessao":
                return money(item.preco) + " por sessão";

            case "diagnostico":
                return money(item.preco) + " — diagnóstico inicial";

            case "mensal":
                return money(item.preco) + " / mês — estimativa";

            default:
                return "A partir de " + money(item.preco);
        }
    }

    function potencialPagamentoDireto(item) {

        return item.ativo === true &&
            item.consultaPrevia === false &&
            item.pagamentoAntecipado === true &&
            ["fixo", "sessao"].includes(item.tipo) &&
            item.preco > 0;
    }

    function situacaoServico(item) {

        if (!item.ativo) {
            return "🔒 Temporariamente indisponível";
        }

        if (item.tipo === "gratuito") {
            return "Sem cobrança";
        }

        if (item.consultaPrevia) {
            return "🔒 Consulta prévia obrigatória";
        }

        if (potencialPagamentoDireto(item)) {
            return "Pagamento direto previsto";
        }

        return "🔒 Pagamento bloqueado";
    }

    // ==========================================
    // 04. EXIBICAO DO CATALOGO
    // ==========================================

    function renderizarCatalogo() {

        $("catalogo").replaceChildren();

        for (const item of CATALOGO) {

            if (item.codigo === "mensal") continue;

            const card = elemento("article");

            const preco = elemento(
                "p", apresentarPreco(item)
            );

            preco.style.fontWeight = "700";
            preco.style.color = "#0A2540";

            const status = elemento(
                "p", situacaoServico(item)
            );

            status.style.fontSize = "13px";

            status.style.color =
                item.consultaPrevia || !item.ativo
                    ? "#92400E"
                    : "#475569";

            card.append(
                elemento("h3", item.nome),
                preco,
                status
            );

            if (item.motivo) {
                card.append(elemento("p", item.motivo));
            }

            if (item.tipo === "diagnostico") {

                card.append(elemento(
                    "p",
                    "A execução será orçada separadamente."
                ));
            }

            const selecionado = carrinho.has(item.codigo);

            const adicionar = botao(
                !item.ativo
                    ? "Indisponível"
                    : selecionado
                        ? "Adicionado"
                        : "Adicionar ao carrinho",
                () => adicionarServico(item)
            );

            adicionar.disabled = !item.ativo || selecionado;

            card.append(adicionar);

            $("catalogo").append(card);
        }
    }

    // ==========================================
    // 05. TOTAIS FINANCEIROS
    // ==========================================

    function calcularTotais() {

        const t = {
            direto: 0,
            analise: 0,
            diagnostico: 0,
            mensal: 0
        };

        for (const item of carrinho.values()) {

            if (item.tipo === "gratuito") continue;

            if (item.tipo === "mensal") {
                t.mensal += item.preco;
            } else if (item.tipo === "diagnostico") {
                t.diagnostico += item.preco;
            } else if (potencialPagamentoDireto(item)) {
                t.direto += item.preco;
            } else {
                t.analise += item.preco;
            }
        }

        t.avulso = t.direto + t.analise + t.diagnostico;

        return t;
    }

    function renderizarCarrinho() {

        $("carrinho").replaceChildren();
        $("total").replaceChildren();

        if (!carrinho.size) {

            $("carrinho").append(
                elemento("p", "Seu carrinho está vazio.")
            );

        } else {

            for (const item of carrinho.values()) {

                const linha = elemento("div");
                linha.className = "cc-line";

                const info = elemento("div");

                info.append(
                    elemento("strong", item.nome),
                    elemento("p", apresentarPreco(item)),
                    elemento("p", situacaoServico(item))
                );

                linha.append(
                    info,
                    botao(
                        "Remover",
                        () => removerServico(item.codigo)
                    )
                );

                $("carrinho").append(linha);
            }

            const t = calcularTotais();

            $("total").append(

                elemento(
                    "p",
                    "Serviços padronizados: " + money(t.direto)
                ),

                elemento(
                    "p",
                    "Serviços sob análise: " + money(t.analise)
                ),

                elemento(
                    "p",
                    "Diagnósticos iniciais: " + money(t.diagnostico)
                ),

                elemento(
                    "strong",
                    "Total avulso de referência: " + money(t.avulso)
                ),

                elemento(
                    "p",
                    "Honorários mensais estimados: " +
                    money(t.mensal) + " / mês"
                ),

                elemento(
                    "p",
                    "Disponível para pagamento agora: R$ 0,00"
                ),

                elemento(
                    "p",
                    "Tributos, taxas públicas e despesas adicionais não inclusos."
                )
            );
        }

        $("continuar").disabled = carrinho.size === 0;

        renderizarDocumentos();
        renderizarCatalogo();
        salvarCarrinho();
    }

    // ==========================================
    // 06. CHECKLIST DE DOCUMENTOS
    // ==========================================

    function renderizarDocumentos() {

        $("docs").replaceChildren();

        const documentos = new Set();

        for (const item of carrinho.values()) {

            item.documentos.forEach(
                doc => documentos.add(doc)
            );
        }

        for (const doc of documentosMarcados) {

            if (!documentos.has(doc)) {
                documentosMarcados.delete(doc);
            }
        }

        if (!documentos.size) {

            $("docs").append(elemento(
                "p",
                "Adicione serviços para consultar a documentação."
            ));

            return;
        }

        $("docs").append(elemento(
            "p",
            "Marque os documentos que já possui. Não envie arquivos ou dados reais."
        ));

        for (const doc of documentos) {

            const label = elemento("label");
            label.className = "cc-check";

            const checkbox = document.createElement("input");

            checkbox.type = "checkbox";
            checkbox.checked = documentosMarcados.has(doc);

            checkbox.addEventListener("change", () => {

                if (checkbox.checked) {
                    documentosMarcados.add(doc);
                } else {
                    documentosMarcados.delete(doc);
                }

                salvarCarrinho();
            });

            label.append(
                checkbox,
                document.createTextNode(doc)
            );

            $("docs").append(label);
        }
    }

    // ==========================================
    // 07. SIMULADOR MENSAL
    // ==========================================

    function preencherOpcoes(id, valores) {

        $(id).replaceChildren(
            ...valores.map(v => new Option(v, v))
        );
    }

    function obterValorMensal(d) {

        const linha = tabelaMensal.find(r =>
            r.regime === d.regime &&
            r.faixa === d.faixa &&
            r.setor === d.setor
        );

        const n = d.vinculos;

        if (
            !linha ||
            !Number.isInteger(n) ||
            n < 0 ||
            n > 10000 ||
            !Number.isFinite(Number(linha.valor)) ||
            Number(linha.valor) <= 0
        ) {
            return null;
        }

        const unitario =
            n <= 2 ? 16550 :
            n <= 5 ? 14560 :
            n <= 10 ? 12950 :
            n <= 20 ? 11820 :
            n <= 40 ? 10750 :
            8730;

        const total =
            Math.round(Number(linha.valor) * 100) +
            n * unitario;

        return Number.isSafeInteger(total) ? total : null;
    }

    function dadosSimulacao() {

        return {
            regime: $("regime").value,
            faixa: $("faixa").value,
            setor: $("setor").value,
            vinculos: $("vinculos").value.trim() === ""
                ? NaN
                : Number($("vinculos").value)
        };
    }

    function calcularMensal() {

        const valor = obterValorMensal(dadosSimulacao());

        $("mensal").disabled = valor === null;

        $("estimativa").textContent =
            valor === null
                ? "Não foi possível calcular. Necessária consulta."
                : "Honorário mensal estimado: " +
                    money(valor) +
                    " / mês — sujeito à aprovação do contador.";

        return valor;
    }

    function sincronizarFaixas() {

        const regime = $("regime").value;

        preencherOpcoes(
            "faixa",
            [...new Set(
                tabelaMensal
                    .filter(r => r.regime === regime)
                    .map(r => r.faixa)
            )]
        );

        calcularMensal();
    }

    function inicializarSimulador() {

        preencherOpcoes(
            "regime",
            [...new Set(tabelaMensal.map(r => r.regime))]
        );

        preencherOpcoes(
            "setor",
            [...new Set(tabelaMensal.map(r => r.setor))]
        );

        $("regime").addEventListener(
            "change", sincronizarFaixas
        );

        for (const id of ["faixa", "setor", "vinculos"]) {

            $(id).addEventListener(
                "input", calcularMensal
            );
        }

        $("mensal").addEventListener("click", () => {

            const valor = calcularMensal();

            if (valor === null) return;

            const d = dadosSimulacao();

            const base = CATALOGO.find(
                s => s.codigo === "mensal"
            );

            adicionarServico({
                ...base,
                preco: valor,
                nome: "Contabilidade mensal — " + d.regime,
                dadosSimulacao: d
            });
        });

        sincronizarFaixas();

        const salvo = carrinho.get("mensal")?.dadosSimulacao;

        if (salvo) {

            $("regime").value = salvo.regime;

            sincronizarFaixas();

            $("faixa").value = salvo.faixa;
            $("setor").value = salvo.setor;
            $("vinculos").value = salvo.vinculos;

            calcularMensal();
        }
    }

    // ==========================================
    // 08. FINALIZACAO DO ATENDIMENTO
    // ==========================================

    function finalizarContratacao() {

        if (!carrinho.size) {

            alert("Selecione pelo menos um serviço.");
            return;
        }

        if (!salvarCarrinho()) {

            alert(
                "Não foi possível transferir o carrinho. " +
                "Confira as configurações do navegador."
            );

            return;
        }

        window.location.href = "checkout.html";
    }

    // ==========================================
    // 09. INICIALIZACAO
    // ==========================================

    function iniciar() {

        const ids = [
            "catalogo", "regime", "faixa", "setor",
            "vinculos", "estimativa", "mensal",
            "carrinho", "total", "docs", "continuar"
        ];

        const ausentes = ids.filter(id => !$(id));

        if (ausentes.length) {

            console.error(
                "Elementos HTML ausentes:", ausentes
            );

            return;
        }

        restaurarCarrinho();

        inicializarSimulador();

        $("continuar").addEventListener(
            "click", finalizarContratacao
        );

        renderizarCarrinho();

        console.info(
            "Casa Contábil — Atendimento 1.3 — Testes"
        );
    }

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded", iniciar
        );

    } else {

        iniciar();
    }

    window.addEventListener("pageshow", evento => {

        if (evento.persisted && $("carrinho")) {

            carrinho.clear();
            documentosMarcados.clear();

            restaurarCarrinho();
            renderizarCarrinho();
        }
    });

})();
